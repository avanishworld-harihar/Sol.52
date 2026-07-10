"use client";

/**
 * Local Zenith Luxury preview — /dev/zenith-preview
 * Full-bleed Midnight Onyx (no light chrome).
 */

import { ZenithProposalRenderer } from "@/components/proposals/zenith/zenith-renderer";
import { MOCK_ZENITH_DATA } from "@/components/proposals/zenith/mock-zenith-data";

export default function ZenithPreviewPage() {
  return (
    <div style={{ minHeight: "100dvh", background: "#0a0f1c", margin: 0, padding: 0 }}>
      <ZenithProposalRenderer data={MOCK_ZENITH_DATA} />
    </div>
  );
}
