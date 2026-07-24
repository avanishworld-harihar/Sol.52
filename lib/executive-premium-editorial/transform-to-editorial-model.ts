/**
 * Editorial model for Golden (`residential_executive`) and read-only reuse by Ember/Horizon blocks.
 * Do not change for other presets — see `lib/golden-proposal-lock.ts`.
 */
import type { PremiumProposalPptInput, ProposalDeckSummary } from "@/lib/proposal-ppt";
import type { ProposalLang } from "@/lib/proposal-i18n";
import { resolveInstallerNameForProposal } from "@/lib/proposal-branding-settings";
import { enrichBomTechnicalRows } from "@/lib/proposal-bom-technical-detail";
import { buildEditorialTermsModel } from "@/lib/executive-premium-editorial/build-terms-model";
import {
  buildEditorialEngineeringModel,
  buildEditorialWarrantyModel,
} from "@/lib/executive-premium-editorial/build-engineering-model";
import { epGoldenCopy } from "@/lib/executive-premium-editorial/ep-golden-i18n";
import {
  buildEditorialGenerationMonths,
  editorialEffectiveSavingPerUnit,
} from "@/lib/executive-premium-editorial/build-generation-forecast";
import { fmtCompactK } from "@/lib/executive-premium-editorial/format";
import type { ExecutivePremiumEditorialModel } from "@/lib/executive-premium-editorial/types";

const SUMMER_INDICES = new Set([3, 4, 5, 6]);
const PAYMENT_PCTS = ["25%", "50%", "20%", "5%"] as const;

function locationLine(pptInput: PremiumProposalPptInput): string {
  const city = (pptInput.location ?? "").trim().split(",")[0]?.trim();
  const state = (pptInput.state ?? "").trim();
  if (city && state) return `${city}, ${state}`;
  return city || state || "—";
}

function normalizeWarranty(w: string): string {
  return w.replace(/\byr\b/gi, "Year").replace(/\byears?\b/gi, "Year").trim();
}

function bomLineNote(title: string, brand: string): string {
  const make = brand.trim();
  if (!make) return "";
  const key = title.toLowerCase();
  if (key.includes("panel")) return `Panel make: ${make}.`;
  if (key.includes("inverter")) return `Inverter make: ${make}.`;
  if (key.includes("mount") || key.includes("structure")) return `Structure make: ${make}.`;
  if (key.includes("cabl")) return `Cable make: ${make}.`;
  if (key.includes("protect") || key.includes("safety")) return `Protection make: ${make}.`;
  if (key.includes("net meter") || key.includes("amc")) return `Handled by: ${make}.`;
  return `Make: ${make}.`;
}

export function transformToEditorialModel(
  pptInput: PremiumProposalPptInput,
  summary: ProposalDeckSummary,
  lang: ProposalLang = "en"
): ExecutivePremiumEditorialModel {
  const copy = epGoldenCopy(lang);
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

  const enrichedBom = enrichBomTechnicalRows(summary.bom, summary, { pptInput });
  const installerLabel =
    resolveInstallerNameForProposal({ installerName: pptInput.installerName }) || summary.installer.trim();
  const bom_rows = enrichedBom.map((item) => ({
    name: item.title.replace(/^Solar /, ""),
    spec: item.spec.replace(/\s*×\s*/g, " × ").replace(/\s*x\s*/gi, " × "),
    brand: item.brand,
    warranty: normalizeWarranty(item.warranty),
    description: bomLineNote(item.title, item.brand),
    technical_points: item.technicalPoints,
  }));

  const emi_rows = summary.emi.slice(0, 3).map((row) => ({
    tenure_label: copy.economics.yearLoan(row.tenureYears),
    interest_paid_inr: row.totalInterest,
    monthly_emi_inr: row.monthlyEmi,
  }));

  const bank = summary.bankDetails;
  const payments = summary.paymentMilestones.map((m, i) => {
    const label = copy.execution.paymentLabels[i];
    return {
      label: label ? `${i + 1}. ${label}` : `${m.step}. ${m.label}`,
      pct_label: PAYMENT_PCTS[i] ?? `${m.pct}%`,
      amount_inr: m.amountInr,
      is_total: i === summary.paymentMilestones.length - 1,
    };
  });

  return {
    brand_display: installerLabel,
    brand_logo_url: pptInput.installerLogoUrl?.trim() || undefined,
    brand_tagline: pptInput.installerTagline?.trim() || undefined,
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
      monthly_savings_inr: Math.round(summary.annualSaving / 12),
      lifetime_profit_inr: summary.lifetime25Profit,
      emi_rows,
    },
    generation: {
      months: buildEditorialGenerationMonths(summary.annualGen, summary.annualSaving),
      effective_rate_inr: editorialEffectiveSavingPerUnit(
        summary.annualGen,
        summary.annualSaving
      ),
    },
    impact: {
      co2_tons: summary.environmental.lifetimeCo2TonsSaved,
      trees: summary.environmental.treeEquivalent,
    },
    architecture: { bom_rows },
    engineering: buildEditorialEngineeringModel(pptInput, summary, lang),
    warranty: buildEditorialWarrantyModel(summary, lang),
    execution: {
      company: bank.accountName?.trim() || summary.installer,
      account_number: bank.accountNumber?.trim() || "—",
      ifsc: bank.ifsc?.trim() || "—",
      upi_id: bank.upiId?.trim() || "—",
      steps: copy.execution.steps.map((step, i) => ({
        num: String(i + 1),
        title: step.title,
        description: step.description,
      })),
      payments,
    },
    terms: buildEditorialTermsModel(summary, installerLabel, lang),
    closing: {
      customer_name: customer,
      annual_units: summary.annualGen,
      annual_savings_inr: summary.annualSaving,
      lifetime_wealth_inr: summary.lifetime25Profit,
      installer_name: installerLabel,
      contact_line: summary.contact,
      contact_person: pptInput.companyProfile?.contactPerson?.trim() || undefined,
      contact_person_designation:
        pptInput.companyProfile?.contactPersonDesignation?.trim() || undefined,
      address: pptInput.companyProfile?.address?.trim() || undefined,
      gst_number:
        pptInput.companyProfile?.gstNumber?.trim() ||
        summary.companyProfile?.gstNumber?.trim() ||
        undefined,
      brand_tagline: pptInput.installerTagline?.trim() || undefined,
      qr_url:
        summary.bankDetails?.paymentQrCodeUrl?.trim() ||
        pptInput.bankDetails?.paymentQrCodeUrl?.trim() ||
        undefined,
    },
  };
}
