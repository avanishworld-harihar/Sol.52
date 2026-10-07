"use client";

import type { EquipmentLibrary } from "@/lib/equipment-library";
import { cn } from "@/lib/utils";
import { ChevronDown, CircleAlert, DatabaseZap, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type ApiEnvelope = { ok: boolean; data?: EquipmentLibrary; error?: string };

function statusTone(status: "verified" | "indicative" | "review_required") {
  if (status === "verified") return "text-emerald-700 dark:text-emerald-300";
  if (status === "review_required") return "text-amber-700 dark:text-amber-300";
  return "text-slate-600 dark:text-slate-400";
}

/** More → shared online engineering library status. */
export function MoreEquipmentLibraryGroup() {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [library, setLibrary] = useState<EquipmentLibrary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash === "#more-section-equipment-library") {
      setOpen(true);
      setMounted(true);
      detailsRef.current?.setAttribute("open", "");
      detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  useEffect(() => {
    if (!mounted || library || loading) return;
    let active = true;
    setLoading(true);
    fetch("/api/equipment-library", { cache: "no-store" })
      .then((res) => res.json() as Promise<ApiEnvelope>)
      .then((json) => {
        if (!active) return;
        if (!json.ok || !json.data) throw new Error(json.error || "Could not load library");
        setLibrary(json.data);
      })
      .catch((reason) => active && setError(reason instanceof Error ? reason.message : "Load failed"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [library, loading, mounted]);

  const entries = library ? [...library.modules, ...library.inverters] : [];
  const verified = entries.filter((entry) => entry.verification === "verified").length;
  const review = entries.filter((entry) => entry.verification === "review_required").length;

  return (
    <details
      ref={detailsRef}
      id="more-section-equipment-library"
      className={cn(
        "ss-card workspace-more-group overflow-hidden p-0 [[open]_&_.more-chevron]:rotate-180",
        "[&_summary::-webkit-details-marker]:hidden [&_summary::marker]:content-none"
      )}
      onToggle={(event) => {
        const isOpen = event.currentTarget.open;
        setOpen(isOpen);
        if (isOpen) setMounted(true);
      }}
    >
      <summary className="flex cursor-pointer list-none items-start gap-3 p-4 sm:p-5">
        <span className="ws-icon-well ws-icon-well--amber shrink-0" aria-hidden>
          <DatabaseZap className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="workspace-more-group__title">Equipment &amp; engineering library</span>
          <span className="workspace-more-group__subtitle">
            Official-source module and inverter data shared by every proposal preset.
          </span>
        </span>
        <ChevronDown
          className="more-chevron mt-0.5 h-5 w-5 shrink-0 text-slate-500 transition-transform duration-200 dark:text-slate-400"
          aria-hidden
        />
      </summary>

      <div className="space-y-4 border-t border-slate-200/80 px-4 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4 dark:border-white/10">
        {!open || !mounted ? null : loading ? (
          <div className="flex min-h-[100px] items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading engineering library…
          </div>
        ) : error ? (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </div>
        ) : library ? (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ["Modules", library.modules.length],
                ["Inverters", library.inverters.length],
                ["Verified", verified],
                ["Needs review", review],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                  <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">{label}</p>
                  <p className="mt-1 text-xl font-black text-slate-900 dark:text-white">{value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-300" />
                <div>
                  <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
                    One calculation engine for every preset
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-emerald-800/80 dark:text-emerald-200/80">
                    Official sources are checked daily. Changed datasheets are quarantined for review instead of silently changing live proposal calculations.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {entries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2.5 dark:border-white/10">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                      {entry.manufacturer} · {entry.model}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {"watt" in entry ? `${entry.watt} W module` : `${entry.ratedAcKw} kW inverter`} · revision {entry.revision}
                    </p>
                  </div>
                  <span className={cn("shrink-0 text-[10px] font-extrabold uppercase tracking-wide", statusTone(entry.verification))}>
                    {entry.verification.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-500">
              Revision {library.revision} · Last internet check: {library.lastSyncedAt ? new Date(library.lastSyncedAt).toLocaleString() : "pending first scheduled sync"}
            </p>
          </>
        ) : null}
      </div>
    </details>
  );
}
