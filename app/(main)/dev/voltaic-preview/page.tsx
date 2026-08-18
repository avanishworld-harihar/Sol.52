"use client";

/** Local Voltaic preview — /dev/voltaic-preview */

import { VoltaicRenderer } from "@/components/proposals/voltaic/voltaic-renderer";
import { ProposalPageFit } from "@/components/proposals/_shared/proposal-page-fit";
import { MOCK_ZENITH_DATA } from "@/components/proposals/zenith/mock-zenith-data";

export default function VoltaicPreviewPage() {
  return (
    <div className="min-h-[100dvh] bg-[#dfe7ee]">
      <ProposalPageFit>
        <VoltaicRenderer data={MOCK_ZENITH_DATA} />
      </ProposalPageFit>
    </div>
  );
}
