import { z } from "zod";
import { fetchMpAuditOverridesByRef } from "@/lib/mp-bill-audit-fetch";
import { appendActivityEvent } from "@/lib/followup-store";
import { mergeProposalPricingIntoPptInput } from "@/lib/proposal-pricing-merge";
import { getProposalPricingByProposalId } from "@/lib/proposal-pricing-store";
import { persistMergedProposalDeck } from "@/lib/proposal-pricing-sync";
import { proposalExtrasShape } from "@/lib/proposal-extras-schema";
import { summarizeProposalDeck, type PremiumProposalPptInput } from "@/lib/proposal-ppt";
import { PROPOSAL_PRESET_IDS } from "@/lib/proposal-preset-engine";
import { normalizeSalesPremiumStyle } from "@/lib/sales-premium-styles";
import { getProposalById } from "@/lib/proposals-store";
import { bumpLeadStatus, upsertPipelineProject } from "@/lib/supabase";
import type { MonthlyUnits } from "@/lib/types";

const SITE_SURVEY_NEXT_ACTION = "Site survey pending";

const monthsSchema = z.object({
  jan: z.number(),
  feb: z.number(),
  mar: z.number(),
  apr: z.number(),
  may: z.number(),
  jun: z.number(),
  jul: z.number(),
  aug: z.number(),
  sep: z.number(),
  oct: z.number(),
  nov: z.number(),
  dec: z.number(),
});

const monthBillActualsSchema = z
  .object({
    jan: z.number().min(0).optional(),
    feb: z.number().min(0).optional(),
    mar: z.number().min(0).optional(),
    apr: z.number().min(0).optional(),
    may: z.number().min(0).optional(),
    jun: z.number().min(0).optional(),
    jul: z.number().min(0).optional(),
    aug: z.number().min(0).optional(),
    sep: z.number().min(0).optional(),
    oct: z.number().min(0).optional(),
    nov: z.number().min(0).optional(),
    dec: z.number().min(0).optional(),
  })
  .optional();

const monthlyAuditOverrideEntry = z.object({
  netPayableInr: z.number().min(0),
  energyInr: z.number().min(0).optional(),
  fixedInr: z.number().min(0).optional(),
  fppasInr: z.number().optional(),
  electricityDutyInr: z.number().optional(),
  units: z.number().min(0).optional(),
});

const monthlyAuditOverridesSchema = z
  .object({
    jan: monthlyAuditOverrideEntry.optional(),
    feb: monthlyAuditOverrideEntry.optional(),
    mar: monthlyAuditOverrideEntry.optional(),
    apr: monthlyAuditOverrideEntry.optional(),
    may: monthlyAuditOverrideEntry.optional(),
    jun: monthlyAuditOverrideEntry.optional(),
    jul: monthlyAuditOverrideEntry.optional(),
    aug: monthlyAuditOverrideEntry.optional(),
    sep: monthlyAuditOverrideEntry.optional(),
    oct: monthlyAuditOverrideEntry.optional(),
    nov: monthlyAuditOverrideEntry.optional(),
    dec: monthlyAuditOverrideEntry.optional(),
  })
  .optional();

/** Same shape as POST /api/proposals — customer name may be empty for anonymous quick quotes. */
export const proposalDeckUpdateBodySchema = z.object({
  customerName: z.string().max(120),
  location: z.string().max(160).default(""),
  systemKw: z.number().min(0).max(200),
  yearlyBill: z.number().min(0),
  afterSolar: z.number().min(0),
  saving: z.number().min(0),
  paybackYears: z.number().min(0).max(50),
  monthlyUnits: monthsSchema,
  state: z.string().max(100).optional(),
  discom: z.string().max(160).optional(),
  connectionType: z.string().max(120).optional(),
  tariffCategory: z.string().max(120).optional(),
  connectedLoadKw: z.number().min(0).max(500).optional(),
  purposeOfSupply: z.string().max(200).optional(),
  contractDemandKva: z.number().min(0).max(2000).optional(),
  billEnergyChargesInr: z.number().min(0).max(50000000).optional(),
  billElectricityDutyInr: z.number().min(-50000000).max(50000000).optional(),
  billFppasInr: z.number().min(-50000000).max(50000000).optional(),
  billFixedChargeInr: z.number().min(0).max(50000000).optional(),
  referenceBillUnits: z.number().min(0).max(2_000_000).optional(),
  areaProfile: z.enum(["urban", "rural"]).optional(),
  billMonth: z.string().max(40).optional(),
  currentMonthBillAmountInr: z.number().min(0).max(10000000).nullable().optional(),
  monthlyBillActuals: monthBillActualsSchema,
  monthlyAuditOverrides: monthlyAuditOverridesSchema,
  agjyClaimed: z.boolean().optional(),
  clientRef: z.string().max(120).optional(),
  leadId: z.string().max(120).nullish(),
  consumerId: z.string().max(120).optional(),
  useMpAudits: z.boolean().optional(),
  grossSystemCostInr: z.number().min(0).max(50000000).optional(),
  pmSuryaGharSubsidyInr: z.number().min(0).max(500000).optional(),
  netCostInr: z.number().min(0).max(50000000).optional(),
  dataSource: z.enum(["bill", "requirement"]).optional(),
  presetId: z.enum(PROPOSAL_PRESET_IDS).optional(),
  panelBrand: z.enum(["Adani", "Waaree", "JSW", "Tata", "Vikram", "RenewSys"]).optional(),
  installerName: z.string().max(120).optional(),
  installerTagline: z.string().max(160).optional(),
  installerContact: z.string().max(220).optional(),
  ...proposalExtrasShape,
});

