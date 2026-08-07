/**
 * Static guards for proposal PDF / print layout regressions.
 */

import { readFileSync } from "fs";
import { join } from "path";

type PrintLayoutGuardRule = {
  id: string;
  file: string;
  description: string;
  mustInclude?: string;
  mustNotInclude?: string;
  validate?: (content: string) => string | null;
};

export const PRINT_LAYOUT_GUARD_RULES: PrintLayoutGuardRule[] = [
  {
    id: "bom-electrical-page-break",
    file: "app/globals.css",
    mustInclude: 'commercial-proposal #comm-bom [data-bom-category="electrical"]',
    description: "Electrical BOM category must start on fresh print page",
  },
  {
    id: "bom-no-blank-footer-page",
    file: "components/proposal/blocks/commercial/block-tiered-bom.tsx",
    description: "BOM footer must not force blank print page",
    validate: (content: string) => {
      const footerIdx = content.indexOf("Footer note");
      if (footerIdx < 0) return "Footer note section missing";
      const footerBlock = content.slice(footerIdx);
      if (/className="[^"]*print:break-before-page/.test(footerBlock)) {
        return "footer must not use print:break-before-page";
      }
      return null;
    },
  },
  {
    id: "executive-static-kpi",
    file: "components/proposal/blocks/commercial/block-commercial-executive-summary.tsx",
    mustInclude: "StaticInrKpi",
    description: "Executive summary KPIs must use static values (print-safe)",
  },
  {
    id: "school-green-compact-kpi",
    file: "components/proposal/blocks/commercial/block-school-green-campus.tsx",
    mustInclude: "compact",
    description: "School Green Campus KPI cards must use compact layout",
  },
  {
    id: "financial-engine-single-source",
    file: "lib/proposal-ppt.ts",
    mustInclude: "proposal-financial-engine",
    description: "Deck summarizer must use proposal-financial-engine",
  },
  {
    id: "residential-capture-preserves-theme-context",
    file: "components/proposals/atelier/atelier-proposal-pdf.ts",
    description:
      "Residential PDF capture must keep the preset root context and full opacity",
    validate: (content: string) => {
      if (!content.includes("createRootShell(options.root)")) {
        return "capture no longer clones the renderer root";
      }
      if (content.includes('"opacity:0.01"')) {
        return "capture host opacity will wash out PDF colours";
      }
      return null;
    },
  },
];

export function validatePrintLayoutGuards(rootDir: string): string[] {
  const errors: string[] = [];
  for (const rule of PRINT_LAYOUT_GUARD_RULES) {
    const path = join(rootDir, rule.file);
    let content: string;
    try {
      content = readFileSync(path, "utf8");
    } catch {
      errors.push(`[print-guard:${rule.id}] cannot read ${rule.file}`);
      continue;
    }
    if ("mustInclude" in rule && rule.mustInclude && !content.includes(rule.mustInclude)) {
      errors.push(`[print-guard:${rule.id}] ${rule.description} — missing: ${rule.mustInclude}`);
    }
    if ("mustNotInclude" in rule && rule.mustNotInclude && content.includes(rule.mustNotInclude)) {
      errors.push(`[print-guard:${rule.id}] ${rule.description} — forbidden: ${rule.mustNotInclude}`);
    }
    if ("validate" in rule && rule.validate) {
      const msg = rule.validate(content);
      if (msg) errors.push(`[print-guard:${rule.id}] ${rule.description} — ${msg}`);
    }
  }
  return errors;
}
