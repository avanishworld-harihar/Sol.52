import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = join(__dirname, "..", "docs", "verification", "3a51-documents", "screenshots");

mkdirSync(OUT, { recursive: true });

const projectId = process.env.TEST_PROJECT_ID;
if (!projectId) {
  console.error("Set TEST_PROJECT_ID from verify script output");
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

await page.goto(`${BASE}/projects/${projectId}`, { waitUntil: "networkidle", timeout: 90000 });
await page.waitForSelector('[role="tablist"]', { timeout: 60000 });
await page.screenshot({ path: join(OUT, "01-hub-overview.png"), fullPage: true });

const docsTab = page.getByRole("tab", { name: /^docs$/i });
await docsTab.waitFor({ state: "visible", timeout: 30000 });
await docsTab.click();
await page.waitForTimeout(1500);
await page.screenshot({ path: join(OUT, "02-hub-documents-tab.png"), fullPage: true });

const hasUpload = await page.getByText("Quick upload").isVisible();
const hasRoof = await page.getByText("Roof photo").first().isVisible();
console.log("Docs tab visible:", await docsTab.isVisible());
console.log("Quick upload section:", hasUpload);
console.log("Roof photo slot:", hasRoof);

await page.getByRole("tab", { name: /survey/i }).click();
await page.waitForTimeout(1000);
await page.screenshot({ path: join(OUT, "03-hub-survey-photos.png"), fullPage: true });

await page.getByRole("tab", { name: /timeline/i }).click();
await page.waitForTimeout(1000);
await page.screenshot({ path: join(OUT, "04-hub-timeline.png"), fullPage: true });

await page.getByRole("tab", { name: /overview/i }).click();
await page.waitForTimeout(1000);
await page.screenshot({ path: join(OUT, "05-hub-overview-documents.png"), fullPage: true });

await browser.close();
console.log("Screenshots saved to", OUT);
