"use client";

import type { ProjectDashboardStats } from "@/lib/project-api-client";
import { formatInrCompact } from "@/lib/proposal-hub-insights";
import { cn } from "@/lib/utils";
import {
  CircleDollarSign,
  ClipboardCheck,
  HardHat,
  Layers,
  Zap,
  Gauge,
} from "lucide-react";
import Link from "next/link";

type MetricTone = "sky" | "orange" | "amber" | "purple" | "teal" | "rose";

function MetricCard({
  label,
  value,
  href,
  onClick,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  href?: string;
  onClick?: () => void;
  icon: typeof Layers;
  tone: MetricTone;
}) {
  const interactive = Boolean(href || onClick);
  const body = (
    <div
      className={cn(
        "flex min-w-[8.25rem] shrink-0 flex-col gap-1.5 rounded-lg border border-slate-200/90 bg-white px-2.5 py-2 dark:border-white/10 dark:bg-[#0c1017] max-sm:min-w-[7.5rem] max-sm:gap-1 max-sm:px-2 max-sm:py-1.5 sm:min-w-[10.5rem] sm:gap-2 sm:rounded-xl sm:px-3.5 sm:py-3",
        interactive &&
          "cursor-pointer transition hover:border-teal-300/80 hover:shadow-sm dark:hover:border-teal-500/30"
      )}
    >
      <span
        className={cn(
          "ws-icon-well h-6 w-6 max-sm:h-5 max-sm:w-5 sm:h-8 sm:w-8",
          `ws-icon-well--${tone}`
        )}
        aria-hidden
      >
        <Icon className="h-3 w-3 max-sm:h-2.5 max-sm:w-2.5 sm:h-4 sm:w-4" strokeWidth={2.25} />
      </span>
      <div>
        <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 max-sm:text-[8px] sm:text-[10px]">
          {label}
        </p>
        <p className="mt-0.5 text-base font-extrabold tabular-nums text-slate-900 dark:text-white max-sm:text-sm sm:text-xl">
          {value}
        </p>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {body}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" className="block text-left" onClick={onClick}>
        {body}
      </button>
    );
  }
  return body;
}

export function ProjectOpsMetricsStrip({
  stats,
  className,
  onPendingCollectionClick,
}: {
  stats: ProjectDashboardStats | null | undefined;
  className?: string;
  onPendingCollectionClick?: () => void;
}) {
  const metrics = [
    {
      key: "total",
      label: "Active projects",
      value: String(stats?.total_projects ?? 0),
      icon: Layers,
      tone: "sky" as const,
      href: "/projects",
    },
    {
      key: "install",
      label: "Installs in progress",
      value: String(stats?.today_installations ?? 0),
      icon: HardHat,
      tone: "orange" as const,
      href: "/projects?stage=installation",
    },
    {
      key: "approval",
      label: "Approval pending",
      value: String(stats?.approval_pending ?? 0),
      icon: ClipboardCheck,
      tone: "amber" as const,
      href: "/projects?stage=approval",
    },
    {
      key: "nm",
      label: "Net metering",
      value: String(stats?.nm_pending ?? 0),
      icon: Zap,
      tone: "purple" as const,
      href: "/projects?stage=net_metering",
    },
    {
      key: "pipeline",
      label: "Pipeline value",
      value: formatInrCompact(stats?.total_pipeline_value_inr ?? 0),
      icon: CircleDollarSign,
      tone: "teal" as const,
    },
    {
      key: "pending",
      label: "Pending collection",
      value: formatInrCompact(stats?.total_pending_inr ?? 0),
      icon: Gauge,
      tone: "rose" as const,
    },
  ];

  return (
    <div
      className={cn(
        "page-lite-item -mx-1 flex gap-3 overflow-x-auto pb-1 scrollbar-thin sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3 xl:grid-cols-6",
        className
      )}
    >
      {metrics.map((m) => (
        <MetricCard
          key={m.key}
          label={m.label}
          value={m.value}
          href={m.href}
          onClick={m.key === "pending" ? onPendingCollectionClick : undefined}
          icon={m.icon}
          tone={m.tone}
        />
      ))}
    </div>
  );
}
