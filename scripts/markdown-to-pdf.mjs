/**
 * Convert markdown to PDF via system Chrome/Edge headless print.
 * Usage: node scripts/markdown-to-pdf.mjs <input.md> <output.pdf>
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const inputPath = path.resolve(process.argv[2] ?? "");
const outputPath = path.resolve(process.argv[3] ?? "");

if (!inputPath || !outputPath) {
  console.error("Usage: node scripts/markdown-to-pdf.mjs <input.md> <output.pdf>");
  process.exit(1);
}

const BROWSERS = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];

function findBrowser() {
  return BROWSERS.find((p) => fs.existsSync(p)) ?? null;
}

function stripFrontmatter(raw) {
  if (raw.startsWith("---")) {
    const end = raw.indexOf("\n---", 3);
    if (end !== -1) return raw.slice(end + 4).trimStart();
  }
  return raw;
}

function mdToHtml(md) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let inCode = false;
  let inUl = false;
  let inOl = false;
  let tableRows = [];

  function flushLists() {
    if (inUl) {
      out.push("</ul>");
      inUl = false;
    }
    if (inOl) {
      out.push("</ol>");
      inOl = false;
    }
  }

  function flushTable() {
    if (!tableRows.length) return;
    out.push("<table>");
    tableRows.forEach((row, i) => {
      const tag = i === 0 ? "th" : "td";
      out.push("<tr>" + row.map((c) => `<${tag}>${inline(c)}</${tag}>`).join("") + "</tr>");
    });
    out.push("</table>");
    tableRows = [];
  }

  function inline(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  }

  for (const line of lines) {
    if (line.startsWith("```")) {
      flushLists();
      flushTable();
      if (!inCode) {
        inCode = true;
        out.push('<pre class="code"><code>');
      } else {
        inCode = false;
        out.push("</code></pre>");
      }
      continue;
    }
    if (inCode) {
      out.push(line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
      continue;
    }

    if (/^\|.+\|$/.test(line.trim())) {
      flushLists();
      const cells = line.trim().slice(1, -1).split("|").map((c) => c.trim());
      if (cells.every((c) => /^[-:]+$/.test(c))) continue;
      tableRows.push(cells);
      continue;
    }
    flushTable();

    if (/^---+$/.test(line.trim())) {
      flushLists();
      out.push("<hr/>");
      continue;
    }

    const h = line.match(/^(#{1,6})\s+(.+)$/);
    if (h) {
      flushLists();
      out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`);
      continue;
    }

    if (/^>\s?/.test(line)) {
      flushLists();
      out.push(`<blockquote>${inline(line.replace(/^>\s?/, ""))}</blockquote>`);
      continue;
    }

    const ul = line.match(/^[-*]\s+(.+)$/);
    if (ul) {
      if (inOl) {
        out.push("</ol>");
        inOl = false;
      }
      if (!inUl) {
        out.push("<ul>");
        inUl = true;
      }
      out.push(`<li>${inline(ul[1])}</li>`);
      continue;
    }

    const ol = line.match(/^\d+\.\s+(.+)$/);
    if (ol) {
      if (inUl) {
        out.push("</ul>");
        inUl = false;
      }
      if (!inOl) {
        out.push("<ol>");
        inOl = true;
      }
      out.push(`<li>${inline(ol[1])}</li>`);
      continue;
    }

    if (!line.trim()) {
      flushLists();
      continue;
    }

    flushLists();
    out.push(`<p>${inline(line)}</p>`);
  }

  flushLists();
  flushTable();
  if (inCode) out.push("</code></pre>");
  return out.join("\n");
}

function buildHtml(body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>SOL.52 Solar Commerce Network Architecture</title>
  <style>
    @page { margin: 18mm 16mm; size: A4; }
    body {
      font-family: "Segoe UI", system-ui, sans-serif;
      font-size: 10.5pt;
      line-height: 1.45;
      color: #0f172a;
    }
    h1 { font-size: 20pt; color: #0D2C54; border-bottom: 2px solid #00A88F; padding-bottom: 6px; }
    h2 { font-size: 14pt; color: #0D2C54; margin-top: 1.4em; page-break-after: avoid; }
    h3 { font-size: 12pt; color: #334155; page-break-after: avoid; }
    blockquote {
      border-left: 4px solid #FFB81C;
      margin: 0.8em 0;
      padding: 0.4em 0 0.4em 1em;
      background: #f8fafc;
    }
    pre.code {
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 12px;
      font-size: 8.5pt;
      white-space: pre-wrap;
      word-break: break-word;
      page-break-inside: avoid;
    }
    code { font-family: Consolas, monospace; font-size: 9pt; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 0.8em 0;
      font-size: 9pt;
      page-break-inside: avoid;
    }
    th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; vertical-align: top; }
    th { background: #0D2C54; color: #fff; }
    tr:nth-child(even) td { background: #f8fafc; }
    hr { border: none; border-top: 1px solid #e2e8f0; margin: 1.2em 0; }
    .cover {
      text-align: center;
      padding: 40px 0 28px;
      margin-bottom: 20px;
      border-bottom: 3px solid #0D2C54;
    }
    .cover h1 { border: none; font-size: 22pt; margin: 0; }
    .cover .meta { color: #64748b; font-size: 10pt; }
  </style>
</head>
<body>
  <div class="cover">
    <h1>SOL.52 — Solar Commerce + Proposal Network</h1>
    <p class="meta">Architecture Blueprint · May 2026</p>
    <p class="meta"><strong>Status:</strong> DEFERRED INFRASTRUCTURE — Reference Only</p>
  </div>
  ${body}
</body>
</html>`;
}

const browser = findBrowser();
if (!browser) {
  console.error("Chrome/Edge not found.");
  process.exit(1);
}

const raw = fs.readFileSync(inputPath, "utf8");
const htmlPath = outputPath.replace(/\.pdf$/i, ".html");
fs.writeFileSync(htmlPath, buildHtml(mdToHtml(stripFrontmatter(raw))), "utf8");

const fileUrl = "file:///" + htmlPath.replace(/\\/g, "/");

const result = spawnSync(
  browser,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    `--print-to-pdf=${outputPath}`,
    "--no-pdf-header-footer",
    fileUrl,
  ],
  { encoding: "utf8", timeout: 120000 }
);

if (result.status !== 0) {
  console.error(result.stderr || result.stdout || "PDF generation failed");
  process.exit(result.status ?? 1);
}

if (!fs.existsSync(outputPath)) {
  console.error("PDF file was not created.");
  process.exit(1);
}

const sizeKb = Math.round(fs.statSync(outputPath).size / 1024);
console.log(`PDF written: ${outputPath} (${sizeKb} KB)`);
console.log(`HTML source: ${htmlPath}`);
