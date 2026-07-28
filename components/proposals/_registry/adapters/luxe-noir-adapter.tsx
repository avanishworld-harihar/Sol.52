"use client";

/**
 * Adapter — Premium Luxe (noir cinematic) · preset id residential_luxe_noir
 */

import { LuxeNoirRenderer } from "@/components/proposals/luxe-noir/luxe-noir-renderer";
import type { PresetRendererProps } from "@/components/proposals/_registry/types";

export default function LuxeNoirAdapter({ data }: PresetRendererProps) {
  return <LuxeNoirRenderer data={data} />;
}
