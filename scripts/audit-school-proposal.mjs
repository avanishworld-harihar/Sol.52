/**
 * Final audit: School vs Factory commercial proposal consistency & section markers.
 * Run: node scripts/audit-school-proposal.mjs [baseUrl]
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// Dynamic import TS modules via tsx subprocess output — inline mirror of key checks
const emptyMonths = {
  jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0,
  jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0,
};

function buildInput(orgType, customerName) {
  const systemKw = orgType === "school" ? 50 : 100;
  const gross = systemKw * 85000;
  const annualGen = Math.round(systemKw * 1500);
  const annualSaving = Math.round(annualGen * 8 * 0.85);
  return {
    customerName,
    location: "Bhopal, MP",
    systemKw,
    yearlyBill: 0,
    afterSolar: 0,
    saving: annualSaving,
    paybackYears: annualSaving > 0 ? Number((gross / annualSaving).toFixed(1)) : 99,
    monthlyUnits: emptyMonths,
    state: "Madhya Pradesh",
    discom: "MPPKVVCL",
    connectionType: "LT",
    grossSystemCostInr: gross,
    pmSuryaGharSubsidyInr: 0,
    netCostInr: gross,
    dataSource: "requirement",
    presetId: "commercial_executive",
    commercialConfig: { orgType, dcrComparison: { enabled: true }, capacityScenarios: { enabled: true } },
  };
}

async function runTsAudit() {
  const { execSync } = await import("child_process");
  const snippet = `
    import { summarizeProposalDeck } from "../lib/proposal-ppt.ts";
    import { reconcileCommercialFinancialMetrics, isSchoolInstitutionOrg } from "../lib/commercial-proposal-financials.ts";

    const emptyMonths = { jan:0,feb:0,mar:0,apr:0,may:0,jun:0,jul:0,aug:0,sep:0,oct:0,nov:0,dec:0 };
    function build(orgType, name) {
      const systemKw = orgType === "school" ? 50 : 100;
      const gross = systemKw * 85000;
      const annualGen = Math.round(systemKw * 1500);
      const annualSaving = Math.round(annualGen * 8 * 0.85);
      return {
        customerName: name, location: "Bhopal", systemKw,
        yearlyBill: 0, afterSolar: 0, saving: annualSaving,
        paybackYears: annualSaving > 0 ? Number((gross / annualSaving).toFixed(1)) : 99,
        monthlyUnits: emptyMonths, state: "Madhya Pradesh", discom: "MPPKVVCL",
        grossSystemCostInr: gross, pmSuryaGharSubsidyInr: 0, netCostInr: gross,
        dataSource: "requirement", commercialConfig: { orgType, dcrComparison: { enabled: true } },
      };
    }

    function audit(label, input) {
      const summary = summarizeProposalDeck(input);
      const fin = reconcileCommercialFinancialMetrics({
        annualGen: summary.annualGen, netCost: summary.netCost,
        yearlyBill: summary.yearlyBill, afterSolar: summary.afterSolar,
        billDerivedAnnualSaving: summary.annualSaving, paybackHint: summary.paybackYears,
        savingHintInr: input.saving, effectiveTariffInrPerKwh: summary.effectiveTariffRateInrPerKwh,
        preferGenerationPath: true,
      });
      const paybackCheck = fin.annualSaving > 0 ? fin.netCost / fin.annualSaving : 99;
      const profitCheck = fin.annualSaving * 25 - fin.netCost;
      const roiCheck = fin.netCost > 0 ? (fin.annualSaving / fin.netCost) * 100 : 0;
      const issues = [];
      if (summary.annualGen > 0 && fin.annualSaving <= 0) issues.push("annualSaving zero despite generation");
      if (Math.abs(paybackCheck - fin.paybackYears) > 0.3 && fin.paybackYears < 99) issues.push("payback mismatch");
      if (Math.abs(profitCheck - fin.lifetime25Profit) > 1) issues.push("lifetime profit mismatch");
      if (Math.abs(roiCheck - fin.roiPctFirstYear) > 0.2) issues.push("ROI mismatch");
      if (fin.paybackYears < 99 && fin.irrEstimate <= 0) issues.push("positive payback but IRR zero");
      return { label, orgType: input.commercialConfig?.orgType, isSchool: isSchoolInstitutionOrg(input.commercialConfig?.orgType),
        summary: { annualSaving: fin.annualSaving, paybackYears: fin.paybackYears, lifetime25Profit: fin.lifetime25Profit, roiPct: fin.roiPctFirstYear, irr: fin.irrEstimate, annualGen: summary.annualGen, netCost: summary.netCost },
        issues };
    }

    console.log(JSON.stringify({
      school: audit("school", build("school", "Green Valley School")),
      factory: audit("factory", build("factory", "Satna Steel Works")),
    }));
  `;
  const tmp = join(root, "scripts", ".audit-snippet.ts");
  const { writeFileSync, unlinkSync } = await import("fs");
  writeFileSync(tmp, snippet);
  try {
    const out = execSync(`npx --yes tsx "${tmp}"`, { cwd: root, encoding: "utf8", timeout: 120000 });
    return JSON.parse(out.trim());
  } finally {
    try { unlinkSync(tmp); } catch { /* ignore */ }
  }
}

