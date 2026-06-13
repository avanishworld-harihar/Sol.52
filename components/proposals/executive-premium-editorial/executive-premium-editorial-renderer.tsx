"use client";

import type { PremiumProposalPptInput, ProposalDeckSummary } from "@/lib/proposal-ppt";
import { transformToEditorialModel } from "@/lib/executive-premium-editorial/transform-to-editorial-model";
import { EpProposalShell } from "@/components/proposals/executive-premium-editorial/primitives/ep-proposal-shell";
import { EpCoverPage } from "@/components/proposals/executive-premium-editorial/pages/ep-cover-page";
import { EpBillPage } from "@/components/proposals/executive-premium-editorial/pages/ep-bill-page";
import { EpEconomicsPage } from "@/components/proposals/executive-premium-editorial/pages/ep-economics-page";
import { EpImpactPage } from "@/components/proposals/executive-premium-editorial/pages/ep-impact-page";
import { EpBomPage } from "@/components/proposals/executive-premium-editorial/pages/ep-bom-page";
import { EpExecutionPage } from "@/components/proposals/executive-premium-editorial/pages/ep-execution-page";
import "@/components/proposals/executive-premium-editorial/ep-editorial.css";

export type ExecutivePremiumEditorialRendererProps = {
  pptInput: PremiumProposalPptInput;
  summary: ProposalDeckSummary;
};

/**
 * Executive Premium — Editorial Split-Page (6-page HNI document).
 * Replaces legacy NextGen block-style renderer.
 */
export function ExecutivePremiumEditorialRenderer({
  pptInput,
  summary,
}: ExecutivePremiumEditorialRendererProps) {
  const model = transformToEditorialModel(pptInput, summary);

  return (
    <div className="ep-editorial-root w-full">
      <EpProposalShell>
        <div className="ep-ed-doc-canvas">
          <EpCoverPage
            data={{
              brand_primary: model.brand_primary,
              brand_secondary: model.brand_secondary,
              customer_name: model.customer_name,
              location_line: model.location_line,
              system_size_line: model.system_size_line,
              cover_tagline: model.cover_tagline,
            }}
          />
          <EpBillPage data={model.bill} />
          <EpEconomicsPage data={model.economics} />
          <EpImpactPage data={model.impact} />
          <EpBomPage flowNodes={model.architecture.flow_nodes} bomRows={model.architecture.bom_rows} />
          <EpExecutionPage data={model.execution} />
        </div>
      </EpProposalShell>
    </div>
  );
}
