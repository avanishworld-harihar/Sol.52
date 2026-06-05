/**
 * Phase 1 pre-Phase-2 batch validation — programmatic only (no layout changes).
 * 10 variants × 4 proposal families; golden baseline match; branding migration checks.
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
import {
  runProposalStabilityChecks,
  type GoldenFixture,
  type GoldenSnapshot,
} from "@/lib/proposal-stability/run-stability-checks";
import {
  DEFAULT_PROPOSAL_BRANDING_SETTINGS,
  resolveProposalBrandConfig,
  resolveProposalBrandPresentation,
  finalizeBrandingSettings,
  type ProposalBrandingSettings,
} from "@/lib/proposal-branding-settings";

type ProposalFamily = "residential" | "commercial" | "school" | "factory";

type VariantResult = {
  family: ProposalFamily;
  index: number;
  label: string;
  ok: boolean;
  errors: string[];
  financial?: GoldenSnapshot["financial"];
  layoutPageCount?: number;
  branding?: { coverShowLogo: boolean; coverShowName: boolean; closingShowName: boolean };
};

function loadFixture(root: string, name: string): GoldenFixture {
  return JSON.parse(
    readFileSync(join(root, "tests/proposal-stability/fixtures", `${name}.json`), "utf8")
  ) as GoldenFixture;
}

function loadGolden(root: string, name: string): GoldenSnapshot {
  return JSON.parse(
    readFileSync(join(root, "tests/proposal-stability/golden", `${name}.snapshot.json`), "utf8")
  ) as GoldenSnapshot;
}

function cloneInput(input: PremiumProposalPptInput): PremiumProposalPptInput {
  return JSON.parse(JSON.stringify(input)) as PremiumProposalPptInput;
}

function residentialVariants(base: PremiumProposalPptInput): { label: string; input: PremiumProposalPptInput }[] {
  const kwSteps = [3, 4, 5, 5, 6, 7, 8, 9, 10, 12];
  const amcSteps: (1 | 5 | 10)[] = [1, 1, 5, 5, 10, 1, 5, 10, 1, 5];
  return kwSteps.map((kw, i) => {
    const input = cloneInput(base);
    input.systemKw = kw;
    input.grossSystemCostInr = Math.round(kw * 55000);
    input.netCostInr = Math.round(input.grossSystemCostInr! * 0.72);
    input.amcSelectedYears = amcSteps[i];
    input.customerName = `Residential Batch ${i + 1}`;
    if (i > 0) delete input.paybackYears;
    return { label: `${kw} kW · AMC ${amcSteps[i]}yr`, input };
  });
}

function commercialVariants(base: PremiumProposalPptInput): { label: string; input: PremiumProposalPptInput }[] {
  const orgTypes = ["generic", "hotel", "hospital", "warehouse", "dairy", "generic", "hotel", "hospital", "warehouse", "dairy"] as const;
  const kwSteps = [30, 40, 50, 60, 75, 80, 90, 100, 110, 120];
  return orgTypes.map((orgType, i) => {
    const input = cloneInput(base);
    const kw = kwSteps[i];
    input.systemKw = kw;
    input.grossSystemCostInr = Math.round(kw * 85000);
    input.netCostInr = input.grossSystemCostInr;
    input.customerName = `Commercial ${orgType} ${i + 1}`;
    input.commercialConfig = {
      ...(input.commercialConfig ?? {}),
      orgType,
      dcrComparison: { enabled: i % 2 === 0 },
      capacityScenarios: { enabled: true },
    };
    if (i > 0) delete input.paybackYears;
    return { label: `${orgType} · ${kw} kW`, input };
  });
}

function schoolVariants(base: PremiumProposalPptInput): { label: string; input: PremiumProposalPptInput }[] {
  const kwSteps = [25, 30, 40, 50, 50, 60, 70, 75, 80, 100];
  return kwSteps.map((kw, i) => {
    const input = cloneInput(base);
    input.systemKw = kw;
    input.grossSystemCostInr = Math.round(kw * 85000);
    input.netCostInr = input.grossSystemCostInr;
    input.customerName = `School Batch ${i + 1}`;
    if (i > 0) delete input.paybackYears;
    return { label: `${kw} kW school`, input };
  });
}

function factoryVariants(base: PremiumProposalPptInput): { label: string; input: PremiumProposalPptInput }[] {
  const kwSteps = [50, 75, 100, 100, 125, 150, 175, 200, 250, 300];
  return kwSteps.map((kw, i) => {
    const input = cloneInput(base);
    input.systemKw = kw;
    input.grossSystemCostInr = Math.round(kw * 85000);
    input.netCostInr = input.grossSystemCostInr;
    input.customerName = `Factory Batch ${i + 1}`;
    if (i > 0) delete input.paybackYears;
    return { label: `${kw} kW factory`, input };
  });
}

function validateVariant(
  family: ProposalFamily,
  index: number,
  label: string,
  input: PremiumProposalPptInput,
  golden?: GoldenSnapshot
): VariantResult {
  const errors: string[] = [];
  const summary = summarizeProposalDeck(input);
  const financial = computeProposalFinancialsFromDeck(summary, input);

  const finCheck = validateProposalFinancials(financial, {
    annualGen: summary.annualGen,
    label: `${family}-${index + 1}`,
  });
  if (!finCheck.ok) errors.push(...finCheck.errors);

  if (input.commercialConfig) {
    const plan = resolveCommercialLayoutPlan(input);
    errors.push(...validateCommercialLayoutPlan(plan).map((e) => `layout: ${e}`));
    if (family === "school" && !plan.isSchool) errors.push("expected school layout");
    if (family === "factory" && plan.isSchool) errors.push("expected non-school factory layout");
  }

  if (golden) {
    const keys = Object.keys(golden.financial) as (keyof GoldenSnapshot["financial"])[];
    for (const key of keys) {
      if (golden.financial[key] !== financial[key as keyof typeof financial]) {
        errors.push(`golden financial.${key}: expected ${golden.financial[key]}, got ${financial[key as keyof typeof financial]}`);
      }
    }
    if (golden.layout && input.commercialConfig) {
      const plan = resolveCommercialLayoutPlan(input);
      if (plan.estimatedPageCount !== golden.layout.estimatedPageCount) {
        errors.push(`golden pageCount: expected ${golden.layout.estimatedPageCount}, got ${plan.estimatedPageCount}`);
      }
      if (JSON.stringify(plan.navSections) !== JSON.stringify(golden.layout.navSections)) {
        errors.push("golden navSections mismatch");
      }
    }
  }

  const brandConfig = resolveProposalBrandConfig({
    pptInput: {
      brandDisplayMode: input.brandDisplayMode,
      brandSectionConfig: input.brandSectionConfig,
    },
    settings: DEFAULT_PROPOSAL_BRANDING_SETTINGS,
  });
  const cover = resolveProposalBrandPresentation(brandConfig, "cover", {
    installerName: input.installerName ?? "Test Co",
    logoUrl: input.installerLogoUrl ?? "",
    tagline: "",
  });
  const closing = resolveProposalBrandPresentation(brandConfig, "closing", {
    installerName: input.installerName ?? "Test Co",
    logoUrl: input.installerLogoUrl ?? "",
    tagline: "",
  });

  if (financial.netCost <= 0) errors.push("netCost must be positive");
  if (financial.annualSaving < 0) errors.push("annualSaving must be non-negative");

  return {
    family,
    index,
    label,
    ok: errors.length === 0,
    errors,
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
    layoutPageCount: input.commercialConfig
      ? resolveCommercialLayoutPlan(input).estimatedPageCount
      : undefined,
    branding: {
      coverShowLogo: cover.showLogo,
      coverShowName: cover.showName,
      closingShowName: closing.showName,
    },
  };
}

function validateBrandingMigration(): string[] {
  const errors: string[] = [];

  const legacyFlatGst: Partial<ProposalBrandingSettings> = {
    companyGstNumber: "23AAAAA0000A1Z5",
    companyProfile: { ...DEFAULT_PROPOSAL_BRANDING_SETTINGS.companyProfile, gstNumber: "" },
  };
  const gstMerged = finalizeBrandingSettings(legacyFlatGst);
  if (gstMerged.companyProfile.gstNumber !== "23AAAAA0000A1Z5") {
    errors.push("GST migration: flat companyGstNumber not merged into companyProfile.gstNumber");
  }
  if (gstMerged.companyGstNumber !== "23AAAAA0000A1Z5") {
    errors.push("GST migration: companyGstNumber alias not synced");
  }

  const profileWins: Partial<ProposalBrandingSettings> = {
    companyGstNumber: "23BBBBB0000B1Z5",
    companyProfile: {
      ...DEFAULT_PROPOSAL_BRANDING_SETTINGS.companyProfile,
      gstNumber: "23AAAAA0000A1Z5",
    },
  };
  const gstProfile = finalizeBrandingSettings(profileWins);
  if (gstProfile.companyProfile.gstNumber !== "23AAAAA0000A1Z5") {
    errors.push("GST canonical: profile.gstNumber should win over flat alias");
  }

  const themeLegacy: Partial<ProposalBrandingSettings> = {
    themePreset: "greenBlueVivid",
    proposalAppearance: {
      themePreset: "greenBlueClassic",
      colorStyle: "greenBlueClassic",
      typographyPreset: "montserrat",
    },
  };
  const themeCanon = finalizeBrandingSettings(themeLegacy);
  if (themeCanon.proposalAppearance.themePreset !== "greenBlueClassic") {
    errors.push("Theme canonical: proposalAppearance.themePreset should win");
  }
  if (themeCanon.themePreset !== "greenBlueClassic") {
    errors.push("Theme alias: top-level themePreset not derived from appearance");
  }

  const brandCanon: Partial<ProposalBrandingSettings> = {
    brandDisplayPreference: "logoOnly",
    brandSectionRules: {
      cover: "logoAndName",
      header: "logoAndName",
      footer: "logoAndName",
      closing: "logoAndName",
    },
  };
  const brandOut = finalizeBrandingSettings(brandCanon);
  if (brandOut.brandDisplayMode !== "logoOnly") {
    errors.push("Branding: brandDisplayMode not derived from preference");
  }
  const resolvedBrand = resolveProposalBrandConfig({ settings: brandOut });
  const coverBrand = resolveProposalBrandPresentation(resolvedBrand, "cover", {
    installerName: "Test Solar",
    logoUrl: "https://example.com/logo.png",
  });
  if (coverBrand.showName) {
    errors.push("Branding: logoOnly preference must hide name on cover at render resolution");
  }

  const amc5 = finalizeBrandingSettings({ amcSelectedYears: 5 });
  if (amc5.amcSelectedYears !== 5) errors.push("AMC: amcSelectedYears not preserved");

  return errors;
}

export type BatchValidationReport = {
  ok: boolean;
  stabilityOk: boolean;
  variantResults: VariantResult[];
  migrationErrors: string[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    byFamily: Record<ProposalFamily, { passed: number; failed: number }>;
  };
};

export function runPhase1BatchValidation(rootDir: string): BatchValidationReport {
  const stability = runProposalStabilityChecks(rootDir);
  const migrationErrors = validateBrandingMigration();

  const residentialBase = loadFixture(rootDir, "residential").input;
  const schoolBase = loadFixture(rootDir, "school").input;
  const factoryBase = loadFixture(rootDir, "factory").input;
  const commercialBase = cloneInput(factoryBase);
  commercialBase.commercialConfig = {
    orgType: "generic",
    dcrComparison: { enabled: true },
    capacityScenarios: { enabled: true },
  };
  commercialBase.systemKw = 100;
  commercialBase.grossSystemCostInr = 8500000;
  commercialBase.netCostInr = 8500000;
  commercialBase.saving = 1020000;

  const goldenResidential = loadGolden(rootDir, "residential");
  const goldenSchool = loadGolden(rootDir, "school");
  const goldenFactory = loadGolden(rootDir, "factory");

  const batches: {
    family: ProposalFamily;
    variants: { label: string; input: PremiumProposalPptInput }[];
    golden?: GoldenSnapshot;
  }[] = [
    {
      family: "residential",
      variants: [
        { label: "golden baseline (5 kW)", input: cloneInput(residentialBase) },
        ...residentialVariants(residentialBase).slice(1),
      ],
      golden: goldenResidential,
    },
    {
      family: "commercial",
      variants: [
        { label: "golden baseline (generic 100 kW)", input: cloneInput(commercialBase) },
        ...commercialVariants(commercialBase).slice(1),
      ],
    },
    {
      family: "school",
      variants: [
        { label: "golden baseline (50 kW school)", input: cloneInput(schoolBase) },
        ...schoolVariants(schoolBase).slice(1),
      ],
      golden: goldenSchool,
    },
    {
      family: "factory",
      variants: [
        { label: "golden baseline (100 kW factory)", input: cloneInput(factoryBase) },
        ...factoryVariants(factoryBase).slice(1),
      ],
      golden: goldenFactory,
    },
  ];

  const variantResults: VariantResult[] = [];
  const byFamily: Record<ProposalFamily, { passed: number; failed: number }> = {
    residential: { passed: 0, failed: 0 },
    commercial: { passed: 0, failed: 0 },
    school: { passed: 0, failed: 0 },
    factory: { passed: 0, failed: 0 },
  };

  for (const batch of batches) {
    batch.variants.forEach((v, i) => {
      const golden = i === 0 ? batch.golden : undefined;
      const result = validateVariant(batch.family, i, v.label, v.input, golden);
      variantResults.push(result);
      if (result.ok) byFamily[batch.family].passed += 1;
      else byFamily[batch.family].failed += 1;
    });
  }

  const failed = variantResults.filter((r) => !r.ok).length;
  const ok = stability.ok && migrationErrors.length === 0 && failed === 0;

  return {
    ok,
    stabilityOk: stability.ok,
    variantResults,
    migrationErrors,
    summary: {
      total: variantResults.length,
      passed: variantResults.length - failed,
      failed,
      byFamily,
    },
  };
}

export function writeBatchValidationReport(rootDir: string, report: BatchValidationReport): string {
  const outDir = join(rootDir, "scripts", "validation-output");
  mkdirSync(outDir, { recursive: true });
  const path = join(outDir, "phase1-batch-report.json");
  writeFileSync(path, `${JSON.stringify({ generatedAt: new Date().toISOString(), ...report }, null, 2)}\n`, "utf8");
  return path;
}

const isMain =
  typeof process !== "undefined" &&
  process.argv[1]?.replace(/\\/g, "/").includes("phase1-batch-validation");

if (isMain) {
  const rootDir = process.cwd();
  const report = runPhase1BatchValidation(rootDir);
  const outPath = writeBatchValidationReport(rootDir, report);

  console.log("\n=== Phase 1 Batch Validation (40 variants) ===\n");
  console.log(`Stability framework: ${report.stabilityOk ? "PASS" : "FAIL"}`);
  console.log(`Branding migration: ${report.migrationErrors.length === 0 ? "PASS" : "FAIL"}`);
  for (const [family, stats] of Object.entries(report.summary.byFamily)) {
    console.log(`  ${family}: ${stats.passed}/10 passed`);
  }
  if (report.migrationErrors.length) {
    console.error("\nMigration errors:");
    for (const e of report.migrationErrors) console.error(`  ✗ ${e}`);
  }
  const failures = report.variantResults.filter((r) => !r.ok);
  if (failures.length) {
    console.error("\nVariant failures:");
    for (const f of failures) {
      console.error(`  ✗ ${f.family} #${f.index + 1} (${f.label}): ${f.errors.join("; ")}`);
    }
  }
  console.log(`\nReport: ${outPath}\n`);
  if (!report.ok) process.exit(1);
  console.log("All batch checks passed.\n");
}
