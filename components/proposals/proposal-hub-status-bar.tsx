"use client";

/**
 * Stage actions on the proposals hub workspace — makes Sent / Viewed /
 * Negotiation / Won actionable (not just filters).
 */

import { buildProposalEditHref } from "@/lib/proposal-edit-url";
import { patchProposalStatus } from "@/lib/proposal-share-actions";
import { normalizeProposalStatus, type ProposalStatus } from "@/lib/proposal-status";
import { cn } from "@/lib/utils";
import { Handshake, PencilLine, Trophy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type Lang = "en" | "hi";

const STAGE_BLURB: Record<ProposalStatus, { en: string; hi: string }> = {
  draft: {
    en: "Still editing. Share when ready, then tap Mark as sent.",
    hi: "अभी एडिट हो रहा है। भेजने के बाद Mark as sent दबाएँ।",
  },
  sent: {
    en: "Waiting for the customer. Follow up, or move to Negotiation / Won.",
    hi: "ग्राहक का इंतज़ार। फॉलो-अप करें, या Negotiation / Won पर ले जाएँ।",
  },
  viewed: {
    en: "They opened the link — call now, negotiate price, or mark Won.",
    hi: "उन्होंने लिंक खोला — अभी कॉल करें, बातचीत शुरू करें, या Won करें।",
  },
  negotiation: {
    en: "Price/terms under discussion. Revise the quote, then mark Won when closed.",
    hi: "कीमत/शर्तें चर्चा में। कोट बदलें, डील बंद हो तो Won करें।",
  },
  approved: {
    en: "Deal won — continue in Projects for survey and install.",
    hi: "डील जीत ली — सर्वे और इंस्टॉल के लिए Projects खोलें।",
  },
};

export function ProposalHubStatusBar({
  proposalId,
  leadId,
  status,
  lang = "en",
  onStatusChange,
}: {
  proposalId: string;
  leadId?: string | null;
  status: string;
  lang?: Lang;
  onStatusChange?: (proposalId: string, status: string) => void;
}) {
  const st = normalizeProposalStatus(status);
  const [busy, setBusy] = useState<string | null>(null);
  const reviseHref = buildProposalEditHref({ leadId, proposalId });

  async function setStatus(next: ProposalStatus) {
    if (next === st || busy) return;
    setBusy(next);
    const result = await patchProposalStatus(proposalId, next);
    setBusy(null);
    if (result.ok) {
      onStatusChange?.(proposalId, result.proposalStatus ?? next);
    }
  }

  const blurb = STAGE_BLURB[st][lang];

  return (
    <section
      className="rounded-xl border border-slate-200/90 bg-white/90 p-3 dark:border-white/10 dark:bg-white/[0.04]"
      aria-label={lang === "hi" ? "प्रस्ताव स्टेटस" : "Proposal status"}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
        {lang === "hi" ? "स्टेज एक्शन" : "Stage actions"}
      </p>
      <p className="mt-1.5 text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-300">{blurb}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {(st === "sent" || st === "viewed") && (
          <button
            type="button"
            disabled={!!busy}
            onClick={() => void setStatus("negotiation")}
            className={cn(
              "inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-amber-300/90 bg-amber-50 px-3 text-xs font-bold text-amber-950",
              "hover:bg-amber-100 disabled:opacity-60 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-100"
            )}
          >
            <Handshake className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {busy === "negotiation"
              ? lang === "hi"
                ? "सेव…"
                : "Saving…"
              : lang === "hi"
                ? "Negotiation शुरू"
                : "Start negotiation"}
          </button>
        )}

        {(st === "sent" || st === "viewed" || st === "negotiation") && (
          <button
            type="button"
            disabled={!!busy}
            onClick={() => void setStatus("approved")}
            className={cn(
              "inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-emerald-300/90 bg-emerald-50 px-3 text-xs font-bold text-emerald-950",
              "hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-100"
            )}
          >
            <Trophy className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {busy === "approved"
              ? lang === "hi"
                ? "सेव…"
                : "Saving…"
              : lang === "hi"
                ? "Won मार्क करें"
                : "Mark as Won"}
          </button>
        )}

        {(st === "negotiation" || st === "viewed" || st === "sent") && (
          <Link
            href={reviseHref}
            className={cn(
              "inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800",
              "hover:border-teal-300 hover:text-teal-800 dark:border-white/15 dark:bg-white/5 dark:text-slate-100"
            )}
          >
            <PencilLine className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {st === "negotiation"
              ? lang === "hi"
                ? "कोट बदलें (Negotiate)"
                : "Revise quote"
              : lang === "hi"
                ? "प्रस्ताव एडिट"
                : "Edit quote"}
          </Link>
        )}

        {st === "approved" && (
          <Link
            href="/projects"
            className={cn(
              "inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-indigo-300/90 bg-indigo-50 px-3 text-xs font-bold text-indigo-950",
              "hover:bg-indigo-100 dark:border-indigo-500/40 dark:bg-indigo-950/40 dark:text-indigo-100"
            )}
          >
            {lang === "hi" ? "Projects खोलें" : "Open Projects"}
          </Link>
        )}
      </div>
    </section>
  );
}
