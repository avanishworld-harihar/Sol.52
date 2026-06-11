import type { PremiumProposalPptInput, ProposalDeckSummary } from "@/lib/proposal-ppt";
import { computeProposalFinancialsFromDeck } from "@/lib/proposal-financial-engine";
import { computeEmi } from "@/lib/proposal-deck-helpers";
import { parseResidentialConfig } from "@/lib/residential-proposal-config";
import {
  buildBillIntelligenceData,
  resolveNextgenFlowMode,
} from "@/lib/executive-premium-nextgen/bill-intelligence-data";
import { buildOwnershipLedgerFromSummary } from "@/lib/executive-premium-nextgen/ownership-ledger-engine";
import { buildRequirementContextData } from "@/lib/executive-premium-nextgen/requirement-context-data";
import type { ExecutivePremiumNextgenModel } from "@/lib/executive-premium-nextgen/types";
import { DEFAULT_OUTCOME_WORDS } from "@/lib/executive-premium-nextgen/ep-copy";
import { resolveEpPropertyImages } from "@/lib/executive-premium-nextgen/resolve-ep-images";

function formatReferenceId(proposalId: string): string {
  const compact = proposalId.replace(/-/g, "").slice(0, 12).toUpperCase();
  return `EP-${compact}`;
}

function formatDocumentDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function splitPropertyAddress(location: string, cityHint?: string): {
  address_line1: string;
  address_line2: string;
  city: string;
  full_address: string;
} {
  const raw = (location ?? "").trim();
  const city = (cityHint ?? "").trim();
  if (!raw) {
    return {
      address_line1: "Property address",
      address_line2: "",
      city: city || "—",
      full_address: city || "—",
    };
  }
  const parts = raw.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 1) {
    return {
      address_line1: parts[0]!,
      address_line2: "",
      city: city || parts[0]!,
      full_address: city ? `${parts[0]}, ${city}` : parts[0]!,
    };
  }
  const address_line1 = parts[0]!;
  const address_line2 = parts.slice(1, -1).join(", ") || parts[1]!;
  const resolvedCity = city || parts[parts.length - 1]!;
  return {
    address_line1,
    address_line2,
    city: resolvedCity,
    full_address: city ? `${raw}, ${city}` : raw,
  };
}

