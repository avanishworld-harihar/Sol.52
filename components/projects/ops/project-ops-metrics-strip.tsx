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
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  href?: string;
  icon: typeof Layers;
  tone: MetricTone;
}) {
  const body = (
    <div
      className={cn(
        "flex min-w-[9.5rem] shrink-0 flex-col gap-2 rounded-xl border border-slate-200/90 bg-white px-3.5 py-3 dark:border-white/10 dark:bg-[#0c1017] sm:min-w-[10.5rem]",
        href && "transition hover:border-teal-300/80 hover:shadow-sm dark:hover:border-teal-500/30"
      )}
    >
      <span className={cn("ws-icon-well h-8 w-8", `ws-icon-well--${tone}`)} aria-hidden>
        <Icon className="h-4 w-4" strokeWidth={2.25} />
      </span>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          {label}
        </p>
        <p className="mt-0.5 text-lg font-extrabold tabular-nums text-slate-900 dark:text-white sm:text-xl">
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
  return body;
}

export function ProjectOpsMetricsStrip({
  stats,
  className,
}: {
  stats: ProjectDashboardStats | null | undefined;
  className?: string;
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
          icon={m.icon}
          tone={m.tone}
        />
      ))}
    </div>
  );
}
