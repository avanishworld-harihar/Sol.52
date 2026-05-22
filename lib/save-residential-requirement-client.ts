import { applyResidentialFlagsToLayout } from "@/lib/residential-proposal-config";
import { writeResidentialBrandCatalog } from "@/lib/residential-brand-catalog-storage";
import { ensureBrandCatalog } from "@/lib/residential-brand-catalog";
import { syncResidentialSolarToLineItems } from "@/lib/residential-solar-engine";
import type { PricingLineItem } from "@/lib/proposal-pricing-lines";
import type { ProposalTemplateV1 } from "@/lib/proposal-template-schema";
import type { ResidentialProposalConfig } from "@/lib/residential-requirements-schema";

export type SaveResidentialRequirementInput = {
  proposalId: string;
  config: ResidentialProposalConfig;
  proposalLayout?: ProposalTemplateV1 | null;
  /** When provided, BOM line items are synced from solar config and saved to proposal_pricing. */
  lineItems?: PricingLineItem[];
};

export type SaveResidentialRequirementResult = {
  ok: boolean;
  error?: string;
  proposalLayout?: ProposalTemplateV1;
};

/**
 * Persists requirement-based residential config (+ optional BOM pricing lines) for a proposal.
 */
export async function saveResidentialRequirement(
  input: SaveResidentialRequirementInput
): Promise<SaveResidentialRequirementResult> {
  const { proposalId, config, proposalLayout, lineItems } = input;
  const layout = applyResidentialFlagsToLayout(
    proposalLayout ?? { version: 1, blocks: [] },
    config
  );
  const residentialConfig = ensureBrandCatalog(config);
  writeResidentialBrandCatalog(residentialConfig.brandCatalog);

  if (lineItems?.length) {
    const syncedLines = syncResidentialSolarToLineItems(residentialConfig.solar, lineItems);
    const prRes = await fetch(`/api/proposals/${proposalId}/pricing`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        line_items: syncedLines,
        system_kw: residentialConfig.solar.plantCapacityKw,
      }),
    });
    const prJson = (await prRes.json()) as { ok?: boolean; error?: string };
    if (!prRes.ok || !prJson.ok) {
      return { ok: false, error: prJson.error ?? "pricing_save_failed" };
    }
  }

  const cfgRes = await fetch(`/api/proposals/${proposalId}/residential-config`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ residentialConfig, proposalLayout: layout }),
  });
  const cfgJson = (await cfgRes.json()) as {
    ok?: boolean;
    error?: string;
    proposalLayout?: ProposalTemplateV1;
  };
  if (!cfgRes.ok || !cfgJson.ok) {
    return { ok: false, error: cfgJson.error ?? "config_save_failed" };
  }

  return { ok: true, proposalLayout: cfgJson.proposalLayout ?? layout };
}