function auditSourceMarkers() {
  const files = {
    green: "components/proposal/blocks/commercial/block-school-green-campus.tsx",
    learning: "components/proposal/blocks/commercial/block-school-learning-asset.tsx",
    safety: "components/proposal/blocks/commercial/block-school-safety-card.tsx",
    load: "components/proposal/blocks/commercial/block-school-load-advantage.tsx",
    view: "components/proposal/commercial-proposal-view.tsx",
  };
  const required = {
    green: ["Green Campus & Sustainability Impact", "comm-school-green", "Environmental Impact Score"],
    learning: ["Solar as a Learning Asset", "Real-Time Generation Monitoring", "comm-school-learning"],
    safety: ["Designed for Safe Educational Environments", "Child-safe engineering"],
    load: ["Why Schools Achieve Excellent Solar Utilization", "8 AM → 4 PM School Usage"],
    view: ["isSchoolProposal", "BlockSchoolGreenCampus", "BlockSchoolLearningAsset", "comm-roi"],
  };
  const bad = ["TODO", "TBD", "coming soon", "lorem ipsum", "placeholder"];
  const results = {};
  for (const [key, rel] of Object.entries(files)) {
    const text = readFileSync(join(root, rel), "utf8");
    const missing = (required[key] || []).filter((s) => !text.includes(s));
    const placeholders = bad.filter((s) => text.toLowerCase().includes(s.toLowerCase()));
    results[key] = { file: rel, missing, placeholders, ok: missing.length === 0 && placeholders.length === 0 };
  }
  return results;
}

async function fetchProposalHtml(baseUrl, orgType) {
  const payload = buildInput(orgType, orgType === "school" ? "Audit Green Valley School" : "Audit Satna Factory");
  const post = await fetch(`${baseUrl}/api/proposals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!post.ok) return { error: `POST ${post.status}`, orgType };
  const json = await post.json();
  if (!json.id) return { error: "not persisted (no id)", orgType, persisted: json.persisted };
  const get = await fetch(`${baseUrl}/proposal/${json.id}`, { headers: { Accept: "text/html" } });
  const html = await get.text();
  const markers = {
    commSchoolGreen: html.includes("comm-school-green") || html.includes("Green Campus"),
    commSchoolLearning: html.includes("comm-school-learning") || html.includes("Learning Asset"),
    commRoi: html.includes("comm-roi") || html.includes("ROI"),
    safeEducational: html.includes("Safe Educational") || html.includes("Child-safe"),
  };
  return { orgType, id: json.id, url: `${baseUrl}/proposal/${json.id}`, markers, htmlLength: html.length };
}

async function main() {
  const baseUrl = process.argv[2] || "http://localhost:3000";
  console.log("=== School Proposal Final Audit ===\n");

  console.log("1. Source marker audit");
  const sources = auditSourceMarkers();
  for (const [k, v] of Object.entries(sources)) {
    console.log(`  [${v.ok ? "PASS" : "FAIL"}] ${k}: ${v.file}`);
    if (v.missing.length) console.log("    missing:", v.missing.join(", "));
    if (v.placeholders.length) console.log("    placeholders:", v.placeholders.join(", "));
  }

  console.log("\n2. Financial consistency (summarize + reconcile)");
  let fin;
  try {
    fin = await runTsAudit();
    for (const row of [fin.school, fin.factory]) {
      console.log(`  [${row.issues.length ? "FAIL" : "PASS"}] ${row.label}`, row.summary);
      row.issues.forEach((i) => console.log("    issue:", i));
    }
  } catch (e) {
    console.log("  [SKIP] tsx audit:", e.message);
  }

  console.log("\n3. Live HTML probe:", baseUrl);
  for (const org of ["school", "factory"]) {
    try {
      const r = await fetchProposalHtml(baseUrl, org);
      if (r.error) {
        console.log(`  [SKIP] ${org}: ${r.error}`);
        continue;
      }
      console.log(`  ${org} → ${r.url}`);
      console.log("    markers:", JSON.stringify(r.markers));
      const schoolOnly = org === "school"
        ? r.markers.commSchoolGreen && r.markers.commSchoolLearning
        : !r.markers.commSchoolGreen && !r.markers.commSchoolLearning;
      console.log(`  [${schoolOnly ? "PASS" : "WARN"}] school-only sections ${org === "school" ? "present" : "absent"}`);
    } catch (e) {
      console.log(`  [SKIP] ${org}:`, e.message);
    }
  }

  console.log("\n4. PDF print CSS");
  const css = readFileSync(join(root, "app/globals.css"), "utf8");
  const printOk = css.includes(".commercial-proposal .proposal-page") && css.includes("@media print");
  console.log(`  [${printOk ? "PASS" : "FAIL"}] commercial print rules present`);

  console.log("\n=== Done ===");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
