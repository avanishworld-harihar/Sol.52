"use client";

import {
  closingConfidence,
  dealHealthScore,
  dealVelocity,
  hubIntelForStatus,
  proposalEngagementFromRow,
  velocityVisual,
  type ProposalHubRow,
} from "@/lib/proposal-hub-insights";
import { normalizeProposalStatus } from "@/lib/proposal-status";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, Zap } from "lucide-react";

export function ProposalHubIntelPanel({
  row,
  lang,
  title,
  variant = "default",
}: {
  row: ProposalHubRow | null;
  lang: "en" | "hi";
  title: string;
  variant?: "default" | "rail";
}) {
  const reduced = useReducedMotion();
  if (!row) {
    return (
      <motion.div className="proposal-hub-intel rounded-xl border border-dashed p-4 text-center text-xs proposal-hub-text-muted">
        {lang === "hi" ? "सूची से एक डील चुनें" : "Select a deal to see recommendations"}
      </motion.div>
    );
  }

  const st = normalizeProposalStatus(row.proposal_status);
  const intel = hubIntelForStatus(st, lang);
  const health = dealHealthScore(row);
  const confidence = closingConfidence(row);
  const vel = velocityVisual(dealVelocity(row));
  const engagement = proposalEngagementFromRow(row, lang);

  return (
    <motion.aside
      initial={reduced ? false : { opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35 }}
      className={cn(
        "proposal-hub-intel rounded-xl border p-4",
        variant === "rail" && "proposal-hub-intel--rail"
      )}
      aria-label={title}
    >
      <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-sky-800 dark:text-[color:var(--hub-text-accent-strong)]">
        <Sparkles className="h-3.5 w-3.5" aria-hidden />
        {title}
      </div>

      <div
        className={cn(
          "mt-3 rounded-lg border px-3 py-3",
          intel.tone === "action" && "proposal-hub-intel-callout--action",
          intel.tone === "warn" && "proposal-hub-intel-callout--warn",
          intel.tone === "success" && "proposal-hub-intel-callout--success",
          intel.tone === "neutral" && "proposal-hub-intel-callout--neutral"
        )}
      >
        <div className="flex items-start gap-2">
          <Zap className="mt-0.5 h-4 w-4 shrink-0 text-sky-700 dark:text-[color:var(--hub-text-accent-strong)]" aria-hidden />
          <div>
            <p className="text-sm font-extrabold leading-snug text-slate-900 dark:text-[color:var(--hub-text-primary)]">
              {intel.title}
            </p>
            <p className="mt-1.5 text-xs font-medium leading-relaxed text-slate-700 dark:text-[color:var(--hub-text-secondary)]">
              {intel.body}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-[11px] dark:border-white/10 dark:bg-black/15">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-slate-600 dark:text-[color:var(--hub-text-muted)]">
            {lang === "hi" ? "स्वास्थ्य" : "Health"}
          </span>
          <span className="font-black tabular-nums text-slate-900 dark:text-[color:var(--hub-text-primary)]">
            {health}/100
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-slate-600 dark:text-[color:var(--hub-text-muted)]">
            {lang === "hi" ? "विश्वास" : "Close confidence"}
          </span>
          <span className="font-bold tabular-nums text-emerald-700 dark:text-[color:var(--hub-text-accent-strong)]">
            {confidence}%
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-slate-600 dark:text-[color:var(--hub-text-muted)]">
            {lang === "hi" ? "गति" : "Velocity"}
          </span>
          <span className={cn("inline-flex items-center gap-1 font-bold", vel.color)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", vel.dot)} aria-hidden />
            {vel.label}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-slate-200 pt-2 dark:border-white/10">
          <span className="font-semibold text-slate-600 dark:text-[color:var(--hub-text-muted)]">
            {lang === "hi" ? "शेयर" : "Engagement"}
          </span>
          <span className="text-right font-bold leading-snug text-slate-900 dark:text-[color:var(--hub-text-primary)]">
            {engagement.shareLabel}
          </span>
        </div>
      </div>

      {row.annual_saving_inr != null && row.annual_saving_inr > 0 ? (
        <p className="proposal-hub-text-muted mt-3 text-[11px] font-medium">
          {lang === "hi" ? "अनुमानित वार्षिक बचत" : "Est. annual saving"}:{" "}
          <span className="proposal-hub-text-accent font-bold tabular-nums">
            ₹{Math.round(row.annual_saving_inr).toLocaleString("en-IN")}
          </span>
        </p>
      ) : null}
    </motion.aside>
  );
}
