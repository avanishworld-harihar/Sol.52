import { resolvePhaseSurchargeInr } from "@/lib/connection-phase-pricing";
import type { ProposalShareMetrics } from "@/lib/proposal-share-actions";
import type { ResidentialProposalConfig } from "@/lib/residential-requirements-schema";

/** Build WhatsApp/share metrics from deck summary + optional residential config. */
export function proposalShareMetricsFromConfig(input: {
  customerName: string;
  systemKw: number;
  netCostInr: number;
  annualSavingInr?: number;
  paybackLabel?: string;
  phone?: string;
  residentialConfig?: ResidentialProposalConfig | null;
}): ProposalShareMetrics {
  const phaseSurchargeInr = resolvePhaseSurchargeInr(input.residentialConfig?.pricing);
  return {
    customerName: input.customerName,
    systemKw: input.systemKw,
    netCostInr: input.netCostInr,
    annualSavingInr: input.annualSavingInr ?? 0,
    paybackLabel: input.paybackLabel ?? "—",
    phone: input.phone,
    connectionPhase: input.residentialConfig?.pricing?.connectionPhase,
    phaseSurchargeInr: phaseSurchargeInr > 0 ? phaseSurchargeInr : undefined,
  };
}
