/**
 * Executive Premium visual proof — all 6 pages + SP vs EP comparisons.
 * Usage: node scripts/verify-ep-visual-proof.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PORT = process.env.PORT || "3000";
const BASE = `http://localhost:${PORT}`;
const EP_ID = "4137765e-c37c-4c24-866e-a2d920c37e14";
const SP_ID = "441491dd-8246-4d5c-89bd-bad8dd1a12d0";
const OUT = path.join(ROOT, "review-output", "ep-visual-proof");

fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  channel: process.env.PW_CHANNEL || "chrome",
  headless: true,
});

async function shotPage(page, url, selector, outPath) {
  await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });
  await page.waitForTimeout(900);
  const el = page.locator(selector).first();
  await el.waitFor({ state: "visible", timeout: 60000 });
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await el.screenshot({ path: outPath });
}

async function stitchSideBySide(leftPath, rightPath, outPath, labelLeft, labelRight) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  const leftB64 = fs.readFileSync(leftPath).toString("base64");
  const rightB64 = fs.readFileSync(rightPath).toString("base64");
  const html = `<!DOCTYPE html><html><head><style>
    * { margin: 0; box-sizing: border-box; }
    body { background: #e8e8e6; font-family: system-ui, sans-serif; }
    .wrap { display: flex; gap: 8px; padding: 8px; height: 100vh; }
    .panel { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .tag { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #6b6b6b;
      padding: 8px 12px; background: #fff; border-bottom: 1px solid rgba(0,0,0,0.08); }
    .img { flex: 1; overflow: hidden; background: #fff; display: flex; align-items: center; justify-content: center; }
    img { width: 100%; height: 100%; object-fit: contain; object-position: top center; }
  </style></head><body>
  <div class="wrap">
    <div class="panel"><div class="tag">${labelLeft}</div><div class="img"><img src="data:image/png;base64,${leftB64}" /></div></div>
    <div class="panel"><div class="tag">${labelRight}</div><div class="img"><img src="data:image/png;base64,${rightB64}" /></div></div>
  </div></body></html>`;
  await page.setContent(html, { waitUntil: "load" });
  await page.waitForTimeout(300);
  await page.screenshot({ path: outPath, fullPage: false });
  await page.close();
}

const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// —— Executive Premium: all 6 pages ——
await page.goto(`${BASE}/proposal/${EP_ID}`, { waitUntil: "networkidle", timeout: 120000 });
await page.waitForSelector(".ep-nextgen-root", { timeout: 60000 });
const epSections = await page.locator("section.snap-start").all();
const epNames = [
  "01-cover",
  "02-bill-intelligence",
  "03-ownership-ledger",
  "04-property-asset",
  "05-governance",
  "06-investment-decision",
];
for (let i = 0; i < Math.min(epSections.length, epNames.length); i++) {
  await epSections[i].scrollIntoViewIfNeeded();
  await page.waitForTimeout(450);
  await epSections[i].screenshot({ path: path.join(OUT, `ep-${epNames[i]}.png`) });
}

// —— Sales Premium singles for comparison ——
const spShots = [
  { attr: "cover", file: "sp-cover.png" },
  { attr: "bill-audit", file: "sp-bill-intelligence.png" },
  { attr: "investment-summary", file: "sp-investment-summary.png" },
];
for (const { attr, file } of spShots) {
  await shotPage(
    page,
    `${BASE}/proposal/${SP_ID}`,
    `[data-page="${attr}"]`,
    path.join(OUT, file)
  );
}

await page.close();

// —— Side-by-side composites ——
await stitchSideBySide(
  path.join(OUT, "sp-cover.png"),
  path.join(OUT, "ep-01-cover.png"),
  path.join(OUT, "compare-01-cover.png"),
  "Sales Premium — Cover",
  "Executive Premium — Cover"
);
await stitchSideBySide(
  path.join(OUT, "sp-bill-intelligence.png"),
  path.join(OUT, "ep-02-bill-intelligence.png"),
  path.join(OUT, "compare-02-bill.png"),
  "Sales Premium — Bill Intelligence",
  "Executive Premium — Bill Intelligence"
);
await stitchSideBySide(
  path.join(OUT, "sp-investment-summary.png"),
  path.join(OUT, "ep-06-investment-decision.png"),
  path.join(OUT, "compare-03-investment.png"),
  "Sales Premium — Investment Summary",
  "Executive Premium — Investment Decision"
);

await browser.close();
console.log(`Visual proof saved to ${OUT}`);
