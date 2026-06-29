"use client";

import { describeCallback } from "@/lib/crm-callback-display";
import { cn } from "@/lib/utils";
import { AlarmClock } from "lucide-react";

type Props = {
  dueAt: string | null | undefined;
  title?: string | null;
  compact?: boolean;
  className?: string;
};

export function CallbackStatusBadge({ dueAt, title, compact = false, className }: Props) {
  const info = describeCallback(dueAt);
  if (info.state === "none") return null;

  const tone =
    info.state === "overdue"
      ? "border-rose-300/90 bg-rose-50 text-rose-800 dark:border-rose-500/40 dark:bg-rose-950/40 dark:text-rose-200"
      : info.state === "today"
        ? "border-amber-300/90 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/35 dark:text-amber-100"
        : "border-sky-200/90 bg-sky-50 text-sky-900 dark:border-sky-500/35 dark:bg-sky-950/30 dark:text-sky-100";

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 font-bold",
        compact ? "text-[9px] uppercase tracking-wide" : "text-[10px]",
        tone,
        className
      )}
      title={title ? `${title} · ${info.label}` : info.label}
    >
      <AlarmClock className={cn(compact ? "h-2.5 w-2.5" : "h-3 w-3")} aria-hidden />
      {info.state === "overdue" ? "Overdue" : info.shortLabel}
    </span>
  );
}
