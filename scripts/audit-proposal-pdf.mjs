#!/usr/bin/env node
/**
 * Proposal PDF size audit — generates a commercial PDF via Playwright (Chromium print)
 * and analyzes structure: pages, images, fonts, estimated per-page weight.
 *
 * Usage:
 *   node scripts/audit-proposal-pdf.mjs [proposalUrl]
 *   PROPOSAL_URL=http://localhost:3002/proposal/xxx node scripts/audit-proposal-pdf.mjs
 */
import { chromium } from "playwright";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.VERIFY_BASE_URL ?? "http://localhost:3002";
const OUT = path.join(process.cwd(), "scripts", "audit-pdf-output");
const SCHOOL_FIXTURE = JSON.parse(
  await readFile(path.join(process.cwd(), "tests/proposal-stability/fixtures/school.json"), "utf8")
);

async function api(method, urlPath, body) {
  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function ensureProposalUrl() {
  if (process.env.PROPOSAL_URL) return process.env.PROPOSAL_URL;
  if (process.argv[2]?.startsWith("http")) return process.argv[2];

  const payload = {
    ...SCHOOL_FIXTURE.input,
    presetId: "commercial_executive",
    customerName: `PDF Audit ${Date.now()}`,
    commercialConfig: {
      ...SCHOOL_FIXTURE.input.commercialConfig,
      capacityScenarios: {
        enabled: true,
        recommendedId: "primary",
        scenarios: [
          { id: "primary", label: "Recommended", systemKw: 50, isRecommended: true },
          { id: "option_a", label: "Conservative", systemKw: 40 },
          { id: "option_b", label: "Expansion", systemKw: 60 },
        ],
      },
    },
  };
  const created = await api("POST", "/api/proposals", payload);
  if (created.status !== 200 || !created.json?.shareToken) {
    throw new Error(`Could not create proposal: ${created.status} ${JSON.stringify(created.json)}`);
  }
  return `${BASE}/proposal/${created.json.shareToken}`;
}

/** Parse PDF buffer for structural analysis (no external deps). */
function analyzePdfBuffer(buf) {
  const latin = buf.toString("latin1");
  const totalBytes = buf.length;

  // Page count — prefer /Count in Pages tree
  let pageCount = 0;
  const countMatch = latin.match(/\/Type\s*\/Pages[\s\S]*?\/Count\s+(\d+)/);
  if (countMatch) pageCount = Number(countMatch[1]);
  if (!pageCount) {
    pageCount = (latin.match(/\/Type\s*\/Page\b/g) || []).length;
  }

  // Image streams
  const images = [];
  const imageRe = /(\d+)\s+(\d+)\s+obj[\s\S]*?<<([\s\S]*?)>>\s*stream\r?\n([\s\S]*?)endstream/g;
  let m;
  while ((m = imageRe.exec(latin)) !== null) {
    const dict = m[3];
    if (!/\/Subtype\s*\/Image/.test(dict)) continue;
    const len = m[4].length;
    const w = dict.match(/\/Width\s+(\d+)/)?.[1];
    const h = dict.match(/\/Height\s+(\d+)/)?.[1];
    const filter = dict.match(/\/Filter\s*\/?(\w+)/)?.[1] ?? "none";
    const colorSpace = dict.match(/\/ColorSpace\s*\/?(\w+)/)?.[1] ?? "?";
    const bpc = dict.match(/\/BitsPerComponent\s+(\d+)/)?.[1] ?? "?";
    images.push({
      obj: `${m[1]} ${m[2]}`,
      bytes: len,
      width: w ? Number(w) : null,
      height: h ? Number(h) : null,
      filter,
      colorSpace,
      bitsPerComponent: bpc,
      megapixels: w && h ? ((Number(w) * Number(h)) / 1_000_000).toFixed(2) : null,
    });
  }
  images.sort((a, b) => b.bytes - a.bytes);

  // Font objects
  const fontNames = [];
  const fontRe = /\/BaseFont\s*\/([^\s/>]+)/g;
  while ((m = fontRe.exec(latin)) !== null) {
    fontNames.push(m[1]);
  }
  const uniqueFonts = [...new Set(fontNames)];

  // Content stream sizes (page paint instructions — proxy for page complexity)
  const contentStreams = [];
  const streamRe = /(\d+)\s+(\d+)\s+obj[\s\S]*?<<([\s\S]*?)>>\s*stream\r?\n([\s\S]*?)endstream/g;
  while ((m = streamRe.exec(latin)) !== null) {
    const dict = m[3];
    if (/\/Subtype\s*\/Image/.test(dict)) continue;
    if (!/\/Length\s+\d+/.test(dict) && m[4].length < 200) continue;
    contentStreams.push({ obj: `${m[1]} ${m[2]}`, bytes: m[4].length });
  }
  contentStreams.sort((a, b) => b.bytes - a.bytes);

  const imageBytes = images.reduce((s, i) => s + i.bytes, 0);
  const rasterLike = images.filter((i) => i.width && i.width >= 800);

  return {
    totalBytes,
    totalMb: (totalBytes / (1024 * 1024)).toFixed(2),
    pageCount,
    avgMbPerPage: pageCount ? (totalBytes / pageCount / (1024 * 1024)).toFixed(2) : "?",
    imageCount: images.length,
    imageBytes,
    imageMb: (imageBytes / (1024 * 1024)).toFixed(2),
    imagePct: ((imageBytes / totalBytes) * 100).toFixed(1),
    rasterLikeCount: rasterLike.length,
    fonts: uniqueFonts,
    fontCount: uniqueFonts.length,
    topImages: images.slice(0, 15),
    topContentStreams: contentStreams.slice(0, 20),
    likelyFullPageRasters: rasterLike.filter((i) => i.width >= 1200 && i.height >= 1500).length,
  };
}

/** Estimate per-page weight by pairing large images with page order (heuristic). */
function estimatePageBreakdown(analysis, sectionLabels) {
  const pages = analysis.pageCount;
  const bigImages = analysis.topImages.filter((i) => i.bytes > 50_000);
  const perPage = [];
  for (let i = 0; i < pages; i++) {
    const img = bigImages[i];
    perPage.push({
      page: i + 1,
      section: sectionLabels[i] ?? `page-${i + 1}`,
      estImageKb: img ? Math.round(img.bytes / 1024) : 0,
      estTotalKb: img ? Math.round(img.bytes / 1024) + 80 : Math.round(analysis.totalBytes / pages / 1024),
      dimensions: img?.width && img?.height ? `${img.width}×${img.height}` : "text/vector",
      filter: img?.filter ?? "—",
    });
  }
  return perPage;
}

const SCHOOL_SECTIONS = [
  "Cover",
  "Executive Summary",
  "Green Campus",
  "Learning Asset",
  "DCR Comparison",
  "Capacity Scenarios",
  "ROI Dashboard",
  "Financials",
  "Engineering",
  "Architecture",
  "BOM (part 1)",
  "BOM Electrical",
  "Timeline",
  "Monitoring",
  "Terms",
  "Closing (part 1)",
  "Closing (part 2)",
];

async function collectDomMetrics(page) {
  return page.evaluate(() => {
    const imgs = [...document.querySelectorAll("img")].map((el) => ({
      src: (el.src || "").slice(0, 120),
      naturalW: el.naturalWidth,
      naturalH: el.naturalHeight,
      displayW: el.clientWidth,
      displayH: el.clientHeight,
    }));
    const canvases = [...document.querySelectorAll("canvas")].map((el) => ({
      w: el.width,
      h: el.height,
    }));
    const motionHidden = document.querySelectorAll('[style*="opacity: 0"], [style*="opacity:0"]').length;
    const pages = document.querySelectorAll(".proposal-page").length;
    const shadows = document.querySelectorAll('[class*="shadow"]').length;
    const gradients = document.querySelectorAll('[class*="gradient"]').length;
    const blur = document.querySelectorAll('[class*="backdrop-blur"], [class*="blur-"]').length;
    return { imgs, canvases, motionHidden, pages, shadows, gradients, blur };
  });
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const url = await ensureProposalUrl();
  console.log(`Auditing: ${url}`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  await page.goto(url, { waitUntil: "networkidle", timeout: 180000 });
  await page.waitForSelector(".commercial-proposal", { timeout: 60000 });

  // Scroll entire document so framer-motion whileInView content materializes before print
  await page.evaluate(async () => {
    document.documentElement.classList.add("commercial-print-snap");
    const step = Math.max(400, window.innerHeight * 0.85);
    const max = document.documentElement.scrollHeight;
    for (let y = 0; y <= max; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 80));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1500);

  // Match user print dialog
  await page.emulateMedia({ media: "print", reducedMotion: "reduce" });
  await page.waitForTimeout(500);

  await page.screenshot({
    path: path.join(OUT, "commercial-print-preview.png"),
    fullPage: true,
  });

  const dom = await collectDomMetrics(page);
  const pdfPath = path.join(OUT, "commercial-school-audit.pdf");

  await page.pdf({
    path: pdfPath,
    format: "A4",
    printBackground: true,
    margin: { top: "10mm", bottom: "10mm", left: "9mm", right: "9mm" },
  });

  const buf = await readFile(pdfPath);
  const analysis = analyzePdfBuffer(buf);
  const pageBreakdown = estimatePageBreakdown(analysis, SCHOOL_SECTIONS);

  const report = {
    generatedAt: new Date().toISOString(),
    url,
    exportMethod: "Playwright page.pdf() — same Chromium print pipeline as window.print()",
    file: pdfPath,
    dom,
    analysis,
    pageBreakdown,
    findings: [],
  };

  if (Number(analysis.totalMb) > 10) {
    report.findings.push(`Total size ${analysis.totalMb} MB exceeds 10 MB target`);
  }
  if (Number(analysis.imagePct) > 70) {
    report.findings.push(`${analysis.imagePct}% of PDF is embedded images — likely page rasterization`);
  }
  if (analysis.likelyFullPageRasters > 0) {
    report.findings.push(`${analysis.likelyFullPageRasters} full-page-scale raster images detected (≥1200×1500px)`);
  }
  if (dom.canvases.length > 0) {
    report.findings.push(`${dom.canvases.length} HTML canvas elements (Chart.js-style bitmap risk)`);
  }
  if (dom.motionHidden > 0) {
    report.findings.push(`${dom.motionHidden} elements still at opacity:0 — white-page risk on iOS`);
  }

  const reportPath = path.join(OUT, "audit-report.json");
  await writeFile(reportPath, JSON.stringify(report, null, 2));

  console.log("\n=== Proposal PDF Audit ===\n");
  console.log(`File: ${pdfPath}`);
  console.log(`Size: ${analysis.totalMb} MB (${analysis.pageCount} pages, ~${analysis.avgMbPerPage} MB/page)`);
  console.log(`Images: ${analysis.imageCount} (${analysis.imageMb} MB, ${analysis.imagePct}% of file)`);
  console.log(`Fonts: ${analysis.fontCount} unique (${analysis.fonts.slice(0, 6).join(", ")}${analysis.fonts.length > 6 ? "…" : ""})`);
  console.log(`DOM: ${dom.pages} proposal-page sections, ${dom.imgs.length} img, ${dom.canvases.length} canvas, ${dom.shadows} shadow classes, ${dom.gradients} gradients`);
  console.log("\nTop embedded images:");
  for (const img of analysis.topImages.slice(0, 8)) {
    console.log(
      `  ${Math.round(img.bytes / 1024)} KB  ${img.width ?? "?"}×${img.height ?? "?"}  ${img.filter}  obj ${img.obj}`
    );
  }
  console.log("\nEstimated page breakdown (heuristic):");
  for (const p of pageBreakdown.slice(0, analysis.pageCount)) {
    console.log(`  p${String(p.page).padStart(2)}  ~${p.estTotalKb} KB  ${p.dimensions.padEnd(12)}  ${p.section}`);
  }
  if (report.findings.length) {
    console.log("\nFindings:");
    for (const f of report.findings) console.log(`  • ${f}`);
  }
  console.log(`\nFull report: ${reportPath}`);

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
