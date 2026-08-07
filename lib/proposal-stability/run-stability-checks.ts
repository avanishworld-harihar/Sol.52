/**
 * Proposal Stability Framework — CI / prebuild gate.
 *
 * Runs golden fixture financial checks, layout snapshots, and print-layout guards.
 * Exit code 1 on any failure.
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { summarizeProposalDeck, type PremiumProposalPptInput } from "@/lib/proposal-ppt";
import {
  computeProposalFinancialsFromDeck,
  validateProposalFinancials,
} from "@/lib/proposal-financial-engine";
import {
  resolveCommercialLayoutPlan,
  validateCommercialLayoutPlan,
} from "@/lib/proposal-stability/commercial-layout";
import { validatePrintLayoutGuards } from "@/lib/proposal-stability/print-layout-guards";
import { validateResidentialPresetGuards } from "@/lib/proposal-stability/residential-preset-guards";

export type GoldenFixture = {
  id: string;
  description: string;
  input: PremiumProposalPptInput;
};

export type GoldenSnapshot = {
  fixtureId: string;
  financial: {
    annualSaving: number;
    netCost: number;
    paybackYears: number;
    roiPctFirstYear: number;
    lifetime25Profit: number;
    breakEvenYear: number;
    profit25: number;
    npv: number;
    irrEstimate: number;
  };
  layout?: {
    isSchool: boolean;
    estimatedPageCount: number;
    navSections: string[];
    executiveKpiLabels: string[];
    schoolSections?: string[];
  };
};

function loadFixture(path: string): GoldenFixture {
  return JSON.parse(readFileSync(path, "utf8")) as GoldenFixture;
}

function loadSnapshot(path: string): GoldenSnapshot | null {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8")) as GoldenSnapshot;
}

function buildSnapshot(fixture: GoldenFixture): GoldenSnapshot {
  const summary = summarizeProposalDeck(fixture.input);
  const financial = computeProposalFinancialsFromDeck(summary, fixture.input);

  const snapshot: GoldenSnapshot = {
    fixtureId: fixture.id,
    financial: {
      annualSaving: financial.annualSaving,
      netCost: financial.netCost,
      paybackYears: financial.paybackYears,
      roiPctFirstYear: financial.roiPctFirstYear,
      lifetime25Profit: financial.lifetime25Profit,
      breakEvenYear: financial.breakEvenYear,
      profit25: financial.profit25,
      npv: financial.npv,
      irrEstimate: financial.irrEstimate,
    },
  };

  if (fixture.input.commercialConfig) {
    const plan = resolveCommercialLayoutPlan(fixture.input);
    snapshot.layout = {
      isSchool: plan.isSchool,
      estimatedPageCount: plan.estimatedPageCount,
      navSections: plan.navSections,
      executiveKpiLabels: plan.executiveKpiLabels,
      schoolSections: plan.isSchool ? ["comm-school-green", "comm-school-learning"] : [],
    };
  }

  return snapshot;
}

function compareSnapshots(expected: GoldenSnapshot, actual: GoldenSnapshot): string[] {
  const errors: string[] = [];
  const keys = Object.keys(expected.financial) as (keyof GoldenSnapshot["financial"])[];
  for (const key of keys) {
    if (expected.financial[key] !== actual.financial[key]) {
      errors.push(
        `financial.${key}: expected ${expected.financial[key]}, got ${actual.financial[key]}`
      );
    }
  }
  if (expected.layout && actual.layout) {
    if (expected.layout.estimatedPageCount !== actual.layout.estimatedPageCount) {
      errors.push(
        `layout.pageCount: expected ${expected.layout.estimatedPageCount}, got ${actual.layout.estimatedPageCount}`
      );
    }
    if (JSON.stringify(expected.layout.navSections) !== JSON.stringify(actual.layout.navSections)) {
      errors.push("layout.navSections mismatch");
    }
    if (expected.layout.isSchool !== actual.layout.isSchool) {
      errors.push(`layout.isSchool: expected ${expected.layout.isSchool}, got ${actual.layout.isSchool}`);
    }
  }
  return errors;
}

export type StabilityReport = {
  ok: boolean;
  errors: string[];
  passed: string[];
};

export function runProposalStabilityChecks(rootDir: string): StabilityReport {
  const errors: string[] = [];
  const passed: string[] = [];

  // ── Print / layout source guards ─────────────────────────────────────────
  for (const err of validatePrintLayoutGuards(rootDir)) {
    errors.push(err);
  }
  if (errors.length === 0) passed.push("print-layout-guards");

  for (const err of validateResidentialPresetGuards()) {
    errors.push(err);
  }
  if (errors.length === 0) passed.push("residential-preset-guards");

  // ── Golden fixtures ──────────────────────────────────────────────────────
  const fixtureNames = ["residential", "school", "factory"] as const;
  const fixturesDir = join(rootDir, "tests/proposal-stability/fixtures");
  const goldenDir = join(rootDir, "tests/proposal-stability/golden");

  for (const name of fixtureNames) {
    const fixture = loadFixture(join(fixturesDir, `${name}.json`));
    const summary = summarizeProposalDeck(fixture.input);
    const financial = computeProposalFinancialsFromDeck(summary, fixture.input);

    const validation = validateProposalFinancials(financial, {
      annualGen: summary.annualGen,
      label: fixture.id,
    });
    if (!validation.ok) {
      errors.push(...validation.errors);
    } else {
      passed.push(`${fixture.id}:financial-validation`);
    }

    if (fixture.input.commercialConfig) {
      const plan = resolveCommercialLayoutPlan(fixture.input);
      const layoutErrors = validateCommercialLayoutPlan(plan);
      if (layoutErrors.length) {
        errors.push(...layoutErrors.map((e) => `[${fixture.id}] ${e}`));
      } else {
        passed.push(`${fixture.id}:layout-plan`);
      }
    }

    const actual = buildSnapshot(fixture);
    const goldenPath = join(goldenDir, `${name}.snapshot.json`);
    const expected = loadSnapshot(goldenPath);

    if (!expected) {
      errors.push(`missing golden snapshot: tests/proposal-stability/golden/${name}.snapshot.json — run with UPDATE_GOLDEN=1`);
    } else {
      const diff = compareSnapshots(expected, actual);
      if (diff.length) {
        errors.push(...diff.map((d) => `[${fixture.id}] snapshot: ${d}`));
      } else {
        passed.push(`${fixture.id}:golden-snapshot`);
      }
    }
  }

  return { ok: errors.length === 0, errors, passed };
}

export function writeGoldenSnapshots(rootDir: string): void {
  const fixturesDir = join(rootDir, "tests/proposal-stability/fixtures");
  const goldenDir = join(rootDir, "tests/proposal-stability/golden");
  mkdirSync(goldenDir, { recursive: true });
  for (const name of ["residential", "school", "factory"]) {
    const fixture = loadFixture(join(fixturesDir, `${name}.json`));
    const snapshot = buildSnapshot(fixture);
    writeFileSync(
      join(goldenDir, `${name}.snapshot.json`),
      `${JSON.stringify(snapshot, null, 2)}\n`,
      "utf8"
    );
  }
}

// CLI entry when executed via tsx
const isMain =
  typeof process !== "undefined" &&
  process.argv[1]?.replace(/\\/g, "/").includes("run-stability-checks");

if (isMain) {
  const rootDir = join(process.cwd());
  if (process.env.UPDATE_GOLDEN === "1") {
    writeGoldenSnapshots(rootDir);
    console.log("Golden snapshots updated.");
  }
  const report = runProposalStabilityChecks(rootDir);
  console.log("\n=== Proposal Stability Framework ===\n");
  for (const p of report.passed) console.log(`  ✓ ${p}`);
  if (report.errors.length) {
    console.error("\nFailures:");
    for (const e of report.errors) console.error(`  ✗ ${e}`);
    process.exit(1);
  }
  console.log(`\nAll ${report.passed.length} checks passed.\n`);
}