export type ProposalDeckUpdateBody = z.infer<typeof proposalDeckUpdateBodySchema>;

function looksLikeMp(state?: string, discom?: string): boolean {
  return /madhya pradesh|mppkv|mppgvv|mpmkvv|mppakvv|mpcz|mpez|mpwz/i.test(`${state ?? ""} ${discom ?? ""}`);
}

async function buildPptInputFromBody(
  payload: ProposalDeckUpdateBody,
  existing?: PremiumProposalPptInput | null
): Promise<PremiumProposalPptInput> {
  let auditOverrides = payload.monthlyAuditOverrides ?? existing?.monthlyAuditOverrides;
  const wantsMpAudits = payload.useMpAudits !== false && looksLikeMp(payload.state, payload.discom);
  const leadId = payload.leadId?.trim() || null;
  if (wantsMpAudits && (payload.clientRef || leadId || payload.consumerId)) {
    try {
      const fetched = await fetchMpAuditOverridesByRef({
        clientRef: payload.clientRef ?? null,
        leadId,
        consumerId: payload.consumerId ?? null,
        withinDays: 540,
      });
      auditOverrides = { ...fetched.overrides, ...(auditOverrides ?? {}) };
    } catch {
      /* ignore */
    }
  }

  const { salesPremiumStyle: rawSalesPremiumStyle, ...proposalFields } = payload;
  return {
    ...existing,
    ...proposalFields,
    customerName: payload.customerName,
    monthlyUnits: payload.monthlyUnits as MonthlyUnits,
    monthlyAuditOverrides: auditOverrides,
    ...(rawSalesPremiumStyle
      ? { salesPremiumStyle: normalizeSalesPremiumStyle(rawSalesPremiumStyle) }
      : {}),
  };
}

export async function updateProposalDeckFromBody(
  proposalId: string,
  payload: ProposalDeckUpdateBody
): Promise<{ ok: boolean; error?: string }> {
  const proposal = await getProposalById(proposalId);
  if (!proposal) return { ok: false, error: "not_found" };

  const pptInput = await buildPptInputFromBody(payload, proposal.ppt_input);
  const pricing = await getProposalPricingByProposalId(proposalId);
  const mergedPpt = mergeProposalPricingIntoPptInput(pptInput, pricing);
  const leadId = payload.leadId?.trim() || proposal.lead_id || null;

  const ok = await persistMergedProposalDeck(proposalId, mergedPpt, { leadId });
  if (!ok) return { ok: false, error: "persist_failed" };

  if (leadId && !proposal.lead_id) {
    try {
      await upsertPipelineProject({
        lead_id: leadId,
        official_name: payload.customerName || proposal.customer_name,
        capacity_kw: `${payload.systemKw} kW`,
        contract_amount_inr: payload.netCostInr ?? null,
        status: "pending",
        install_progress: 10,
        next_action: SITE_SURVEY_NEXT_ACTION,
      });
    } catch {
      /* ignore */
    }
    try {
      await bumpLeadStatus(leadId, "proposal-sent");
    } catch {
      /* ignore */
    }
    void appendActivityEvent({
      leadId,
      eventType: "proposal_created",
      meta: {
        proposalId,
        customerName: payload.customerName,
        systemKw: payload.systemKw,
        source: "proposal_update",
      },
    });
  }

  void summarizeProposalDeck(mergedPpt);
  return { ok: true };
}
