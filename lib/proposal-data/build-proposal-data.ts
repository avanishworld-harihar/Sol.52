/**
 * Single source of truth: PremiumProposalPptInput + ProposalDeckSummary → ProposalData.
 * Independent of Golden editorial transform (do not import executive-premium-editorial).
 */

import type { PremiumProposalPptInput, ProposalDeckSummary } from "@/lib/proposal-ppt";
import { resolveInstallerNameForProposal } from "@/lib/proposal-branding-settings";
import { enrichBomTechnicalRows } from "@/lib/proposal-bom-technical-detail";
import type { ProposalData } from "@/lib/proposal-data/types";
import { buildWealthJourney } from "@/lib/proposal-data/build-wealth-journey";

const SUMMER_INDICES = new Set([3, 4, 5, 6]);
const PAYMENT_PCTS = ["25%", "50%", "20%", "5%"] as const;

const DEFAULT_STEPS = [
  { title: "Site Survey", description: "Roof assessment and load verification." },
  { title: "Design & SLD", description: "Engineering drawings and single-line diagram." },
  { title: "Subsidy & Net Meter", description: "PM Surya Ghar and DISCOM paperwork." },
  { title: "Installation", description: "Structure, modules, and electrical fit-out." },
  { title: "Testing", description: "Safety checks and commissioning." },
  { title: "Go Live", description: "Grid sync and handover." },
] as const;

function locationLine(pptInput: PremiumProposalPptInput): string {
  const city = (pptInput.location ?? "").trim().split(",")[0]?.trim();
  const state = (pptInput.state ?? "").trim();
  if (city && state) return `${city}, ${state}`;
  return city || state || "—";
}

function cityFromLocation(line: string): string {
  const t = line.trim();
  if (!t || t === "—") return "";
  return t.split(",")[0]?.trim() || t;
}

function normalizeWarranty(w: string): string {
  return w.replace(/\byr\b/gi, "Year").replace(/\byears?\b/gi, "Year").trim();
}

function fmtCompactK(v: number): string {
  const x = Math.max(0, Math.round(Number(v) || 0));
  if (x >= 100000) return `₹${(x / 100000).toFixed(1)}L`;
  if (x >= 1000) return `₹${(x / 1000).toFixed(0)}k`;
  return `₹${x.toLocaleString("en-IN")}`;
}

function bomDescription(title: string, brand: string): string {
  const make = brand.trim();
  if (!make) return "";
  const key = title.toLowerCase();
  if (key.includes("panel")) return `Panel make: ${make}.`;
  if (key.includes("inverter")) return `Inverter make: ${make}.`;
  if (key.includes("mount") || key.includes("structure")) return `Structure make: ${make}.`;
  if (key.includes("cabl")) return `Cable make: ${make}.`;
  return `Make: ${make}.`;
}

export type BuildProposalDataOptions = {
  generatedAt?: string;
};

/**
 * Build the unified ProposalData contract for all new isolated presets.
 */
