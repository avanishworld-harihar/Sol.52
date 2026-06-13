"use client";

import { cn } from "@/lib/utils";
import {
  readDefaultSalesPremiumStyle,
  SALES_PREMIUM_STYLE_LIST,
  SALES_PREMIUM_STYLE_UPDATED_EVENT,
  writeDefaultSalesPremiumStyle,
  type SalesPremiumStyleId,
} from "@/lib/sales-premium-styles";
import { SalesPremiumStyleThumbnail } from "@/components/proposals/sales-premium-institutional/sales-premium-style-thumbnail";
import { CheckCircle2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Props = {
  markSaved: (message: string) => void;
  /** Compact grid when nested inside Sales Premium card. */
  compact?: boolean;
};

export function SalesPremiumStylePicker({ markSaved, compact = false }: Props) {
  const [selected, setSelected] = useState<SalesPremiumStyleId>(readDefaultSalesPremiumStyle);

  const sync = useCallback(() => {
    setSelected(readDefaultSalesPremiumStyle());
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener(SALES_PREMIUM_STYLE_UPDATED_EVENT, sync);
    return () => window.removeEventListener(SALES_PREMIUM_STYLE_UPDATED_EVENT, sync);
  }, [sync]);

  function choose(id: SalesPremiumStyleId) {
    setSelected(id);
    writeDefaultSalesPremiumStyle(id);
    const label = SALES_PREMIUM_STYLE_LIST.find((s) => s.id === id)?.label ?? id;
    markSaved(`Sales Premium style set to ${label}. New residential proposals will use this look.`);
  }

  return (
    <div className={cn("space-y-3", compact ? "pt-1" : "")}>
      {!compact ? (
        <p className="text-[11px] leading-snug text-slate-600 dark:text-slate-400">
          Pick a visual style for <strong className="font-semibold">Sales Premium</strong> — like choosing a
          theme in Gamma AI. Each style changes layout and page count.
        </p>
      ) : null}
      <div
        className={cn(
          "grid gap-3",
          compact ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        )}
      >
        {SALES_PREMIUM_STYLE_LIST.map((style) => {
          const active = selected === style.id;
          return (
            <button
              key={style.id}
              type="button"
              onClick={() => choose(style.id)}
              className={cn(
                "group rounded-xl border p-2 text-left transition",
                active
                  ? "border-brand-500 bg-brand-50/90 ring-1 ring-brand-400/40 dark:border-brand-400 dark:bg-brand-500/10"
                  : "border-slate-200 bg-white/80 hover:border-brand-300 dark:border-white/10 dark:bg-white/[0.04]"
              )}
            >
              <div className="relative">
                <SalesPremiumStyleThumbnail styleId={style.id} className="aspect-[3/4] w-full" />
                {active ? (
                  <CheckCircle2
                    className="absolute right-1.5 top-1.5 h-5 w-5 text-emerald-600 drop-shadow-sm"
                    aria-hidden
                  />
                ) : null}
              </div>
              <p className="mt-2 px-1 text-xs font-extrabold text-slate-900 dark:text-slate-100">
                {style.label}
              </p>
              <p className="mt-0.5 px-1 pb-1 text-[10px] font-medium leading-snug text-slate-600 dark:text-slate-400">
                {style.subtitle}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
