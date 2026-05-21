"use client";

import { ResidentialPricingStudio } from "@/components/residential/residential-pricing-studio";
import { ResidentialRequirementBuilder } from "@/components/residential/residential-requirement-builder";
import { Button } from "@/components/ui/button";
import {
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
      <ResidentialRequirementBuilder
        config={config}
        onChange={patchConfig}
        netCostInr={Math.round(net)}
        annualSavingInr={liveSummary.annualSaving}
      />

      {onOpenReview ? (
        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onOpenReview}>
          Review proposal sections
        </Button>
      ) : null}

      <ResidentialPricingStudio
        config={config}
        onChange={patchConfig}
        proposalId={proposalId}
        proposalLayout={getProposalLayout(pptInput)}
        onSaved={() => {
          onPptInputChange?.({
            ...pptInput,
            residentialConfig: config,
          });
        }}
      />
    </div>
  );
}
