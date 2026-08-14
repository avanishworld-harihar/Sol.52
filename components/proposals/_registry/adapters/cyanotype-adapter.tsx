"use client";

/**
 * Adapter — Cyanotype (deep indigo blueprint drafting) · residential_cyanotype
 */

import { CyanotypeRenderer } from "@/components/proposals/cyanotype/cyanotype-renderer";
import type { PresetRendererProps } from "@/components/proposals/_registry/types";

export default function CyanotypeAdapter({ data, proposalId }: PresetRendererProps) {
  return <CyanotypeRenderer data={data} proposalId={proposalId} />;
}
