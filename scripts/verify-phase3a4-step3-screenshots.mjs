/**
 * Phase 3A-4 Step 3 — Stage advance + NM sub-status screenshot verification.
 * Run: node scripts/verify-phase3a4-step3-screenshots.mjs
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.VERIFY_BASE_URL ?? "http://localhost:3001";
const OUT = path.join(process.cwd(), "scripts", "phase3a4-step3-screenshots");

async function api(method, urlPath, body) {
  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function ensureSurveyProject() {
  const list = await api("GET", "/api/projects/list?view=active&limit=50");
  const rows = list.json.data ?? [];
  const survey = rows.find((p) => p.current_stage === "survey");
  if (survey) return survey;

  const created = await api("POST", "/api/projects", {
    official_name: "Step 3 Advance Demo",
    project_code: "SOL-HUB-S3",
    contract_amount_inr: 350000,
    capacity_kw: "5",
    detail: "Phase 3A-4 Step 3 stage advance demo",
  });
  return created.json.data ?? null;
}

async function advanceToNetMetering(projectId) {
  let detail = await api("GET", `/api/projects/${projectId}`);
  let stage = detail.json.data?.current_stage;
  const order = ["survey", "design", "approval", "installation", "net_metering"];
  while (stage && stage !== "net_metering" && order.includes(stage)) {
    const r = await api("POST", `/api/projects/${projectId}/advance-stage`, {});
    if (!r.json.ok) break;
    detail = await api("GET", `/api/projects/${projectId}`);
    stage = detail.json.data?.current_stage;
  }
  return detail.json.data;
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const project = await ensureSurveyProject();
  if (!project?.id) throw new Error("No project for Step 3 verification");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const hubUrl = `${BASE}/projects/${project.id}?tab=overview`;

  await page.goto(hubUrl, { waitUntil: "networkidle", timeout: 120000 });
  await page.waitForSelector('button:has-text("Advance stage")', { timeout: 60000 });

  await page.screenshot({ path: path.join(OUT, "01-before-advance.png"), fullPage: true });

  await page.getByRole("button", { name: "Advance stage" }).click();
  await page.waitForSelector('[aria-labelledby="project-advance-sheet-title"]', { timeout: 15000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, "02-advance-sheet-open.png"), fullPage: true });

  await page.getByRole("button", { name: "Confirm advance" }).click();
  await page.waitForFunction(
    () => !document.querySelector('[aria-labelledby="project-advance-sheet-title"]'),
    undefined,
    { timeout: 30000 }
  );
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, "03-after-advance.png"), fullPage: true });

  const afterAdvance = await api("GET", `/api/projects/${project.id}`);
  const activityAfterAdvance = await api("GET", `/api/projects/${project.id}/activity?limit=5`);

  await advanceToNetMetering(project.id);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector('label:has-text("Net metering sub-status")', { timeout: 60000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, "04-nm-stage-selectors.png"), fullPage: true });

  const nmSelect = page.locator('select[aria-label="Net metering sub-status"]');
  await nmSelect.selectOption("application_filed");
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT, "05-nm-substatus-updated.png"), fullPage: true });

  const afterNm = await api("GET", `/api/projects/${project.id}`);
  const activityAfterNm = await api("GET", `/api/projects/${project.id}/activity?limit=8`);

  const report = {
    captured_at: new Date().toISOString(),
    base_url: BASE,
    project_id: project.id,
    stage_after_first_advance: afterAdvance.json.data?.current_stage ?? null,
    stage_after_nm_setup: afterNm.json.data?.current_stage ?? null,
    nm_substatus: afterNm.json.data?.nm_substatus ?? null,
    activity_events: (activityAfterNm.json.data ?? []).map((e) => ({
      type: e.event_type,
      title: e.event_title,
    })),
    stage_advance_logged: (activityAfterAdvance.json.data ?? []).some(
      (e) => e.event_type === "stage_changed"
    ),
    nm_change_logged: (activityAfterNm.json.data ?? []).some(
      (e) => e.event_type === "nm_substatus_changed"
    ),
    cache_keys_revalidated: [
      `/api/projects/${project.id}`,
      `/api/projects/${project.id}/activity`,
      `/api/projects/${project.id}/tasks`,
      "/api/projects/list?view=active&limit=200",
      "/api/projects/dashboard-stats",
    ],
    files: [
      "01-before-advance.png",
      "02-advance-sheet-open.png",
      "03-after-advance.png",
      "04-nm-stage-selectors.png",
      "05-nm-substatus-updated.png",
    ],
  };

  await writeFile(path.join(OUT, "verification-report.json"), JSON.stringify(report, null, 2));
  await browser.close();
  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
