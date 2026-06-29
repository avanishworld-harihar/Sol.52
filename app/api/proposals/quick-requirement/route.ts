import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  assertCanCreateProposal,
  extractTrialIdentityFromRequest,
  isBillingEntitlementError,
  recordProposalCreated,
} from "@/lib/billing";
import { mergeProposalPricingIntoPptInput } from "@/lib/proposal-pricing-merge";
import {
  ensureProposalPricingRow,
  getProposalPricingByProposalId,
} from "@/lib/proposal-pricing-store";
import {
  persistProposalDeckAfterPricingChange,
  persistResidentialConfigChange,
} from "@/lib/proposal-pricing-sync";
import { summarizeProposalDeck } from "@/lib/proposal-ppt";
import { PROPOSAL_PRESET_IDS } from "@/lib/proposal-preset-engine";
import { buildQuickRequirementProposal } from "@/lib/quick-requirement-proposal";
import { resolveDefaultOrgId } from "@/lib/project-store";
import { createProposal } from "@/lib/proposals-store";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const bodySchema = z.object({
  kw: z.coerce.number().min(0.5).max(10000),
  customerName: z.string().max(120).optional(),
  presetId: z.enum(PROPOSAL_PRESET_IDS).optional(),
  leadId: z.string().max(120).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const payload = bodySchema.parse(await req.json());
    const built = await buildQuickRequirementProposal({
      kw: payload.kw,
      customerName: payload.customerName,
      presetId: payload.presetId,
      leadId: payload.leadId ?? null,
    });

    const orgId = await resolveDefaultOrgId();
    const identity = extractTrialIdentityFromRequest(req);

    let billingSub = null;
    try {
      billingSub = await assertCanCreateProposal({
        organizationId: orgId ?? "",
        presetId: built.presetId,
        salesPremiumStyle: built.pptInput.salesPremiumStyle,
        galleryKey: built.pptInput.galleryThemeKey,
        identity,
      });
    } catch (billingErr) {
      if (isBillingEntitlementError(billingErr)) {
        return NextResponse.json(
          {
            ok: false,
            error: billingErr.message,
            code: billingErr.code,
            details: billingErr.details ?? null,
          },
          { status: 402 }
        );
      }
      throw billingErr;
    }

    const created = await createProposal({
      pptInput: built.pptInput,
      summary: built.summary,
      leadId: payload.leadId?.trim() || null,
      clientRef: null,
      consumerId: null,
      presetId: built.presetId,
      organizationId: orgId,
    });

    if (!created) {
      return NextResponse.json({ ok: false, error: "persist_failed" }, { status: 503 });
    }

    if (orgId && billingSub) {
      await recordProposalCreated(orgId, billingSub);
    }

    await ensureProposalPricingRow({
      ...built.pricingInsert,
      proposal_id: created.id,
    });

    await persistResidentialConfigChange(
      created.id,
      built.residentialConfig,
      built.pptInput.proposalLayout
    );
    await persistProposalDeckAfterPricingChange(created.id);

    const freshPricing = await getProposalPricingByProposalId(created.id);
    const responseSummary = freshPricing
      ? summarizeProposalDeck(mergeProposalPricingIntoPptInput(built.pptInput, freshPricing))
      : built.summary;

    const origin = req.headers.get("origin") || `${req.nextUrl.protocol}//${req.nextUrl.host}`;
    const shareUrl = `${origin}/proposal/${created.id}`;

    return NextResponse.json(
      {
        ok: true,
        id: created.id,
        customerName: created.customer_name,
        shareUrl,
        presetId: built.presetId,
        systemKw: built.residentialConfig.solar.plantCapacityKw,
        netCostInr: responseSummary.netCost,
        subsidyInr: responseSummary.pmSubsidy,
        plantGrossInr: responseSummary.grossSystemCost,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")
        : error instanceof Error
          ? error.message
          : "quick_requirement_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
