"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowUp, Check, Eye, EyeOff, RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  DASHBOARD_SECTION_LABELS,
  DEFAULT_DASHBOARD_LAYOUT,
  type DashboardLayoutPreferences,
  type DashboardSectionId,
} from "@/lib/dashboard-layout-preferences";
import { cn } from "@/lib/utils";

type Props = {
  value: DashboardLayoutPreferences;
  onChange: (value: DashboardLayoutPreferences) => void;
};

export function DashboardCustomizeMenu({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);

  function close() {
    setOpen(false);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }

  function handleDialogKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ) ?? []);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function toggleSection(id: DashboardSectionId) {
    const wasHidden = value.hidden.includes(id);
    const hidden = wasHidden
      ? value.hidden.filter((item) => item !== id)
      : [...value.hidden, id];
    onChange({ ...value, hidden });
    setAnnouncement(`${DASHBOARD_SECTION_LABELS[id]} ${wasHidden ? "shown" : "hidden"}.`);
  }

  function moveSection(id: DashboardSectionId, delta: -1 | 1) {
    const index = value.order.indexOf(id);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= value.order.length) return;
    const order = [...value.order];
    [order[index], order[target]] = [order[target], order[index]];
    onChange({ ...value, order });
    setAnnouncement(`${DASHBOARD_SECTION_LABELS[id]} moved ${delta < 0 ? "up" : "down"}.`);
  }

  const dialog = (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[10080] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reducedMotion ? undefined : { opacity: 0 }}
          onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dashboard-customize-title"
            aria-describedby="dashboard-customize-description"
            onKeyDown={handleDialogKeyDown}
            initial={reducedMotion ? false : { opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? undefined : { opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="max-h-[88dvh] w-full overflow-y-auto rounded-t-[1.75rem] border border-white/70 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl dark:border-white/10 dark:bg-[#0c1017] sm:max-w-lg sm:rounded-[1.75rem] sm:p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">Personalize</p>
                <h2 id="dashboard-customize-title" className="mt-1 text-xl font-black text-slate-950 dark:text-white">Customize dashboard</h2>
                <p id="dashboard-customize-description" className="mt-1 text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-300">Choose density, hide sections, or move them into your preferred workflow.</p>
              </div>
              <button autoFocus type="button" onClick={close} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 dark:text-slate-300 dark:hover:bg-white/10" aria-label="Close dashboard customization"><X className="h-5 w-5" /></button>
            </div>

            <fieldset className="mt-5">
              <legend className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-700 dark:text-slate-200">Display density</legend>
              <div className="mt-2 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5 dark:bg-white/5">
                {(["comfortable", "compact"] as const).map((density) => {
                  const active = value.density === density;
                  return <button key={density} type="button" onClick={() => onChange({ ...value, density })} aria-pressed={active} className={cn("min-h-11 rounded-xl px-3 text-sm font-extrabold capitalize transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500", active ? "bg-white text-slate-950 shadow-sm dark:bg-white/15 dark:text-white" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white")}>{active ? <Check className="mr-1.5 inline h-4 w-4" aria-hidden /> : null}{density}</button>;
                })}
              </div>
            </fieldset>

            <div className="mt-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-700 dark:text-slate-200">Sections</h3>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Top items appear first</span>
              </div>
              <ol className="mt-2 space-y-2">
                {value.order.map((id, index) => {
                  const visible = !value.hidden.includes(id);
                  return (
                    <li key={id} className={cn("flex min-h-14 items-center gap-2 rounded-2xl border px-2.5 py-2 transition", visible ? "border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.035]" : "border-slate-200/60 bg-slate-50/70 opacity-70 dark:border-white/5 dark:bg-white/[0.02]") }>
                      <button type="button" onClick={() => toggleSection(id)} aria-pressed={visible} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 dark:text-slate-300 dark:hover:bg-white/10" aria-label={`${visible ? "Hide" : "Show"} ${DASHBOARD_SECTION_LABELS[id]}`}>{visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button>
                      <span className="min-w-0 flex-1 truncate text-sm font-extrabold text-slate-800 dark:text-slate-100">{DASHBOARD_SECTION_LABELS[id]}</span>
                      <button type="button" disabled={index === 0} onClick={() => moveSection(id, -1)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-25 dark:text-slate-300 dark:hover:bg-white/10" aria-label={`Move ${DASHBOARD_SECTION_LABELS[id]} up`}><ArrowUp className="h-4 w-4" /></button>
                      <button type="button" disabled={index === value.order.length - 1} onClick={() => moveSection(id, 1)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-25 dark:text-slate-300 dark:hover:bg-white/10" aria-label={`Move ${DASHBOARD_SECTION_LABELS[id]} down`}><ArrowDown className="h-4 w-4" /></button>
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <button type="button" onClick={() => { onChange(DEFAULT_DASHBOARD_LAYOUT); setAnnouncement("Dashboard layout reset to default."); }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 dark:text-slate-300 dark:hover:bg-white/10"><RotateCcw className="h-4 w-4" />Reset default</button>
              <button type="button" onClick={close} className="min-h-11 rounded-xl bg-teal-600 px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 dark:ring-offset-[#0c1017]">Done</button>
            </div>
            <p className="sr-only" role="status" aria-live="polite">{announcement}</p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  return (
    <>
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/75 px-3 py-2 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/[0.035]">
        <div className="min-w-0">
          <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100">Your dashboard</p>
          <p className="truncate text-[10px] font-medium text-slate-500 dark:text-slate-400">{value.density === "compact" ? "Compact" : "Comfortable"} · {value.order.length - value.hidden.length} sections visible</p>
        </div>
        <button ref={triggerRef} type="button" onClick={() => setOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-extrabold text-slate-700 shadow-sm transition hover:border-teal-300 hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-teal-500/40 dark:hover:text-teal-200" aria-haspopup="dialog" aria-expanded={open}><SlidersHorizontal className="h-4 w-4" aria-hidden />Customize</button>
      </div>
      {mounted ? createPortal(dialog, document.body) : null}
    </>
  );
}
