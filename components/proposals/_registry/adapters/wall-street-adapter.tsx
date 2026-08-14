"use client";

/**
 * Adapter — Wall Street Ledger (salmon newsprint financial editorial) · residential_wall_street
 */

import { WallStreetRenderer } from "@/components/proposals/wall-street/wall-street-renderer";
import type { PresetRendererProps } from "@/components/proposals/_registry/types";

export default function WallStreetAdapter({ data, proposalId }: PresetRendererProps) {
  return <WallStreetRenderer data={data} proposalId={proposalId} />;
}
