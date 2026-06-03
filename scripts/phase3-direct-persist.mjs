/**
 * Direct Phase 3 persist (bypass PATCH when proposal_status column missing).
 * Usage: npx tsx scripts/phase3-direct-persist.mjs <proposalId>
 */
import { readFileSync } from "fs";

function loadEnv() {
  try {
    for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq <= 0) continue;
      let v = t.slice(eq + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
        v = v.slice(1, -1);
      if (!process.env[t.slice(0, eq).trim()]) process.env[t.slice(0, eq).trim()] = v;
    }
  } catch {
    /* ignore */
  }
}

loadEnv();

const proposalId = process.argv[2] || "fd4369ad-d6f4-4396-aead-2ae6c1977635";

const { getProposalPricingByProposalId } = await import("../lib/proposal-pricing-store.ts");
const { createPricingSnapshot, getLatestSnapshot } = await import("../lib/proposal-snapshot-store.ts");
const { persistProposalAssetForSnapshot } = await import("../lib/proposal-asset-persist.ts");

const pricing = await getProposalPricingByProposalId(proposalId);
if (!pricing) {
  console.error("no pricing");
  process.exit(1);
}

const latest = await getLatestSnapshot(proposalId);
const trigger = latest ? "revised" : "sent";
const snap = await createPricingSnapshot(proposalId, pricing, trigger, "phase3-e2e");
console.log("snapshot", snap?.id, snap?.version, snap?.triggered_by);

if (snap) {
  await new Promise((r) => setTimeout(r, 2000));
  const result = await persistProposalAssetForSnapshot(snap);
  console.log("persist", result);
}

process.exit(snap ? 0 : 1);
