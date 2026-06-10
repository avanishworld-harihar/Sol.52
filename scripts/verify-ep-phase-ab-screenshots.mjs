/**
 * Executive Premium Phase A+B — capture thesis page screenshots.
 * Usage: node scripts/verify-ep-phase-ab-screenshots.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PORT = process.env.PORT || "3000";
const BASE = `http://localhost:${PORT}`;
const PROPOSAL_ID = process.env.EP_PROPOSAL_ID || "4137765e-c37c-4c24-866e-a2d920c37e14";
const OUT = path.join(ROOT, "review-output", "ep-phase-ab");

fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  channel: process.env.PW_CHANNEL || "chrome",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const url = `${BASE}/proposal/${PROPOSAL_ID}`;

await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });
await page.waitForSelector(".ep-nextgen-root", { timeout: 60000 });

const sections = await page.locator("section.snap-start").all();
const names = [
  "01-asset-declaration-cover",
  "02-bill-intelligence",
  "03-ownership-ledger",
  "04-property-asset",
  "05-governance",
  "06-investment-decision",
];

for (let i = 0; i < Math.min(sections.length, names.length); i++) {
  await sections[i].scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await sections[i].screenshot({ path: path.join(OUT, `${names[i]}.png`) });
}

await page.screenshot({ path: path.join(OUT, "00-full-viewport.png"), fullPage: false });
await browser.close();
console.log(`Screenshots saved to ${OUT}`);
