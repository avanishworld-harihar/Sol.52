#!/usr/bin/env node
/**
 * Live Phase 1 validation — PDF size, mobile viewport, branding DOM checks.
 * Requires dev server at VERIFY_BASE_URL (default http://localhost:3000).
 *
 * Creates 1 proposal per family (4 total), audits PDF + mobile + desktop branding.
 */
import { chromium } from "playwright";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.VERIFY_BASE_URL ?? "http://localhost:3000";
const OUT = path.join(process.cwd(), "scripts", "validation-output");
const PRIOR_AUDIT = path.join(process.cwd(), "scripts", "audit-pdf-output", "audit-report.json");

const emptyMonths = {
  jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0,
  jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0,
};

async function api(method, urlPath, body) {
  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function serverReady() {
  try {
    const res = await fetch(`${BASE}/`, { signal: AbortSignal.timeout(5000) });
    return res.ok || res.status < 500;
  } catch {
    return false;
  }
}

function analyzePdfBuffer(buf) {
  const latin = buf.toString("latin1");
  const totalBytes = buf.length;
  let pageCount = 0;
  const countMatch = latin.match(/\/Type\s*\/Pages[\s\S]*?\/Count\s+(\d+)/);
  if (countMatch) pageCount = Number(countMatch[1]);
  if (!pageCount) pageCount = (latin.match(/\/Type\s*\/Page\b/g) || []).length;

  let imageBytes = 0;
  let imageCount = 0;
  const imageRe = /(\d+)\s+(\d+)\s+obj[\s\S]*?<<([\s\S]*?)>>\s*stream\r?\n([\s\S]*?)endstream/g;
  let m;
  while ((m = imageRe.exec(latin)) !== null) {
    if (!/\/Subtype\s*\/Image/.test(m[3])) continue;
    imageCount += 1;
    imageBytes += m[4].length;
  }
  return {
    totalBytes,
    totalMb: (totalBytes / (1024 * 1024)).toFixed(2),
    pageCount,
    imageCount,
    imageMb: (imageBytes / (1024 * 1024)).toFixed(2),
    imagePct: totalBytes ? ((imageBytes / totalBytes) * 100).toFixed(1) : "0",
  };
}

async function createProposals() {
  const residential = await api("POST", "/api/proposals", {
    customerName: "Phase1 Residential Audit",
    location: "Satna, MP",
    systemKw: 5,
    yearlyBill: 72000,
    afterSolar: 18000,
    saving: 54000,
    paybackYears: 5.5,
    monthlyUnits: { jan: 420, feb: 380, mar: 400, apr: 450, may: 520, jun: 580, jul: 600, aug: 590, sep: 480, oct: 420, nov: 400, dec: 410 },
    state: "Madhya Pradesh",
    discom: "MPPKVVCL",
    connectionType: "LT",
    grossSystemCostInr: 275000,
    pmSuryaGharSubsidyInr: 78000,
    netCostInr: 197000,
    amcSelectedYears: 5,
  });

  const commercialPayload = (orgType, kw, name) => ({
    customerName: name,
    location: "Bhopal, MP",
    systemKw: kw,
    yearlyBill: 0,
    afterSolar: 0,
    saving: kw * 10200,
    paybackYears: 8.3,
    monthlyUnits: emptyMonths,
    grossSystemCostInr: kw * 85000,
    netCostInr: kw * 85000,
    presetId: "commercial_executive",
    commercialConfig: {
      orgType,
      dcrComparison: { enabled: true },
      capacityScenarios: {
        enabled: true,
        recommendedId: "primary",
        scenarios: [
          { id: "primary", label: "Recommended", systemKw: kw, isRecommended: true },
          { id: "option_a", label: "Conservative", systemKw: Math.round(kw * 0.8) },
          { id: "option_b", label: "Expansion", systemKw: Math.round(kw * 1.2) },
        ],
      },
    },
  });

  const commercial = await api("POST", "/api/proposals", commercialPayload("generic", 75, "Phase1 Commercial Audit"));
  const school = await api("POST", "/api/proposals", commercialPayload("school", 50, "Phase1 School Audit"));
  const factory = await api("POST", "/api/proposals", commercialPayload("factory", 100, "Phase1 Factory Audit"));

  const out = [];
  for (const [family, res] of [
    ["residential", residential],
    ["commercial", commercial],
    ["school", school],
    ["factory", factory],
  ]) {
    const id = res.json?.id ?? res.json?.shareToken;
    if (res.status !== 200 || !id) {
      throw new Error(`Create ${family} failed: ${res.status} ${JSON.stringify(res.json)}`);
    }
    out.push({ family, url: `${BASE}/proposal/${id}`, id });
  }
  return out;
}

async function auditProposal(browser, { family, url }) {
  const desktop = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await desktop.goto(url, { waitUntil: "networkidle", timeout: 180000 });

  const isCommercial = family !== "residential";
  if (isCommercial) {
    await desktop.waitForSelector(".commercial-proposal", { timeout: 60000 });
    await desktop.evaluate(async () => {
      document.documentElement.classList.add("commercial-print-snap");
      const step = Math.max(400, window.innerHeight * 0.85);
      const max = document.documentElement.scrollHeight;
      for (let y = 0; y <= max; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 80));
      }
      window.scrollTo(0, 0);
    });
    await desktop.waitForTimeout(1200);
  } else {
    await desktop.waitForTimeout(2000);
  }

  const branding = await desktop.evaluate(() => {
    const logos = [...document.querySelectorAll("img")].filter((i) => /logo|brand|installer/i.test(i.alt || i.src || ""));
    const companyNames = [...document.querySelectorAll("[class*='brand'], [class*='installer'], h1, h2")].slice(0, 20).map((el) => el.textContent?.trim().slice(0, 80) ?? "");
    return {
      imgCount: document.querySelectorAll("img").length,
      logoLikeCount: logos.length,
      hasMainContent: document.body.innerText.length > 500,
      sampleHeadings: companyNames.filter(Boolean).slice(0, 5),
    };
  });

  await desktop.emulateMedia({ media: "print", reducedMotion: "reduce" });
  const pdfPath = path.join(OUT, `${family}-phase1-audit.pdf`);
  await desktop.pdf({
    path: pdfPath,
    format: "A4",
    printBackground: true,
    margin: { top: "10mm", bottom: "10mm", left: "9mm", right: "9mm" },
  });
  const pdfBuf = await readFile(pdfPath);
  const pdf = analyzePdfBuffer(pdfBuf);

  await desktop.screenshot({ path: path.join(OUT, `${family}-desktop.png`), fullPage: false });
  await desktop.close();

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await mobile.goto(url, { waitUntil: "networkidle", timeout: 180000 });
  await mobile.waitForTimeout(1500);
  const mobileMetrics = await mobile.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 8,
    bodyTextLen: document.body.innerText.length,
    rootExists: !!document.querySelector(".commercial-proposal, [class*='proposal']"),
  }));
  await mobile.screenshot({ path: path.join(OUT, `${family}-mobile.png`), fullPage: false });
  await mobile.close();

  return { family, url, branding, pdf: { ...pdf, path: pdfPath }, mobile: mobileMetrics };
}

