import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BASE = "http://localhost:3000";
const OUT = path.join(process.cwd(), "scripts", "phase3a2-screenshots-v2");

async function shot(page, name, fullPage = true) {
  const p = path.join(OUT, name);
  await page.screenshot({ path: p, fullPage });
  console.log("saved", p);
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const apis = [
    "/api/projects/list?view=active",
    "/api/projects/list?view=hidden",
    "/api/projects/list?view=archived",
    "/api/projects/dashboard-stats",
    "/api/pipeline",
  ];
  for (const ep of apis) {
    const r = await fetch(`${BASE}${ep}`);
    const j = await r.json();
    console.log(`API ${ep}: ${r.status}`, j.ok, Array.isArray(j.data) ? j.data.length : j.data?.total_projects);
  }

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));

  // Warm dev server
  await page.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 120000 });
  await page.waitForTimeout(2000);
  await page.goto(`${BASE}/projects`, { waitUntil: "networkidle", timeout: 120000 });
  await page.waitForSelector(".workspace-filter-rail", { timeout: 30000 });
  await page.waitForTimeout(1500);

  await shot(page, "01-desktop.png");

  // Filters visible (top of page)
  await page.locator(".workspace-filter-rail").scrollIntoViewIfNeeded();
  await shot(page, "03-filters.png", false);

  // Search
  await page.getByRole("textbox", { name: /Search projects/i }).fill("test");
  await page.waitForTimeout(500);
  await shot(page, "03-search-active.png");

  // Empty filtered
  await page.goto(`${BASE}/projects?q=__no_match_xyz__`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await shot(page, "05-empty-filtered.png");

  // Loading: slow API
  const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p2 = await ctx2.newPage();
  await p2.route("**/api/projects/list**", async (route) => {
    await new Promise((r) => setTimeout(r, 3000));
    await route.continue();
  });
  const nav = p2.goto(`${BASE}/projects`, { waitUntil: "commit" });
  await p2.waitForTimeout(600);
  await shot(p2, "06-loading.png");
  await nav;

  // Mobile
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const mp = await mobile.newPage();
  await mp.goto(`${BASE}/projects`, { waitUntil: "networkidle" });
  await mp.waitForTimeout(1500);
  await shot(mp, "02-mobile.png");

  console.log("console errors:", consoleErrors.slice(0, 10));
  await browser.close();
}

main().catch(console.error);
