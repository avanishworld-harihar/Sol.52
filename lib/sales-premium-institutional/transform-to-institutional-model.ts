import type { PremiumProposalPptInput, ProposalDeckSummary } from "@/lib/proposal-ppt";
import {
  fmtInrPlain,
  fmtInrSpaced,
  fmtLakhsShort,
  normalizeWarrantyShort,
} from "@/lib/sales-premium-institutional/format";
import type { SalesPremiumInstitutionalModel } from "@/lib/sales-premium-institutional/types";

const SUMMER_MONTH_INDICES = new Set([3, 4, 5, 6]);
const CHECKOUT_TITLES = ["Booking (25%)", "Material (50%)", "Installation (20%)", "Go Live (5%)"] as const;

function locationLine(pptInput: PremiumProposalPptInput): string {
  const city = (pptInput.location ?? "").trim().split(",")[0]?.trim();
  const state = (pptInput.state ?? "").trim();
  if (city && state) return `${city}, ${state}`;
  return city || state || "—";
}

function warrantyTone(warranty: string): "green" | "blue" | "default" {
  const w = warranty.toLowerCase();
  if (w.includes("25") || w.includes("lifetime")) return "green";
  if (w.includes("10")) return "blue";
  return "default";
}

export function transformToInstitutionalModel(
  pptInput: PremiumProposalPptInput,
  summary: ProposalDeckSummary
): SalesPremiumInstitutionalModel {
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
    duty_inr: row.duty + row.fuel + (row.other ?? 0),
    net_inr: row.total,
    is_summer_peak: SUMMER_MONTH_INDICES.has(i),
    bar_height_pct: Math.max(4, Math.round((row.total / maxBill) * 100)),
  }));

  const totals = summary.auditTotals;
  const dutyTotal = totals.duty + totals.fuel + (totals.other ?? 0);

  const bom_rows = summary.bom.map((item, i) => ({
    index: i + 1,
    component: item.title.replace(/^Solar /, ""),
    specification: item.spec.replace(/\s*x\s*/gi, " × "),
    brand: item.brand,
    warranty: normalizeWarrantyShort(item.warranty),
    warranty_tone: warrantyTone(item.warranty),
  }));

  const emi_rows = summary.emi.slice(0, 3).map((row) => ({
    tenure_label: `${row.tenureYears} Years`,
    interest_inr: row.totalInterest,
    monthly_inr: row.monthlyEmi,
  }));

  const bank = summary.bankDetails;
  const steps = summary.paymentMilestones.map((m, i) => {
    const title = CHECKOUT_TITLES[i] ?? `${m.label} (${m.pct}%)`;
    const descParts = [
      `${fmtInrSpaced(m.amountInr)}.`,
      i === 0
        ? "We apply for your DISCOM permission and subsidy."
        : i === 1
          ? "Upon secure arrival of panels and inverter at your home."
          : i === 2
            ? "Once our engineers finish the rooftop fitting and wiring."
            : "The net-meter is activated. Your electricity is now free.",
    ];
    return {
      num: String(i + 1),
      title,
      description: descParts.join(" "),
      highlight_title: i === summary.paymentMilestones.length - 1,
    };
  });

  return {
    cover: {
      brand_display: summary.installer.trim() || "Harihar Solar",
      customer_name: customer,
      location_line: locationLine(pptInput),
      system_kw_line: `${summary.systemKw} kW Premium`,
      system_architecture_line: "Grid-Connected Architecture",
      savings_lakhs: Number(fmtLakhsShort(summary.lifetime25Profit)),
    },
    bill: {
      current_annual_inr: summary.yearlyBill,
      cost_after_solar_inr: summary.afterSolar,
      annual_savings_inr: summary.annualSaving,
      months,
      totals: {
        units: totals.units,
        energy_inr: totals.energy,
        fixed_inr: totals.fixed,
        duty_inr: dutyTotal,
        net_inr: totals.total,
      },
    },
    capital: {
      net_investment_lakhs: Number(fmtLakhsShort(summary.netCost)),
      lifetime_returns_lakhs: Number(fmtLakhsShort(summary.lifetime25Profit)),
      gross_cost_inr: summary.grossSystemCost,
      subsidy_inr: summary.pmSubsidy,
      net_cost_inr: summary.netCost,
      emi_rows,
    },
    technical: {
      bom_rows,
      co2_tons: summary.environmental.lifetimeCo2TonsSaved,
      trees: summary.environmental.treeEquivalent,
    },
    execution: {
      steps,
      bank: {
        beneficiary: bank.accountName?.trim() || summary.installer,
        account_number: bank.accountNumber?.trim() || "—",
        ifsc: bank.ifsc?.trim() || "—",
        upi_id: bank.upiId?.trim() || "—",
      },
    },
  };
}
