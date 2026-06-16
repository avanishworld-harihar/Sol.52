/**
 * Manual three-phase connection surcharge — no per-kW or auto-calculated defaults.
 */

import type { ResidentialProposalConfig } from "@/lib/residential-requirements-schema";

export type ConnectionPhase = "single_phase" | "three_phase";

/** Detect single vs three phase from bill OCR or customer record text. */
export function detectConnectionPhaseFromText(raw?: string | null): ConnectionPhase | null {
  const s = raw?.trim() ?? "";
  if (!s) return null;
  const u = s.toUpperCase().replace(/[-_]/g, " ");
  if (/\bTHREE\s*PHASE\b|\b3\s*PH(?:ASE)?\b/.test(u)) return "three_phase";
  if (/\bSINGLE\s*PHASE\b|\b1\s*PH(?:ASE)?\b/.test(u)) return "single_phase";
  return null;
}

export function resolvePhaseSurchargeInr(
  pricing?: ResidentialProposalConfig["pricing"] | null
): number {
  const ps = pricing?.phaseSurcharge;
  if (!ps?.enabled) return 0;
  const amt = Number(ps.amountInr);
  return Number.isFinite(amt) && amt > 0 ? Math.round(amt) : 0;
}

export function defaultPhaseSurchargeForConnection(phase: ConnectionPhase): {
  enabled: boolean;
  amountInr: number;
} {
  return phase === "three_phase" ? { enabled: true, amountInr: 0 } : { enabled: false, amountInr: 0 };
}

export const CONNECTION_PHASE_OPTIONS: { id: ConnectionPhase; label: string }[] = [
  { id: "single_phase", label: "Single Phase" },
  { id: "three_phase", label: "Three Phase" },
];

export function connectionPhaseToManualLabel(phase: ConnectionPhase): string {
  return phase === "three_phase" ? "Three phase" : "Single phase";
}

/** Installer explicitly chose phase in requirement form or pricing adjustments. */
export function applyConnectionPhaseSelection(
  config: ResidentialProposalConfig,
  phase: ConnectionPhase
): ResidentialProposalConfig {
  const pricing = config.pricing ?? {};
  const current = pricing.phaseSurcharge;
  const defaults = defaultPhaseSurchargeForConnection(phase);
  const nextPhaseSurcharge = {
    enabled: defaults.enabled,
    amountInr:
      phase === "three_phase" && pricing.connectionPhase === "three_phase"
        ? current?.amountInr ?? 0
        : defaults.amountInr,
  };
  if (pricing.connectionPhase === phase && pricing.phaseSurcharge?.enabled === nextPhaseSurcharge.enabled) {
    return config;
  }
  return {
    ...config,
    pricing: {
      ...pricing,
      connectionPhase: phase,
      phaseSurcharge: nextPhaseSurcharge,
    },
  };
}

/**
 * When bill OCR indicates phase, pre-select connection phase and surcharge toggle.
 * Skips when installer has already chosen a connection phase.
 */
export function mergeConnectionPhaseFromBillText(
  config: ResidentialProposalConfig,
  billPhaseText?: string | null
): ResidentialProposalConfig {
  const detected = detectConnectionPhaseFromText(billPhaseText);
  if (!detected) return config;
  if (config.pricing?.connectionPhase != null) return config;

  const pricing = config.pricing ?? {};
  return {
    ...config,
    pricing: {
      ...pricing,
      connectionPhase: detected,
      phaseSurcharge: {
        ...defaultPhaseSurchargeForConnection(detected),
        amountInr: 0,
      },
    },
  };
}
