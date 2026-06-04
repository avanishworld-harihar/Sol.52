#!/usr/bin/env node
/**
 * Proposal Stability Framework runner.
 * Usage:
 *   npm run test:proposal-stability
 *   UPDATE_GOLDEN=1 npm run test:proposal-stability   (regenerate snapshots)
 */
import { execSync } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const script = join(root, "lib/proposal-stability/run-stability-checks.ts");

try {
  execSync(`npx --yes tsx "${script}"`, {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env },
  });
} catch {
  process.exit(1);
}
