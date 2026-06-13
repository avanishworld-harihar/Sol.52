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
import { useCallback, useEffect, useState } from "react";

type Props = {
  markSaved: (message: string) => void;
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
    markSaved(`Sales Premium style set to ${label}.`);
  }

  return (
    <div className={cn("space-y-2", compact ? "pt-0" : "")}>
      {!compact ? (
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Choose a style — same as picking a theme in Gamma.
        </p>
      ) : (
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Styles
        </p>
      )}
      <div className="flex flex-wrap gap-x-4 gap-y-5 sm:gap-x-5">
        {SALES_PREMIUM_STYLE_LIST.map((style) => {
          const active = selected === style.id;
          return (
            <button
              key={style.id}
              type="button"
              onClick={() => choose(style.id)}
              className="group flex w-[88px] flex-col items-stretch text-left sm:w-[96px]"
              title={style.subtitle}
            >
              <div
                className={cn(
                  "overflow-hidden rounded-lg transition",
                  active
                    ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900"
                    : "ring-1 ring-slate-200/90 hover:ring-slate-300 dark:ring-white/15 dark:hover:ring-white/25"
                )}
              >
                <SalesPremiumStyleThumbnail styleId={style.id} />
              </div>
              <span
                className={cn(
                  "mt-1.5 truncate text-[11px] leading-tight sm:text-xs",
                  active
                    ? "font-semibold text-slate-900 dark:text-slate-100"
                    : "font-medium text-slate-600 group-hover:text-slate-800 dark:text-slate-400 dark:group-hover:text-slate-200"
                )}
              >
                {style.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
