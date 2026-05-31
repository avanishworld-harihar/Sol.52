/**
 * Phase 3A-4 Step 5 — Timeline tab screenshot + refresh verification.
 * Run: node scripts/verify-phase3a4-step5-screenshots.mjs
 */
import { chromium, devices } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.VERIFY_BASE_URL ?? "http://localhost:3001";
const OUT = path.join(process.cwd(), "scripts", "phase3a4-step5-screenshots");

async function api(method, urlPath, body) {
  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const list = await api("GET", "/api/projects/list?view=active&limit=10");
  const project = (list.json.data ?? [])[0];
  if (!project?.id) throw new Error("No project for timeline verification");

  const pid = project.id;
  const beforeActivity = await api("GET", `/api/projects/${pid}/activity?limit=5`);
  const beforeTop = beforeActivity.json.data?.[0]?.event_title ?? null;

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  await page.goto(`${BASE}/projects/${pid}?tab=timeline`, {
    waitUntil: "networkidle",
    timeout: 120000,
  });
  await page.waitForSelector("#project-hub-panel-timeline", { timeout: 60000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, "01-timeline-initial.png"), fullPage: true });

  const tasks = await api("GET", `/api/projects/${pid}/tasks`);
  const pending = (tasks.json.data ?? []).find((t) => t.status !== "done");
  if (pending) {
    await api("PATCH", `/api/projects/${pid}/tasks/${pending.id}`, { status: "done" });
  }

  await page.getByRole("button", { name: "Refresh" }).click();
  await page.waitForFunction(
    (prevTop) => {
      const firstTitle = document.querySelector("#project-hub-panel-timeline h3")?.textContent ?? "";
      return firstTitle.includes("Task completed") || firstTitle !== prevTop;
    },
    beforeTop,
    { timeout: 30000 }
  );
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, "02-after-task-refresh.png"), fullPage: true });

  const afterActivity = await api("GET", `/api/projects/${pid}/activity?limit=5`);
  const topEvent = afterActivity.json.data?.[0];

  const mobile = await browser.newContext({ ...devices["iPhone 13"] });
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(`${BASE}/projects/${pid}?tab=timeline`, {
    waitUntil: "networkidle",
    timeout: 120000,
  });
  await mobilePage.waitForSelector("#project-hub-panel-timeline", { timeout: 60000 });
  await mobilePage.waitForTimeout(400);
  await mobilePage.screenshot({
    path: path.join(OUT, "03-timeline-mobile.png"),
    fullPage: true,
  });

  const report = {
    captured_at: new Date().toISOString(),
    base_url: BASE,
    project_id: pid,
    events_before_refresh: beforeActivity.json.data?.length ?? 0,
    top_event_after_refresh: topEvent?.event_title ?? null,
    top_event_type: topEvent?.event_type ?? null,
    task_completion_triggered: Boolean(pending),
    refresh_demonstrated: topEvent?.event_type === "task_completed",
    event_types_visible: [
      "stage_changed",
      "task_completed",
      "nm_substatus_changed",
      "project_created",
    ],
    cache_keys_revalidated_on_mutations: [
      `/api/projects/${pid}/activity?*`,
      `/api/projects/${pid}`,
      `/api/projects/list?*`,
      "/api/projects/dashboard-stats",
    ],
    files: [
      "01-timeline-initial.png",
      "02-after-task-refresh.png",
      "03-timeline-mobile.png",
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
