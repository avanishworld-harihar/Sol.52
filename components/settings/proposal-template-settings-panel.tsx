"use client";

import { cn } from "@/lib/utils";
import {
  PROPOSAL_DEFAULT_PRESET_UPDATED_EVENT,
  readDefaultResidentialPreset,
  RESIDENTIAL_TEMPLATE_OPTIONS,
  writeDefaultResidentialPreset,
  type ResidentialTemplatePresetId,
} from "@/lib/proposal-default-preset-storage";
import { SalesPremiumStylePicker } from "@/components/settings/sales-premium-style-picker";
import { CheckCircle2, ChevronDown, FileText, Home, Sparkles, Star } from "lucide-react";
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
  const [salesPremiumExpanded, setSalesPremiumExpanded] = useState(
    () => readDefaultResidentialPreset() === "residential_sales_premium"
  );

  const sync = useCallback(() => {
    const preset = readDefaultResidentialPreset();
    setSelected(preset);
    if (preset === "residential_sales_premium") setSalesPremiumExpanded(true);
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener(PROPOSAL_DEFAULT_PRESET_UPDATED_EVENT, sync);
    return () => window.removeEventListener(PROPOSAL_DEFAULT_PRESET_UPDATED_EVENT, sync);
  }, [sync]);

  function choose(id: ResidentialTemplatePresetId) {
    setSelected(id);
    writeDefaultResidentialPreset(id);
    if (id === "residential_sales_premium") {
      setSalesPremiumExpanded(true);
    }
    const label = RESIDENTIAL_TEMPLATE_OPTIONS.find((o) => o.id === id)?.label ?? id;
    markSaved(`Default residential template set to ${label}. New proposals will use this format.`);
  }

  return (
    <div className="space-y-4">
      <p className="text-[11px] leading-snug text-slate-600 dark:text-slate-400">
        When you start a <strong className="font-semibold text-slate-800 dark:text-slate-200">Residential</strong>{" "}
        proposal, we apply this template. Sales Premium includes multiple visual styles — pick one below.
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {RESIDENTIAL_TEMPLATE_OPTIONS.map((opt) => {
          const active = selected === opt.id;
          const isSalesPremium = opt.id === "residential_sales_premium";

          if (isSalesPremium) {
            return (
              <div
                key={opt.id}
                className={cn(
                  "rounded-xl border transition sm:col-span-2",
                  active
                    ? "border-brand-500 bg-brand-50/50 ring-1 ring-brand-400/40 dark:border-brand-400 dark:bg-brand-500/10"
                    : "border-slate-200 bg-white/80 dark:border-white/10 dark:bg-white/[0.04]"
                )}
              >
                <div className="flex w-full items-start justify-between gap-2 p-3">
                  <button
                    type="button"
                    onClick={() => choose(opt.id)}
                    className="flex min-w-0 flex-1 items-start gap-2 text-left"
                  >
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
                    <span className="min-w-0">
                      <span className="block text-xs font-extrabold text-slate-900 dark:text-slate-100">
                        {opt.label}
                      </span>
                      <span className="mt-1 block text-[11px] font-medium text-slate-600 dark:text-slate-400">
                        {opt.subtitle}
                      </span>
                    </span>
                  </button>
                  <span className="flex shrink-0 items-center gap-1">
                    {active ? <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden /> : null}
                    <button
                      type="button"
                      onClick={() => {
                        setSalesPremiumExpanded((v) => !v);
                        if (!active) choose(opt.id);
                      }}
                      className="rounded-lg p-1 text-slate-500 hover:bg-white/60 dark:hover:bg-white/10"
                      aria-expanded={salesPremiumExpanded}
                      aria-label="Show Sales Premium styles"
                    >
                      <ChevronDown
                        className={cn("h-4 w-4 transition-transform", salesPremiumExpanded && "rotate-180")}
                      />
                    </button>
                  </span>
                </div>
                {active && salesPremiumExpanded ? (
                  <div className="border-t border-brand-200/50 px-3 pb-3 pt-2 dark:border-brand-500/20">
                    <SalesPremiumStylePicker markSaved={markSaved} compact />
                  </div>
                ) : null}
              </div>
            );
          }

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
