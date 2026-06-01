/**
 * Mobile UX polish verification — projects list + hub at common widths.
 * Run: node scripts/verify-mobile-ux-polish.mjs
 */
import { chromium, devices } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.VERIFY_BASE_URL ?? "http://localhost:3000";
const OUT = path.join(process.cwd(), "scripts", "mobile-ux-polish-screenshots");

const WIDTHS = [
  { name: "360", width: 360, height: 800 },
  { name: "375", width: 375, height: 812 },
  { name: "390", width: 390, height: 844 },
  { name: "412", width: 412, height: 915 },
];

async function measureOverflow(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const overflow =
      document.body.scrollWidth > document.body.clientWidth + 1 ||
      doc.scrollWidth > doc.clientWidth + 1;
    return {
      body_scroll_width: document.body.scrollWidth,
      body_client_width: document.body.clientWidth,
      page_horizontal_overflow: overflow,
    };
  });
}

async function resolveHubHref() {
  try {
    const res = await fetch(`${BASE}/api/projects/list?limit=1`);
    const json = await res.json();
    const id = json?.data?.[0]?.id;
    if (id) return `/projects/${id}`;
  } catch {
    /* ignore */
  }
  return null;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const issues = [];
  const results = [];

  const browser = await chromium.launch({ headless: true });
  const hubHref = await resolveHubHref();

  for (const w of WIDTHS) {
    const ctx = await browser.newContext({
      viewport: { width: w.width, height: w.height },
      ...devices["iPhone 13"],
    });
    const page = await ctx.newPage();

    await page.goto(`${BASE}/projects`, { waitUntil: "domcontentloaded", timeout: 120000 });
    await page.waitForSelector('[role="tablist"][aria-label="Projects view"]', {
      timeout: 90000,
    });
    await page.waitForTimeout(400);

    const listOverflow = await measureOverflow(page);
    const listShot = `projects-list-${w.name}.png`;
    await page.screenshot({ path: path.join(OUT, listShot), fullPage: true });

    const cardBox = await page
      .locator("article")
      .filter({ has: page.locator("h3") })
      .first()
      .boundingBox()
      .catch(() => null);

    if (listOverflow.page_horizontal_overflow) {
      issues.push(`${w.name}px: horizontal overflow on /projects`);
    }

    let hubShot = null;
    let hubOverflow = null;
    if (hubHref) {
      await page.goto(`${BASE}${hubHref}?tab=design`, {
        waitUntil: "domcontentloaded",
        timeout: 120000,
      });
      await page.waitForSelector('[role="tablist"][aria-label="Project hub tabs"]', {
        timeout: 90000,
      });
      await page.waitForTimeout(400);
      hubOverflow = await measureOverflow(page);
      hubShot = `hub-design-${w.name}.png`;
      await page.screenshot({ path: path.join(OUT, hubShot), fullPage: true });
      if (hubOverflow.page_horizontal_overflow) {
        issues.push(`${w.name}px: horizontal overflow on hub`);
      }
    }

    results.push({
      width: w.name,
      list: { overflow: listOverflow, first_card_height_px: cardBox?.height ?? null, screenshot: listShot },
      hub: hubShot ? { overflow: hubOverflow, screenshot: hubShot } : null,
    });

    await ctx.close();
  }

  const desktopCtx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const desktop = await desktopCtx.newPage();
  await desktop.goto(`${BASE}/projects`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await desktop.waitForTimeout(500);
  await desktop.screenshot({ path: path.join(OUT, "projects-list-desktop-regression.png"), fullPage: true });
  await desktopCtx.close();

  const report = {
    captured_at: new Date().toISOString(),
    base_url: BASE,
    hub_href: hubHref,
    results,
    issues,
    desktop_regression_screenshot: "projects-list-desktop-regression.png",
  };

  await writeFile(path.join(OUT, "verification-report.json"), JSON.stringify(report, null, 2));
  await browser.close();
  console.log(JSON.stringify(report, null, 2));
  if (issues.length > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
