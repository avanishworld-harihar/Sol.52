import type { PremiumProposalPptInput, ProposalDeckSummary } from "@/lib/proposal-ppt";
import { fmtCompactK } from "@/lib/executive-premium-editorial/format";
import type { ExecutivePremiumEditorialModel } from "@/lib/executive-premium-editorial/types";

const SUMMER_INDICES = new Set([3, 4, 5, 6]);
const PAYMENT_SHORT = [
  { label: "Booking", pct: "25%" },
  { label: "Material", pct: "50%" },
  { label: "Install", pct: "20%" },
  { label: "Go Live", pct: "5%" },
] as const;

function locationLine(pptInput: PremiumProposalPptInput): string {
  const city = (pptInput.location ?? "").trim().split(",")[0]?.trim();
  const state = (pptInput.state ?? "").trim();
  if (city && state) return `${city}, ${state}`;
  return city || state || "—";
}

function normalizeWarranty(w: string): string {
  return w.replace(/\byr\b/gi, "Year").replace(/\byears?\b/gi, "Year").trim();
}

function bomDescription(title: string, brand: string): string {
  const b = brand.trim() || "certified manufacturers";
  const key = title.toLowerCase();
  if (key.includes("panel")) {
    return `High-efficiency silicon modules from ${b} engineered for peak absorption.`;
  }
  if (key.includes("inverter")) {
    return `Aerospace-grade waterproof enclosure from ${b} with advanced tracking.`;
  }
  if (key.includes("mount") || key.includes("structure")) {
    return `Industrial mounting structures from ${b} built to survive 150 km/h wind velocities.`;
  }
  if (key.includes("cabl")) {
    return `Fire-resistant ${b} wiring ensures near-zero transmission loss to the grid.`;
  }
  if (key.includes("protect") || key.includes("safety") || key.includes("dcdb")) {
    return "Dedicated safety units with Surge Protection Devices and proper copper earthing.";
  }
  return `Premium-grade component from ${b}, certified for long-term rooftop performance.`;
}

export function transformToEditorialModel(
  pptInput: PremiumProposalPptInput,
  summary: ProposalDeckSummary
): ExecutivePremiumEditorialModel {
  const customer =
    (typeof pptInput.customerName === "string" && pptInput.customerName.trim()) ||
    summary.honoredName ||
    "Valued Customer";

  const maxBill = Math.max(...summary.auditRows.map((r) => r.total), 1);
  const months = summary.auditRows.map((row, i) => {
    const isSummer = SUMMER_INDICES.has(i);
    return {
      label: row.label.slice(0, 3),
      units: row.units,
      energy_inr: row.energy,
      fixed_inr: row.fixed,
      duty_inr: row.duty + row.fuel + (row.other ?? 0),
      net_inr: row.total,
      is_summer_peak: isSummer,
      highlight_net: isSummer,
      bar_height_pct: Math.max(4, Math.round((row.total / maxBill) * 100)),
    };
  });

  const totals = summary.auditTotals;
  const dutyTotal = totals.duty + totals.fuel + (totals.other ?? 0);
  const solarSavingsPct =
    summary.yearlyBill > 0
      ? Math.min(100, Math.round((summary.annualSaving / summary.yearlyBill) * 100))
      : 0;

  const bom_rows = summary.bom.map((item) => ({
    name: item.title.replace(/^Solar /, ""),
    spec: item.spec.replace(/\s*×\s*/g, " × ").replace(/\s*x\s*/gi, " × "),
    warranty: normalizeWarranty(item.warranty),
    description: bomDescription(item.title, item.brand),
  }));

  const emi_rows = summary.emi.slice(0, 3).map((row) => ({
    tenure_label: `${row.tenureYears} Year Loan`,
    interest_paid_inr: row.totalInterest,
    monthly_emi_inr: row.monthlyEmi,
  }));

  const bank = summary.bankDetails;
  const payments = summary.paymentMilestones.map((m, i) => {
    const short = PAYMENT_SHORT[i];
    return {
      label: short ? `${i + 1}. ${short.label}` : `${m.step}. ${m.label}`,
      pct_label: short?.pct ?? `${m.pct}%`,
      amount_inr: m.amountInr,
      is_total: i === summary.paymentMilestones.length - 1,
    };
  });

  return {
    brand_display: summary.installer.trim() || "Harihar Solar",
    customer_name: customer,
    location_line: locationLine(pptInput),
    asset_profile_line: `${summary.systemKw} kW Premium Grid-Architecture`,
    bill: {
      summer_trap_pct: summary.summerPct,
      fixed_charges_display: fmtCompactK(summary.fixedAnnual),
      solar_savings_pct: solarSavingsPct,
      months,
      totals: {
        units: totals.units,
        energy_inr: totals.energy,
        fixed_inr: totals.fixed,
        duty_inr: dutyTotal,
        net_inr: totals.total,
      },
    },
    economics: {
      gross_cost_inr: summary.grossSystemCost,
      subsidy_inr: summary.pmSubsidy,
      net_cost_inr: summary.netCost,
      payback_years: Math.round(summary.paybackYears * 10) / 10,
      emi_rows,
    },
    impact: {
      co2_tons: summary.environmental.lifetimeCo2TonsSaved,
      trees: summary.environmental.treeEquivalent,
    },
    architecture: { bom_rows },
    execution: {
      company: bank.accountName?.trim() || summary.installer,
      account_number: bank.accountNumber?.trim() || "—",
      ifsc: bank.ifsc?.trim() || "—",
      upi_id: bank.upiId?.trim() || "—",
      steps: [
        {
          num: "1",
          title: "Get Started",
          description: "We apply for your electricity board permission and state subsidy.",
        },
        {
          num: "2",
          title: "Material Delivery",
          description: "All solar panels and heavy components arrive safely at your home.",
        },
        {
          num: "3",
          title: "Rooftop Fitting",
          description: "Our expert engineers complete the rooftop fitting, wiring, and testing.",
        },
        {
          num: "4",
          title: "Go Live",
          description: "The net-meter is installed, and your home achieves energy independence.",
        },
      ],
      payments,
    },
  };
}
