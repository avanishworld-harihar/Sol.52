"use client";

import { cn } from "@/lib/utils";
import {
  PROPOSAL_DEFAULT_PRESET_UPDATED_EVENT,
  readDefaultResidentialPreset,
  RESIDENTIAL_TEMPLATE_OPTIONS,
  writeDefaultResidentialPreset,
  type ResidentialTemplatePresetId,
} from "@/lib/proposal-default-preset-storage";
import { CheckCircle2, FileText, Home, Sparkles, Star } from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";

type Props = {
  markSaved: (message: string) => void;
};

const ICONS: Record<ResidentialTemplatePresetId, ReactNode> = {
  residential_sales_premium: <Star className="h-4 w-4" />,
  residential_bank_loan: <FileText className="h-4 w-4" />,
  residential_executive: <Sparkles className="h-4 w-4" />,
  residential_smart: <Home className="h-4 w-4" />,
};

export function ProposalTemplateSettingsPanel({ markSaved }: Props) {
  const [selected, setSelected] = useState<ResidentialTemplatePresetId>(readDefaultResidentialPreset);

  const sync = useCallback(() => {
    setSelected(readDefaultResidentialPreset());
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener(PROPOSAL_DEFAULT_PRESET_UPDATED_EVENT, sync);
    return () => window.removeEventListener(PROPOSAL_DEFAULT_PRESET_UPDATED_EVENT, sync);
  }, [sync]);

  function choose(id: ResidentialTemplatePresetId) {
    setSelected(id);
    writeDefaultResidentialPreset(id);
    const label = RESIDENTIAL_TEMPLATE_OPTIONS.find((o) => o.id === id)?.label ?? id;
    markSaved(`Default residential template set to ${label}. New proposals will use this format.`);
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] leading-snug text-slate-600 dark:text-slate-400">
        When you start a <strong className="font-semibold text-slate-800 dark:text-slate-200">Residential</strong>{" "}
        proposal, we apply this template automatically. You can add more templates here over time — like Gamma AI
        themes.
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {RESIDENTIAL_TEMPLATE_OPTIONS.map((opt) => {
          const active = selected === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => choose(opt.id)}
              className={cn(
                "rounded-xl border p-3 text-left transition",
                active
                  ? "border-brand-500 bg-brand-50/90 ring-1 ring-brand-400/40 dark:border-brand-400 dark:bg-brand-500/10"
                  : "border-slate-200 bg-white/80 hover:border-brand-300 dark:border-white/10 dark:bg-white/[0.04]"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className={cn(
                    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    active
                      ? "bg-brand-100 text-brand-800 dark:bg-brand-500/25 dark:text-brand-100"
                      : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"
                  )}
                >
                  {ICONS[opt.id]}
                </span>
                {active ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden /> : null}
              </div>
              <p className="mt-2 text-xs font-extrabold text-slate-900 dark:text-slate-100">{opt.label}</p>
              <p className="mt-1 text-[11px] font-medium leading-snug text-slate-600 dark:text-slate-400">
                {opt.subtitle}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
