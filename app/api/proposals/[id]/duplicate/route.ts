import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  assertCanCreateProposal,
  extractTrialIdentityFromRequest,
  isBillingEntitlementError,
  recordProposalCreated,
} from "@/lib/billing";
import {
  buildDuplicatePptInput,
  duplicateCustomerNameForMode,
  type DuplicateProposalMode,
} from "@/lib/duplicate-proposal";
import { mergeProposalPricingIntoPptInput } from "@/lib/proposal-pricing-merge";
import {
  ensureProposalPricingRow,
  getProposalPricingByProposalId,
} from "@/lib/proposal-pricing-store";
import { persistProposalDeckAfterPricingChange } from "@/lib/proposal-pricing-sync";
import { summarizeProposalDeck, type PremiumProposalPptInput } from "@/lib/proposal-ppt";
import { resolveDefaultOrgId } from "@/lib/project-store";
import { createProposal, getProposalById } from "@/lib/proposals-store";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type RouteCtx = { params: Promise<{ id: string }> };

const UUID_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const bodySchema = z.object({
  mode: z.enum(["template", "revision"]).default("template"),
});

export async function POST(req: NextRequest, ctx: RouteCtx) {
  try {
    const { id } = await ctx.params;
    if (!id || !UUID_RX.test(id.trim())) {
      return NextResponse.json({ ok: false, error: "invalid_id" }, { status: 400 });
    }

    const rawBody = await req.json().catch(() => ({}));
    const { mode } = bodySchema.parse(rawBody);

    const source = await getProposalById(id.trim());
    if (!source?.ppt_input) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }

    const srcPpt = source.ppt_input as PremiumProposalPptInput;
    const srcName = srcPpt.customerName ?? source.customer_name ?? "";
    const customerName = duplicateCustomerNameForMode(srcName, mode);
    const pptInput = buildDuplicatePptInput(srcPpt, mode, customerName);
    const summary = summarizeProposalDeck(pptInput);
    const presetId = source.preset_id ?? "residential_sales_premium";

    const orgId = await resolveDefaultOrgId();
    const identity = extractTrialIdentityFromRequest(req);

    let billingSub = null;
    try {
      billingSub = await assertCanCreateProposal({
        organizationId: orgId ?? "",
        presetId,
        salesPremiumStyle: pptInput.salesPremiumStyle,
        galleryKey: pptInput.galleryThemeKey,
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

    const keepCrmLink = mode === "revision";

    const created = await createProposal({
      pptInput,
      summary,
      leadId: keepCrmLink ? (source.lead_id ?? null) : null,
      clientRef: keepCrmLink ? ((source as { client_ref?: string | null }).client_ref ?? null) : null,
      consumerId: keepCrmLink ? ((source as { customer_id?: string | null }).customer_id ?? null) : null,
      presetId,
      organizationId: orgId,
    });

    if (!created) {
      return NextResponse.json({ ok: false, error: "persist_failed" }, { status: 503 });
    }

    if (orgId && billingSub) {
      await recordProposalCreated(orgId, billingSub);
    }

    const srcPricing = await getProposalPricingByProposalId(id.trim());
    if (srcPricing) {
      await ensureProposalPricingRow({
        proposal_id: created.id,
        system_kw: srcPricing.system_kw,
        price_per_watt_inr: srcPricing.price_per_watt_inr,
        hardware_inr: srcPricing.hardware_inr,
        installation_inr: srcPricing.installation_inr,
        structure_inr: srcPricing.structure_inr,
        subsidy_inr: srcPricing.subsidy_inr,
        discount_inr: srcPricing.discount_inr,
        final_amount_inr: srcPricing.final_amount_inr,
        manual_final_override: srcPricing.manual_final_override,
        line_items: srcPricing.line_items,
      });
      await persistProposalDeckAfterPricingChange(created.id);
      const freshPricing = await getProposalPricingByProposalId(created.id);
      if (freshPricing) {
        summarizeProposalDeck(mergeProposalPricingIntoPptInput(pptInput, freshPricing));
      }
    }

    const origin = req.headers.get("origin") || `${req.nextUrl.protocol}//${req.nextUrl.host}`;
    const shareUrl = `${origin}/proposal/${created.id}`;

    return NextResponse.json(
      {
        ok: true,
        id: created.id,
        customerName: created.customer_name,
        shareUrl,
        presetId,
        mode,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")
        : error instanceof Error
          ? error.message
          : "duplicate_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
