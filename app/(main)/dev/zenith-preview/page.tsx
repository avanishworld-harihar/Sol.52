"use client";

/**
 * Local Zenith Luxury preview — /dev/zenith-preview
 */

import { ZenithProposalRenderer } from "@/components/proposals/zenith/zenith-renderer";
import { MOCK_ZENITH_DATA } from "@/components/proposals/zenith/mock-zenith-data";

export default function ZenithPreviewPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#05070d", padding: "2rem 0" }}>
      <ZenithProposalRenderer data={MOCK_ZENITH_DATA} />
    </div>
  );
}
