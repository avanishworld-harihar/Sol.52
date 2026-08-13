"use client";

/**
 * Adapter — Emerald Signature (eco-luxury split-folio) · preset id residential_emerald
 */

import { EmeraldRenderer } from "@/components/proposals/emerald/emerald-renderer";
import type { PresetRendererProps } from "@/components/proposals/_registry/types";

export default function EmeraldAdapter({
  data,
  proposalId,
}: PresetRendererProps) {
  return <EmeraldRenderer data={data} proposalId={proposalId} />;
}
