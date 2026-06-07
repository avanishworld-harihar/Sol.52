#!/usr/bin/env node
import { execSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const script = join(root, "lib/project-pending-checks.ts");

try {
  execSync(`npx --yes tsx "${script}"`, { cwd: root, stdio: "inherit", env: { ...process.env } });
} catch {
  process.exit(1);
}
