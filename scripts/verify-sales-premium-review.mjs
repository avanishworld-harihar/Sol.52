/**
 * Sales Premium v1 review — creates bill + requirement proposals, captures
 * page order from DOM, content checks, and full-page screenshots.
 *
 * Usage: node scripts/verify-sales-premium-review.mjs
 * Requires: dev server on PORT (default 3002), playwright chromium
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PORT = process.env.PORT || "3002";
const BASE = `http://localhost:${PORT}`;
const OUT = path.join(ROOT, "review-output", "sales-premium-v1");

// Inline v1 layout (matches getPresetDefaultLayout residential_sales_premium)
const V1_LAYOUT = {
  version: 1,
  blocks: [
    { id: "cover_page", enabled: true, section: "flow" },
    { id: "bill_intelligence", enabled: true, section: "flow" },
    { id: "system_requirements", enabled: true, section: "flow" },
    { id: "roi_savings", enabled: true, section: "flow" },
    { id: "investment_summary", enabled: true, section: "flow" },
    { id: "technical_specifications", enabled: true, section: "flow" },
    { id: "amc_maintenance", enabled: true, section: "flow" },
    { id: "payment_terms", enabled: true, section: "flow" },
    { id: "terms_conditions", enabled: true, section: "appendix" },
    { id: "customer_documents_required", enabled: true, section: "appendix" },
    { id: "bom_material_list", enabled: true, section: "appendix" },
    { id: "financial_summary", enabled: true, section: "appendix" },
  ],
};

const MONTHLY_VARIED = {
  jan: 400, feb: 380, mar: 420, apr: 450, may: 500, jun: 550,
  jul: 600, aug: 580, sep: 480, oct: 420, nov: 400, dec: 390,
};

const MONTHLY_FLAT = {
  jan: 400, feb: 400, mar: 400, apr: 400, may: 400, jun: 400,
  jul: 400, aug: 400, sep: 400, oct: 400, nov: 400, dec: 400,
};

const AUDIT_OVERRIDES = {
  jan: { netPayableInr: 7200, energyInr: 5200, fixedInr: 800, electricityDutyInr: 600, units: 400 },
  feb: { netPayableInr: 6800, energyInr: 4900, fixedInr: 800, electricityDutyInr: 550, units: 380 },
  mar: { netPayableInr: 7500, energyInr: 5400, fixedInr: 800, electricityDutyInr: 650, units: 420 },
  apr: { netPayableInr: 8100, energyInr: 5800, fixedInr: 800, electricityDutyInr: 700, units: 450 },
  may: { netPayableInr: 9000, energyInr: 6500, fixedInr: 800, electricityDutyInr: 750, units: 500 },
  jun: { netPayableInr: 9800, energyInr: 7100, fixedInr: 800, electricityDutyInr: 800, units: 550 },
};

function basePayload(name, dataSource, monthlyUnits) {
  return {
    customerName: name,
    location: "Bhopal, MP",
    systemKw: 5,
    yearlyBill: 96000,
    afterSolar: 12000,
    saving: 84000,
    paybackYears: 4.5,
    monthlyUnits,
    state: "Madhya Pradesh",
    discom: "MPCZ Bhopal",
    connectionType: "LT",
    dataSource,
    presetId: "residential_sales_premium",
    proposalLayout: V1_LAYOUT,
    useMpAudits: false,
    billMonth: dataSource === "bill" ? "Jun 2025" : undefined,
    currentMonthBillAmountInr: dataSource === "bill" ? 9800 : undefined,
    monthlyAuditOverrides: dataSource === "bill" ? AUDIT_OVERRIDES : undefined,
    grossSystemCostInr: 280000,
    pmSuryaGharSubsidyInr: 78000,
    netCostInr: 202000,
  };
}

async function createProposal(label, dataSource, monthlyUnits) {
  const res = await fetch(`${BASE}/api/proposals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(basePayload(`SP Review ${label}`, dataSource, monthlyUnits)),
  });
  const json = await res.json();
  if (!json.ok || !json.id) throw new Error(`Create failed (${label}): ${JSON.stringify(json)}`);
  return { id: json.id, url: `${BASE}/proposal/${json.id}` };
}

async function reviewProposal(browser, scenario, url) {
  const dir = path.join(OUT, scenario);
  fs.mkdirSync(dir, { recursive: true });

  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(url, { waitUntil: "load", timeout: 180000 });
  await page.waitForSelector('[data-preset="residential_sales_premium"]', { timeout: 120000 });
  await page.waitForSelector(".proposal-page", { timeout: 120000 });
  await page.waitForTimeout(3000);

  const report = await page.evaluate(() => {
    const flowPages = Array.from(document.querySelectorAll(".proposal-page:not(.proposal-page--appendix)"));
    const appendixPages = Array.from(document.querySelectorAll(".proposal-page--appendix"));
    const allText = document.body.innerText;

    const flowOrder = flowPages.map((el, i) => ({
      index: i + 1,
      dataPage: el.getAttribute("data-page"),
      journeyId: el.querySelector("[id^='journey-']")?.id ?? null,
      heading: el.querySelector("h2, h3")?.textContent?.trim().slice(0, 80) ?? null,
    }));

    const appendixOrder = appendixPages.map((el, i) => ({
      index: `A${i + 1}`,
      dataPage: el.getAttribute("data-page"),
      journeyId: el.querySelector("[id^='journey-']")?.id ?? null,
    }));

    const checks = {
      billEnergyCharge: /Energy ₹|ऊर्जा ₹/i.test(allText),
      billFixedCharge: /Fixed ₹|फिक्स्ड ₹/i.test(allText),
      billDutyFuel: /Duty \+ Fuel|ड्यूटी\+फ्यूल/i.test(allText),
      billTotal: /Total|कुल/i.test(allText),
      grossCost: /Gross System Cost|सकल सिस्टम लागत/i.test(allText),
      subsidy: /Subsidy|सब्सिडी/i.test(allText),
      netCost: /Net System Cost|निवेश|net investment|Your net investment/i.test(allText),
      payback: /Payback|पेबैक/i.test(allText),
      savings25: /25.*(year|yr|वर्ष)|Net Saving|शुद्ध बचत/i.test(allText),
      bomInFlow: flowPages.some((el) => el.getAttribute("data-page") === "bom"),
      bomInAppendix: appendixPages.some((el) => el.getAttribute("data-page") === "bom"),
      aboutCompany: /id="journey-expertise"|About company|हमारे बारे/i.test(document.body.innerHTML),
      dcrComparison: /dcr-comparison|DCR vs|ट्रैक तुलना/i.test(document.body.innerHTML),
      billAuditVisible: !!document.querySelector("#journey-bill-audit"),
      systemReqVisible: !!document.querySelector("#journey-system-requirement, [data-page='system-requirement']"),
      investmentVisible: !!document.querySelector("#journey-investment-summary"),
      appendixShell: !!document.querySelector(".proposal-appendix-shell"),
    };

    const pricingConsistent = (() => {
      const gross = allText.match(/Gross System Cost|सकल सिस्टम लागत/i)
        ? [...allText.matchAll(/₹[\d,]+/g)].map((m) => m[0])
        : [];
      void gross;
      const investmentPage = document.querySelector("#journey-investment-summary");
      const paymentPage = document.querySelector("#journey-payment");
      const parseInr = (s) => {
        const m = (s || "").replace(/[^\d]/g, "");
        return m ? parseInt(m, 10) : null;
      };
      const heroNet = investmentPage?.querySelector(".text-3xl, .text-4xl")?.textContent;
      const rowNet = investmentPage?.querySelector(".bg-sky-100\\/80 .font-bold:last-child, .bg-sky-100 .font-bold:last-child")?.textContent;
      const paymentNet = paymentPage?.querySelector(".text-sky-300, .text-sky-900")?.textContent;
      const h = parseInr(heroNet);
      const r = parseInr(rowNet);
      const p = parseInr(paymentNet);
      if (h == null || r == null) return { ok: false, heroNet: h, rowNet: r, paymentNet: p };
      return { ok: h === r && (p == null || p === h), heroNet: h, rowNet: r, paymentNet: p };
    })();

    return { flowOrder, appendixOrder, checks, pricingConsistent, title: document.title };
  });

  // Screenshot each flow page
  const flowLocators = page.locator(".proposal-page:not(.proposal-page--appendix)");
  const flowCount = await flowLocators.count();
  for (let i = 0; i < flowCount; i++) {
    const el = flowLocators.nth(i);
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    const dataPage = await el.getAttribute("data-page");
    await el.screenshot({ path: path.join(dir, `${String(i + 1).padStart(2, "0")}-${dataPage ?? "page"}.png`) });
  }

  // Expand appendix and screenshot
  const appendixDetails = page.locator(".proposal-appendix-shell");
  if ((await appendixDetails.count()) > 0) {
    await appendixDetails.evaluate((el) => { el.open = true; });
    await page.waitForTimeout(500);
    const appendixLocators = page.locator(".proposal-page--appendix");
    const appendixCount = await appendixLocators.count();
    for (let i = 0; i < appendixCount; i++) {
      const el = appendixLocators.nth(i);
      await el.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      const dataPage = await el.getAttribute("data-page");
      await el.screenshot({ path: path.join(dir, `A${String(i + 1).padStart(2, "0")}-${dataPage ?? "appendix"}.png`) });
    }
    await page.screenshot({ path: path.join(dir, "00-full-document.png"), fullPage: true });
  }

  await page.close();
  return report;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  let bill;
  let req;
  if (process.env.REVIEW_ONLY === "1") {
    const billId = process.env.BILL_ID || "441491dd-8246-4d5c-89bd-bad8dd1a12d0";
    const reqId = process.env.REQ_ID || "05a15a64-daf5-4163-9811-a50f3e3c320d";
    bill = { id: billId, url: `${BASE}/proposal/${billId}` };
    req = { id: reqId, url: `${BASE}/proposal/${reqId}` };
    console.log("Review-only mode — reusing existing proposals");
  } else {
    console.log("Creating bill-backed proposal...");
    bill = await createProposal("Bill", "bill", MONTHLY_VARIED);
    console.log("Creating requirement proposal...");
    req = await createProposal("Requirement", "requirement", MONTHLY_FLAT);
  }

  const browser = await chromium.launch({ headless: true });

  console.log("Reviewing bill-backed:", bill.url);
  const billReport = await reviewProposal(browser, "bill-backed", bill.url);

  console.log("Reviewing requirement:", req.url);
  const reqReport = await reviewProposal(browser, "requirement-based", req.url);

  await browser.close();

  const results = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE,
    scenarios: {
      billBacked: { url: bill.url, id: bill.id, ...billReport },
      requirementBased: { url: req.url, id: req.id, ...reqReport },
    },
  };

  fs.writeFileSync(path.join(OUT, "verification-results.json"), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
