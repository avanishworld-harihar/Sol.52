"use client";

import { cn } from "@/lib/utils";
import { Info } from "lucide-react";
import { useId, useState } from "react";

type Tone = "default" | "tip" | "warn";

const toneClass: Record<Tone, { text: string; panel: string; icon: string }> = {
  default: {
    text: "text-slate-600 dark:text-slate-400",
    panel: "border-slate-200/80 bg-slate-50/90 text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300",
    icon: "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200",
  },
  tip: {
    text: "text-sky-800 dark:text-sky-300",
    panel: "border-sky-200/80 bg-sky-50/90 text-sky-900 dark:border-sky-500/20 dark:bg-sky-950/30 dark:text-sky-100",
    icon: "text-sky-500 hover:text-sky-700 dark:hover:text-sky-300",
  },
  warn: {
    text: "text-amber-950 dark:text-amber-200",
    panel: "border-amber-200/90 bg-amber-50/90 text-amber-950 dark:border-amber-500/25 dark:bg-amber-950/30 dark:text-amber-100",
    icon: "text-amber-600 hover:text-amber-800 dark:hover:text-amber-300",
  },
};

type Props = {
  /** Short line shown by default — one sentence. */
  label: string;
  /** Longer guidance — behind ⓘ / Learn more. */
  detail?: string;
  tone?: Tone;
  className?: string;
};

/**
 * Compact helper: one short sentence + optional detail behind info toggle.
 * Mobile-first — avoids multi-line instructional blocks in the default view.
 */
export function HelpHint({ label, detail, tone = "default", className }: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const styles = toneClass[tone];
  const hasDetail = Boolean(detail?.trim() && detail.trim() !== label.trim());

  if (!hasDetail) {
    return (
      <p className={cn("text-[11px] font-medium leading-snug sm:text-xs", styles.text, className)}>{label}</p>
    );
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-start gap-1.5">
        <p className={cn("min-w-0 flex-1 text-[11px] font-medium leading-snug sm:text-xs", styles.text)}>{label}</p>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={open ? "Hide help" : "Learn more"}
          title={open ? undefined : "Learn more"}
          className={cn(
            "mt-0.5 shrink-0 rounded-md p-0.5 transition-colors",
            styles.icon,
            open && "bg-black/5 dark:bg-white/10"
          )}
        >
          <Info className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
      {open ? (
        <p
          id={panelId}
          className={cn(
            "rounded-lg border px-2.5 py-2 text-[10px] font-medium leading-relaxed sm:text-[11px]",
            styles.panel
          )}
        >
          {detail}
        </p>
      ) : null}
    </div>
  );
}
