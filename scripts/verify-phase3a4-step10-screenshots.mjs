/**
 * Phase 3A-4 Step 10 — Full hub QA, mobile, tab sweep, overflow checks.
 * Run: node scripts/verify-phase3a4-step10-screenshots.mjs
 * Env: VERIFY_BASE_URL (default http://localhost:3000)
 */
import { chromium, devices } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.VERIFY_BASE_URL ?? "http://localhost:3000";
const OUT = path.join(process.cwd(), "scripts", "phase3a4-step10-screenshots");

const TABS = [
  { id: "overview", label: "Overview", qs: "" },
  { id: "survey", label: "Survey", qs: "?tab=survey" },
  { id: "design", label: "Design", qs: "?tab=design" },
  { id: "tasks", label: "Tasks", qs: "?tab=tasks" },
  { id: "timeline", label: "Timeline", qs: "?tab=timeline" },
  { id: "comments", label: "Comments", qs: "?tab=comments" },
];

async function measureOverflow(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const bodyOverflow = document.body.scrollWidth > document.body.clientWidth + 1;
    const docOverflow = doc.scrollWidth > doc.clientWidth + 1;
    return {
      body_scroll_width: document.body.scrollWidth,
      body_client_width: document.body.clientWidth,
      doc_scroll_width: doc.scrollWidth,
      doc_client_width: doc.clientWidth,
      page_horizontal_overflow: bodyOverflow || docOverflow,
    };
  });
}

async function resolveHubHref() {
  try {
    const res = await fetch(`${BASE}/api/projects/list?limit=1`);
    const json = await res.json();
    const id = json?.data?.[0]?.id;
    if (typeof id === "string" && id.length > 0) return `/projects/${id}`;
  } catch {
    /* fall through */
  }
  return null;
}

async function openFirstHub(page) {
  const directHref = await resolveHubHref();
  if (directHref) {
    await page.goto(`${BASE}${directHref}`, { waitUntil: "domcontentloaded", timeout: 120000 });
    await page.waitForSelector('[role="tablist"][aria-label="Project hub tabs"]', {
      timeout: 120000,
    });
    return directHref;
  }

  await page.goto(`${BASE}/projects`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForSelector('a[href^="/projects/"]', { timeout: 90000 });
  const link = page
    .locator('a[href^="/projects/"]')
    .filter({ hasNotText: "Projects" })
    .first();
  const href = await link.getAttribute("href");
  if (!href) throw new Error("No project hub link on /projects");
  await link.click();
  await page.waitForURL(/\/projects\/[^/?]+/, { timeout: 90000 });
  await page.waitForSelector('[role="tablist"][aria-label="Project hub tabs"]', {
    timeout: 90000,
  });
  return href;
}

async function auditTabs(page, prefix, issues) {
  const tabResults = [];
  for (const tab of TABS) {
    const url = page.url().replace(/\?.*$/, "") + tab.qs;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120000 });
    await page.waitForSelector(`#project-hub-tab-${tab.id}`, { timeout: 30000 });
    await page.waitForTimeout(500);
    const overflow = await measureOverflow(page);
    if (overflow.page_horizontal_overflow) {
      issues.push(`${prefix}: horizontal overflow on tab ${tab.id}`);
    }
    const file = `${prefix}-tab-${tab.id}.png`;
    await page.screenshot({ path: path.join(OUT, file), fullPage: true });
    tabResults.push({ tab: tab.id, overflow, screenshot: file });
  }
  return tabResults;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const issues = [];
  const apiCalls = [];

  const browser = await chromium.launch({ headless: true });
  const desktopCtx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const desktop = await desktopCtx.newPage();

  desktop.on("request", (req) => {
    const u = req.url();
    if (u.includes("/api/projects/")) apiCalls.push(u);
  });

  const hubHref = await openFirstHub(desktop);
  await desktop.screenshot({ path: path.join(OUT, "01-hub-overview-desktop.png"), fullPage: true });

  const desktopTabs = await auditTabs(desktop, "desktop", issues);

  await desktop.click("#project-hub-tab-tasks");
  await desktop.waitForTimeout(400);
  await desktop.screenshot({ path: path.join(OUT, "02-hub-advance-area-desktop.png"), fullPage: false });

  const mobileCtx = await browser.newContext({ ...devices["iPhone 13"] });
  const mobile = await mobileCtx.newPage();
  await mobile.goto(`${BASE}${hubHref}`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await mobile.waitForSelector('[role="tablist"][aria-label="Project hub tabs"]', {
    timeout: 90000,
  });
  const mobileTabs = await auditTabs(mobile, "mobile", issues);

  const uniqueApi = [...new Set(apiCalls.map((u) => u.split("?")[0]))];

  const report = {
    captured_at: new Date().toISOString(),
    base_url: BASE,
    hub_href: hubHref,
    desktop_tabs: desktopTabs,
    mobile_tabs: mobileTabs,
    issues,
    api_project_endpoints_seen: uniqueApi.length,
    api_project_endpoints_sample: uniqueApi.slice(0, 24),
    production_readiness_note:
      issues.length === 0
        ? "No page-level horizontal overflow detected across hub tabs (desktop + mobile)."
        : "Fix overflow issues before go-live.",
    files: [
      "01-hub-overview-desktop.png",
      "02-hub-advance-area-desktop.png",
      ...desktopTabs.map((t) => t.screenshot),
      ...mobileTabs.map((t) => t.screenshot),
    ],
  };

  await writeFile(path.join(OUT, "verification-report.json"), JSON.stringify(report, null, 2));
  await browser.close();
  console.log(JSON.stringify(report, null, 2));
  if (issues.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
