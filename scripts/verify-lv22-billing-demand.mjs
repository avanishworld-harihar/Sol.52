/**
 * One-shot verify: LV2.2 demand-based FC uses 90% CD billing demand.
 *   node --import tsx scripts/verify-lv22-billing-demand.mjs
 */
import {
  computeFixedCharge,
  computeLtBillingDemandKw
} from "../lib/mp-bill-engine.ts";

function assertEq(label, got, expected) {
  const ok = got === expected;
  console.log(`${ok ? "OK" : "FAIL"} ${label}: got ${got}, expected ${expected}`);
  if (!ok) process.exitCode = 1;
}

const bd = computeLtBillingDemandKw({ contractDemandKw: 25, maxDemandKw: 13.26 });
assertEq("billingDemand(MD13.26, CD25)", bd, 23);

const feb = computeFixedCharge({
  discomCode: "MPPKVVCL",
  category: "LV2.2",
  units: 677.32,
  sanctionedLoadKw: 25,
  contractDemandKva: 25,
  maxDemandKw: 5.235,
  area: "urban",
  billMonth: "FEB-2026"
});
assertEq("Feb-2026 FC", feb.amount, 6946);
console.log("  formula:", feb.formula);

const aug = computeFixedCharge({
  discomCode: "MPPKVVCL",
  category: "LV2.2",
  units: 1897.32,
  sanctionedLoadKw: 25,
  contractDemandKva: 25,
  maxDemandKw: 13.26,
  area: "urban",
  billMonth: "AUG-2026"
});
assertEq("Aug-2026 FC", aug.amount, 7176);
console.log("  formula:", aug.formula);

const noCd = computeFixedCharge({
  discomCode: "MPPKVVCL",
  category: "LV2.2",
  units: 1897,
  sanctionedLoadKw: 25,
  area: "urban",
  billMonth: "AUG-2026"
});
assertEq("Aug FC load-only (no CD field)", noCd.amount, 7176);

const sl = computeFixedCharge({
  discomCode: "MPPKVVCL",
  category: "LV2.2",
  units: 200,
  sanctionedLoadKw: 5,
  area: "urban",
  billMonth: "AUG-2026"
});
assertEq("LV2.2 SL ≤10 kW (>50u)", sl.amount, 767.05);

const domApr = computeFixedCharge({
  discomCode: "MPPKVVCL",
  category: "LV1.2",
  units: 327,
  sanctionedLoadKw: 3,
  area: "urban",
  billMonth: "APR-2026"
});
// ceil(327/15)=22 blocks × ₹30 (FY26-27 urban >150)
assertEq("LV1.2 residential APR-2026", domApr.amount, 660);
console.log("  formula:", domApr.formula);

const lv3 = computeFixedCharge({
  discomCode: "MPPKVVCL",
  category: "LV3",
  units: 100,
  sanctionedLoadKw: 10,
  area: "urban",
  billMonth: "AUG-2026"
});
assertEq("LV3 (no 90% floor)", lv3.amount, 3890);

if (process.exitCode) {
  console.log("\nFAILED");
  process.exit(1);
}
console.log("\nAll checks passed.");
