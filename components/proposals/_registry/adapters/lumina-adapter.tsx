"use client";

/**
 * Adapter — Lumina (clean light app UI) · residential_lumina
 */

import { LuminaRenderer } from "@/components/proposals/lumina/lumina-renderer";
import type { PresetRendererProps } from "@/components/proposals/_registry/types";

export default function LuminaAdapter({ data, proposalId }: PresetRendererProps) {
  return <LuminaRenderer data={data} proposalId={proposalId} />;
}
