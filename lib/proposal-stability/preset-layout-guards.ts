/**
 * Static guards for the shared proposal A4 layout contract.
 *
 * Background: every preset draws a fixed-height A4 sheet. When a preset also
 * reflowed that sheet at tablet widths, the same proposal rendered one way in
 * iPad portrait, another way in landscape, and a third way in print — while a
 * desktop browser (always wider than the sheet) looked correct. The shared fit
 * shell now scales the sheet instead of reflowing it, so presets must not
 * reintroduce tablet-width layout overrides.
 *
 * These rules run for existing and future presets, residential and commercial.
 */

import { readdirSync, readFileSync, statSync } from "fs";
import { join, relative } from "path";

/** Presets stack into a phone layout at or below this width; above it the sheet scales. */
export const PROPOSAL_PHONE_BREAKPOINT_PX = 640;

/** Directories that contain preset page CSS. */
const PRESET_CSS_ROOTS = [
  "components/proposals",
  "components/QuantumPreset",
];

/**
 * Files exempt from the tablet-breakpoint rule.
 * Luxe Noir is development-locked (`lib/luxe-noir-proposal-lock.ts`) and scopes
 * its wide-viewport rules to the live preview via `[data-proposal-live]`.
 * The rest are legacy renderers no longer in `PRESET_RENDERER_LOADERS`.
 */
const EXEMPT_FILES = new Set([
  "components/proposals/luxe-noir/luxe.module.css",
  "components/proposals/luxe-noir/luxe-noir-shell.module.css",
  "components/proposals/solstice/solstice-proposal.css",
  "components/proposals/executive-premium-nextgen/ep-nextgen.css",
  "components/proposals/executive-premium-editorial/ep-editorial.css",
  "components/proposals/energy-freedom/energy-freedom-proposal.css",
  "components/proposals/premium-luxe/premium-luxe.module.css",
  "components/proposals/sales-premium-institutional/sp-institutional.css",
]);

/**
 * Declarations that break the sheet rather than adjust content inside it.
 *
 * Narrowing the sheet or flipping its axis changes the document itself, which
 * is what made tablets disagree with desktop and print. Letting a sheet grow
 * taller (`height: auto` with a kept `min-height`) is safe, so it is not listed.
 */
const PAGE_BOX_PROPERTIES = ["width", "max-width", "flex-direction"];

/** Collapsing the reserved sheet height also reflows the document. */
const COLLAPSING_DECLARATION = /min-height\s*:\s*0(?![.\d])/;

/** Selectors that identify a full-sheet container. */
const PAGE_SELECTOR_PATTERN =
  /\.(a4[A-Za-z0-9_-]*|page|pageCover|coverPage|closingPage|ep-gl-page|proposal-page)\b/;

function walkCssFiles(rootDir: string, relDir: string, out: string[]): void {
  let entries: string[];
  try {
    entries = readdirSync(join(rootDir, relDir));
  } catch {
    return;
  }
  for (const entry of entries) {
    const relPath = `${relDir}/${entry}`;
    const abs = join(rootDir, relPath);
    let stats;
    try {
      stats = statSync(abs);
    } catch {
      continue;
    }
    if (stats.isDirectory()) {
      walkCssFiles(rootDir, relPath, out);
    } else if (entry.endsWith(".css")) {
      out.push(relPath);
    }
  }
}

type MediaBlock = {
  condition: string;
  body: string;
};

/** Extract top-level `@media` blocks with balanced braces. */
function extractMediaBlocks(css: string): MediaBlock[] {
  const blocks: MediaBlock[] = [];
  const re = /@media([^{]*)\{/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(css)) !== null) {
    const condition = match[1].trim();
    let depth = 1;
    let i = re.lastIndex;
    while (i < css.length && depth > 0) {
      const ch = css[i];
      if (ch === "{") depth += 1;
      else if (ch === "}") depth -= 1;
      i += 1;
    }
    blocks.push({ condition, body: css.slice(re.lastIndex, i - 1) });
    re.lastIndex = i;
  }
  return blocks;
}

function maxWidthPx(condition: string): number | null {
  const match = condition.match(/max-width:\s*(\d+)px/);
  return match ? Number(match[1]) : null;
}

/**
 * Rules inside a media block that both target a sheet container and change its
 * box. Returns the offending selector list, if any.
 */
