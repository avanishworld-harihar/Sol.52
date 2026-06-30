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
  /** Desktop rows: inline pill instead of full-width banner */
  variant?: "prominent" | "compact";
};

/** Prominent callback state + schedule CTA for customer rows */
export function CustomerCallbackChip({
  dueAt,
  title,
  onSchedule,
  className,
  variant = "prominent",
}: ChipProps) {
  const info = describeCallback(dueAt);
  const hasCallback = info.state !== "none";
  const tone = callbackUrgencyClasses(info.state);

  if (variant === "compact") {
    if (!hasCallback) {
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSchedule();
          }}
          className={cn(
            "inline-flex touch-manipulation items-center gap-1.5 rounded-lg border border-amber-200/80 bg-amber-50/60 px-2 py-1 text-[11px] font-bold text-amber-900 transition hover:bg-amber-100/80 dark:border-amber-500/35 dark:bg-amber-950/25 dark:text-amber-100",
            className
          )}
        >
          <CalendarClock className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} aria-hidden />
          Schedule callback
        </button>
      );
    }

    return (
      <div className={cn("inline-flex max-w-full items-center gap-1.5", className)}>
        <CallbackStatusBadge dueAt={dueAt} title={title} compact />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSchedule();
          }}
          className="inline-flex h-7 shrink-0 touch-manipulation items-center gap-1 rounded-lg border border-slate-200/90 bg-white px-2 text-[10px] font-bold uppercase tracking-wide text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
          aria-label="Reschedule callback"
        >
          <CalendarClock className="h-3 w-3" strokeWidth={2.25} aria-hidden />
          Edit
        </button>
      </div>
    );
  }

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
