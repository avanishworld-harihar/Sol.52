"use client";

import { cn } from "@/lib/utils";
import type { DuplicateProposalMode } from "@/lib/duplicate-proposal";
import { buttonVariants } from "@/components/ui/button";
import { Copy, FileStack, Layers, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const MODAL_Z = "z-[10070]";

export type ProposalDuplicateModalLabels = {
  title: string;
  subtitle: string;
  templateTitle: string;
  templateDesc: string;
  revisionTitle: string;
  revisionDesc: string;
  cancel: string;
  confirm: string;
  confirming: string;
};

export function ProposalDuplicateModal({
  open,
  onClose,
  onConfirm,
  labels,
  busy,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (mode: DuplicateProposalMode) => void;
  labels: ProposalDuplicateModalLabels;
  busy?: boolean;
}) {
  const [mode, setMode] = useState<DuplicateProposalMode>("template");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setMode("template");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, busy]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!mounted || !open) return null;

  const options: {
    id: DuplicateProposalMode;
    title: string;
    desc: string;
    icon: typeof Layers;
  }[] = [
    {
      id: "template",
      title: labels.templateTitle,
      desc: labels.templateDesc,
      icon: Layers,
    },
    {
      id: "revision",
      title: labels.revisionTitle,
      desc: labels.revisionDesc,
      icon: FileStack,
    },
  ];

  return createPortal(
    <div
      className={cn("fixed inset-0 flex items-end justify-center sm:items-center sm:p-4", MODAL_Z)}
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-slate-950/50 touch-manipulation"
        aria-label={labels.cancel}
        disabled={busy}
        onClick={() => {
          if (!busy) onClose();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="proposal-duplicate-title"
        className="relative z-[1] w-full max-w-md touch-manipulation rounded-t-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-white/10 dark:bg-[#0f1419] sm:rounded-2xl sm:p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="proposal-duplicate-title" className="text-base font-bold text-slate-900 dark:text-slate-50 sm:text-lg">
              {labels.title}
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{labels.subtitle}</p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-white/10"
            aria-label={labels.cancel}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2">
          {options.map((opt) => {
            const Icon = opt.icon;
            const selected = mode === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                disabled={busy}
                onClick={() => setMode(opt.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors touch-manipulation",
                  selected
                    ? "border-emerald-500/60 bg-emerald-50/80 ring-1 ring-emerald-500/25 dark:border-emerald-500/40 dark:bg-emerald-950/25"
                    : "border-slate-200 bg-slate-50/50 hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/20"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    selected
                      ? "bg-emerald-600 text-white dark:bg-emerald-500"
                      : "bg-white text-slate-500 dark:bg-white/10 dark:text-slate-400"
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-900 dark:text-slate-50">{opt.title}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                    {opt.desc}
                  </span>
                </span>
                <span
                  className={cn(
                    "mt-2 h-4 w-4 shrink-0 rounded-full border-2",
                    selected ? "border-emerald-600 bg-emerald-600 dark:border-emerald-400 dark:bg-emerald-400" : "border-slate-300 dark:border-slate-600"
                  )}
                  aria-hidden
                />
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className={cn(buttonVariants({ variant: "outline" }), "h-11 touch-manipulation sm:min-w-[7rem]")}
          >
            {labels.cancel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onConfirm(mode)}
            className={cn(
              buttonVariants({ variant: "default" }),
              "h-11 touch-manipulation gap-2 bg-emerald-600 hover:bg-emerald-700 sm:min-w-[9rem]"
            )}
          >
            <Copy className="h-4 w-4 shrink-0" aria-hidden />
            {busy ? labels.confirming : labels.confirm}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