function findPageBoxOverrides(body: string): string[] {
  const offenders: string[] = [];
  const ruleRe = /([^{}]+)\{([^{}]*)\}/g;
  let match: RegExpExecArray | null;
  while ((match = ruleRe.exec(body)) !== null) {
    const selector = match[1].trim();
    const declarations = match[2];
    if (!PAGE_SELECTOR_PATTERN.test(selector)) continue;
    const touched = PAGE_BOX_PROPERTIES.filter((prop) =>
      new RegExp(`(^|[;{\\s])${prop}\\s*:`).test(declarations)
    );
    if (COLLAPSING_DECLARATION.test(declarations)) touched.push("min-height");
    if (touched.length > 0) {
      offenders.push(`${selector.replace(/\s+/g, " ")} (${touched.join(", ")})`);
    }
  }
  return offenders;
}

/**
 * No preset may reflow the A4 sheet above the phone breakpoint. That is the
 * exact pattern that made iPad portrait, iPad landscape and print disagree.
 */
export function validateTabletSheetGuards(rootDir: string): string[] {
  const errors: string[] = [];
  const files: string[] = [];
  for (const root of PRESET_CSS_ROOTS) {
    walkCssFiles(rootDir, root, files);
  }

  for (const relPath of files) {
    const normalized = relPath.replace(/\\/g, "/");
    if (EXEMPT_FILES.has(normalized)) continue;
    let css: string;
    try {
      css = readFileSync(join(rootDir, relPath), "utf8");
    } catch {
      continue;
    }
    for (const block of extractMediaBlocks(css)) {
      if (/\bprint\b/.test(block.condition)) continue;
      const width = maxWidthPx(block.condition);
      if (width === null || width <= PROPOSAL_PHONE_BREAKPOINT_PX) continue;
      const offenders = findPageBoxOverrides(block.body);
      if (offenders.length > 0) {
        errors.push(
          `[preset-layout:tablet-sheet] ${normalized} — @media (max-width: ${width}px) resizes the A4 sheet: ${offenders.join(
            "; "
          )}. Sheets must stay fixed above ${PROPOSAL_PHONE_BREAKPOINT_PX}px; the shared fit shell scales them.`
        );
      }
    }
  }
  return errors;
}

type SourceGuardRule = {
  id: string;
  file: string;
  description: string;
  validate: (content: string) => string | null;
};

const SOURCE_GUARD_RULES: SourceGuardRule[] = [
  {
    id: "fit-shell-wraps-every-preset",
    file: "components/proposals/ProposalRenderer.tsx",
    description:
      "All presets must render inside the shared A4 fit shell so new presets inherit tablet + print behaviour",
    validate: (content) => {
      if (!content.includes("ProposalPageFit")) {
        return "ProposalRenderer no longer wraps presets in ProposalPageFit";
      }
      return null;
    },
  },
  {
    id: "fit-shell-print-safe",
    file: "components/proposals/_shared/proposal-page-fit.css",
    description:
      "The fit shell must never scale print output or the PDF capture host",
    validate: (content) => {
      if (!/@media print\s*\{[^}]*zoom:\s*1\s*!important/s.test(content)) {
        return "print must reset zoom to 1";
      }
      if (!content.includes("#atelier-pdf-capture-host")) {
        return "capture host must reset zoom to 1";
      }
      return null;
    },
  },
  {
    id: "capture-preset-agnostic-background",
    file: "components/proposals/atelier/atelier-proposal-pdf.ts",
    description:
      "PDF capture must read sheet background from the live page, not from one preset's class names",
    validate: (content) => {
      if (!content.includes("resolveSheetBackground")) {
        return "sheet background helper is missing";
      }
      if (/\/coverPage\|closingPage\//.test(content)) {
        return "capture still infers dark sheets from Atelier class names";
      }
      return null;
    },
  },
];

export function validatePresetLayoutSourceGuards(rootDir: string): string[] {
  const errors: string[] = [];
  for (const rule of SOURCE_GUARD_RULES) {
    let content: string;
    try {
      content = readFileSync(join(rootDir, rule.file), "utf8");
    } catch {
      errors.push(`[preset-layout:${rule.id}] cannot read ${rule.file}`);
      continue;
    }
    const msg = rule.validate(content);
    if (msg) {
      errors.push(`[preset-layout:${rule.id}] ${rule.description} — ${msg}`);
    }
  }
  return errors;
}

export function validatePresetLayoutGuards(rootDir: string): string[] {
  return [
    ...validatePresetLayoutSourceGuards(rootDir),
    ...validateTabletSheetGuards(rootDir),
  ];
}

/** Exposed for diagnostics: which CSS files the tablet rule scans. */
export function listScannedPresetCss(rootDir: string): string[] {
  const files: string[] = [];
  for (const root of PRESET_CSS_ROOTS) {
    walkCssFiles(rootDir, root, files);
  }
  return files
    .map((f) => f.replace(/\\/g, "/"))
    .filter((f) => !EXEMPT_FILES.has(f))
    .map((f) => relative(".", f));
}
