"use client";

/**
 * Adapter — Quantum (Cinematic Neo-Glass) · preset id residential_quantum
 */

import { QuantumRenderer } from "@/components/QuantumPreset/quantum-renderer";
import type { PresetRendererProps } from "@/components/proposals/_registry/types";

export default function QuantumAdapter({ data, installerLogoUrl }: PresetRendererProps) {
  return <QuantumRenderer data={data} installerLogoUrl={installerLogoUrl} />;
}