async function main() {
  await mkdir(OUT, { recursive: true });

  if (!(await serverReady())) {
    const skipReport = {
      generatedAt: new Date().toISOString(),
      skipped: true,
      reason: `Dev server not reachable at ${BASE}. Start with npm run dev and re-run npm run test:phase1-validation.`,
      batchOnly: true,
    };
    await writeFile(path.join(OUT, "phase1-live-report.json"), JSON.stringify(skipReport, null, 2));
    console.log(`\nLive validation SKIPPED — no server at ${BASE}`);
    console.log("Batch validation may still have passed. Start dev server for PDF/mobile checks.\n");
    return;
  }

  console.log(`Live validation against ${BASE}`);
  const proposals = await createProposals();
  const browser = await chromium.launch({ headless: true });
  const results = [];
  for (const p of proposals) {
    console.log(`  Auditing ${p.family}…`);
    results.push(await auditProposal(browser, p));
  }
  await browser.close();

  let priorPdf = null;
  try {
    priorPdf = JSON.parse(await readFile(PRIOR_AUDIT, "utf8"));
  } catch {
    /* no prior baseline */
  }

  const findings = [];
  for (const r of results) {
    if (!r.branding.hasMainContent) findings.push(`${r.family}: thin/empty page content`);
    if (r.mobile.hasHorizontalOverflow) findings.push(`${r.family}: mobile horizontal overflow`);
    if (Number(r.pdf.totalMb) > 15) findings.push(`${r.family}: PDF ${r.pdf.totalMb} MB exceeds 15 MB`);
  }

  if (priorPdf?.analysis) {
    const priorMb = Number(priorPdf.analysis.totalMb);
    for (const r of results) {
      if (r.family === "school") {
        const delta = Number(r.pdf.totalMb) - priorMb;
        if (Math.abs(delta) > 0.5) {
          findings.push(`school PDF size delta vs pre-stabilization audit: ${delta > 0 ? "+" : ""}${delta.toFixed(2)} MB (was ${priorMb}, now ${r.pdf.totalMb})`);
        }
      }
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE,
    priorAuditReference: priorPdf ? PRIOR_AUDIT : null,
    results,
    findings,
    ok: findings.length === 0,
  };

  const reportPath = path.join(OUT, "phase1-live-report.json");
  await writeFile(reportPath, JSON.stringify(report, null, 2));

  console.log("\n=== Live Phase 1 Validation ===\n");
  for (const r of results) {
    console.log(`${r.family}:`);
    console.log(`  PDF: ${r.pdf.totalMb} MB, ${r.pdf.pageCount} pages, ${r.pdf.imageCount} images (${r.pdf.imagePct}% raster)`);
    console.log(`  Mobile: overflow=${r.mobile.hasHorizontalOverflow}, content=${r.mobile.bodyTextLen} chars`);
    console.log(`  Branding: ${r.branding.imgCount} images, logos~${r.branding.logoLikeCount}`);
  }
  if (findings.length) {
    console.log("\nFindings:");
    for (const f of findings) console.log(`  • ${f}`);
    process.exit(1);
  }
  console.log(`\nLive report: ${reportPath}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
