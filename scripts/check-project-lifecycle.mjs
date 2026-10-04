import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const listRoute = read("app/api/projects/list/route.ts");
const store = read("lib/project-store.ts");
const migration = read("supabase/migrations/096_project_lifecycle_integrity.sql");
const page = read("app/(main)/projects/page.tsx");

const checks = [
  [!listRoute.includes("repairPreWonProjectVisibility"), "Projects GET is read-only"],
  [page.includes('"completed"') && page.includes('"drafts"'), "Completed and Drafts views exist"],
  [store.includes('record_type", "operational"'), "Operational lifecycle is filtered server-side"],
  [migration.includes("projects_one_operational_per_lead_idx"), "Duplicate operational project guard exists"],
  [read("lib/demo-seed-data.ts").includes("ui-preview-demo"), "Preview demos are filtered"],
];

for (const [ok, label] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"} ${label}`);
  if (!ok) process.exitCode = 1;
}
