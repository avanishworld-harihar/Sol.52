"use client";

/**
 * Local Atelier preview — /dev/atelier-preview (also available at /dev/luxe-preview)
 */

import { AtelierRenderer } from "@/components/proposals/atelier/atelier-renderer";
import { MOCK_ZENITH_DATA } from "@/components/proposals/zenith/mock-zenith-data";

export default function AtelierPreviewPage() {
  return (
    <div className="min-h-[100dvh] bg-[#E8EDF2]">
      <AtelierRenderer data={MOCK_ZENITH_DATA} />
    </div>
  );
}
