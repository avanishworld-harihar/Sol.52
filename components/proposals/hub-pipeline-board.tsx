"use client";

/**
 * HubPipelineBoard — Kanban pipeline for /proposals.
 * Cards can move columns via Mark sent / Negotiate / Won (no drag required).
 */

import { useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { DealCard } from "@/components/proposals/deal-card";
import { formatInrCompact, statusVisualLight } from "@/lib/proposal-hub-insights";
import type { ProposalHubRow } from "@/lib/proposal-hub-insights";
import { normalizeProposalStatus, PROPOSAL_STATUS_ORDER, type ProposalStatus } from "@/lib/proposal-status";

const COLUMN_LABELS: Record<ProposalStatus, { title: string; emoji: string }> = {
  draft: { title: "Draft", emoji: "✏️" },
  sent: { title: "Sent", emoji: "📤" },
  viewed: { title: "Viewed", emoji: "👁️" },
  negotiation: { title: "Negotiation", emoji: "🤝" },
  approved: { title: "Won", emoji: "✅" },
};

const EMPTY_HINT: Record<ProposalStatus, { en: string; hi: string }> = {
  draft: {
    en: "New quotes land here.",
    hi: "नए कोट यहाँ आते हैं।",
  },
  sent: {
    en: "On a Draft card, tap Mark sent.",
    hi: "Draft कार्ड पर Mark sent दबाएँ।",
  },
  viewed: {
    en: "Fills when customer opens the link.",
    hi: "ग्राहक लिंक खोले तो यहाँ आएगा।",
  },
  negotiation: {
    en: "On Sent/Viewed, tap Negotiate.",
    hi: "Sent/Viewed पर Negotiate दबाएँ।",
  },
  approved: {
    en: "Tap Won on a card, or mark customer Won.",
    hi: "कार्ड पर Won दबाएँ, या Customer Won करें।",
  },
};

function ColumnHeader({
  status,
  count,
  totalInr,
}: {
  status: ProposalStatus;
  count: number;
  totalInr: number;
}) {
  const vis = statusVisualLight(status);
  const meta = COLUMN_LABELS[status];

  return (
    <div className={cn("flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5", vis.bg, vis.border)}>
      <div className="flex items-center gap-2">
        <span aria-hidden className="text-sm">
          {meta.emoji}
        </span>
        <span className={cn("text-[11px] font-bold uppercase tracking-[0.15em]", vis.text)}>{meta.title}</span>
        <span
          className={cn(
            "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-black tabular-nums",
            vis.bg,
            vis.text
          )}
        >
          {count}
        </span>
      </div>
      {totalInr > 0 && (
        <span className={cn("text-[10px] font-bold tabular-nums", vis.text)}>{formatInrCompact(totalInr)}</span>
      )}
    </div>
  );
}

function EmptyColumn({ status, lang }: { status: ProposalStatus; lang: "en" | "hi" }) {
  const meta = COLUMN_LABELS[status];
  const hint = EMPTY_HINT[status][lang];
  return (
    <div className="flex min-h-[140px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 px-3 py-4 dark:border-white/8">
      <span aria-hidden className="text-2xl opacity-30">
        {meta.emoji}
      </span>
      <p className="mt-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500">No {meta.title.toLowerCase()} deals</p>
      <p className="mt-1.5 max-w-[12rem] text-center text-[10px] leading-snug text-slate-400 dark:text-slate-500">{hint}</p>
    </div>
  );
}

export function HubPipelineBoard({
  rows,
  focusId,
  onSelect,
  onStatusChange,
  lang = "en",
  className,
}: {
  rows: ProposalHubRow[];
  focusId: string | null;
  onSelect: (id: string) => void;
  onStatusChange?: (proposalId: string, status: string) => void;
  lang?: "en" | "hi";
  className?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const grouped = new Map<ProposalStatus, ProposalHubRow[]>();
  for (const st of PROPOSAL_STATUS_ORDER) grouped.set(st, []);
  for (const row of rows) {
    const st = normalizeProposalStatus(row.proposal_status);
    grouped.get(st)?.push(row);
  }

  function columnTotal(status: ProposalStatus): number {
    return (grouped.get(status) ?? []).reduce((sum, r) => {
      const v = r.final_amount_inr;
      return sum + (v != null && Number.isFinite(v) ? v : 0);
    }, 0);
  }

  return (
    <div className={cn("space-y-3", className)}>
      <p className="rounded-xl border border-slate-200/80 bg-slate-50/90 px-3 py-2 text-[11px] font-medium leading-relaxed text-slate-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300">
        {lang === "hi"
          ? "Pipeline = डील का रास्ता। कार्ड पर Mark sent / Negotiate / Won दबाएँ — डील अगले कॉलम में चली जाएगी। Edit proposal सिर्फ कोट बदलने के लिए है।"
          : "Pipeline = deal stages. On each card tap Mark sent → Negotiate → Won to move columns. Edit proposal only changes the quote — it does not move the deal."}
      </p>

      <div
        ref={scrollRef}
        className={cn(
          "flex gap-4 overflow-x-auto overscroll-x-contain pb-4",
          "[-webkit-overflow-scrolling:touch]",
          "snap-x snap-mandatory lg:snap-none"
        )}
        aria-label="Proposal pipeline"
      >
        {(PROPOSAL_STATUS_ORDER as ProposalStatus[]).map((status: ProposalStatus, colIdx: number) => {
          const bucket = grouped.get(status) ?? [];
          const total = columnTotal(status);

          return (
            <motion.div
              key={status}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: colIdx * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "flex w-64 shrink-0 snap-start flex-col gap-3",
                "sm:w-[17.5rem]",
                "lg:min-w-[15rem] lg:flex-1"
              )}
            >
              <ColumnHeader status={status} count={bucket.length} totalInr={total} />

              <div className="flex flex-col gap-3">
                {bucket.length === 0 ? (
                  <EmptyColumn status={status} lang={lang} />
                ) : (
                  bucket.map((row, cardIdx) => (
                    <DealCard
                      key={row.id}
                      row={row}
                      density="pipeline"
                      active={row.id === focusId}
                      lang={lang}
                      onClick={onSelect}
                      onStatusChange={onStatusChange}
                      delay={cardIdx}
                    />
                  ))
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
