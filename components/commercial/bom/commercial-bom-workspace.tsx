"use client";

import { CommercialControlCenter } from "@/components/commercial/bom/commercial-control-center";
import { CommercialDcrPreview } from "@/components/commercial/bom/commercial-dcr-preview";
import { CommercialHardwareBom } from "@/components/commercial/bom/commercial-hardware-bom";
import { CommercialPricingTemplatesPanel } from "@/components/commercial/bom/commercial-pricing-templates-panel";
import { CommercialSolarPanelSection } from "@/components/commercial/bom/commercial-solar-panel-section";
import { useToast } from "@/components/ui/toast-center";
import {
  defaultCommercialConfig,
  parseCommercialConfig,
  type CommercialProposalConfig,
} from "@/lib/commercial-proposal-config";
import {
  ensureSolarPanelsInConfig,
  solarPanelsFromLineItems,
  syncLegacyPanelFieldsFromSolar,
  syncSolarPanelsToLineItems,
} from "@/lib/commercial-solar-engine";
import { defaultSolarPanels } from "@/lib/commercial-solar-schema";
import { mergeProposalPricingIntoPptInput } from "@/lib/proposal-pricing-merge";
import {
  hydrateLineItems,
  proposalPricingRowFromLineItems,
  type PricingLineItem,
} from "@/lib/proposal-pricing-lines";
import type { ProposalPricingRow } from "@/lib/proposal-pricing-schema";
import type { ProposalPricingConfiguratorLabels } from "@/components/proposals/proposal-pricing-configurator";
import type { PremiumProposalPptInput } from "@/lib/proposal-ppt";
import { summarizeProposalDeck } from "@/lib/proposal-ppt";
import { getCachedResidentialBrandCatalog } from "@/lib/installer-rate-card-client";
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
  labels,
  onPptInputChange,
  onOpenReview,
}: Props) {
  const toast = useToast();
  const [pricing, setPricing] = useState(initialPricing);
  const [lines, setLines] = useState<PricingLineItem[]>(() => hydrateLineItems(initialPricing));
  const [config, setConfig] = useState<CommercialProposalConfig>(() => {
    const base = parseCommercialConfig(pptInput.commercialConfig) ?? defaultCommercialConfig(initialPricing.system_kw);
    return ensureSolarPanelsInConfig(base, initialPricing.system_kw);
  });
  const [manualFinal, setManualFinal] = useState(initialPricing.manual_final_override);
  const [manualFinalAmt, setManualFinalAmt] = useState(initialPricing.final_amount_inr);

  useEffect(() => {
    setPricing(initialPricing);
    setLines(hydrateLineItems(initialPricing));
    setManualFinal(initialPricing.manual_final_override);
    setManualFinalAmt(initialPricing.final_amount_inr);
  }, [initialPricing]);

  const solar = useMemo(() => {
    if (config.solarPanels) return config.solarPanels;
    return defaultSolarPanels(pricing.system_kw);
  }, [config.solarPanels, pricing.system_kw]);

  const preview = useMemo(() => {
    const syncedLines = syncSolarPanelsToLineItems(solar, lines);
    return proposalPricingRowFromLineItems(
      { ...pricing, manual_final_override: manualFinal, final_amount_inr: manualFinalAmt },
      syncedLines,
      {
        system_kw: solar.plantCapacityKw,
        manual_final_override: manualFinal,
        final_amount_inr: manualFinal ? manualFinalAmt : undefined,
      }
    );
  }, [pricing, lines, solar, manualFinal, manualFinalAmt]);

  const liveSummary = useMemo(() => {
    const merged = mergeProposalPricingIntoPptInput(
      { ...pptInput, commercialConfig: syncLegacyPanelFieldsFromSolar({ ...config, solarPanels: solar }) },
      preview
    );
    return summarizeProposalDeck(merged);
  }, [pptInput, config, solar, preview]);

  const patchSolar = useCallback(
    (nextSolar: typeof solar) => {
      const kw = nextSolar.plantCapacityKw;
      setConfig((c) => ({ ...c, solarPanels: nextSolar }));
      setLines((prev) => syncSolarPanelsToLineItems(nextSolar, prev));
      setPricing((p) => ({ ...p, system_kw: kw }));
    },
    []
  );

  function applyTemplate(tpl: import("@/lib/commercial-pricing-templates").CommercialPricingTemplate) {
    setLines(tpl.lineItems);
    const cfg = ensureSolarPanelsInConfig(tpl.commercialConfig, tpl.systemKw);
    setConfig(cfg);
    const sp =
      cfg.solarPanels ?? solarPanelsFromLineItems(tpl.lineItems, tpl.systemKw) ?? defaultSolarPanels(tpl.systemKw);
    patchSolar(sp);
    toast.push({ tone: "success", title: "Template applied", description: tpl.name });
  }

  const brandCatalog =
    pptInput.residentialConfig?.brandCatalog ??
    pptInput.sharedPlantCatalog ??
    getCachedResidentialBrandCatalog();

  return (
    <div className="space-y-6">
      <p className="rounded-xl border border-slate-200/90 bg-slate-50/80 px-3 py-2.5 text-[11px] leading-snug text-slate-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400">
        <strong className="text-slate-900 dark:text-white">Quote price</strong> comes from More → Rate card
        (₹/Wp). This section is an <strong>optional engineering BOM breakdown</strong> — not required for a
        simple customer offer.
      </p>

      <CommercialPricingTemplatesPanel
        presetId="commercial_executive"
        systemKw={solar.plantCapacityKw}
        lineItems={syncSolarPanelsToLineItems(solar, lines)}
        commercialConfig={config}
        onApply={applyTemplate}
      />

      <CommercialSolarPanelSection solar={solar} onChange={patchSolar} />

      {config.dcrComparison?.enabled !== false ? <CommercialDcrPreview solar={solar} /> : null}

      <CommercialControlCenter
        config={config}
        summary={liveSummary}
        onChange={setConfig}
        onOpenReview={onOpenReview}
        brandCatalog={brandCatalog}
      />

      <CommercialHardwareBom
        lines={lines}
        onChange={setLines}
        labels={{
          title: "Hardware & services BOM",
          subtitle: "Inverter, structure, installation — drag to reorder · actions on the left rail",
          addLine: labels.addLine,
          removeLine: labels.removeLine,
        }}
      />
    </div>
  );
}
