/**
 * @deprecated Import from `@/lib/proposal-financial-engine` instead.
 * Re-exports preserved for existing imports.
 */
export {
  COMMERCIAL_TARIFF_INR_PER_KWH,
  COMMERCIAL_SELF_USE_FACTOR,
  COMMERCIAL_GEN_KWH_PER_KW,
  CASHFLOW_ESCALATION_PCT,
  DISCOUNT_RATE_PCT,
  deriveAnnualSavingsFromGeneration,
  computeProposalFinancials,
  computeProposalFinancialsFromDeck,
  reconcileCommercialFinancialMetrics,
  buildEscalatedCashflow25,
  buildCashflowChartRows,
  isSchoolInstitutionOrg,
  validateProposalFinancials,
  type CashflowRow,
  type ProposalFinancialInput,
  type ProposalFinancialMetrics,
  type ReconcileFinancialInput,
  type ReconciledFinancialMetrics,
  type FinancialValidationResult,
} from "@/lib/proposal-financial-engine";
