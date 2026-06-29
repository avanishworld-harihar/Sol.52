"use client";

import { AlarmClock, CalendarClock } from "lucide-react";
import { describeCallback, callbackUrgencyClasses } from "@/lib/crm-callback-display";
import { cn } from "@/lib/utils";

type Props = {
  dueAt: string | null | undefined;
  title?: string | null;
  compact?: boolean;
  className?: string;
};

export function CallbackStatusBadge({ dueAt, title, compact = false, className }: Props) {
  const info = describeCallback(dueAt);
  if (info.state === "none") return null;

  const tone = callbackUrgencyClasses(info.state);
  const badgeLabel =
    info.state === "overdue"
      ? "Overdue"
      : info.state === "today"
        ? "Due today"
        : info.state === "due_soon"
          ? "Due soon"
          : "Scheduled";

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 font-bold",
        compact ? "text-[9px] uppercase tracking-wide" : "text-[10px]",
        tone.shell,
        tone.text,
        className
      )}
      title={title ? `${title} · ${info.label}` : info.label}
    >
      <AlarmClock className={cn(compact ? "h-2.5 w-2.5" : "h-3 w-3", tone.icon)} aria-hidden />
      {badgeLabel}
    </span>
  );
}

type ChipProps = {
  dueAt: string | null | undefined;
  title?: string | null;
  onSchedule: () => void;
  className?: string;
};

/** Prominent callback state + schedule CTA for customer rows */
export function CustomerCallbackChip({ dueAt, title, onSchedule, className }: ChipProps) {
  const info = describeCallback(dueAt);
  const hasCallback = info.state !== "none";
  const tone = callbackUrgencyClasses(info.state);

  if (!hasCallback) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSchedule();
        }}
        className={cn(
          "flex min-h-11 w-full touch-manipulation items-center justify-center gap-2 rounded-xl border-2 border-dashed border-amber-400/70 bg-amber-50/80 px-3 text-sm font-extrabold text-amber-950 shadow-sm transition active:scale-[0.99] hover:bg-amber-100 dark:border-amber-500/50 dark:bg-amber-950/30 dark:text-amber-100",
          className
        )}
      >
        <CalendarClock className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
        Schedule callback
      </button>
    );
  }

  return (
    <div
      className={cn(
        "flex min-h-11 w-full items-stretch overflow-hidden rounded-xl border shadow-sm",
        tone.shell,
        className
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2">
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/70 dark:bg-white/10",
            tone.icon
          )}
        >
          <AlarmClock className="h-4 w-4" strokeWidth={2.25} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className={cn("text-[10px] font-extrabold uppercase tracking-wide opacity-80", tone.text)}>
            Next callback
          </p>
          <p className={cn("truncate text-xs font-bold leading-snug sm:text-sm", tone.text)}>{info.label}</p>
          {title ? (
            <p className="truncate text-[10px] font-semibold opacity-75 dark:opacity-60">{title}</p>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSchedule();
        }}
        className={cn(
          "flex shrink-0 touch-manipulation flex-col items-center justify-center gap-0.5 border-l px-3 text-[10px] font-extrabold uppercase tracking-wide transition active:bg-black/5 dark:active:bg-white/10",
          tone.shell,
          tone.text,
          "min-w-[4.5rem] min-h-11"
        )}
        aria-label="Reschedule callback"
      >
        <CalendarClock className="h-4 w-4" strokeWidth={2.25} aria-hidden />
        Edit
      </button>
    </div>
  );
}
