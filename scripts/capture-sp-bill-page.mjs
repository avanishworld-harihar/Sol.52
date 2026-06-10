import path from "node:path";
import { chromium } from "playwright";

const OUT = path.join("review-output", "ep-phase-c");
const SP_ID = "441491dd-8246-4d5c-89bd-bad8dd1a12d0";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`http://localhost:3000/proposal/${SP_ID}`, { waitUntil: "networkidle", timeout: 120000 });
await page.waitForTimeout(1000);

const el = page.locator('[data-page="bill-audit"]');
if (await el.count()) {
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await el.screenshot({ path: path.join(OUT, "sp-02-bill-intelligence.png") });
  console.log("captured sp bill-audit");
} else {
  const pages = await page.locator("[data-page]").evaluateAll((els) =>
    els.map((e) => e.getAttribute("data-page"))
  );
  console.log("bill-audit not found. data-page values:", pages);
}

await browser.close();
