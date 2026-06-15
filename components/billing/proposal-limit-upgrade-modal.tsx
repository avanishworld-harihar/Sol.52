"use client";

import { cn } from "@/lib/utils";
import { Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  planName?: string | null;
};

export function ProposalLimitUpgradeModal({ open, onClose, planName }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10070] flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="proposal-limit-title"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#12161c]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <h2 id="proposal-limit-title" className="text-lg font-bold text-slate-900 dark:text-slate-50">
              Proposal limit reached
            </h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              You have reached your proposal limit.
            </p>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Upgrade your plan to continue creating proposals.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Current Plan</p>
          <p className="mt-1 text-base font-bold text-slate-900 dark:text-slate-100">{planName ?? "—"}</p>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5"
          >
            Not now
          </button>
          <Link
            href="/billing"
            onClick={onClose}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            )}
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            Upgrade Plan
          </Link>
        </div>
      </div>
    </div>
  );
}
