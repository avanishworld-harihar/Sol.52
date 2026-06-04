/**
 * Capture School vs Factory proposal screenshots for visual audit.
 * Run: node scripts/capture-proposal-screenshots.mjs
 */
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "scripts", "audit-screenshots");
const baseUrl = process.env.AUDIT_BASE_URL || "http://localhost:3000";

const emptyMonths = {
  jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0,
  jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0,
};

async function createProposal(orgType, customerName) {
  const res = await fetch(`${baseUrl}/api/proposals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerName,
      location: "Bhopal, MP",
      systemKw: 50,
      yearlyBill: 0,
      afterSolar: 0,
      saving: 510000,
      paybackYears: 8.3,
      monthlyUnits: emptyMonths,
      grossSystemCostInr: 4250000,
      netCostInr: 4250000,
      presetId: "commercial_executive",
      commercialConfig: { orgType },
    }),
  });
  const json = await res.json();
  if (!json.id) throw new Error(`create failed: ${JSON.stringify(json)}`);
  return json.id;
}

async function capture(browser, id, label, anchors) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 900 });
  const url = `${baseUrl}/proposal/${id}`;
  await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });
  await page.waitForTimeout(2500);

  mkdirSync(outDir, { recursive: true });
  await page.screenshot({ path: join(outDir, `${label}-top.png`), fullPage: false });

  const results = {};
  for (const [name, selector] of Object.entries(anchors)) {
    const el = page.locator(selector).first();
    const count = await el.count();
    results[name] = count > 0;
    if (count > 0) {
      await el.scrollIntoViewIfNeeded();
      await page.waitForTimeout(600);
      await page.screenshot({ path: join(outDir, `${label}-${name}.png`), fullPage: false });
    }
  }

  await page.screenshot({ path: join(outDir, `${label}-full.png`), fullPage: true });
  await page.close();
  return { url, results };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    const schoolId = await createProposal("school", "Green Valley Public School");
    const factoryId = await createProposal("factory", "Satna Industrial Works");

    const school = await capture(browser, schoolId, "school", {
      "green-campus": "#comm-school-green",
      "learning-asset": "#comm-school-learning",
      "roi": "#comm-roi",
      "engineering-safety": "text=Designed for Safe Educational Environments",
    });

    const factory = await capture(browser, factoryId, "factory", {
      "green-campus": "#comm-school-green",
      "learning-asset": "#comm-school-learning",
      "roi": "#comm-roi",
    });

    console.log(JSON.stringify({ outDir, school, factory }, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
