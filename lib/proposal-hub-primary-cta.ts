import { buildProposalEditHref } from "@/lib/proposal-edit-url";
import type { ProposalHubRow } from "@/lib/proposal-hub-insights";
import { normalizeProposalStatus, type ProposalStatus } from "@/lib/proposal-status";

export type ProposalHubPrimaryCta = {
  label: string;
  href: string;
};

const EN: Record<ProposalStatus, Omit<ProposalHubPrimaryCta, "href">> = {
  draft: { label: "Edit proposal" },
  sent: { label: "Follow up" },
  viewed: { label: "Call / follow up" },
  negotiation: { label: "Revise quote" },
  approved: { label: "Open project" },
};

const HI: Record<ProposalStatus, Omit<ProposalHubPrimaryCta, "href">> = {
  draft: { label: "प्रस्ताव संपादित करें" },
  sent: { label: "फॉलो-अप" },
  viewed: { label: "कॉल / फॉलो-अप" },
  negotiation: { label: "कोट बदलें" },
  approved: { label: "प्रोजेक्ट खोलें" },
};

function hrefForStatus(row: ProposalHubRow, st: ProposalStatus): string {
  if (st === "draft" || st === "negotiation") {
    return buildProposalEditHref({ leadId: row.lead_id, proposalId: row.id });
  }
  if (st === "approved") {
    return "/projects";
  }
  return `/workspace/${encodeURIComponent(row.id)}`;
}

/** One clear next step per deal stage — used on cards, list rows, and workspace footer. */
export function resolveProposalHubPrimaryCta(
  row: ProposalHubRow,
  lang: "en" | "hi" = "en"
): ProposalHubPrimaryCta {
  const st = normalizeProposalStatus(row.proposal_status);
  const copy = lang === "hi" ? HI[st] : EN[st];
  return { ...copy, href: hrefForStatus(row, st) };
}
