"use client";

import { InstallerRateCardWorkspace } from "@/components/installer/installer-rate-card-workspace";
import { cn } from "@/lib/utils";
import { ChevronDown, Landmark, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

/**
 * More tab — Rate card as its own section (not nested under Brand & proposals).
 */
export function MoreRateCardGroup() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  function handleToggle(e: React.SyntheticEvent<HTMLDetailsElement>) {
    const isOpen = e.currentTarget.open;
    setOpen(isOpen);
    if (isOpen) setMounted(true);
  }

  return (
    <details
      id="more-section-rate-card"
      className={cn(
        "ss-card workspace-more-group overflow-hidden p-0 [[open]_&_.more-chevron]:rotate-180",
        "[&_summary::-webkit-details-marker]:hidden [&_summary::marker]:content-none"
      )}
      onToggle={handleToggle}
    >
      <summary className="flex cursor-pointer list-none items-start gap-3 p-4 sm:p-5">
        <span className="ws-icon-well ws-icon-well--amber shrink-0" aria-hidden>
          <Landmark className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="workspace-more-group__title">Rate card</span>
          <span className="workspace-more-group__subtitle">
            Smart catalog — plant ₹/kW for residential &amp; commercial proposals.
          </span>
        </span>
        <ChevronDown
          className="more-chevron mt-0.5 h-5 w-5 shrink-0 text-slate-500 transition-transform duration-200 dark:text-slate-400"
          aria-hidden
        />
      </summary>
      <div className="space-y-4 border-t border-slate-200/80 px-4 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4 dark:border-white/10">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            Edit once here — all new proposals pull pricing from this catalog unless you override on a
            single deal.
          </p>
          <Link
            href="/more/rate-card"
            className="inline-flex shrink-0 items-center justify-center rounded-xl border border-amber-300/80 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-950 hover:bg-amber-100 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-100"
          >
            Open full screen
          </Link>
        </div>
        {mounted ? (
          <InstallerRateCardWorkspace />
        ) : open ? (
          <div className="flex min-h-[120px] items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading rate card…
          </div>
        ) : null}
      </div>
    </details>
  );
}
