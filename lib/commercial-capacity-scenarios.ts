/**
 * Plant capacity scenario comparison — executive multi-kW options.
 * Pricing from Smart catalog when catalog entry is provided.
 */

import { applyResidentialDiscountInr } from "@/lib/residential-deck-helpers";
import {
  getActiveCatalogEntry,
  lookupDcrKwGrossInr,
  lookupNonDcrKwGrossInr,
  type ResidentialBrandCatalogEntry,
} from "@/lib/residential-brand-catalog";
import type { ResidentialDiscount, ResidentialProposalConfig } from "@/lib/residential-requirements-schema";
import type { ProposalDeckSummary } from "@/lib/proposal-ppt";

export type CapacityScenarioInput = {
  id: string;
  label: string;
  systemKw: number;
  isRecommended?: boolean;
};

export type CapacityScenarioMetrics = CapacityScenarioInput & {
  grossCostInr: number;
  netCostInr: number;
  annualGenKwh: number;
  annualSavingInr: number;
  paybackYears: number;
  moduleCountApprox: number;
  roofAreaSqmApprox: number;
};

const MODULE_WATT_DEFAULT = 540;
const SQM_PER_KW = 6.5;
const GEN_KWH_PER_KW = 1500;
const TARIFF_INR_PER_KWH = 8;
const SELF_USE_FACTOR = 0.85;

export type CatalogScenarioOpts = {
  catalogEntry?: ResidentialBrandCatalogEntry | null;
  panelTrack?: "dcr" | "non_dcr";
  discount?: ResidentialDiscount;
  subsidyInr?: number;
  moduleWatt?: number;
};

/** Gross/net from Smart catalog kW tiers (DCR track for executive cards). */
export function computeCapacityScenarioFromCatalog(
  scenario: CapacityScenarioInput,
  opts: CatalogScenarioOpts = {}
): CapacityScenarioMetrics {
  const entry = opts.catalogEntry ?? null;
  const track = opts.panelTrack ?? "dcr";
  const kw = Math.max(1, scenario.systemKw);
  const moduleWatt = opts.moduleWatt ?? MODULE_WATT_DEFAULT;
  const grossDcr = lookupDcrKwGrossInr(entry, kw) ?? 0;
  const grossNon = lookupNonDcrKwGrossInr(entry, kw) ?? 0;
  const grossCostInr = Math.max(0, Math.round(track === "dcr" ? grossDcr : grossNon));
  const discountInr = applyResidentialDiscountInr(grossCostInr, opts.discount);
  const netCostInr = Math.max(0, grossCostInr - discountInr - Math.max(0, opts.subsidyInr ?? 0));
  const annualGenKwh = Math.round(kw * GEN_KWH_PER_KW);
  const annualSavingInr = Math.round(annualGenKwh * TARIFF_INR_PER_KWH * SELF_USE_FACTOR);
  const paybackYears =
    annualSavingInr > 0 && netCostInr > 0
      ? Math.round((netCostInr / annualSavingInr) * 10) / 10
      : 0;
  const moduleCountApprox = Math.max(1, Math.ceil((kw * 1000) / moduleWatt));
  const roofAreaSqmApprox = Math.round(kw * SQM_PER_KW);

  return {
    ...scenario,
    systemKw: kw,
    grossCostInr,
    netCostInr,
    annualGenKwh,
    annualSavingInr,
    paybackYears,
    moduleCountApprox,
    roofAreaSqmApprox,
  };
}

/**
 * Legacy ratio scaling from deck summary (fallback when no catalog).
 */
export function computeCapacityScenarioMetrics(
  base: ProposalDeckSummary,
  scenario: CapacityScenarioInput,
  moduleWatt = MODULE_WATT_DEFAULT
): CapacityScenarioMetrics {
  const ratio = base.systemKw > 0 ? scenario.systemKw / base.systemKw : 1;
  const grossCostInr = Math.round(base.grossSystemCost * ratio);
  const netCostInr = Math.round(base.netCost * ratio);
  const annualGenKwh = Math.round(base.annualGen * ratio);
  const annualSavingInr = Math.round(base.annualSaving * ratio);
  const paybackYears =
    annualSavingInr > 0 && netCostInr > 0
      ? Math.round((netCostInr / annualSavingInr) * 10) / 10
      : base.paybackYears;

  const moduleCountApprox = Math.max(1, Math.ceil((scenario.systemKw * 1000) / moduleWatt));
  const roofAreaSqmApprox = Math.round(scenario.systemKw * SQM_PER_KW);

  return {
    ...scenario,
    grossCostInr,
    netCostInr,
    annualGenKwh,
    annualSavingInr,
    paybackYears,
    moduleCountApprox,
    roofAreaSqmApprox,
  };
}

export function catalogOptsFromResidentialConfig(
  config: ResidentialProposalConfig | null | undefined
): CatalogScenarioOpts {
  if (!config) return {};
  return {
    catalogEntry: getActiveCatalogEntry(config),
    panelTrack: config.solar.panelTrack ?? "dcr",
    discount: config.pricing?.discount,
    subsidyInr: 0,
    moduleWatt: config.solar.watt ?? MODULE_WATT_DEFAULT,
  };
}

export function buildDefaultScenarios(primaryKw: number): CapacityScenarioInput[] {
  const step = Math.max(5, Math.round(primaryKw * 0.15 / 5) * 5);
  const lower = Math.max(10, primaryKw - step);
  const higher = primaryKw + step;

  return [
    { id: "primary", label: "Recommended", systemKw: primaryKw, isRecommended: true },
    { id: "option_a", label: "Conservative", systemKw: lower },
    { id: "option_b", label: "Expansion", systemKw: higher },
  ];
}

export function resolveScenarioMetrics(
  base: ProposalDeckSummary,
  scenarios: CapacityScenarioInput[],
  moduleWatt?: number,
  catalogOpts?: CatalogScenarioOpts
): CapacityScenarioMetrics[] {
  if (catalogOpts?.catalogEntry) {
    return scenarios.map((s) =>
      computeCapacityScenarioFromCatalog(s, { ...catalogOpts, moduleWatt: moduleWatt ?? catalogOpts.moduleWatt })
    );
  }
  return scenarios.map((s) => computeCapacityScenarioMetrics(base, s, moduleWatt));
}