function contactFirstName(installerName: string): string {
  const trimmed = installerName.trim();
  if (!trimmed) return "Your advisor";
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

function exportPercentage(summary: ProposalDeckSummary): number {
  if (summary.annualGen <= 0) return 0;
  const selfUse = Math.min(summary.annualUse, summary.annualGen);
  const exportUnits = Math.max(0, summary.annualGen - selfUse);
  return Math.round((exportUnits / summary.annualGen) * 100);
}

function fmtUnits(n: number): string {
  return Math.round(n).toLocaleString("en-IN");
}

export type TransformToNextgenInput = {
  proposalId: string;
  generatedAt: string;
  pptInput: PremiumProposalPptInput;
  summary: ProposalDeckSummary;
  siteImages?: string[];
};

/** Map existing proposal payload → NextGen MVP model. */
export function transformToNextgenModel(input: TransformToNextgenInput): ExecutivePremiumNextgenModel {
  const { proposalId, generatedAt, pptInput, summary, siteImages = [] } = input;
  const { coverUrl, assetUrl } = resolveEpPropertyImages(siteImages);
  const address = splitPropertyAddress(pptInput.location);

  const lifetime_energy_value_inr = Math.round(summary.annualSaving * 25);
  const flow_mode = resolveNextgenFlowMode(pptInput, summary);
  const bill_intelligence =
    flow_mode === "bill" ? buildBillIntelligenceData(pptInput, summary) : null;
  const requirement_context =
    flow_mode === "requirement" ? buildRequirementContextData(pptInput, summary) : null;

  const ledger = buildOwnershipLedgerFromSummary(summary);

  const exportPct = exportPercentage(summary);
  const residential = parseResidentialConfig(pptInput.residentialConfig);
  const storageKwh =
    residential?.battery?.required && residential.battery.capacityKwh
      ? residential.battery.capacityKwh
      : null;

  const asset = {
    rooftop_layout_image_url: assetUrl,
    annual_generation_kwh: summary.annualGen,
    export_percentage: exportPct,
    storage_kwh: storageKwh,
    characteristics: [
      {
        label: "Power per year",
        value: fmtUnits(summary.annualGen),
        unit: "units",
      },
      {
        label: "Sent to grid",
        value: String(exportPct),
        unit: "% of power",
      },
      {
        label: "System life",
        value: "25",
        unit: "years",
      },
    ] as ExecutivePremiumNextgenModel["asset"]["characteristics"],
    lifespan_years: 25,
    performance_assurance_text:
      "We track your system’s output. If it underperforms, we make it right.",
  };

  const contactMethod = summary.contact?.trim() || "Contact on file";
  const governance = {
    zones: [
      {
        zone_name: "Performance",
        coverage_line1: "We check your system’s output against what we promised.",
        coverage_line2: "If numbers fall short, we review and fix — not just send a ticket.",
        response_timeline: "Checked every month",
      },
      {
        zone_name: "Monitoring",
        coverage_line1: "Your system is watched remotely, day and night.",
        coverage_line2: "We act before small issues become big problems.",
        response_timeline: "Always on",
      },
      {
        zone_name: "Support",
        coverage_line1: "If a visit is needed, we coordinate the work for you.",
        coverage_line2: "You speak to one person — not a call centre queue.",
        response_timeline: "Within 48 hours",
      },
    ] as ExecutivePremiumNextgenModel["governance"]["zones"],
    contact: {
      first_name: contactFirstName(summary.installer),
      title: "Your contact",
      contact_method: contactMethod,
    },
    closing_statement: "One named person is responsible — not a department.",
  };

  const metrics = computeProposalFinancialsFromDeck(summary, pptInput);
  const monthlyReturn = Math.round(summary.annualSaving / 12);
  const finance = pptInput.financeOption ?? {};
  const interestPct = Number.isFinite(finance.interestRatePct) ? Number(finance.interestRatePct) : 10.5;
  const tenureYears =
    residential?.financing?.selectedTenureYears ??
    finance.selectedTenureYears ??
    finance.tenuresYears?.[1] ??
    5;
  const emi = computeEmi(summary.netCost, interestPct, tenureYears);
  const monthlyOutflowFinanced = emi.monthlyEmi;
  const monthlyNetFinanced = monthlyReturn - monthlyOutflowFinanced;

  const investment = {
    net_commitment_inr: summary.netCost,
    options: [
      {
        option_label: "Option A — Pay in full",
        monthly_outflow_inr: 0,
        monthly_return_inr: monthlyReturn,
        monthly_net_inr: monthlyReturn,
        irr_percent: metrics.irrEstimate,
      },
      {
        option_label: "Option B — Finance",
        monthly_outflow_inr: monthlyOutflowFinanced,
        monthly_return_inr: monthlyReturn,
        monthly_net_inr: monthlyNetFinanced,
        irr_percent: metrics.irrEstimate,
      },
    ] as ExecutivePremiumNextgenModel["investment"]["options"],
    recommended_option: monthlyNetFinanced > monthlyReturn * 0.35 ? ("B" as const) : ("A" as const),
    recommendation_text:
      monthlyNetFinanced > 0
        ? "Finance keeps cash in hand while solar savings cover most of the EMI."
        : "Paying in full costs less over 25 years if you have the funds available.",
    next_steps: [
      "Confirm your address and when we can visit the site.",
      "Choose pay-in-full or finance and sign the agreement.",
      "We schedule the site survey and grid paperwork.",
    ] as ExecutivePremiumNextgenModel["investment"]["next_steps"],
    validity_statement: `Valid for 30 days from ${formatDocumentDate(generatedAt)}.`,
  };

  return {
    flow_mode,
    property: {
      photograph_url: coverUrl,
      ...address,
    },
    document: {
      reference_id: formatReferenceId(proposalId),
      created_date: formatDocumentDate(generatedAt),
    },
    financials: { lifetime_energy_value_inr },
    config: { outcome_words: DEFAULT_OUTCOME_WORDS },
    bill_intelligence,
    requirement_context,
    ledger,
    asset,
    governance,
    investment,
  };
}
