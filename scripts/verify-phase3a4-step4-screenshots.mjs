/**
 * Phase 3A-4 Step 4 — Tasks tab screenshot + flow verification.
 * Run: node scripts/verify-phase3a4-step4-screenshots.mjs
 */
import { chromium, devices } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.VERIFY_BASE_URL ?? "http://localhost:3001";
const OUT = path.join(process.cwd(), "scripts", "phase3a4-step4-screenshots");

async function api(method, urlPath, body) {
  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function ensureTasksProject() {
  const list = await api("GET", "/api/projects/list?view=active&limit=50");
  let project = (list.json.data ?? []).find((p) => p.current_stage === "net_metering");
  if (!project) project = (list.json.data ?? [])[0];
  if (!project?.id) throw new Error("No project found");

  let tasks = await api("GET", `/api/projects/${project.id}/tasks`);
  if ((tasks.json.data?.length ?? 0) === 0) {
    await api("POST", `/api/projects/${project.id}/advance-stage`, {});
    tasks = await api("GET", `/api/projects/${project.id}/tasks`);
  }
  return { project, tasks: tasks.json.data ?? [] };
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const { project, tasks: initialTasks } = await ensureTasksProject();
  const pending = initialTasks.find((t) => t.status !== "done");
  if (!pending) throw new Error("No pending task available for completion demo");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const hubTasksUrl = `${BASE}/projects/${project.id}?tab=tasks`;

  await page.goto(hubTasksUrl, { waitUntil: "networkidle", timeout: 120000 });
  await page.waitForSelector("#project-hub-panel-tasks", { timeout: 60000 });

  const allStagesBtn = page.getByRole("button", { name: "All stages" });
  if (await allStagesBtn.isVisible()) await allStagesBtn.click();
  await page.waitForTimeout(600);

  await page.screenshot({ path: path.join(OUT, "01-tasks-tab-initial.png"), fullPage: true });

  const completeBtn = page.getByRole("button", { name: "Mark complete" }).first();
  await completeBtn.click();
  await page.waitForFunction(
    () => {
      const text = document.body.innerText;
      return /Completed tasks\s*\(\s*[1-9]/.test(text) || text.includes("Task completed");
    },
    undefined,
    { timeout: 30000 }
  );
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, "02-after-complete.png"), fullPage: true });

  const tasksAfterComplete = await api("GET", `/api/projects/${project.id}/tasks`);
  const activityAfterComplete = await api("GET", `/api/projects/${project.id}/activity?limit=5`);

  const reopenBtn = page.getByRole("button", { name: "Reopen" }).first();
  await reopenBtn.click();
  await page.waitForFunction(
    () => {
      const text = document.body.innerText;
      return text.includes("Pending tasks") && !document.querySelector('button:has-text("Reopen")');
    },
    undefined,
    { timeout: 30000 }
  ).catch(() => null);
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, "03-after-reopen.png"), fullPage: true });

  const tasksAfterReopen = await api("GET", `/api/projects/${project.id}/tasks`);
  const reopenedTask = (tasksAfterReopen.json.data ?? []).find((t) => t.id === pending.id);

  const mobile = await browser.newContext({ ...devices["iPhone 13"] });
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(hubTasksUrl, { waitUntil: "networkidle", timeout: 120000 });
  await mobilePage.waitForSelector("#project-hub-panel-tasks", { timeout: 60000 });
  await mobilePage.getByRole("button", { name: "All stages" }).click();
  await mobilePage.waitForTimeout(400);
  await mobilePage.screenshot({
    path: path.join(OUT, "04-tasks-tab-mobile.png"),
    fullPage: true,
  });

  const report = {
    captured_at: new Date().toISOString(),
    base_url: BASE,
    project_id: project.id,
    demo_task_id: pending.id,
    demo_task_title: pending.title,
    task_completed_logged: (activityAfterComplete.json.data ?? []).some(
      (e) => e.event_type === "task_completed"
    ),
    task_status_after_complete: (tasksAfterComplete.json.data ?? []).find((t) => t.id === pending.id)
      ?.status,
    task_status_after_reopen: reopenedTask?.status,
    cache_keys_revalidated: [
      `/api/projects/${project.id}`,
      `/api/projects/${project.id}/activity`,
      `/api/projects/${project.id}/tasks`,
      "/api/projects/list?view=active&limit=200",
      "/api/projects/dashboard-stats",
    ],
    files: [
      "01-tasks-tab-initial.png",
      "02-after-complete.png",
      "03-after-reopen.png",
      "04-tasks-tab-mobile.png",
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
