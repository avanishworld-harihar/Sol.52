"use client";

/**
 * Local Premium Luxe (noir) preview — /dev/premium-luxe-preview
 */

import { LuxeNoirRenderer } from "@/components/proposals/luxe-noir/luxe-noir-renderer";
import { MOCK_ZENITH_DATA } from "@/components/proposals/zenith/mock-zenith-data";

export default function PremiumLuxeNoirPreviewPage() {
  return (
    <div className="min-h-[100dvh] bg-[#0a0a0a]">
      <LuxeNoirRenderer data={MOCK_ZENITH_DATA} />
    </div>
  );
}
