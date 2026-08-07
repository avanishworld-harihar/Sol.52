/**
 * Shared residential export contract.
 *
 * The capture implementation remains lazy-loaded so normal proposal viewing
 * does not ship PDF dependencies.  Every caller must provide its own root,
 * canonical preset id, and page selector; exporting `document.body` is
 * intentionally unsupported.
 */
export {
  buildAtelierProposalPdf,
  buildAtelierProposalPdf as buildResidentialProposalPdf,
  downloadPdfFile,
  isAppleTouchDevice,
  sharePdfFile,
  type AtelierPdfFile as ResidentialPdfFile,
} from "@/components/proposals/atelier/atelier-proposal-pdf";
