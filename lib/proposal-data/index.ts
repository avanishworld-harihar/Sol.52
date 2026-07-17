export type {
  ProposalData,
  ProposalBillMonth,
  ProposalBomItem,
  ProposalEmiRow,
  ProposalWealthPoint,
  ProposalMetric,
  ProposalWarrantyHighlight,
  ProposalWarrantyRow,
  ProposalProcessStep,
  ProposalPaymentRow,
  ProposalBankDetails,
} from "@/lib/proposal-data/types";

export { buildProposalData } from "@/lib/proposal-data/build-proposal-data";
export type { BuildProposalDataOptions } from "@/lib/proposal-data/build-proposal-data";
export { isSparseProposalData } from "@/lib/proposal-data/is-sparse-proposal-data";
export { buildWealthJourney } from "@/lib/proposal-data/build-wealth-journey";
