"use client";

/**
 * Adapter — Brutalism (concrete gray industrial spec) · residential_brutalism
 */

import { BrutalismRenderer } from "@/components/proposals/brutalism/brutalism-renderer";
import type { PresetRendererProps } from "@/components/proposals/_registry/types";

export default function BrutalismAdapter({ data, proposalId }: PresetRendererProps) {
  return <BrutalismRenderer data={data} proposalId={proposalId} />;
}
