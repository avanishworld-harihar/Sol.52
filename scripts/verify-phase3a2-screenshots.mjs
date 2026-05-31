/**
 * Phase 3A-2 visual verification — captures screenshots via Playwright.
 * Run: node scripts/verify-phase3a2-screenshots.mjs
 */
import { chromium, devices } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.VERIFY_BASE_URL ?? "http://localhost:3000";
const OUT = path.join(process.cwd(), "scripts", "phase3a2-screenshots");

async function api(method, urlPath, body) {
  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function waitForProjectsLoaded(page) {
  await page.waitForFunction(
    () => {
      const text = document.body?.innerText ?? "";
      return (
        text.includes("Patel") ||
        text.includes("Green Valley") ||
        text.includes("Ravi Sharma")
      );
    },
    undefined,
    { timeout: 120000 }
  );
  await page.waitForTimeout(800);
}

async function openProjectsPage(page) {
  const listResp = page.waitForResponse(
    (resp) => resp.url().includes("/api/projects/list") && resp.status() === 200,
    { timeout: 120000 }
  );
  await page.goto(`${BASE}/projects`, { waitUntil: "networkidle", timeout: 120000 });
  await listResp.catch(() => null);
  await page.waitForSelector(".workspace-filter-rail", { timeout: 60000 });
  await waitForProjectsLoaded(page);
}

async function seedSampleProjects() {
  const list = await api("GET", "/api/projects/list?view=active&limit=200");
  if ((list.json.data?.length ?? 0) >= 3) return list.json.data;

  const samples = [
    {
      official_name: "Ravi Sharma Solar",
      project_code: "SOL-2026-0001",
      contract_amount_inr: 285000,
      current_stage: "survey",
    },
    {
      official_name: "Green Valley Apartments",
      project_code: "SOL-2026-0002",
      contract_amount_inr: 1250000,
    },
    {
      official_name: "Patel Industries 50kW",
      project_code: "SOL-2026-0003",
      contract_amount_inr: 2100000,
    },
  ];

  const created = [];
  for (const s of samples) {
    const r = await api("POST", "/api/projects", {
      official_name: s.official_name,
      project_code: s.project_code,
      contract_amount_inr: s.contract_amount_inr,
      detail: "Verification seed project",
      capacity_kw: "5",
    });
    if (r.json.ok && r.json.data) created.push(r.json.data);
  }
  return created;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const report = { base: BASE, checks: [], errors: [], screenshots: [] };

  // --- API checks ---
  const endpoints = [
    "/api/projects/list?view=active",
    "/api/projects/list?view=hidden",
    "/api/projects/list?view=archived",
    "/api/projects/dashboard-stats",
  ];
  for (const ep of endpoints) {
    const r = await api("GET", ep);
    report.checks.push({
      endpoint: ep,
      ok: r.json.ok !== false,
      status: r.status,
      count: Array.isArray(r.json.data) ? r.json.data.length : r.json.data?.total_projects,
    });
    if (r.status >= 400 || r.json.ok === false) {
      report.errors.push(`API ${ep}: ${r.status} ${r.json.error ?? ""}`);
    }
  }

  // Ensure test data exists (seed script should have run; fallback via POST)
  await seedSampleProjects();

  const listAfter = await api("GET", "/api/projects/list?view=active&limit=200");
  const projects = listAfter.json.data ?? [];
  report.checks.push({ seedCount: projects.length });

  // --- Browser screenshots ---
  const browser = await chromium.launch({ headless: true });
  let archiveTestId = null;

  // Warm dev server (fixes unstyled HTML / CSS 404 on cold start)
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 120000 });
    await page.waitForTimeout(1500);
    await ctx.close();
  }

  // Loading state: intercept API with delay
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    const consoleErrors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => consoleErrors.push(err.message));

    await page.route("**/api/projects/list**", async (route) => {
      await new Promise((r) => setTimeout(r, 2500));
      await route.continue();
    });

    const loadPromise = page.goto(`${BASE}/projects`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);
    const p = path.join(OUT, "06-loading-state.png");
    await page.screenshot({ path: p, fullPage: true });
    report.screenshots.push(p);
    await loadPromise;
    await ctx.close();
  }

  // Desktop populated + filters
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const consoleErrors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => consoleErrors.push(err.message));

    await openProjectsPage(page);

    const p1 = path.join(OUT, "01-desktop-populated.png");
    await page.screenshot({ path: p1, fullPage: true });
    report.screenshots.push(p1);

    const p3 = path.join(OUT, "03-filters-visible.png");
    await page.locator(".workspace-filter-rail").scrollIntoViewIfNeeded();
    await page.screenshot({ path: p3, fullPage: false });
    report.screenshots.push(p3);

    const p4 = path.join(OUT, "04-table-populated.png");
    await page.screenshot({ path: p4, fullPage: true });
    report.screenshots.push(p4);

    // Search filter
    await page.getByLabel("Search projects").fill("Patel");
    await page.waitForTimeout(600);
    const searchHtml = await page.content();
    report.checks.push({
      searchPatel: searchHtml.includes("Patel") && !searchHtml.includes("Green Valley"),
    });

    // Stage filter screenshot
    await openProjectsPage(page);
    await page.getByLabel("Stage").selectOption("design");
    await page.waitForTimeout(800);
    const pStage = path.join(OUT, "07-stage-filter-design.png");
    await page.screenshot({ path: pStage, fullPage: true });
    report.screenshots.push(pStage);
    report.checks.push({
      stageFilter: page.url().includes("stage=design") && (await page.content()).includes("Green Valley"),
    });

    // Health filter screenshot
    await openProjectsPage(page);
    await page.getByLabel("Health").selectOption("delayed");
    await page.waitForTimeout(800);
    const pHealth = path.join(OUT, "08-health-filter-delayed.png");
    await page.screenshot({ path: pHealth, fullPage: true });
    report.screenshots.push(pHealth);
    report.checks.push({
      healthFilter:
        page.url().includes("health=delayed") &&
        !(await page.content()).includes("Green Valley") &&
        (await page.content()).includes("Patel"),
    });

    // Archive tab with populated data (archive first project, then screenshot)
    if (projects[0]?.id) {
      archiveTestId = projects[0].id;
      const arch = await api("PATCH", `/api/projects/${archiveTestId}`, { archived_at: true });
      report.checks.push({ archive: arch.json.ok, status: arch.status });
      const archivedList = await api("GET", "/api/projects/list?view=archived");
      const found = (archivedList.json.data ?? []).some((p) => p.id === archiveTestId);
      report.checks.push({ archivedVisible: found });
    }

    await page.goto(`${BASE}/projects?view=archived`, { waitUntil: "networkidle", timeout: 120000 });
    await page.waitForTimeout(1200);
    const pArchive = path.join(OUT, "09-archive-tab-populated.png");
    await page.screenshot({ path: pArchive, fullPage: true });
    report.screenshots.push(pArchive);
    report.checks.push({
      archiveTabPopulated: (await page.content()).includes("Ravi Sharma"),
    });

    // Pagination — shrink page size by many projects or use page=2 if enough
    if (projects.length > 20) {
      await page.goto(`${BASE}/projects?page=2`, { waitUntil: "networkidle" });
      report.checks.push({ pagination: page.url().includes("page=2") });
    } else {
      report.checks.push({ pagination: "skipped (<21 projects)" });
    }

    report.consoleErrors = consoleErrors;
    await ctx.close();
  }

  // Mobile
  {
    const iPhone = devices["iPhone 13"];
    const ctx = await browser.newContext({ ...iPhone });
    const page = await ctx.newPage();
    await openProjectsPage(page);
    const p2 = path.join(OUT, "02-mobile-populated.png");
    await page.screenshot({ path: p2, fullPage: true });
    report.screenshots.push(p2);
    await ctx.close();
  }

  // Empty state (filter no match)
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/projects?q=__no_match_xyz_999__`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    const p5 = path.join(OUT, "05-empty-filtered.png");
    await page.screenshot({ path: p5, fullPage: true });
    report.screenshots.push(p5);

    await page.goto(`${BASE}/projects?view=archived`, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    const p5b = path.join(OUT, "05-empty-archived-tab.png");
    await page.screenshot({ path: p5b, fullPage: true });
    report.screenshots.push(p5b);
    await ctx.close();
  }

  // Restore archived project after screenshots
  if (archiveTestId) {
    const restore = await api("PATCH", `/api/projects/${archiveTestId}`, { archived_at: null });
    report.checks.push({ restore: restore.json.ok });
  }

  await browser.close();

  const reportPath = path.join(OUT, "verification-report.json");
  await writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  console.log(`\nScreenshots saved to: ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
