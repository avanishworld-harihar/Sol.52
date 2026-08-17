"use client";

/**
 * Local Zenith Luxury preview — Midnight Onyx 11-page brochure
 */

import { ZenithProposalRenderer } from "@/components/proposals/zenith/zenith-renderer";
import { ProposalPageFit } from "@/components/proposals/_shared/proposal-page-fit";
import { MOCK_ZENITH_DATA } from "@/components/proposals/zenith/mock-zenith-data";

export default function ZenithPreviewPage() {
  return (
    <div style={{ minHeight: "100dvh", background: "#0a0f1c", margin: 0, padding: 0 }}>
      <ProposalPageFit>
        <ZenithProposalRenderer data={MOCK_ZENITH_DATA} />
      </ProposalPageFit>
    </div>
  );
}
