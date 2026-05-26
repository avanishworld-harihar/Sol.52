"use client";

import { CommercialProposalConfigWorkspace } from "@/components/commercial/commercial-proposal-config-workspace";
import { Button } from "@/components/ui/button";
import {
  applyCommercialFlagsToLayout,
  defaultCommercialConfig,
  parseCommercialConfig,
  type CommercialProposalConfig,
} from "@/lib/commercial-proposal-config";
import { applyCommercialPanelTrackPolicy } from "@/lib/commercial-panel-track-policy";
import { getCachedResidentialBrandCatalog } from "@/lib/installer-rate-card-client";
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

  const brandCatalog =
    pricingConfig.brandCatalog ?? pptInput.sharedPlantCatalog ?? getCachedResidentialBrandCatalog();

  return (
    <div className="space-y-5">
      {onOpenReview ? (
        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onOpenReview}>
          Review proposal sections
        </Button>
      ) : null}

      <p className="rounded-xl border border-indigo-200/60 bg-indigo-50/50 px-3 py-2.5 text-[11px] leading-snug text-indigo-900/90 dark:border-indigo-500/25 dark:bg-indigo-950/20 dark:text-indigo-200/90">
        <strong>Rate-card pricing</strong> drives plant kW, brands, and net payable. Use{" "}
        <strong>Solar + DG hybrid</strong> below when the site runs diesel backup — customers see a simple
        architecture diagram on the web proposal.
      </p>

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
        brandCatalog={brandCatalog}
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
        onCommercialPersisted={(cfg, layout) => {
          const merged = mergeCommercialConfigWithPricing(cfg, pricingConfig);
          onPptInputChange?.({
            ...pptInput,
            commercialConfig: merged,
            residentialConfig: pricingConfig,
            proposalLayout: layout ?? applyCommercialFlagsToLayout(getProposalLayout(pptInput), merged),
          });
        }}
        onLayoutChange={(layout) => {
          onPptInputChange?.({
            ...pptInput,
            commercialConfig: mergedCommercial,
            residentialConfig: pricingConfig,
            proposalLayout: applyCommercialFlagsToLayout(layout, mergedCommercial),
          });
        }}
      />
    </div>
  );
}
