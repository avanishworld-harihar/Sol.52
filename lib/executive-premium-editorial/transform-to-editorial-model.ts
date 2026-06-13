import type { PremiumProposalPptInput, ProposalDeckSummary } from "@/lib/proposal-ppt";
import {
  fmtCompactK,
  fmtLakhsShort,
  warrantyTone,
} from "@/lib/executive-premium-editorial/format";
import type { ExecutivePremiumEditorialModel } from "@/lib/executive-premium-editorial/types";

const SUMMER_INDICES = new Set([3, 4, 5, 6]);
const MILESTONE_LABELS = ["Booking", "Material Delivery", "Installation", "Go Live"] as const;

function splitBrand(installer: string): { primary: string; secondary: string } {
  const trimmed = installer.trim() || "Solar Installer";
  const parts = trimmed.split(/\s+/);
  if (parts.length <= 1) return { primary: trimmed.toUpperCase(), secondary: "" };
  return {
    primary: parts.slice(0, -1).join(" ").toUpperCase(),
    secondary: parts[parts.length - 1]!.toUpperCase(),
  };
}

function locationLine(pptInput: PremiumProposalPptInput): string {
  const city = (pptInput.location ?? "").trim().split(",")[0]?.trim();
  const state = (pptInput.state ?? "").trim();
  if (city && state) return `${city}, ${state}`;
  return city || state || "—";
}

function normalizeWarranty(w: string): string {
  return w.replace(/\byr\b/gi, "Year").replace(/\byears?\b/gi, "Year").trim();
}

export function transformToEditorialModel(
  pptInput: PremiumProposalPptInput,
  summary: ProposalDeckSummary
): ExecutivePremiumEditorialModel {
  const brand = splitBrand(summary.installer);
  const customer =
    (typeof pptInput.customerName === "string" && pptInput.customerName.trim()) ||
    summary.honoredName ||
    "Valued Customer";

  const maxBill = Math.max(...summary.auditRows.map((r) => r.total), 1);
  const months = summary.auditRows.map((row, i) => ({
    label: row.label.slice(0, 3),
    units: row.units,
    energy_inr: row.energy,
    fixed_inr: row.fixed,
    tax_inr: row.duty + row.fuel + (row.other ?? 0),
    net_inr: row.total,
    is_summer_peak: SUMMER_INDICES.has(i),
    bar_height_pct: Math.max(4, Math.round((row.total / maxBill) * 100)),
  }));

  const totals = summary.auditTotals;
  const taxTotal = totals.duty + totals.fuel + (totals.other ?? 0);
  const solarSavingsPct =
    summary.yearlyBill > 0
      ? Math.min(100, Math.round((summary.annualSaving / summary.yearlyBill) * 100))
      : 0;

  const flow_nodes = [
    { title: "Array", sub: "Solar Panels" },
    { title: "DC System", sub: "DCDB & Cabling" },
    { title: "Inverter", sub: "On-Grid Unit" },
    { title: "AC System", sub: "ACDB & Cabling" },
    { title: "Grid Sync", sub: "Net Metering", complete: true },
  ];

  const bom_rows = summary.bom.map((item) => {
    const tone = warrantyTone(item.warranty);
    return {
      name: item.title.replace(/^Solar /, ""),
      brand: item.brand,
      spec: item.spec.endsWith(".") ? item.spec : `${item.spec}.`,
      warranty: normalizeWarranty(item.warranty),
      warranty_tone: tone,
    };
  });

  const emi_rows = summary.emi.slice(0, 3).map((row) => ({
    tenure_label: `${row.tenureYears} Years`,
    interest_paid_inr: row.totalInterest,
    monthly_emi_inr: row.monthlyEmi,
  }));

  const bank = summary.bankDetails;
  const payments = summary.paymentMilestones.map((m, i) => ({
    label: `${m.step}. ${MILESTONE_LABELS[i] ?? m.label} (${m.pct}%)`,
    amount_inr: m.amountInr,
    is_total: i === summary.paymentMilestones.length - 1,
  }));

  return {
    brand_primary: brand.primary,
    brand_secondary: brand.secondary,
    customer_name: customer,
    location_line: locationLine(pptInput),
    system_size_line: `${summary.systemKw} kW Grid-Tie`,
    cover_tagline:
      "A complete plan to upgrade your home with a premium solar system and make your electricity bill zero.",
    bill: {
      summer_trap_pct: summary.summerPct,
      fixed_charges_display: fmtCompactK(summary.fixedAnnual),
      solar_savings_pct: solarSavingsPct,
      months,
      totals: {
        units: totals.units,
        energy_inr: totals.energy,
        fixed_inr: totals.fixed,
        tax_inr: taxTotal,
        net_inr: totals.total,
      },
    },
    economics: {
      gross_cost_inr: summary.grossSystemCost,
      subsidy_inr: summary.pmSubsidy,
      net_cost_inr: summary.netCost,
      payback_years: Math.round(summary.paybackYears * 10) / 10,
      savings_25yr_lakhs: Number(fmtLakhsShort(summary.lifetime25Profit)),
      emi_rows,
    },
    impact: {
      annual_gen_units: summary.annualGen || summary.environmental.annualGenUnits,
      co2_tons: summary.environmental.lifetimeCo2TonsSaved,
      trees: summary.environmental.treeEquivalent,
    },
    architecture: { flow_nodes, bom_rows },
    execution: {
      company: bank.accountName?.trim() || summary.installer,
      account_number: bank.accountNumber?.trim() || "—",
      ifsc: bank.ifsc?.trim() || "—",
      upi_id: bank.upiId?.trim() || "—",
      steps: [
        {
          num: "01",
          title: "Get Started",
          description: "We apply for your electricity board permission and subsidy.",
        },
        {
          num: "02",
          title: "Material Delivery",
          description: "All solar panels and parts arrive safely at your home.",
        },
        {
          num: "03",
          title: "Rooftop Fitting",
          description: "Our expert engineers finish the rooftop fitting and wiring.",
        },
        {
          num: "04",
          title: "Free Electricity",
          description: "The net-meter is installed, and your free electricity starts.",
        },
      ],
      payments,
    },
  };
}
