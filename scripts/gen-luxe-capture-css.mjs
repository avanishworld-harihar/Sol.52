import fs from "fs";

const CAPTURE_PREFIX =
  ":global(#atelier-pdf-capture-host)\n  [data-pdf-capture-root='true'][data-proposal-preset='residential_luxe_noir']";

function transformDeclarations(decls) {
  return decls
    .replace(/width:\s*210mm/g, "width: 794px")
    .replace(/max-width:\s*210mm/g, "max-width: 794px")
    .replace(/min-width:\s*210mm/g, "min-width: 794px")
    .replace(/height:\s*297mm/g, "height: 1123px")
    .replace(/max-height:\s*297mm/g, "max-height: 1123px")
    .replace(/min-height:\s*297mm/g, "min-height: 1123px");
}

function transformBlock(body) {
  const lines = body.split("\n");
  const out = [];
  let i = 0;

  while (i < lines.length) {
    let trimmed = lines[i].trim();
    if (!trimmed || trimmed.startsWith("/*")) {
      i++;
      continue;
    }
    if (trimmed.startsWith("@page")) {
      while (i < lines.length && lines[i].trim() !== "}") i++;
      i++;
      continue;
    }

    const selectorParts = [];
    while (i < lines.length) {
      trimmed = lines[i].trim();
      if (!trimmed) {
        i++;
        continue;
      }
      if (trimmed.startsWith("@page")) break;
      selectorParts.push(trimmed.replace(/\s*\{\s*$/, ""));
      if (trimmed.includes("{")) {
        i++;
        break;
      }
      i++;
    }
    if (selectorParts.length === 0) continue;

    const selectors = selectorParts
      .join(" ")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const decls = [];
    while (i < lines.length) {
      if (lines[i].trim() === "}") {
        i++;
        break;
      }
      decls.push(lines[i]);
      i++;
    }

    const declBlock = transformDeclarations(decls.join("\n"));
    for (const sel of selectors) {
      out.push(`${CAPTURE_PREFIX}\n  ${sel} {`);
      out.push(declBlock);
      out.push("}");
      out.push("");
    }
  }

  return out.join("\n");
}

function generateCaptureFromPrint(css, marker) {
  const markerNeedle = "@media print {\n  .a4Page,\n  .a4Page :global(*) {";
  const firstPrint = css.indexOf(markerNeedle);
  const printStart =
    firstPrint < 0 ? -1 : css.indexOf(markerNeedle, firstPrint + markerNeedle.length);
  const markerIdx = css.indexOf(marker, printStart);
  if (printStart < 0 || markerIdx < 0) {
    throw new Error(`print block not found for ${marker}`);
  }
  const printEnd = css.lastIndexOf("\n}", markerIdx);
  const printBody = css.slice(printStart + "@media print {".length, printEnd);
  const header = `/*
 * PDF capture — 1:1 mirror of @media print (html2canvas reads screen CSS, not print).
 * Keep in sync with the @media print block above.
 */

:global(#atelier-pdf-capture-host)
  [data-pdf-capture-root='true'][data-proposal-preset='residential_luxe_noir']
  .a4Page,
:global(#atelier-pdf-capture-host)
  [data-pdf-capture-root='true'][data-proposal-preset='residential_luxe_noir']
  .a4Page :global(*) {
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

`;
  return {
    before: css.slice(0, printEnd + 2),
    generated: header + transformBlock(printBody),
  };
}

function generateShellCaptureFromPrint(css) {
  const printStart = css.indexOf("@media print {\n  @page {");
  const printEnd = css.indexOf("\n}\n\n/*\n * PDF capture", printStart);
  if (printStart < 0 || printEnd < 0) {
    throw new Error("shell print block not found");
  }
  const printBody = css.slice(printStart + "@media print {".length, printEnd);
  const header = `/*
 * PDF capture — 1:1 mirror of shell @media print.
 */

:global(#atelier-pdf-capture-host)
  .root[data-pdf-capture-root='true'][data-proposal-preset='residential_luxe_noir'],
:global(#atelier-pdf-capture-host)
  .root[data-pdf-capture-root='true'][data-proposal-preset='residential_luxe_noir']
  :global(*) {
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

`;
  return {
    before: css.slice(0, printEnd + 2),
    generated: header + transformBlock(printBody),
  };
}

const luxePath = "components/proposals/luxe-noir/luxe.module.css";
const shellPath = "components/proposals/luxe-noir/luxe-noir-shell.module.css";

function normalizeCss(css) {
  return css.replace(/\r\n/g, "\n");
}

const luxeCss = normalizeCss(fs.readFileSync(luxePath, "utf8"));
const luxe = generateCaptureFromPrint(luxeCss, "PDF capture — 1:1 mirror");
fs.writeFileSync(luxePath, `${luxe.before}\n\n${luxe.generated}\n`);
console.log(`Updated ${luxePath}`);

const shellCss = normalizeCss(fs.readFileSync(shellPath, "utf8"));
const shellPrintStart = shellCss.indexOf("@media print {\n  @page {");
const shellMarkerIdx = shellCss.indexOf("PDF capture — 1:1 mirror", shellPrintStart);
if (shellPrintStart < 0 || shellMarkerIdx < 0) throw new Error("shell capture marker not found");
const shellPrintEnd = shellCss.lastIndexOf("\n}", shellMarkerIdx);
const shellBefore = shellCss.slice(0, shellPrintEnd + 2);
const shellPrintBody = shellCss.slice(
  shellPrintStart + "@media print {".length,
  shellPrintEnd
);
const shellHeader = `/*
 * PDF capture — 1:1 mirror of shell @media print.
 */

:global(#atelier-pdf-capture-host)
  .root[data-pdf-capture-root='true'][data-proposal-preset='residential_luxe_noir'],
:global(#atelier-pdf-capture-host)
  .root[data-pdf-capture-root='true'][data-proposal-preset='residential_luxe_noir']
  :global(*) {
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

`;
fs.writeFileSync(shellPath, `${shellBefore}\n\n${shellHeader}${transformBlock(shellPrintBody)}\n`);
console.log(`Updated ${shellPath}`);
