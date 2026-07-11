"use client";

/**
 * Adapter — Premium Luxe preset (UI label: Atelier) for the Proposal OS registry.
 */

import { AtelierRenderer } from "@/components/proposals/atelier/atelier-renderer";
import type { PresetRendererProps } from "@/components/proposals/_registry/types";

export default function PremiumLuxeAdapter({ data }: PresetRendererProps) {
  return <AtelierRenderer data={data} />;
}
