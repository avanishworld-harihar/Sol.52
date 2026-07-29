/**
 * Realistic mock ProposalData for Zenith Luxury UI verification.
 * No Supabase required — used when deck data is sparse / missing.
 */

import type { ProposalData } from "@/lib/proposal-data";
import { buildWealthJourney } from "@/lib/proposal-data/build-wealth-journey";

export const MOCK_ZENITH_DATA: ProposalData = {
  meta: {
    customerName: "Shri Rajesh Sharma",
    locationLine: "Civil Lines, Satna, Madhya Pradesh",
    brandName: "Harihar Solar",
    brandLogoUrl: undefined,
    systemKw: 5,
    assetProfileLine: "5 kW Premium Grid-Architecture · DCR Tier-1",
    generatedAt: "2026-07-10T12:00:00.000Z",
  },
  economics: {
    grossInr: 300000,
    subsidyInr: 78000,
    netInr: 222000,
    monthlySavingsInr: 4080,
    paybackYears: 4.5,
    lifetimeProfitInr: 1000000,
    interestRatePct: 7,
    emiRows: [
      { tenureLabel: "5-Year Loan", interestPaidInr: 45000, monthlyEmiInr: 4450 },
      { tenureLabel: "7-Year Loan", interestPaidInr: 62000, monthlyEmiInr: 3400 },
      { tenureLabel: "10-Year Loan", interestPaidInr: 98000, monthlyEmiInr: 2680 },
    ],
    wealthJourney: buildWealthJourney({
      annualSavingsInr: 4080 * 12,
      lifetimeProfitInr: 1000000,
      paybackYears: 4.5,
    }),
  },
  bill: {
    hasData: true,
    yearlyBillInr: 72000,
    solarSavingsPct: 88,
    summerTrapPct: 42,
    fixedChargesDisplay: "₹12k",
    months: [
      { label: "Jan", units: 420, energyInr: 3200, fixedInr: 400, dutyInr: 200, netInr: 3800, isSummerPeak: false, barHeightPct: 45 },
      { label: "Feb", units: 400, energyInr: 3000, fixedInr: 400, dutyInr: 180, netInr: 3580, isSummerPeak: false, barHeightPct: 42 },
      { label: "Mar", units: 480, energyInr: 3800, fixedInr: 400, dutyInr: 220, netInr: 4420, isSummerPeak: false, barHeightPct: 55 },
      { label: "Apr", units: 620, energyInr: 5200, fixedInr: 400, dutyInr: 280, netInr: 5880, isSummerPeak: true, barHeightPct: 78 },
      { label: "May", units: 710, energyInr: 6100, fixedInr: 400, dutyInr: 320, netInr: 6820, isSummerPeak: true, barHeightPct: 100 },
      { label: "Jun", units: 680, energyInr: 5800, fixedInr: 400, dutyInr: 300, netInr: 6500, isSummerPeak: true, barHeightPct: 92 },
      { label: "Jul", units: 640, energyInr: 5400, fixedInr: 400, dutyInr: 290, netInr: 6090, isSummerPeak: true, barHeightPct: 85 },
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
      name: "Solar Modules",
      brand: "Waaree TOPCon",
      spec: "9 × 580Wp DCR Tier-1",
      warranty: "25 Year Performance",
      technicalPoints: ["Bifacial-ready", "IEC certified"],
    },
    {
      name: "String Inverter",
      brand: "Havells",
      spec: "5 kW · Dual MPPT · Grid-Tie",
      warranty: "10 Year",
      technicalPoints: ["Wi-Fi monitoring"],
    },
    {
      name: "Mounting Structure",
      brand: "JSW Galvanized",
      spec: "Hot-dip · Wind & seismic rated",
      warranty: "10 Year",
    },
    {
      name: "DC / AC Cabling",
      brand: "Polycab",
      spec: "UV-resistant solar cable",
      warranty: "5 Year",
    },
    {
      name: "Protection & Net Meter",
      brand: "Schneider / DISCOM",
      spec: "ACDB · DCDB · Bi-directional meter",
      warranty: "5 Year",
    },
  ],
  engineering: {
    metrics: [
      { label: "System size", value: "5 kW" },
      { label: "Annual generation", value: "7,200 units" },
      { label: "Load coverage", value: "100%" },
      { label: "Array tilt", value: "20°" },
      { label: "Peak sun hours", value: "5.0 hrs/day" },
      { label: "Latitude", value: "24.6°N" },
    ],
    tiltDeg: 20,
    tiltNote: "Satna-optimized tilt for maximum annual yield.",
    cityLabel: "Satna",
    standards: ["IS/IEC 61215", "CEA net-metering", "MNRE DCR"],
    phases: [
      { num: "01", title: "Site Survey", description: "Roof & load assessment." },
      { num: "02", title: "Design & SLD", description: "Engineering drawings." },
      { num: "03", title: "Subsidy & Net Meter", description: "PM Surya Ghar + DISCOM." },
      { num: "04", title: "Installation", description: "Structure, modules, electrical." },
      { num: "05", title: "Commissioning", description: "Testing and go-live." },
    ],
  },
  warranty: {
    intro: "Tier-1 manufacturer coverages with installer workmanship assurance.",
    highlights: [
      { value: "25", unit: "Yrs", label: "Panel performance" },
      { value: "10", unit: "Yrs", label: "Inverter" },
      { value: "5", unit: "Yrs", label: "Workmanship" },
    ],
    rows: [
      { item: "Modules", duration: "25 Year Performance", by: "Waaree", coverage: "Linear performance" },
      { item: "Inverter", duration: "10 Year", by: "Havells", coverage: "Manufacturer" },
      { item: "Structure", duration: "10 Year", by: "JSW", coverage: "Corrosion" },
    ],
  },
  execution: {
    steps: [
      { num: "01", title: "Site Survey", description: "Roof assessment and load verification." },
      { num: "02", title: "Design & SLD", description: "Engineering drawings and single-line diagram." },
      { num: "03", title: "Subsidy Approval", description: "PM Surya Ghar portal filing." },
      { num: "04", title: "Installation", description: "Structure, modules, and electrical fit-out." },
      { num: "05", title: "Testing", description: "Safety checks and commissioning." },
      { num: "06", title: "Go Live", description: "Grid sync and handover." },
    ],
    payments: [
      { label: "1. Booking advance", pctLabel: "25%", amountInr: 55500 },
      { label: "2. Material dispatch", pctLabel: "50%", amountInr: 111000 },
      { label: "3. Installation", pctLabel: "20%", amountInr: 44400 },
      { label: "4. Commissioning", pctLabel: "5%", amountInr: 11100, isTotal: true },
    ],
    bank: {
      company: "Harihar Solar",
      accountNumber: "502000XXXXXX12",
      ifsc: "HDFC0001234",
      upiId: "hariharsolar@hdfcbank",
    },
  },
  terms: {
    conditions: [
      "This proposal is valid for 30 days from the date of issue.",
      "Final pricing may adjust after detailed site survey.",
      "Subsidy is subject to PM Surya Ghar eligibility and portal sanction.",
    ],
    documents: [
      "Latest electricity bill",
      "Aadhaar / identity proof",
      "Property ownership or NOC",
      "Cancelled cheque",
    ],
    amcObjective: "Optional AMC keeps generation and safety checks on schedule.",
    amcScope: ["1-year AMC", "5-year AMC", "10-year AMC"],
    amcTerms: ["AMC excludes physical damage and third-party misuse."],
  },
  closing: {
    customerName: "Shri Rajesh Sharma",
    installerName: "Harihar Solar",
    contactLine: "+91 98765 43210 · satna@hariharsolar.in",
    annualUnits: 7200,
    annualSavingsInr: 48960,
    lifetimeWealthInr: 1000000,
    qrUrl: undefined,
  },
};

/** Alias for older imports */
export const MOCK_ZENITH_PROPOSAL_DATA = MOCK_ZENITH_DATA;
