"use client";

import type { ProjectDashboardStats } from "@/lib/project-api-client";
import type { ProjectHealth } from "@/lib/project-health";
import { formatInrCompact } from "@/lib/proposal-hub-insights";
import { cn } from "@/lib/utils";
import { AlertTriangle, HardHat, Wallet } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

function healthCount(stats: ProjectDashboardStats | null | undefined, key: ProjectHealth): number {
  return stats?.health_counts?.[key] ?? 0;
}

/** Pick the most urgent non-empty health bucket so the tap lands on a real filter. */
function topAttentionHealth(stats: ProjectDashboardStats | null | undefined): ProjectHealth | null {
  if (healthCount(stats, "blocked") > 0) return "blocked";
  if (healthCount(stats, "delayed") > 0) return "delayed";
  if (healthCount(stats, "attention_needed") > 0) return "attention_needed";
  return null;
}

function Pill({
  label,
  value,
  icon,
  tone,
  href,
  onClick,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  tone: "rose" | "amber" | "orange";
  href?: string;
  onClick?: () => void;
}) {
  const toneRing =
    tone === "rose"
      ? "ws-icon-well--rose"
      : tone === "amber"
        ? "ws-icon-well--amber"
        : "ws-icon-well--orange";

  const body = (
    <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200/90 bg-white/95 px-2.5 py-2 text-left shadow-sm active:scale-[0.98] dark:border-white/10 dark:bg-[#0c1017]">
      <span className={cn("ws-icon-well h-7 w-7 shrink-0", toneRing)} aria-hidden>
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[8px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          {label}
        </span>
        <span className="block truncate text-sm font-extrabold tabular-nums leading-tight text-slate-900 dark:text-white">
          {value}
        </span>
      </span>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="flex min-w-0 flex-1">
        {body}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className="flex min-w-0 flex-1">
      {body}
    </button>
  );
}

/**
 * Always-visible ops signals for phones — the full ops dashboard stays collapsed
 * behind its accordion, but the three numbers a field installer needs at a glance
 * (money to collect, projects needing attention, installs happening) stay on top.
 */
export function ProjectOpsMobileStrip({
  stats,
  className,
  onPendingCollectionClick,
}: {
  stats: ProjectDashboardStats | null | undefined;
  className?: string;
  onPendingCollectionClick?: () => void;
}) {
  const pending = stats?.total_pending_inr ?? 0;
  const attentionHealth = topAttentionHealth(stats);
  const attentionCount =
    healthCount(stats, "blocked") +
    healthCount(stats, "delayed") +
    healthCount(stats, "attention_needed");
  const installs = stats?.today_installations ?? 0;

  return (
    <div className={cn("flex items-stretch gap-1.5 sm:hidden", className)}>
      <Pill
        label="To collect"
        value={formatInrCompact(pending)}
        icon={<Wallet className="h-3.5 w-3.5" strokeWidth={2.25} />}
        tone="rose"
        onClick={onPendingCollectionClick}
      />
      <Pill
        label="Attention"
        value={String(attentionCount)}
        icon={<AlertTriangle className="h-3.5 w-3.5" strokeWidth={2.25} />}
        tone="amber"
        href={attentionHealth ? `/projects?health=${attentionHealth}` : "/projects"}
      />
      <Pill
        label="Installing"
        value={String(installs)}
        icon={<HardHat className="h-3.5 w-3.5" strokeWidth={2.25} />}
        tone="orange"
        href="/projects?stage=installation"
      />
    </div>
  );
}
