/**
 * Capture Bharti Documents Hub screenshots (port 3006 or BASE_URL).
 * Run: node scripts/capture-bharti-hub-screenshots.mjs
 */
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.BASE_URL || "http://localhost:3006";
const LEAD = "eead2c0a-8f20-4c7a-8128-ce8fff874834";
const OUT = join(__dirname, "..", "docs", "verification", "customer-documents-hub", "realworld");

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

const url = `${BASE}/customers/${LEAD}`;
await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120000 });
await page.getByText("Documents", { exact: false }).first().waitFor({ timeout: 90000 });
await page.waitForTimeout(3000);

// Scroll to Documents hub
const docsHeading = page.locator("h2, h3").filter({ hasText: /^Documents$/ }).first();
if (await docsHeading.count()) {
  await docsHeading.scrollIntoViewIfNeeded();
}
await page.waitForSelector("text=Showing", { timeout: 60000 }).catch(() => {});
await page.waitForTimeout(2000);

await page.screenshot({ path: join(OUT, "01-hub-populated.png"), fullPage: true });

const ownerSelect = page.locator('select[aria-label="Filter by owner"]');
const typeSelect = page.locator('select[aria-label="Filter by type"]');
const projectSelect = page.locator('select[aria-label="Filter by project"]');

await ownerSelect.selectOption({ value: "customer" });
await page.waitForTimeout(2500);
await page.screenshot({ path: join(OUT, "02-filter-owner-customer.png"), fullPage: true });

await ownerSelect.selectOption({ value: "project" });
await page.waitForTimeout(2500);
await page.screenshot({ path: join(OUT, "03-filter-owner-project.png"), fullPage: true });

await ownerSelect.selectOption({ value: "" });
await typeSelect.selectOption({ value: "ROOF_PHOTO" });
await page.waitForTimeout(2500);
await page.screenshot({ path: join(OUT, "04-filter-type-roof.png"), fullPage: true });

await typeSelect.selectOption({ value: "" });
await projectSelect.selectOption({ value: "3cfd6369-4d9a-45d3-8c90-008de6c62a46" });
await page.waitForTimeout(2500);
await page.screenshot({ path: join(OUT, "05-filter-project-bharti.png"), fullPage: true });

// Search roof
const searchInput = page.getByPlaceholder(/search by filename/i);
await searchInput.fill("roof");
await page.getByRole("button", { name: /^search$/i }).click();
await page.waitForTimeout(3000);
await page.screenshot({ path: join(OUT, "06-search-roof.png"), fullPage: true });

await browser.close();
console.log("Screenshots saved to", OUT);
