"use client";

import { useEffect, useState } from "react";
import type { PremiumProposalPptInput, ProposalDeckSummary } from "@/lib/proposal-ppt";
import { transformToEditorialModel } from "@/lib/executive-premium-editorial/transform-to-editorial-model";
import {
  PROPOSAL_BRANDING_UPDATED_EVENT,
  readProposalBrandingSettings,
} from "@/lib/proposal-branding-settings";
import { EpProposalShell } from "@/components/proposals/executive-premium-editorial/primitives/ep-proposal-shell";
import { EpCoverPage } from "@/components/proposals/executive-premium-editorial/pages/ep-cover-page";
import { EpBillPage } from "@/components/proposals/executive-premium-editorial/pages/ep-bill-page";
import { EpEconomicsPage } from "@/components/proposals/executive-premium-editorial/pages/ep-economics-page";
import { EpImpactPage } from "@/components/proposals/executive-premium-editorial/pages/ep-impact-page";
import { EpBomPage } from "@/components/proposals/executive-premium-editorial/pages/ep-bom-page";
import { EpExecutionPage } from "@/components/proposals/executive-premium-editorial/pages/ep-execution-page";
import "@/components/proposals/executive-premium-editorial/ep-golden.css";

export type ExecutivePremiumEditorialRendererProps = {
  pptInput: PremiumProposalPptInput;
  summary: ProposalDeckSummary;
};

/**
 * Executive Premium — Golden / Elite Luxury (6-page HNI document).
 */
export function ExecutivePremiumEditorialRenderer({
  pptInput,
  summary,
}: ExecutivePremiumEditorialRendererProps) {
  const model = transformToEditorialModel(pptInput, summary);
  const [coverLogoUrl, setCoverLogoUrl] = useState<string | undefined>(() => {
    return (
      model.brand_logo_url?.trim() ||
      pptInput.installerLogoUrl?.trim() ||
      undefined
    );
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

  return (
    <div className="ep-golden-root w-full">
      <EpProposalShell>
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
          <EpBillPage data={model.bill} />
          <EpEconomicsPage data={model.economics} />
          <EpImpactPage data={model.impact} />
          <EpBomPage bomRows={model.architecture.bom_rows} />
          <EpExecutionPage data={model.execution} />
        </div>
      </EpProposalShell>
    </div>
  );
}
