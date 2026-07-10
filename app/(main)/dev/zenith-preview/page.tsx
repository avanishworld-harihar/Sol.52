"use client";

/**
 * Local Zenith Luxury preview — /dev/zenith-preview
 */

import { ZenithProposalRenderer } from "@/components/proposals/zenith/zenith-renderer";
import { MOCK_ZENITH_DATA } from "@/components/proposals/zenith/mock-zenith-data";

export default function ZenithPreviewPage() {
  return <ZenithProposalRenderer data={MOCK_ZENITH_DATA} />;
}
