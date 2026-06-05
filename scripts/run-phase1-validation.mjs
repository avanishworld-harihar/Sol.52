#!/usr/bin/env node
/**
 * Phase 1 pre-Phase-2 validation runner.
 *   npm run test:phase1-validation
 */
import { execSync } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const batchScript = join(root, "lib/proposal-stability/phase1-batch-validation.ts");
const liveScript = join(root, "scripts/phase1-live-validation.mjs");

function run(cmd, label) {
  console.log(`\n--- ${label} ---\n`);
  execSync(cmd, { cwd: root, stdio: "inherit", env: { ...process.env } });
}

try {
  run(`npx --yes tsx "${batchScript}"`, "Batch validation (40 variants + migration)");
  run(`node "${liveScript}"`, "Live PDF + mobile validation");
} catch {
  process.exit(1);
}
