/**
 * Executive Premium Phase C — bill intelligence + ledger table screenshots.
 * Usage: node scripts/verify-ep-phase-c-screenshots.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PORT = process.env.PORT || "3000";
const BASE = `http://localhost:${PORT}`;
const EP_ID = process.env.EP_PROPOSAL_ID || "4137765e-c37c-4c24-866e-a2d920c37e14";
const SP_ID = process.env.SP_PROPOSAL_ID || "441491dd-8246-4d5c-89bd-bad8dd1a12d0";
const OUT = path.join(ROOT, "review-output", "ep-phase-c");

fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  channel: process.env.PW_CHANNEL || "chrome",
  headless: true,
});

async function captureProposal(id, prefix) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${BASE}/proposal/${id}`, { waitUntil: "networkidle", timeout: 120000 });
  await page.waitForTimeout(800);

  const sections = await page.locator("section.snap-start").all();
  const names = [
    "01-cover",
    "02-bill-intelligence",
    "03-ownership-ledger",
    "04-property-asset",
    "05-governance",
    "06-investment",
  ];

  for (let i = 0; i < Math.min(sections.length, names.length); i++) {
    await sections[i].scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await sections[i].screenshot({ path: path.join(OUT, `${prefix}-${names[i]}.png`) });
  }

  await page.close();
}

await captureProposal(EP_ID, "ep");
await captureProposal(SP_ID, "sp");
await browser.close();
console.log(`Screenshots saved to ${OUT}`);
