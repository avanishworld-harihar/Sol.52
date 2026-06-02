"use client";

import { useLanguage } from "@/lib/language-context";
import { cn } from "@/lib/utils";

type DashboardGreetingProps = {
  name?: string;
  className?: string;
};

/**
 * Same glass language as dashboard cards (`glass-surface`) — no flat grey slab; light + simple.
 */
export function DashboardGreeting({ name = "Avanish", className }: DashboardGreetingProps) {
  const { t } = useLanguage();
  const now = new Date();
  const weekday = now.toLocaleDateString("en-IN", { weekday: "long" });
  const dateStr = now.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  return (
    <header className={cn("glass-surface relative overflow-hidden rounded-2xl p-4 sm:p-5", className)}>
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-brand-400/18 to-teal-400/14 blur-2xl dark:from-brand-500/15 dark:to-teal-500/12"
        aria-hidden
      />
      <div className="relative min-w-0">
        <h1 className="ws-type-hero font-bold text-brand-950 dark:text-[#FFFFFF]">
          {t("dashboard_greetingName", { name })}
        </h1>
        <div className="mt-2.5 flex flex-col gap-2.5 sm:mt-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          <span className="inline-flex w-fit items-center rounded-full border border-teal-500/25 bg-teal-500/[0.08] px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-teal-800 shadow-sm dark:border-teal-400/20 dark:bg-teal-400/[0.12] dark:text-teal-100 dark:shadow-[0_0_20px_rgba(45,212,191,0.12)] sm:text-[11px]">
            {t("dashboard_schedule")}
          </span>
          <p className="text-[13px] font-medium leading-snug text-slate-600 dark:text-[#8B949E] sm:text-sm">
            {weekday}, {dateStr}
          </p>
        </div>
      </div>
    </header>
  );
}
