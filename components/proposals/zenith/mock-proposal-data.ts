/**
 * Mock ProposalData for local Zenith UI verification (no DB required).
 *
 * Usage:
 *   import { MOCK_ZENITH_PROPOSAL_DATA } from "@/components/proposals/zenith/mock-proposal-data";
 *   <ZenithProposalRenderer data={MOCK_ZENITH_PROPOSAL_DATA} />
 *
 * Or via registry:
 *   <ProposalRenderer presetId="zenith" data={MOCK_ZENITH_PROPOSAL_DATA} pptInput={...} summary={...} />
 */

import type { ProposalData } from "@/lib/proposal-data";

export const MOCK_ZENITH_PROPOSAL_DATA: ProposalData = {
  meta: {
    customerName: "KLP Residence",
    locationLine: "Satna, Madhya Pradesh",
    brandName: "Harihar Solar",
    brandLogoUrl: undefined,
    systemKw: 5,
    assetProfileLine: "5 kW Premium Grid-Architecture",
    generatedAt: "2026-07-10T12:00:00.000Z",
  },
  economics: {
    grossInr: 300000,
    subsidyInr: 78000,
    netInr: 222000,
    monthlySavingsInr: 4080,
    paybackYears: 4.5,
    lifetimeProfitInr: 1000000,
    emiRows: [
      {
        tenureLabel: "5-Year Loan",
        interestPaidInr: 45000,
        monthlyEmiInr: 4450,
      },
      {
        tenureLabel: "7-Year Loan",
        interestPaidInr: 62000,
        monthlyEmiInr: 3400,
      },
    ],
  },
  bill: {
    hasData: true,
    yearlyBillInr: 72000,
    solarSavingsPct: 85,
    summerTrapPct: 42,
    fixedChargesDisplay: "₹12k",
    months: [
      { label: "Jan", units: 420, energyInr: 3200, fixedInr: 400, dutyInr: 200, netInr: 3800, isSummerPeak: false, barHeightPct: 45 },
      { label: "Feb", units: 400, energyInr: 3000, fixedInr: 400, dutyInr: 180, netInr: 3580, isSummerPeak: false, barHeightPct: 42 },
      { label: "Mar", units: 480, energyInr: 3800, fixedInr: 400, dutyInr: 220, netInr: 4420, isSummerPeak: false, barHeightPct: 55 },
      { label: "Apr", units: 620, energyInr: 5200, fixedInr: 400, dutyInr: 280, netInr: 5880, isSummerPeak: true, barHeightPct: 78 },
      { label: "May", units: 710, energyInr: 6100, fixedInr: 400, dutyInr: 320, netInr: 6820, isSummerPeak: true, barHeightPct: 95 },
      { label: "Jun", units: 680, energyInr: 5800, fixedInr: 400, dutyInr: 300, netInr: 6500, isSummerPeak: true, barHeightPct: 90 },
      { label: "Jul", units: 640, energyInr: 5400, fixedInr: 400, dutyInr: 290, netInr: 6090, isSummerPeak: true, barHeightPct: 82 },
      { label: "Aug", units: 520, energyInr: 4200, fixedInr: 400, dutyInr: 240, netInr: 4840, isSummerPeak: false, barHeightPct: 62 },
      { label: "Sep", units: 490, energyInr: 3900, fixedInr: 400, dutyInr: 220, netInr: 4520, isSummerPeak: false, barHeightPct: 58 },
      { label: "Oct", units: 450, energyInr: 3500, fixedInr: 400, dutyInr: 200, netInr: 4100, isSummerPeak: false, barHeightPct: 52 },
      { label: "Nov", units: 430, energyInr: 3300, fixedInr: 400, dutyInr: 190, netInr: 3890, isSummerPeak: false, barHeightPct: 48 },
      { label: "Dec", units: 410, energyInr: 3100, fixedInr: 400, dutyInr: 180, netInr: 3680, isSummerPeak: false, barHeightPct: 44 },
    ],
    totals: {
      units: 6350,
      energyInr: 52500,
      fixedInr: 4800,
      dutyInr: 2820,
      netInr: 72000,
    },
  },
  impact: {
    co2Tons: 112,
    treesEquivalent: 6709,
  },
  bom: [
    {
      name: "Solar Panels",
      brand: "Waaree",
      spec: "9 × 580Wp TOPCon DCR",
      warranty: "30 Year Performance",
      technicalPoints: ["Tier-1", "Bifacial ready"],
    },
    {
      name: "String Inverter",
      brand: "Havells",
      spec: "5 kW · Dual MPPT",
      warranty: "10 Year",
    },
    {
      name: "Mounting Structure",
      brand: "JSW",
      spec: "Hot-dip galvanized",
      warranty: "10 Year",
    },
  ],
  engineering: {
    metrics: [
      { label: "System size", value: "5 kW" },
      { label: "Annual generation", value: "7,200 units" },
      { label: "Load coverage", value: "100%" },
      { label: "Array tilt", value: "20°" },
    ],
    tiltDeg: 20,
    tiltNote: "Optimized tilt for Satna.",
    cityLabel: "Satna",
    standards: ["IS/IEC module standards", "CEA / DISCOM net-metering norms"],
    phases: [
      { num: "01", title: "Site Survey", description: "Roof assessment." },
      { num: "02", title: "Design & SLD", description: "Engineering drawings." },
    ],
  },
  warranty: {
    intro: "Manufacturer and workmanship coverages.",
    highlights: [
      { value: "30", unit: "Yrs", label: "Panel performance" },
      { value: "10", unit: "Yrs", label: "Inverter" },
      { value: "5", unit: "Yrs", label: "Workmanship" },
    ],
    rows: [
      {
        item: "Solar Panels",
        duration: "30 Year Performance",
        by: "Waaree",
        coverage: "Manufacturer warranty",
      },
    ],
  },
  execution: {
    steps: [
      { num: "01", title: "Site Survey", description: "Roof assessment." },
      { num: "02", title: "Installation", description: "Fit-out and commissioning." },
    ],
    payments: [
      { label: "1. Booking", pctLabel: "25%", amountInr: 55500 },
      { label: "2. Material", pctLabel: "50%", amountInr: 111000, isTotal: false },
    ],
    bank: {
      company: "Harihar Solar",
      accountNumber: "XXXXXXXX1234",
      ifsc: "HDFC0000000",
      upiId: "harihar@upi",
    },
  },
  terms: {
    conditions: ["Valid for 30 days from issue."],
    documents: ["Latest electricity bill", "ID proof"],
    amcObjective: "Optional AMC available.",
    amcScope: ["5-year AMC option"],
    amcTerms: ["Excludes physical damage."],
  },
  closing: {
    customerName: "KLP Residence",
    installerName: "Harihar Solar",
    contactLine: "+91 90000 00000",
    annualUnits: 7200,
    annualSavingsInr: 48960,
    lifetimeWealthInr: 1000000,
  },
};

/** Empty-ish payload to verify empty-state UI for bill / bom / impact. */
export const MOCK_ZENITH_EMPTY_SECTIONS: ProposalData = {
  ...MOCK_ZENITH_PROPOSAL_DATA,
  bill: {
    ...MOCK_ZENITH_PROPOSAL_DATA.bill,
    hasData: false,
    months: [],
    yearlyBillInr: 0,
  },
  bom: [],
  impact: { co2Tons: 0, treesEquivalent: 0 },
};
