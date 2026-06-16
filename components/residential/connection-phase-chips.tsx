"use client";

import {
  CONNECTION_PHASE_OPTIONS,
  type ConnectionPhase,
} from "@/lib/connection-phase-pricing";
import { cn } from "@/lib/utils";

type Props = {
  value?: ConnectionPhase;
  onChange: (phase: ConnectionPhase) => void;
  theme?: "residential" | "commercial";
  className?: string;
};

export function ConnectionPhaseChips({ value, onChange, theme = "residential", className }: Props) {
  const activeClass =
    theme === "commercial"
      ? "border-indigo-600 bg-indigo-50 text-indigo-900 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-100"
      : "border-emerald-600 bg-emerald-50 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-100";

  return (
    <div className={className}>
      <p className="mb-2 text-[11px] font-bold text-slate-700 dark:text-slate-300">Connection phase</p>
      <div className="flex flex-wrap gap-2">
        {CONNECTION_PHASE_OPTIONS.map((opt) => {
          const active = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
                active
                  ? activeClass
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-white/15 dark:bg-white/5 dark:text-slate-300"
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {value === "three_phase" ? (
        <p className="mt-2 text-[10px] leading-snug text-slate-500 dark:text-slate-400">
          Three-phase selected — extra charge toggle will turn on in Pricing adjustments (Step 4). Enter amount
          manually.
        </p>
      ) : null}
    </div>
  );
}
