"use client";

import Link from "next/link";
import { customerInitials, dealHealthScore, dealUrgency, dealUrgencyVisual, dealVelocity, formatInrCompact, healthScoreTone, statusVisual, velocityVisual, type ProposalHubRow } from "@/lib/proposal-hub-insights";
import { resolveProposalHubPrimaryCta } from "@/lib/proposal-hub-primary-cta";
import { normalizeProposalStatus, PROPOSAL_STATUS_ORDER, type ProposalStatus } from "@/lib/proposal-status";
import { DealHeatPill } from "@/components/proposals/proposal-hub-engagement-metrics";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";

export type ProposalHubDealRow = ProposalHubRow;

function formatShortDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  } catch {
    return "—";
  }
}

function groupRows(rows: ProposalHubDealRow[]): Map<ProposalStatus, ProposalHubDealRow[]> {
  const map = new Map<ProposalStatus, ProposalHubDealRow[]>();
  for (const s of PROPOSAL_STATUS_ORDER) map.set(s, []);
  for (const row of rows) {
    const st = normalizeProposalStatus(row.proposal_status);
    map.get(st)?.push(row);
  }
  return map;
}

function HealthMini({ score }: { score: number }) {
  const tone = healthScoreTone(score);
  return (
    <div className="flex shrink-0 flex-col items-center gap-0.5" title={`Health ${score}`}>
      <span className={cn("text-[11px] font-black tabular-nums", tone.text)}>{score}</span>
      <div className="h-1 w-10 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
        <div
          className={cn("h-full rounded-full bg-gradient-to-r", tone.bar)}
          style={{ width: `${Math.min(100, score)}%` }}
        />
      </div>
    </div>
  );
}

export function ProposalHubDealList({
  rows,
  focusId,
  onSelect,
  statusLabel,
  groupCountLabel,
  pipelineLabel,
  className,
  showVersionTag = false,
  lang = "en",
}: {
  rows: ProposalHubDealRow[];
  focusId: string | null;
  onSelect: (id: string) => void;
  statusLabel: (s: ProposalStatus) => string;
  groupCountLabel: (n: number) => string;
  pipelineLabel: string;
  className?: string;
  showVersionTag?: boolean;
  lang?: "en" | "hi";
}) {
  const grouped = groupRows(rows);
  const reduced = useReducedMotion();

  return (
    <div className={cn("proposal-hub-list flex min-h-0 flex-1 flex-col overflow-hidden", className)}>
      <div className="proposal-hub-list-head shrink-0 pb-2">
        <p className="proposal-hub-text-muted text-[10px] font-bold uppercase tracking-[0.18em]">{pipelineLabel}</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-2 [-webkit-overflow-scrolling:touch]">
        {PROPOSAL_STATUS_ORDER.map((st) => {
          const bucket = grouped.get(st) ?? [];
          if (bucket.length === 0) return null;
          const vis = statusVisual(st);
          return (
            <div key={st} className="proposal-hub-list-group">
              <div className="proposal-hub-list-group-head sticky top-0 z-[2] flex items-center justify-between gap-2 py-2">
                <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1", vis.pillClass)}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", vis.dotClass)} aria-hidden />
                  {statusLabel(st)}
                </span>
                <span className="proposal-hub-text-muted text-[10px] tabular-nums">{groupCountLabel(bucket.length)}</span>
              </div>
              <ul className="space-y-2" role="list">
                {bucket.map((row, i) => {
                  const active = row.id === focusId;
                  const health = dealHealthScore(row);
                  const urgency = dealUrgencyVisual(dealUrgency(row));
                  const vel = velocityVisual(dealVelocity(row));
                  const initials = customerInitials(row.customer_name);
                  const primaryCta = resolveProposalHubPrimaryCta(row, lang);
                  return (
                    <li key={row.id}>
                      <motion.button
                        type="button"
                        onClick={() => onSelect(row.id)}
                        aria-current={active ? "true" : undefined}
                        initial={reduced ? false : { opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25, delay: i * 0.03 }}
                        className={cn(
                          "proposal-hub-deal-row proposal-hub-deal-row--v2 flex w-full flex-col gap-2 rounded-xl border px-3 py-2.5 text-left transition-shadow touch-manipulation",
                          active && "proposal-hub-deal-row--active"
                        )}
                      >
                        <div className="flex items-start gap-2.5">
                          <span
                            className="proposal-hub-avatar flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[13px] font-bold shadow-inner"
                            aria-hidden
                          >
                            {initials}
                          </span>
                          <div className="min-w-0 flex-1">
                            {/* Name alone on its row so pills don't steal width / force early ellipsis */}
                            <p
                              className="proposal-hub-text-primary line-clamp-2 text-[15px] font-extrabold leading-snug tracking-tight sm:text-base"
                              title={row.customer_name}
                            >
                              {row.customer_name}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                              <DealHeatPill row={row} lang={lang} />
                              <p className="proposal-hub-text-muted flex min-w-0 flex-wrap items-center gap-x-1.5 text-[11px] font-semibold sm:text-xs">
                                <span>{row.system_kw} kW</span>
                                {row.location?.trim() ? (
                                  <>
                                    <span className="opacity-50">·</span>
                                    <span className="max-w-[10rem] truncate" title={row.location}>
                                      {row.location.trim()}
                                    </span>
                                  </>
                                ) : null}
                                <span className="opacity-50">·</span>
                                <span className="proposal-hub-text-primary tabular-nums">
                                  {formatInrCompact(row.final_amount_inr)}
                                </span>
                                <span className="opacity-50">·</span>
                                <span>{formatShortDate(row.generated_at)}</span>
                                {showVersionTag ? (
                                  <>
                                    <span className="opacity-50">·</span>
                                    <span className="font-mono text-[10px] opacity-70">
                                      {row.id.slice(0, 8)}
                                    </span>
                                  </>
                                ) : null}
                              </p>
                            </div>
                          </div>
                          <HealthMini score={health} />
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-1.5 pl-[3.25rem]">
                          <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide", urgency.className)}>
                            {urgency.label}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold", vel.color)}>
                              <span className={cn("h-1.5 w-1.5 rounded-full", vel.dot)} aria-hidden />
                              {vel.label}
                            </span>
                            <Link
                              href={primaryCta.href}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex shrink-0 items-center rounded-lg bg-teal-600 px-2.5 py-1 text-[10px] font-extrabold text-white shadow-sm hover:bg-teal-700 dark:bg-teal-500"
                            >
                              {primaryCta.label}
                            </Link>
                          </div>
                        </div>
                      </motion.button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
