"use client";

import { Languages } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { cn } from "@/lib/utils";

/**
 * Segmented language control — EN | local script.
 * Brand teal active segment (matches nav rail), compact for top bar + rail.
 */
export function LanguageToggle({ className }: { className?: string }) {
  const { mode, setMode, localScriptLabel, localShortLabel, t } = useLanguage();
  const isEn = mode === "en";

  return (
    <div
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-slate-200/90 bg-white/80 p-0.5",
        "shadow-[0_1px_2px_rgba(15,35,62,0.04),inset_0_1px_0_rgba(255,255,255,0.9)]",
        "dark:border-white/12 dark:bg-white/[0.06] dark:shadow-none",
        "sm:h-9 sm:gap-1.5 sm:rounded-xl sm:px-1",
        className
      )}
      role="group"
      aria-label={t("language_toggleAria")}
    >
      <Languages
        className="ml-1 hidden h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500 sm:block"
        strokeWidth={2.25}
        aria-hidden
      />
      <div className="flex h-full min-w-0 flex-1 items-stretch gap-0.5">
        <button
          type="button"
          onClick={() => setMode("en")}
          className={cn(
            "flex min-w-[2rem] flex-1 items-center justify-center rounded-md px-2 text-[10px] font-extrabold tracking-wide transition-all duration-200 sm:min-w-[2.35rem] sm:rounded-lg sm:text-[11px]",
            isEn
              ? "bg-teal-600 text-white shadow-sm dark:bg-teal-500"
              : "text-slate-500 hover:bg-slate-100/90 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/[0.08] dark:hover:text-slate-100"
          )}
          aria-pressed={isEn}
        >
          EN
        </button>
        <button
          type="button"
          onClick={() => setMode("local")}
          className={cn(
            "flex min-w-[2rem] flex-1 items-center justify-center rounded-md px-2 text-[12px] font-bold leading-none transition-all duration-200 sm:min-w-[2.35rem] sm:rounded-lg sm:text-[13px]",
            !isEn
              ? "bg-teal-600 text-white shadow-sm dark:bg-teal-500"
              : "text-slate-500 hover:bg-slate-100/90 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/[0.08] dark:hover:text-slate-100"
          )}
          aria-pressed={!isEn}
          title={localShortLabel}
        >
          <span className="select-none" aria-hidden>
            {localScriptLabel}
          </span>
          <span className="sr-only">{localShortLabel}</span>
        </button>
      </div>
    </div>
  );
}
