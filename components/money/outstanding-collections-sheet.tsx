"use client";

import type { OutstandingCollectionRow } from "@/lib/project-api-client";
import { formatInrCompact } from "@/lib/proposal-hub-insights";
import { formatPipelineDisplayName } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { ChevronRight, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const SHEET_Z = "z-[10060]";

function rowProjectName(row: OutstandingCollectionRow): string {
  return formatPipelineDisplayName(row.official_name, row.lead_name);
}

function rowClientName(row: OutstandingCollectionRow): string {
  return row.lead_name?.trim() || "—";
}

export function OutstandingCollectionsSheet({
  open,
  onClose,
  loading,
  totalPendingInr,
  projectCount,
  rows,
}: {
  open: boolean;
  onClose: () => void;
  loading?: boolean;
  totalPendingInr: number;
  projectCount: number;
  rows: OutstandingCollectionRow[];
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className={cn("fixed inset-0 flex items-end justify-center md:items-center md:p-6", SHEET_Z)}
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-slate-950/50 touch-manipulation"
        aria-label="Close outstanding collections"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="outstanding-collections-title"
        className="relative z-[1] flex max-h-[min(90dvh,640px)] w-full max-w-lg flex-col touch-manipulation rounded-t-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0f1419] md:max-h-[min(85vh,720px)] md:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-2 border-b border-slate-100 px-4 pb-3 pt-3 dark:border-white/10">
          <div className="min-w-0">
            <p id="outstanding-collections-title" className="text-sm font-extrabold text-slate-900 dark:text-slate-50">
              Outstanding collections
            </p>
            <p className="mt-0.5 text-xs font-semibold tabular-nums text-slate-600 dark:text-slate-400">
              {formatInrCompact(totalPendingInr)} pending · {projectCount} project
              {projectCount === 1 ? "" : "s"}
            </p>
          </div>
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 touch-manipulation items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm font-medium text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Loading…
            </div>
          ) : rows.length === 0 ? (
            <p className="py-12 text-center text-sm font-semibold text-slate-600 dark:text-slate-400">
              All collections are up to date
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-white/[0.06]">
              {rows.map((row) => (
                <li key={row.project_id}>
                  <button
                    type="button"
                    className="group flex w-full touch-manipulation flex-col gap-2 py-3 text-left transition hover:bg-slate-50/80 dark:hover:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between"
                    onClick={() => {
                      onClose();
                      router.push(`/projects/${encodeURIComponent(row.project_id)}`);
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-extrabold text-slate-900 dark:text-slate-50">
                        {rowProjectName(row)}
                      </p>
                      <p className="mt-0.5 truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                        Client: {rowClientName(row)}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-bold uppercase tracking-wide text-slate-400 sm:hidden">
                        <span>
                          Contract{" "}
                          <span className="tabular-nums text-slate-700 dark:text-slate-200">
                            {formatInrCompact(row.stored_contract_amount_inr)}
                          </span>
                        </span>
                        <span>
                          Received{" "}
                          <span className="tabular-nums text-slate-700 dark:text-slate-200">
                            {formatInrCompact(row.amount_received_inr)}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3 sm:gap-4">
                      <div className="hidden min-w-[5.5rem] text-right sm:block">
                        <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                          Contract
                        </p>
                        <p className="text-xs font-bold tabular-nums text-slate-800 dark:text-slate-100">
                          {formatInrCompact(row.stored_contract_amount_inr)}
                        </p>
                      </div>
                      <div className="hidden min-w-[5.5rem] text-right sm:block">
                        <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                          Received
                        </p>
                        <p className="text-xs font-bold tabular-nums text-slate-800 dark:text-slate-100">
                          {formatInrCompact(row.amount_received_inr)}
                        </p>
                      </div>
                      <div className="min-w-[5.5rem] text-left sm:text-right">
                        <p className="text-[9px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                          Pending
                        </p>
                        <p className="text-sm font-extrabold tabular-nums text-amber-800 dark:text-amber-200">
                          {formatInrCompact(row.pending_inr)}
                        </p>
                      </div>
                      <ChevronRight
                        className="hidden h-4 w-4 shrink-0 text-slate-400 opacity-0 transition group-hover:opacity-100 sm:block"
                        aria-hidden
                      />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
