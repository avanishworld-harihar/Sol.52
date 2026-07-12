"use client";

import { CommercialProposalConfigWorkspace } from "@/components/commercial/commercial-proposal-config-workspace";
import {
  applyCommercialFlagsToLayout,
  applyLayoutFlagsToCommercialConfig,
  defaultCommercialConfig,
  parseCommercialConfig,
  type CommercialProposalConfig,
} from "@/lib/commercial-proposal-config";
import { applyCommercialPanelTrackPolicy } from "@/lib/commercial-panel-track-policy";
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
  defaultResidentialConfigForBuilder,
  parseResidentialConfig,
  type ResidentialProposalConfig,
} from "@/lib/residential-proposal-config";
import { syncResidentialSolarToLineItems } from "@/lib/residential-solar-engine";
import { mergeCommercialConfigWithPricing } from "@/lib/save-commercial-requirement-client";
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

export function CommercialBomWorkspace({
  proposalId,
  initialPricing,
  pptInput,
  onPricingSaved,
  onPptInputChange,
  onOpenReview,
}: Props) {
  const [pricing, setPricing] = useState(initialPricing);
  const [lines, setLines] = useState<PricingLineItem[]>(() => hydrateLineItems(initialPricing));
  const [commercialConfig, setCommercialConfig] = useState<CommercialProposalConfig>(() => {
    return parseCommercialConfig(pptInput.commercialConfig) ?? defaultCommercialConfig(initialPricing.system_kw);
  });
  const [pricingConfig, setPricingConfig] = useState<ResidentialProposalConfig>(() => {
    const base =
      parseResidentialConfig(pptInput.residentialConfig) ??
      defaultResidentialConfigForBuilder(initialPricing.system_kw, "bill");
    return applyCommercialPanelTrackPolicy(base, pptInput.connectionType ?? base.connectionType);
  });

  useEffect(() => {
    setPricing(initialPricing);
    setLines(hydrateLineItems(initialPricing));
  }, [initialPricing]);

  const preview = useMemo(() => {
    const syncedLines = syncResidentialSolarToLineItems(pricingConfig.solar, lines);
    return proposalPricingRowFromLineItems(pricing, syncedLines, {
      system_kw: pricingConfig.solar.plantCapacityKw,
    });
  }, [pricing, lines, pricingConfig.solar]);

  const mergedCommercial = useMemo(
    () => mergeCommercialConfigWithPricing(commercialConfig, pricingConfig),
    [commercialConfig, pricingConfig]
  );

  const liveSummary = useMemo(() => {
    const merged = mergeProposalPricingIntoPptInput(
      { ...pptInput, commercialConfig: mergedCommercial, residentialConfig: pricingConfig },
      preview
    );
    return summarizeProposalDeck(merged);
  }, [pptInput, mergedCommercial, pricingConfig, preview]);

  const patchPricingConfig = useCallback((next: ResidentialProposalConfig) => {
    const tracked = applyCommercialPanelTrackPolicy(next, next.connectionType ?? pptInput.connectionType);
    setPricingConfig(tracked);
    setLines((prev) => syncResidentialSolarToLineItems(tracked.solar, prev));
    setPricing((p) => ({ ...p, system_kw: tracked.solar.plantCapacityKw }));
  }, [pptInput.connectionType]);

  const net = preview.final_amount_inr;

  return (
    <div className="space-y-5">
      <CommercialProposalConfigWorkspace
        pricingConfig={pricingConfig}
        commercialConfig={commercialConfig}
        onPricingConfigChange={patchPricingConfig}
        onCommercialConfigChange={setCommercialConfig}
        summary={liveSummary}
        netCostInr={Math.round(net)}
        annualSavingInr={liveSummary.annualSaving}
        proposalId={proposalId}
        proposalLayout={getProposalLayout(pptInput)}
        lineItems={lines}
        onOpenReview={onOpenReview}
        onSaved={() => {
          const syncedLines = syncResidentialSolarToLineItems(pricingConfig.solar, lines);
          const row = proposalPricingRowFromLineItems(pricing, syncedLines, {
            system_kw: pricingConfig.solar.plantCapacityKw,
          });
          const merged = mergeCommercialConfigWithPricing(commercialConfig, pricingConfig);
          const layout = applyCommercialFlagsToLayout(getProposalLayout(pptInput), merged);
          setPricing(row);
          setLines(hydrateLineItems(row));
          onPricingSaved?.(row);
          onPptInputChange?.({
            ...pptInput,
            commercialConfig: merged,
            residentialConfig: pricingConfig,
            proposalLayout: layout,
            systemKw: pricingConfig.solar.plantCapacityKw,
          });
        }}
        onLayoutChange={(layout) => {
          const nextConfig = applyLayoutFlagsToCommercialConfig(mergedCommercial, layout);
          onPptInputChange?.({
            ...pptInput,
            commercialConfig: nextConfig,
            residentialConfig: {
              ...pricingConfig,
              financing: {
                ...pricingConfig.financing,
                enabled: nextConfig.financing?.enabled === true,
                interestRatePct:
                  nextConfig.financing?.interestRatePct ??
                  pricingConfig.financing?.interestRatePct ??
                  10.5,
                selectedTenureYears:
                  nextConfig.financing?.selectedTenureYears ??
                  pricingConfig.financing?.selectedTenureYears ??
                  5,
                tenuresYears: pricingConfig.financing?.tenuresYears ?? [3, 5, 7, 10],
              },
            },
            proposalLayout: applyCommercialFlagsToLayout(layout, nextConfig),
          });
        }}
      />
    </div>
  );
}
