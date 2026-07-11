"use client";

/**
 * Local Premium Luxe preview — /dev/luxe-preview
 */

import { PremiumLuxeRenderer } from "@/components/proposals/premium-luxe/premium-luxe-renderer";
import { MOCK_ZENITH_DATA } from "@/components/proposals/zenith/mock-zenith-data";

export default function LuxePreviewPage() {
  return (
    <div className="min-h-[100dvh] bg-[#EDE6D9]">
      <PremiumLuxeRenderer data={MOCK_ZENITH_DATA} />
    </div>
  );
}
