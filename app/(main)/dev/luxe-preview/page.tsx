"use client";

/**
 * Local Atelier preview — /dev/atelier-preview (also available at /dev/luxe-preview)
 */

import { AtelierRenderer } from "@/components/proposals/atelier/atelier-renderer";
import { ProposalPageFit } from "@/components/proposals/_shared/proposal-page-fit";
import { MOCK_ZENITH_DATA } from "@/components/proposals/zenith/mock-zenith-data";

export default function AtelierPreviewPage() {
  return (
    <div className="min-h-[100dvh] bg-[#E8EDF2]">
      <ProposalPageFit>
        <AtelierRenderer data={MOCK_ZENITH_DATA} />
      </ProposalPageFit>
    </div>
  );
}
