import type { ProposalDuplicateModalLabels } from "@/components/proposals/proposal-duplicate-modal";
import type { QuickQuoteLauncherLabels } from "@/components/proposals/quick-quote-launcher";

type TFn = (key: string) => string;

export function quickQuoteLabelsFromT(t: TFn): QuickQuoteLauncherLabels {
  return {
    title: t("quickQuote_title"),
    subtitle: t("quickQuote_subtitle"),
    netLabel: t("quickQuote_netLabel"),
    creating: t("quickQuote_creating"),
    createdTitle: t("quickQuote_createdTitle"),
    createdSubtitle: t("quickQuote_createdSubtitle"),
    editSend: t("quickQuote_editSend"),
    copyLink: t("quickQuote_copyLink"),
    whatsapp: t("quickQuote_whatsapp"),
    billQuote: t("quickQuote_billQuote"),
    customize: t("quickQuote_customize"),
    equipmentHint: t("quickQuote_equipmentHint"),
    limitError: t("quickQuote_limitError"),
    createError: t("quickQuote_createError"),
  };
}

export function duplicateModalLabelsFromT(t: TFn): ProposalDuplicateModalLabels {
  return {
    title: t("proposals_duplicateModalTitle"),
    subtitle: t("proposals_duplicateModalSubtitle"),
    templateTitle: t("proposals_duplicateTemplateTitle"),
    templateDesc: t("proposals_duplicateTemplateDesc"),
    revisionTitle: t("proposals_duplicateRevisionTitle"),
    revisionDesc: t("proposals_duplicateRevisionDesc"),
    cancel: t("proposals_duplicateCancel"),
    confirm: t("proposals_duplicateConfirm"),
    confirming: t("proposals_duplicateConfirming"),
  };
}

export function duplicateSheetExtrasFromT(t: TFn) {
  return {
    duplicateDone: t("proposals_duplicateDone"),
    duplicateDoneTemplate: t("proposals_duplicateDoneTemplate"),
    duplicateDoneRevision: t("proposals_duplicateDoneRevision"),
    duplicateFailed: t("proposals_duplicateFailed"),
    duplicateModal: duplicateModalLabelsFromT(t),
  };
}
