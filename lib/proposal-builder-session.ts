/**
 * Proposal builder tab session — survives client-side navigation, cleared on reload / new proposal.
 */

import { emptyMonthlyUnits, type ParsedBillShape } from "@/lib/bill-parse";
import type { ManualProposalCustomer } from "@/lib/merge-proposal-customer";
import { clearAllProposalDraftIds } from "@/lib/proposal-builder-draft";
import type { MonthKey, MonthlyUnits } from "@/lib/types";

export const PROPOSAL_BUILDER_SESSION_KEY = "ss_proposal_session_v2";
/** Set by prepareNewProposalNavigation — consumed once on /proposal mount. */
export const PROPOSAL_FORCE_NEW_KEY = "ss_proposal_force_new";

const MONTH_KEYS: MonthKey[] = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];

export type ProposalBuilderSessionSnap = {
  manual: ManualProposalCustomer;
  monthlyUnits: MonthlyUnits;
  latestBill: ParsedBillShape | null;
  additionalBills: (ParsedBillShape | null)[];
  auditedMonthTotals: Partial<Record<keyof MonthlyUnits, number>>;
  overrideSolarKw: string;
  overridePanels: string;
  requirementMonthlyKwh?: string;
  requirementMonthlyBill?: string;
};

export const EMPTY_MANUAL_PROPOSAL_CUSTOMER: ManualProposalCustomer = {
  leadContactName: "",
  leadPhone: "",
  billPhone: "",
  officialBillName: "",
  city: "",
  discom: "",
  state: "",
  area: "",
  location: "",
  consumerId: "",
  meterNumber: "",
  connectionDate: "",
  phase: "",
  connectionType: "",
  sanctionedLoad: "",
  billingAddress: "",
  tariffCategory: "",
  purposeOfSupply: "",
  contractDemandKva: "",
  maxDemandKva: "",
  avgPowerFactor: "",
  kvahUnits: "",
};

function normalizeMonthlyUnits(raw: unknown): MonthlyUnits {
  const units = emptyMonthlyUnits();
  if (!raw || typeof raw !== "object") return units;
  const record = raw as Record<string, unknown>;
  for (const key of MONTH_KEYS) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
      units[key] = value;
    }
  }
  return units;
}

function normalizeManual(raw: unknown): ManualProposalCustomer {
  const base = { ...EMPTY_MANUAL_PROPOSAL_CUSTOMER };
  if (!raw || typeof raw !== "object") return base;
  const record = raw as Record<string, unknown>;
  for (const key of Object.keys(base) as (keyof ManualProposalCustomer)[]) {
    const value = record[key];
    if (typeof value === "string") base[key] = value;
  }
  return base;
}

/** Coerce persisted JSON into a safe shape — prevents client-side crashes on stale session data. */
export function sanitizeProposalBuilderSession(raw: unknown): ProposalBuilderSessionSnap | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Partial<ProposalBuilderSessionSnap>;

  return {
    manual: normalizeManual(o.manual),
    monthlyUnits: normalizeMonthlyUnits(o.monthlyUnits),
    latestBill: o.latestBill && typeof o.latestBill === "object" ? o.latestBill : null,
    additionalBills: Array.isArray(o.additionalBills) ? o.additionalBills : [],
    auditedMonthTotals:
      o.auditedMonthTotals && typeof o.auditedMonthTotals === "object" ? o.auditedMonthTotals : {},
    overrideSolarKw: typeof o.overrideSolarKw === "string" ? o.overrideSolarKw : "",
    overridePanels: typeof o.overridePanels === "string" ? o.overridePanels : "",
    requirementMonthlyKwh:
      typeof o.requirementMonthlyKwh === "string" ? o.requirementMonthlyKwh : undefined,
    requirementMonthlyBill:
      typeof o.requirementMonthlyBill === "string" ? o.requirementMonthlyBill : undefined,
  };
}

export function loadProposalBuilderSession(): ProposalBuilderSessionSnap | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PROPOSAL_BUILDER_SESSION_KEY);
    if (!raw) return null;
    return sanitizeProposalBuilderSession(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveProposalBuilderSession(snap: ProposalBuilderSessionSnap): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(PROPOSAL_BUILDER_SESSION_KEY, JSON.stringify(snap));
  } catch {
    /* quota exceeded or private mode */
  }
}

export function clearProposalBuilderSession(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(PROPOSAL_BUILDER_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

/** Fresh builder entry — use for “New proposal” CTAs (not edit/resume deep-links). */
export function buildNewProposalHref(): string {
  return "/proposal?new=1";
}

/** Fresh commercial builder — segment can be prefilled via orgType. */
export function buildNewCommercialProposalHref(extra?: {
  orgType?: string;
  story?: string;
  kw?: number;
}): string {
  const params = new URLSearchParams({ new: "1", preset: "commercial_executive" });
  if (extra?.orgType) params.set("orgType", extra.orgType);
  if (extra?.story) params.set("story", extra.story);
  if (extra?.kw != null && Number.isFinite(extra.kw)) params.set("kw", String(extra.kw));
  return `/proposal?${params.toString()}`;
}

/** Call before navigating to /proposal for a fresh builder (avoids stale session crashes). */
export function prepareNewProposalNavigation(): void {
  clearProposalBuilderSession();
  clearAllProposalDraftIds();
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(PROPOSAL_FORCE_NEW_KEY, "1");
  } catch {
    /* private mode */
  }
}

/** Returns true once after prepareNewProposalNavigation, then clears the flag. */
export function takeProposalForceNewIntent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const active = sessionStorage.getItem(PROPOSAL_FORCE_NEW_KEY) === "1";
    if (active) sessionStorage.removeItem(PROPOSAL_FORCE_NEW_KEY);
    return active;
  } catch {
    return false;
  }
}

export function isProposalForceNewFromUrl(search: string | URLSearchParams): boolean {
  const params = typeof search === "string" ? new URLSearchParams(search) : search;
  return params.get("new") === "1";
}

export function isProposalBuilderReloadNavigation(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  return nav?.type === "reload";
}
