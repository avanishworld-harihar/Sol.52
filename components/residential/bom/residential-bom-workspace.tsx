"use client";

import { ResidentialProposalConfigWorkspace } from "@/components/residential/residential-proposal-config-workspace";
import { Button } from "@/components/ui/button";
import {
  applyResidentialFlagsToLayout,
  defaultResidentialConfig,
  parseResidentialConfig,
  type ResidentialProposalConfig,
} from "@/lib/residential-proposal-config";
import { mergeProposalPricingIntoPptInput } from "@/lib/proposal-pricing-merge";
import {
  hydrateLineItems,
  proposalPricingRowFromLineItems,
  type PricingLineItem,
} from "@/lib/proposal-pricing-lines";
import type { ProposalPricingRow } from "@/lib/proposal-pricing-schema";
import type { ProposalPricingConfiguratorLabels } from "@/components/proposals/proposal-pricing-configurator";
import { getProposalLayout } from "@/lib/proposal-layout-merge";
import type { PremiumProposalPptInput } from "@/lib/proposal-ppt";
import { isPmSuryaGharSubsidyEligible } from "@/lib/lead-connection-types";
import { summarizeProposalDeck } from "@/lib/proposal-ppt";
import {
  ensureResidentialSolarInConfig,
  syncResidentialSolarToLineItems,
} from "@/lib/residential-solar-engine";
import { useCallback, useEffect, useMemo, useState } from "react";

type Props = {
  proposalId: string;
  initialPricing: ProposalPricingRow;
  pptInput: PremiumProposalPptInput;
  labels: ProposalPricingConfiguratorLabels;
  onPricingSaved?: (row: ProposalPricingRow) => void;
  onPptInputChange?: (ppt: PremiumProposalPptInput) => void;
  onOpenReview?: () => void;
};

export function ResidentialBomWorkspace({
  proposalId,
  initialPricing,
  pptInput,
  onPricingSaved,
  onPptInputChange,
  onOpenReview,
}: Props) {
  const [pricing, setPricing] = useState(initialPricing);
  const [lines, setLines] = useState<PricingLineItem[]>(() => hydrateLineItems(initialPricing));
  const [config, setConfig] = useState<ResidentialProposalConfig>(() => {
    const base =
      parseResidentialConfig(pptInput.residentialConfig) ??
      defaultResidentialConfig(initialPricing.system_kw);
    return ensureResidentialSolarInConfig(base, initialPricing.system_kw);
  });
  useEffect(() => {
    setPricing(initialPricing);
    setLines(hydrateLineItems(initialPricing));
  }, [initialPricing]);

  const solar = config.solar;

  const preview = useMemo(() => {
    const syncedLines = syncResidentialSolarToLineItems(solar, lines);
    return proposalPricingRowFromLineItems(pricing, syncedLines, {
      system_kw: solar.plantCapacityKw,
    });
  }, [pricing, lines, solar]);

  const liveSummary = useMemo(() => {
    const merged = mergeProposalPricingIntoPptInput(
      { ...pptInput, residentialConfig: config },
      preview
    );
    return summarizeProposalDeck(merged);
  }, [pptInput, config, preview]);

  const patchConfig = useCallback((next: ResidentialProposalConfig) => {
    setConfig(next);
    setLines((prev) => syncResidentialSolarToLineItems(next.solar, prev));
    setPricing((p) => ({ ...p, system_kw: next.solar.plantCapacityKw }));
  }, []);

  const net = preview.final_amount_inr;

  return (
    <div className="space-y-5">
      {onOpenReview ? (
        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onOpenReview}>
          Review proposal sections
        </Button>
      ) : null}

      <ResidentialProposalConfigWorkspace
        config={config}
        onChange={patchConfig}
        subsidyEligible={isPmSuryaGharSubsidyEligible(
          config.connectionType ?? pptInput.connectionType
        )}
        netCostInr={Math.round(net)}
        annualSavingInr={liveSummary.annualSaving}
        proposalId={proposalId}
        proposalLayout={getProposalLayout(pptInput)}
        lineItems={lines}
        onPricingSaved={() => {
          const syncedLines = syncResidentialSolarToLineItems(config.solar, lines);
          const row = proposalPricingRowFromLineItems(pricing, syncedLines, {
            system_kw: config.solar.plantCapacityKw,
          });
          setPricing(row);
          setLines(hydrateLineItems(row));
          onPricingSaved?.(row);
          onPptInputChange?.({
            ...pptInput,
            residentialConfig: config,
            proposalLayout: applyResidentialFlagsToLayout(getProposalLayout(pptInput), config),
            systemKw: config.solar.plantCapacityKw,
          });
        }}
        onLayoutChange={(layout) => {
          onPptInputChange?.({
            ...pptInput,
            residentialConfig: config,
            proposalLayout: applyResidentialFlagsToLayout(layout, config),
            systemKw: config.solar.plantCapacityKw,
          });
        }}
        onCreateProposal={async () => proposalId}
      />
    </div>
  );
}
