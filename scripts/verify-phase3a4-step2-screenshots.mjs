/**
 * Phase 3A-4 Step 2 — Project Hub Overview tab screenshots.
 * Run: node scripts/verify-phase3a4-step2-screenshots.mjs
 * Requires dev server at VERIFY_BASE_URL (default http://localhost:3000).
 */
import { chromium, devices } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.VERIFY_BASE_URL ?? "http://localhost:3000";
const OUT = path.join(process.cwd(), "scripts", "phase3a4-step2-screenshots");

async function api(method, urlPath, body) {
  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function ensureProject() {
  const list = await api("GET", "/api/projects/list?view=active");
  const rows = list.json.data ?? [];
  if (rows.length > 0) return rows[0];

  const created = await api("POST", "/api/projects", {
    official_name: "Hub Step 2 Demo",
    project_code: "SOL-HUB-002",
    contract_amount_inr: 420000,
    amount_received_inr: 100000,
    capacity_kw: "5",
    target_completion: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    detail: "Phase 3A-4 Step 2 screenshot seed",
  });
  return created.json.data ?? null;
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const project = await ensureProject();
  if (!project?.id) {
    throw new Error("No project available for hub screenshots");
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  const detailResp = page.waitForResponse(
    (resp) => resp.url().includes(`/api/projects/${project.id}`) && resp.status() === 200,
    { timeout: 120000 }
  );

  await page.goto(`${BASE}/projects/${project.id}?tab=overview`, {
    waitUntil: "networkidle",
    timeout: 120000,
  });
  await detailResp.catch(() => null);

  await page.waitForSelector("#project-hub-panel-overview", { timeout: 60000 });
  await page.waitForFunction(
    () => document.body.innerText.includes("Financial summary"),
    undefined,
    { timeout: 60000 }
  );
  await page.waitForTimeout(600);

  await page.screenshot({ path: path.join(OUT, "01-hub-overview-desktop.png"), fullPage: true });

  const mobile = await browser.newContext({
    ...devices["iPhone 13"],
  });
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(`${BASE}/projects/${project.id}?tab=overview`, {
    waitUntil: "networkidle",
    timeout: 120000,
  });
  await mobilePage.waitForSelector("#project-hub-panel-overview", { timeout: 60000 });
  await mobilePage.waitForTimeout(600);
  await mobilePage.screenshot({
    path: path.join(OUT, "02-hub-overview-mobile.png"),
    fullPage: true,
  });

  const report = {
    captured_at: new Date().toISOString(),
    base_url: BASE,
    project_id: project.id,
    project_name: project.official_name ?? project.lead_name,
    files: ["01-hub-overview-desktop.png", "02-hub-overview-mobile.png"],
  };
  await writeFile(path.join(OUT, "verification-report.json"), JSON.stringify(report, null, 2));

  await browser.close();
  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
