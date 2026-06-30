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
        "group relative flex min-w-[8.5rem] shrink-0 flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/80 px-3 py-3 shadow-[0_4px_18px_-8px_rgba(15,23,42,0.12)] dark:border-white/10 dark:from-[#0c1017] dark:to-[#141a22]",
        "max-sm:min-w-[7.75rem] max-sm:px-2.5 max-sm:py-2.5 sm:min-w-0",
        interactive &&
          "cursor-pointer transition hover:-translate-y-0.5 hover:border-teal-300/70 hover:shadow-[0_12px_28px_-10px_rgba(15,23,42,0.18)] dark:hover:border-teal-500/35"
      )}
    >
      <span
        className={cn(
          "ws-icon-well h-8 w-8 max-sm:h-7 max-sm:w-7",
          `ws-icon-well--${tone}`
        )}
        aria-hidden
      >
        <Icon className="h-4 w-4 max-sm:h-3.5 max-sm:w-3.5" strokeWidth={2.25} />
      </span>
      <div className="mt-3 max-sm:mt-2">
        <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 max-sm:text-[8px] sm:text-[10px]">
          {label}
        </p>
        <p className="mt-0.5 text-lg font-extrabold tabular-nums tracking-tight text-slate-900 dark:text-white max-sm:text-base sm:text-xl">
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
        "flex gap-3 overflow-x-auto pb-1 scrollbar-thin sm:grid sm:grid-cols-2 sm:gap-3 sm:overflow-visible lg:grid-cols-3 xl:grid-cols-6",
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
