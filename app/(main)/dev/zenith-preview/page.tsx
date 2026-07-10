"use client";

/**
 * Local Zenith Pearl preview — /dev/zenith-preview
 */

import { ZenithProposalRenderer } from "@/components/proposals/zenith/zenith-renderer";
import { MOCK_ZENITH_DATA } from "@/components/proposals/zenith/mock-zenith-data";

export default function ZenithPreviewPage() {
  return (
    <div style={{ minHeight: "100dvh", background: "#e8eaed", padding: "2rem 0" }}>
      <ZenithProposalRenderer data={MOCK_ZENITH_DATA} />
    </div>
  );
}
