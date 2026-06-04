"use client";

import { ResidentialEquipmentBrandsSection } from "@/components/residential/residential-equipment-brands-section";
import type { ResidentialProposalConfig } from "@/lib/residential-requirements-schema";

type Props = {
  config: ResidentialProposalConfig;
  onChange: (next: ResidentialProposalConfig) => void;
};

/** Requirement builder — panel / inverter / wire brands (installer presets persist on save). */
export function ResidentialBrandOptions({ config, onChange }: Props) {
  return (
    <section className="space-y-4 rounded-2xl border border-sky-200/80 bg-sky-50/40 p-4 dark:border-sky-900/40 dark:bg-sky-950/15">
      <ResidentialEquipmentBrandsSection config={config} onChange={onChange} />
    </section>
  );
}
