/**
 * Phase 3A-4 Step 9 — List/dashboard deep links to Hub verification.
 * Run: node scripts/verify-phase3a4-step9-screenshots.mjs
 */
import { chromium, devices } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.VERIFY_BASE_URL ?? "http://localhost:3001";
const OUT = path.join(process.cwd(), "scripts", "phase3a4-step9-screenshots");

async function main() {
  await mkdir(OUT, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });

  await page.goto(`${BASE}/projects`, { waitUntil: "networkidle", timeout: 120000 });
  await page.waitForSelector('a[href^="/projects/"]', { timeout: 60000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, "01-projects-list-desktop.png"), fullPage: true });

  const listHubLink = await page
    .locator('a[href^="/projects/"]')
    .filter({ hasNotText: "Projects" })
    .first();
  const listHref = await listHubLink.getAttribute("href");
  if (!listHref) throw new Error("No project hub link found in list");
  await listHubLink.click();
  await page.waitForURL(/\/projects\/[^/?]+(\?.*)?$/, { timeout: 60000 });
  await page.waitForSelector("h1", { timeout: 30000 });
  await page.screenshot({ path: path.join(OUT, "02-hub-from-list-desktop.png"), fullPage: true });

  await page.goBack({ waitUntil: "networkidle" });
  const backUrl = page.url();

  await page.waitForTimeout(700);
  const urgentLink = page
    .locator("article")
    .filter({ hasText: "Urgent attention" })
    .locator('a[href^="/projects/"]')
    .first();
  const urgentHref = await urgentLink.getAttribute("href");
  if (!urgentHref) throw new Error("No urgent dashboard hub link found");
  await urgentLink.click();
  await page.waitForURL(/\/projects\/[^/?]+(\?.*)?$/, { timeout: 60000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, "03-hub-from-dashboard-desktop.png"), fullPage: true });

  const mobileCtx = await browser.newContext({ ...devices["iPhone 13"] });
  const mobilePage = await mobileCtx.newPage();
  await mobilePage.goto(`${BASE}/projects`, { waitUntil: "networkidle", timeout: 120000 });
  await mobilePage.waitForSelector('a[href^="/projects/"]', { timeout: 60000 });
  await mobilePage.waitForTimeout(700);
  await mobilePage.screenshot({ path: path.join(OUT, "04-projects-list-mobile.png"), fullPage: true });

  const mobileLink = mobilePage.locator('a[href^="/projects/"]').first();
  const mobileHref = await mobileLink.getAttribute("href");
  if (!mobileHref) throw new Error("No mobile project hub link found");
  await mobileLink.click();
  await mobilePage.waitForURL(/\/projects\/[^/?]+(\?.*)?$/, { timeout: 60000 });
  await mobilePage.waitForTimeout(600);
  await mobilePage.screenshot({ path: path.join(OUT, "05-hub-mobile.png"), fullPage: true });

  const report = {
    captured_at: new Date().toISOString(),
    base_url: BASE,
    list_link_href: listHref,
    dashboard_link_href: urgentHref,
    mobile_link_href: mobileHref,
    back_navigation_url: backUrl,
    open_in_new_tab_note: "All deep links are native anchor links (/projects/[id]), so browser open-in-new-tab works.",
    files: [
      "01-projects-list-desktop.png",
      "02-hub-from-list-desktop.png",
      "03-hub-from-dashboard-desktop.png",
      "04-projects-list-mobile.png",
      "05-hub-mobile.png",
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
