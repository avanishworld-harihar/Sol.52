"use client";

import { useEffect, useMemo, useState } from "react";
import type { PremiumProposalPptInput, ProposalDeckSummary } from "@/lib/proposal-ppt";
import type { ProposalLang } from "@/lib/proposal-i18n";
import { epGoldenCopy } from "@/lib/executive-premium-editorial/ep-golden-i18n";
import { transformToEditorialModel } from "@/lib/executive-premium-editorial/transform-to-editorial-model";
import {
  PROPOSAL_BRANDING_UPDATED_EVENT,
  readProposalBrandingSettings,
} from "@/lib/proposal-branding-settings";
import { EpGoldenLangProvider } from "@/components/proposals/executive-premium-editorial/ep-golden-lang-context";
import { EpProposalShell } from "@/components/proposals/executive-premium-editorial/primitives/ep-proposal-shell";
import { EpCoverPage } from "@/components/proposals/executive-premium-editorial/pages/ep-cover-page";
import { EpBillPage } from "@/components/proposals/executive-premium-editorial/pages/ep-bill-page";
import { EpRequirementPage } from "@/components/proposals/executive-premium-editorial/pages/ep-requirement-page";
import { EpEconomicsPage } from "@/components/proposals/executive-premium-editorial/pages/ep-economics-page";
import { EpGenerationForecastPage } from "@/components/proposals/executive-premium-editorial/pages/ep-generation-forecast-page";
import { EpImpactPage } from "@/components/proposals/executive-premium-editorial/pages/ep-impact-page";
import { EpBomPage } from "@/components/proposals/executive-premium-editorial/pages/ep-bom-page";
import { EpEngineeringPage } from "@/components/proposals/executive-premium-editorial/pages/ep-engineering-page";
import { EpExecutionPage } from "@/components/proposals/executive-premium-editorial/pages/ep-execution-page";
import { EpTermsPages } from "@/components/proposals/executive-premium-editorial/pages/ep-terms-pages";
import { EpWarrantyPage } from "@/components/proposals/executive-premium-editorial/pages/ep-warranty-page";
import { EpClosingPage } from "@/components/proposals/executive-premium-editorial/pages/ep-closing-page";
import "@/components/proposals/executive-premium-editorial/ep-golden.css";
import { isProposalBillAuditBacked } from "@/lib/proposal-bill-audit-eligibility";

export type ExecutivePremiumEditorialRendererProps = {
  pptInput: PremiumProposalPptInput;
  summary: ProposalDeckSummary;
};

/**
 * Executive Premium — Golden / Elite Luxury (engineering + warranty + terms).
 */
export function ExecutivePremiumEditorialRenderer({
  pptInput,
  summary,
}: ExecutivePremiumEditorialRendererProps) {
  const [lang, setLang] = useState<ProposalLang>(summary.lang ?? "en");
  const copy = epGoldenCopy(lang);
  const model = useMemo(
    () => transformToEditorialModel(pptInput, summary, lang),
    [pptInput, summary, lang]
  );

  const [coverLogoUrl, setCoverLogoUrl] = useState<string | undefined>(() => {
    return model.brand_logo_url?.trim() || pptInput.installerLogoUrl?.trim() || undefined;
  });

  useEffect(() => {
    const sync = () => {
      const fromPpt = pptInput.installerLogoUrl?.trim() ?? "";
      const fromLocal = readProposalBrandingSettings().installerLogoUrl?.trim() ?? "";
      setCoverLogoUrl(model.brand_logo_url?.trim() || fromPpt || fromLocal || undefined);
    };
    sync();
    window.addEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, sync);
    return () => window.removeEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, sync);
  }, [model.brand_logo_url, pptInput.installerLogoUrl]);

  const billAuditBacked = isProposalBillAuditBacked(pptInput);

  return (
    <EpGoldenLangProvider lang={lang}>
      <div className={`ep-golden-root w-full${lang === "hi" ? " lang-hi" : ""}`}>
        <EpProposalShell
          lang={lang}
          onLangToggle={() => setLang((l) => (l === "en" ? "hi" : "en"))}
          langToggleLabel={copy.toolbar.langToggle}
          printLabel={copy.toolbar.printPdf}
          presetLabel={copy.toolbar.preset}
        >
          <div className="ep-gl-doc-canvas">
            <EpCoverPage
              data={{
                brand_display: model.brand_display,
                brand_logo_url: coverLogoUrl,
                customer_name: model.customer_name,
                location_line: model.location_line,
                asset_profile_line: model.asset_profile_line,
              }}
            />
            {billAuditBacked ? (
              <EpBillPage data={model.bill} />
            ) : (
              <EpRequirementPage
                systemKw={summary.systemKw}
                coveragePct={summary.coverage}
                assetProfileLine={model.asset_profile_line}
                annualGenKwh={summary.annualGen}
              />
            )}
            <EpEconomicsPage data={model.economics} />
            <EpGenerationForecastPage data={model.generation} />
            <EpImpactPage data={model.impact} />
            <EpEngineeringPage data={model.engineering} />
            <EpBomPage bomRows={model.architecture.bom_rows} />
            <EpWarrantyPage data={model.warranty} />
            <EpExecutionPage data={model.execution} />
            <EpTermsPages data={model.terms} />
            <EpClosingPage data={model.closing} />
          </div>
        </EpProposalShell>
      </div>
    </EpGoldenLangProvider>
  );
}