export function buildProposalData(
  pptInput: PremiumProposalPptInput,
  summary: ProposalDeckSummary,
  options: BuildProposalDataOptions = {}
): ProposalData {
  const customer =
    (typeof pptInput.customerName === "string" && pptInput.customerName.trim()) ||
    summary.honoredName ||
    "Valued Customer";

  const brandName =
    resolveInstallerNameForProposal({ installerName: pptInput.installerName }) ||
    summary.installer.trim() ||
    "Solar Partner";

  const loc = locationLine(pptInput);
  const cityLabel = cityFromLocation(loc);

  const maxBill = Math.max(...summary.auditRows.map((r) => r.total), 1);
  const months = summary.auditRows.map((row, i) => {
    const isSummer = SUMMER_INDICES.has(i);
    return {
      label: row.label.slice(0, 3),
      units: row.units,
      energyInr: row.energy,
      fixedInr: row.fixed,
      dutyInr: row.duty + row.fuel + (row.other ?? 0),
      netInr: row.total,
      isSummerPeak: isSummer,
      barHeightPct: Math.max(4, Math.round((row.total / maxBill) * 100)),
    };
  });

  const totals = summary.auditTotals;
  const dutyTotal = totals.duty + totals.fuel + (totals.other ?? 0);
  const solarSavingsPct =
    summary.yearlyBill > 0
      ? Math.min(100, Math.round((summary.annualSaving / summary.yearlyBill) * 100))
      : 0;
  const hasBillData = months.some((m) => m.units > 0 || m.netInr > 0);

  const enrichedBom = enrichBomTechnicalRows(summary.bom, summary, { pptInput });
  const bom = enrichedBom.map((item) => ({
    name: item.title.replace(/^Solar /, ""),
    spec: item.spec.replace(/\s*×\s*/g, " × ").replace(/\s*x\s*/gi, " × "),
    brand: item.brand,
    warranty: normalizeWarranty(item.warranty),
    description: bomDescription(item.title, item.brand),
    technicalPoints: item.technicalPoints,
  }));

  const emiRows = summary.emi.slice(0, 3).map((row) => ({
    tenureLabel: `${row.tenureYears}-Year Loan`,
    interestPaidInr: row.totalInterest,
    monthlyEmiInr: row.monthlyEmi,
  }));

  const bank = summary.bankDetails;
  const payments = summary.paymentMilestones.map((m, i) => ({
    label: `${m.step}. ${m.label}`,
    pctLabel: PAYMENT_PCTS[i] ?? `${m.pct}%`,
    amountInr: m.amountInr,
    isTotal: i === summary.paymentMilestones.length - 1,
  }));

  const tiltRaw =
    pptInput.residentialTechnicalSpecs?.mounting?.actualTiltDeg ??
    pptInput.residentialTechnicalSpecs?.mounting?.recommendedTiltDeg;
  const tiltDeg =
    typeof tiltRaw === "number" && Number.isFinite(tiltRaw) ? Math.round(tiltRaw) : undefined;

  const panel = bom.find(
    (r) => r.name.toLowerCase().includes("panel") || r.name.toLowerCase().includes("module")
  );
  const inverter = bom.find((r) => r.name.toLowerCase().includes("inverter"));

  return {
    meta: {
      customerName: customer,
      locationLine: loc,
      brandName,
      brandLogoUrl: pptInput.installerLogoUrl?.trim() || undefined,
      systemKw: summary.systemKw,
      assetProfileLine: `${summary.systemKw} kW Premium Grid-Architecture`,
      generatedAt: options.generatedAt,
    },
    economics: {
      grossInr: summary.grossSystemCost,
      subsidyInr: summary.pmSubsidy,
      netInr: summary.netCost,
      monthlySavingsInr: Math.round(summary.annualSaving / 12),
      paybackYears: Math.round(summary.paybackYears * 10) / 10,
      lifetimeProfitInr: summary.lifetime25Profit,
      emiRows,
      wealthJourney: buildWealthJourney({
        annualSavingsInr: summary.annualSaving,
        lifetimeProfitInr: summary.lifetime25Profit,
        paybackYears: summary.paybackYears,
      }),
    },
    bill: {
      months,
      yearlyBillInr: summary.yearlyBill,
      solarSavingsPct,
      summerTrapPct: summary.summerPct,
      fixedChargesDisplay: fmtCompactK(summary.fixedAnnual),
      hasData: hasBillData,
      totals: {
        units: totals.units,
        energyInr: totals.energy,
        fixedInr: totals.fixed,
        dutyInr: dutyTotal,
        netInr: totals.total,
      },
    },
    impact: {
      co2Tons: summary.environmental.lifetimeCo2TonsSaved,
      treesEquivalent: summary.environmental.treeEquivalent,
    },
    bom,
    engineering: {
      metrics: [
        { label: "System size", value: `${summary.systemKw} kW` },
        { label: "Annual generation", value: `${summary.annualGen.toLocaleString("en-IN")} units` },
        { label: "Load coverage", value: `${Math.round(summary.coverage)}%` },
        ...(tiltDeg != null ? [{ label: "Array tilt", value: `${tiltDeg}°` }] : []),
      ],
      tiltDeg,
      tiltNote: tiltDeg != null ? `Optimized tilt for ${cityLabel || "your site"}.` : undefined,
      cityLabel: cityLabel || undefined,
      standards: ["IS/IEC module standards", "CEA / DISCOM net-metering norms"],
      phases: DEFAULT_STEPS.map((s, i) => ({
        num: String(i + 1).padStart(2, "0"),
        title: s.title,
        description: s.description,
      })),
    },
    warranty: {
      intro: "Manufacturer and workmanship coverages for your rooftop system.",
      highlights: [
        {
          value: panel?.warranty?.match(/\d+/)?.[0] ?? "25",
          unit: "Yrs",
          label: "Panel performance",
        },
        {
          value: inverter?.warranty?.match(/\d+/)?.[0] ?? "10",
          unit: "Yrs",
          label: "Inverter",
        },
        { value: "5", unit: "Yrs", label: "Workmanship" },
      ],
      rows: bom.slice(0, 6).map((row) => ({
        item: row.name,
        duration: row.warranty || "—",
        by: row.brand || brandName,
        coverage: "Manufacturer warranty as applicable",
      })),
    },
    execution: {
      steps: DEFAULT_STEPS.map((s, i) => ({
        num: String(i + 1).padStart(2, "0"),
        title: s.title,
        description: s.description,
      })),
      payments,
      bank: {
        company: bank.accountName?.trim() || summary.installer,
        accountNumber: bank.accountNumber?.trim() || "—",
        ifsc: bank.ifsc?.trim() || "—",
        upiId: bank.upiId?.trim() || "—",
      },
    },
    terms: {
      conditions: [
        "This proposal is valid for 30 days from the date of issue.",
        "Final pricing may adjust after site survey and DISCOM approval.",
        "Subsidy amount is subject to PM Surya Ghar eligibility and portal sanction.",
        "Net metering timelines depend on local DISCOM processing.",
      ],
      documents: [
        "Latest electricity bill",
        "Identity & address proof",
        "Property ownership / NOC where required",
        "Cancelled cheque for subsidy / refunds",
      ],
      amcObjective: "Optional AMC keeps generation and safety checks on schedule.",
      amcScope: summary.amcOptions.slice(0, 3).map((o) => `${o.years}-year AMC option`),
      amcTerms: ["AMC scope excludes physical damage and third-party misuse."],
    },
    closing: {
      customerName: customer,
      installerName: brandName,
      contactLine: summary.contact,
      annualUnits: summary.annualGen,
      annualSavingsInr: summary.annualSaving,
      lifetimeWealthInr: summary.lifetime25Profit,
      qrUrl:
        summary.bankDetails?.paymentQrCodeUrl?.trim() ||
        pptInput.bankDetails?.paymentQrCodeUrl?.trim() ||
        undefined,
    },
  };
}
