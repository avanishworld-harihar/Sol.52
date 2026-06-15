#!/usr/bin/env node
/**
 * Phase 1 subscription / billing validation (no Razorpay).
 *   npm run test:billing-phase1
 */
import { execSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const checks = join(root, "lib/billing/phase1-checks.ts");

try {
  console.log("\n--- Billing Phase 1 static checks ---\n");
  execSync(`npx --yes tsx "${checks}"`, { cwd: root, stdio: "inherit" });
  console.log("\nManual verification checklist:");
  console.log("  [ ] New organization receives Trial automatically");
  console.log("  [ ] Trial lasts 14 days (admin /billing verification table)");
  console.log("  [ ] Trial allows Residential + Commercial proposals");
  console.log("  [ ] Trial stops at 10 total proposals — 11th blocked with upgrade modal");
  console.log("  [ ] Watermark appears in PDF print only (/proposal/[id] print preview)");
  console.log("  [ ] Starter 50/mo · Pro/Business unlimited");
  console.log("  [ ] Team limits: POST /api/team/members returns 402 on Starter/Trial");
  console.log("  [ ] Company Admin billing dashboard at /billing");
} catch {
  process.exit(1);
}
