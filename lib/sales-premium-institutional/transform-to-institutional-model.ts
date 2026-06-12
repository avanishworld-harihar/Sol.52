import type { PremiumProposalPptInput, ProposalDeckSummary } from "@/lib/proposal-ppt";
import { fmtCompactK, fmtInrPlain } from "@/lib/sales-premium-institutional/format";
import type { SalesPremiumInstitutionalModel } from "@/lib/sales-premium-institutional/types";

const SUMMER_MONTH_INDICES = new Set([3, 4, 5, 6]);
const MILESTONE_NAMES = ["Advance", "Dispatch", "Install", "Live"] as const;

function splitBrand(installer: string): { primary: string; secondary: string } {
  const trimmed = installer.trim() || "Solar Installer";
  const parts = trimmed.split(/\s+/);
  if (parts.length <= 1) {
    return { primary: trimmed.toUpperCase(), secondary: "" };
  }
  return {
    primary: parts.slice(0, -1).join(" ").toUpperCase(),
    secondary: parts[parts.length - 1]!.toUpperCase(),
  };
}

function locationLine(pptInput: PremiumProposalPptInput): string {
  const loc = (pptInput.location ?? "").trim();
  const state = (pptInput.state ?? "").trim();
  if (loc && state && !loc.toLowerCase().includes(state.toLowerCase())) {
    return `${loc}, ${state}`;
  }
  return loc || state || "—";
}

function cityFromLocation(pptInput: PremiumProposalPptInput): string {
  const loc = (pptInput.location ?? "").trim();
  if (!loc) return (pptInput.state ?? "").trim() || "your area";
  const first = loc.split(",")[0]?.trim();
  return first || loc;
}

function warrantyTone(warranty: string): "green" | "blue" | "default" {
  const w = warranty.toLowerCase();
  if (w.includes("25")) return "green";
  if (w.includes("10")) return "blue";
  return "default";
}

function normalizeWarrantyLabel(warranty: string): string {
  return warranty
    .replace(/yr/gi, "Yrs")
    .replace(/year/gi, "Yrs")
    .replace(/performance/i, "performance")
    .trim();
}

export function transformToInstitutionalModel(
  pptInput: PremiumProposalPptInput,
  summary: ProposalDeckSummary
): SalesPremiumInstitutionalModel {
  const brand = splitBrand(summary.installer);
  const customer =
    (typeof pptInput.customerName === "string" && pptInput.customerName.trim()) ||
    summary.honoredName ||
    "Valued Customer";

  const panelWatt = summary.panelWatt ?? 540;
  const maxBill = Math.max(...summary.auditRows.map((r) => r.total), 1);

  const months = summary.auditRows.map((row, i) => ({
    label: row.label.slice(0, 3),
    units: row.units,
    energy_inr: row.energy,
    fixed_inr: row.fixed,
    duty_fuel_inr: row.duty + row.fuel + (row.other ?? 0),
    net_inr: row.total,
    is_summer_peak: SUMMER_MONTH_INDICES.has(i),
    bar_height_pct: Math.max(4, Math.round((row.total / maxBill) * 100)),
  }));

  const totals = summary.auditTotals;
  const surcharges = totals.duty + totals.fuel + (totals.other ?? 0);
  const offsetPct =
    summary.yearlyBill > 0
      ? Math.min(100, Math.round((summary.annualSaving / summary.yearlyBill) * 100))
      : 0;

  const billingCaption =
    summary.mpSmartBillingCaption ??
    (summary.mpBillingSubTypeLabel
      ? `Algorithmic analysis of ${summary.mpBillingSubTypeLabel}. Verified data from Sol.52 core.`
      : "Algorithmic analysis of your electricity bill. Verified data from Sol.52 core.");

  const flow_nodes = [
    {
      title: "Panels",
      sub: `${summary.panels}×${panelWatt}W ${summary.brands?.panel?.split("/")[0]?.trim() ?? summary.panelBrand}`,
    },
    { title: "DC System", sub: "4mm² + SPD" },
    { title: "Inverter", sub: `${summary.systemKw}kW MPPT Grid` },
    { title: "AC System", sub: "MCB + Earth" },
    { title: "Net Meter", sub: "Bi-directional", highlight: true },
  ];

  const bom_rows =
    summary.bom.length > 0
      ? summary.bom.map((item) => ({
          component: item.title.replace(/^Solar /, "").replace(/s$/, "") || item.title,
          specification: item.spec,
          brand: item.brand,
          warranty: normalizeWarrantyLabel(item.warranty),
          warranty_tone: warrantyTone(item.warranty),
        }))
      : [];

  const payments = summary.paymentMilestones.map((m, i) => ({
    label: `${m.step}. ${MILESTONE_NAMES[i] ?? m.label} (${m.pct}%)`,
    amount_inr: m.amountInr,
    is_total: i === summary.paymentMilestones.length - 1,
  }));

  const bank = summary.bankDetails;

  return {
    cover: {
      brand_primary: brand.primary,
      brand_secondary: brand.secondary,
      customer_name: customer,
      location_line: locationLine(pptInput),
      system_profile: `${summary.systemKw} kW Premium Grid-Connected`,
    },
    bill: {
      billing_caption: billingCaption,
      months,
      totals: {
        label: "Total",
        units: totals.units,
        energy_inr: totals.energy,
        fixed_inr: totals.fixed,
        duty_fuel_inr: surcharges,
        net_inr: totals.total,
      },
      summer_trap_pct: summary.summerPct,
      fixed_liability_display: fmtCompactK(summary.fixedAnnual),
      surcharges_display: fmtCompactK(surcharges),
      offset_potential_pct: offsetPct,
      offset_retention_display: `₹${fmtInrPlain(summary.annualSaving)}/yr retention.`,
    },
    capital: {
      gross_cost_inr: summary.grossSystemCost,
      subsidy_inr: summary.pmSubsidy,
      net_cost_inr: summary.netCost,
      payback_years: Math.round(summary.paybackYears * 10) / 10,
      wealth_25yr_lakhs: Math.round((summary.lifetime25Profit / 100000) * 10) / 10,
    },
    technical: {
      flow_nodes,
      bom_rows,
    },
    execution: {
      team_city: cityFromLocation(pptInput),
      timeline: [
        { day_label: "Day 1", title: "Audit", description: "Site Survey & structural check." },
        { day_label: "Day 3", title: "Liaison", description: "DISCOM & subsidy filed." },
        { day_label: "Day 7", title: "Deploy", description: "Panels, Inverter & full wiring." },
        {
          day_label: "Day 10",
          title: "Live",
          description: "Net Meter & Handover.",
          complete: true,
        },
      ],
      payments,
      bank: {
        beneficiary: bank.accountName?.trim() || summary.installer,
        account_number: bank.accountNumber?.trim() || "—",
        ifsc: bank.ifsc?.trim() || "—",
        upi_id: bank.upiId?.trim() || "—",
      },
    },
  };
}
