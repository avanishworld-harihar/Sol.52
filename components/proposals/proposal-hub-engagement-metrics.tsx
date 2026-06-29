"use client";

import {
  Eye,
  Flame,
  Share2,
  Timer,
} from "lucide-react";
import { proposalEngagementFromRow, type ProposalHubRow } from "@/lib/proposal-hub-insights";
import { cn } from "@/lib/utils";

export function ProposalHubEngagementMetrics({
  row,
  lang = "en",
  compact = false,
}: {
  row: ProposalHubRow;
  lang?: "en" | "hi";
  compact?: boolean;
}) {
  const e = proposalEngagementFromRow(row, lang);
  const items = [
    {
      icon: Eye,
      label: lang === "hi" ? "खुला" : "Opens",
      value: String(e.viewCount),
    },
    {
      icon: Timer,
      label: lang === "hi" ? "आखिरी बार" : "Last viewed",
      value: e.lastViewedLabel,
    },
    {
      icon: Timer,
      label: lang === "hi" ? "औसत सत्र" : "Avg. session",
      value: e.avgSessionLabel,
    },
    {
      icon: Share2,
      label: lang === "hi" ? "शेयर" : "Share activity",
      value: e.shareLabel,
    },
  ];

  return (
    <div
      className={cn(
        "grid gap-2",
        compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"
      )}
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="proposal-hub-engagement-tile rounded-xl border p-2.5 sm:p-3"
          >
            <div className="flex items-center gap-1.5">
              <Icon className="proposal-hub-text-accent h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
              <p className="proposal-hub-text-muted text-[9px] font-bold uppercase tracking-wide sm:text-[10px]">
                {item.label}
              </p>
            </div>
            <p className="proposal-hub-text-primary mt-1 truncate text-sm font-bold tabular-nums sm:text-base">
              {item.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}

/** Mini heat indicator for pipeline rows */
export function DealHeatPill({ row, lang = "en" }: { row: ProposalHubRow; lang?: "en" | "hi" }) {
  const e = proposalEngagementFromRow(row, lang);
  const hot = (row.view_count ?? 0) > 0;
  if (!hot) return null;
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full border border-violet-500/45 bg-violet-500/15 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-violet-200">
      <Flame className="h-2.5 w-2.5" aria-hidden />
      {lang === "hi" ? "गर्म" : "Hot"}
    </span>
  );
}
