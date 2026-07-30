"use client";

/**
 * Quantum brand + array sizing helpers.
 * Avoids "Solar Partner" placeholders; panel count uses ceil (not round).
 */

import { useEffect, useState } from "react";
import type { ProposalData } from "@/lib/proposal-data";
import {
  PROPOSAL_BRANDING_UPDATED_EVENT,
  readProposalBrandingSettings,
  resolveInstallerDisplayName,
} from "@/lib/proposal-branding-settings";

export const QUANTUM_PANEL_WATT = 580;
export const QUANTUM_SPECIFIC_YIELD = 1450;
export const QUANTUM_DEFAULT_BRAND = "Harihar Solar";
export const QUANTUM_PRODUCT_MARK = "Sol.52";

const PLACEHOLDER =
  /^(solar\s*partner|सोलर\s*पार्टनर|vendor|installer|your\s*solar\s*partner|—|-|n\/a|na)$/i;

function cleanBrand(value: string | undefined | null): string {
  const v = (value ?? "").trim();
  if (!v || PLACEHOLDER.test(v)) return "";
  return v;
}

/** Brand for footers / cover — More settings → proposal → Harihar Solar. */
export function resolveQuantumBrand(data: ProposalData): string {
  if (typeof window !== "undefined") {
    try {
      const settings = readProposalBrandingSettings();
      const fromMore =
        cleanBrand(resolveInstallerDisplayName(settings)) ||
        cleanBrand(settings.companyProfile?.legalName);
      if (fromMore) return fromMore;
    } catch {
      /* ignore */
    }
  }

  for (const raw of [
    data.closing?.installerName,
    data.meta?.brandName,
    data.execution?.bank?.company,
  ]) {
    const v = cleanBrand(raw);
    if (v) return v;
  }
  return QUANTUM_DEFAULT_BRAND;
}

export function useQuantumBrand(data: ProposalData): string {
  const [name, setName] = useState(() => resolveQuantumBrand(data));

  useEffect(() => {
    const sync = () => setName(resolveQuantumBrand(data));
    sync();
    window.addEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [data]);

  return name;
}

/** Modules sized for AC kW — ceil so 3 kW → 6 × 580W (3.48 kWp, ~1.16 DC/AC). */
export function quantumModuleCount(systemKw: number): number {
  if (!(systemKw > 0)) return 0;
  return Math.max(1, Math.ceil((systemKw * 1000) / QUANTUM_PANEL_WATT));
}

export function quantumDcKwp(moduleCount: number): number {
  return moduleCount > 0 ? (moduleCount * QUANTUM_PANEL_WATT) / 1000 : 0;
}

export function quantumDcAcRatio(dcKwp: number, systemKw: number): number {
  return systemKw > 0 && dcKwp > 0 ? dcKwp / systemKw : 0;
}
