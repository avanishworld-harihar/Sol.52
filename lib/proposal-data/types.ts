/**
 * Unified proposal view contract for all isolated presets (Zenith+).
 * Built once from pptInput + ProposalDeckSummary — presets must not re-derive finance/BOM.
 */

export type ProposalBillMonth = {
  label: string;
  units: number;
  energyInr: number;
  fixedInr: number;
  dutyInr: number;
  netInr: number;
  isSummerPeak: boolean;
  barHeightPct: number;
};

export type ProposalEmiRow = {
  tenureLabel: string;
  interestPaidInr: number;
  monthlyEmiInr: number;
};

/** One year on the 25-year compounding wealth path. */
export type ProposalWealthPoint = {
  year: number;
  cumulativeInr: number;
  annualInr?: number;
  isPayback?: boolean;
};

export type ProposalBomItem = {
  name: string;
  brand: string;
  spec: string;
  warranty: string;
  description?: string;
  technicalPoints?: string[];
};

export type ProposalMetric = {
  label: string;
  value: string;
};

export type ProposalWarrantyHighlight = {
  value: string;
  unit: string;
  label: string;
};

export type ProposalWarrantyRow = {
  item: string;
  duration: string;
  by: string;
  coverage: string;
};

export type ProposalProcessStep = {
  num: string;
  title: string;
  description: string;
};

export type ProposalPaymentRow = {
  label: string;
  pctLabel: string;
  amountInr: number;
  isTotal?: boolean;
};

export type ProposalBankDetails = {
  company: string;
  accountNumber: string;
  ifsc: string;
  upiId: string;
};

export type ProposalData = {
  meta: {
    customerName: string;
    locationLine: string;
    brandName: string;
    brandLogoUrl?: string;
    brandTagline?: string;
    brandAddress?: string;
    brandGst?: string;
    brandDisplayMode?: import("@/lib/proposal-branding-settings").ProposalBrandDisplayMode;
    brandSectionConfig?: import("@/lib/proposal-branding-settings").ProposalBrandSectionConfig;
    systemKw: number;
    assetProfileLine: string;
    generatedAt?: string;
  };
  economics: {
    grossInr: number;
    subsidyInr: number;
    netInr: number;
    monthlySavingsInr: number;
    paybackYears: number;
    lifetimeProfitInr: number;
    /** Annual interest rate used to build emiRows (from financeOption). */
    interestRatePct?: number;
    emiRows: ProposalEmiRow[];
    /** 25-year compounding cumulative wealth (Canvas WealthGraph). */
    wealthJourney: ProposalWealthPoint[];
  };
  bill: {
    months: ProposalBillMonth[];
    yearlyBillInr: number;
    solarSavingsPct: number;
    summerTrapPct: number;
    fixedChargesDisplay: string;
    hasData: boolean;
    totals: {
      units: number;
      energyInr: number;
      fixedInr: number;
      dutyInr: number;
      netInr: number;
    };
  };
  impact: {
    co2Tons: number;
    treesEquivalent: number;
  };
  bom: ProposalBomItem[];
  engineering: {
    metrics: ProposalMetric[];
    tiltDeg?: number;
    tiltNote?: string;
    cityLabel?: string;
    standards: string[];
    phases: ProposalProcessStep[];
  };
  warranty: {
    intro: string;
    highlights: ProposalWarrantyHighlight[];
    rows: ProposalWarrantyRow[];
  };
  execution: {
    steps: ProposalProcessStep[];
    payments: ProposalPaymentRow[];
    bank: ProposalBankDetails;
  };
  terms: {
    conditions: string[];
    documents: string[];
    amcObjective?: string;
    amcScope: string[];
    amcTerms: string[];
  };
  closing: {
    customerName: string;
    installerName: string;
    contactLine: string;
    contactPerson?: string;
    contactPersonDesignation?: string;
    address?: string;
    gstNumber?: string;
    brandTagline?: string;
    annualUnits: number;
    annualSavingsInr: number;
    lifetimeWealthInr: number;
    qrUrl?: string;
  };
};
