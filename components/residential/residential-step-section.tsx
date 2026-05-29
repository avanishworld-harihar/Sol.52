"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type Props = {
  step: number;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
};

/** Numbered section shell — residential emerald accent (mirrors CommercialStepSection). */
export function ResidentialStepSection({ step, title, subtitle, icon: Icon, children, className }: Props) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-emerald-200/60 bg-white shadow-sm dark:border-emerald-500/20 dark:bg-[#0c1017]",
        className
      )}
    >
      <div className="flex items-start gap-3 border-b border-emerald-100/80 px-4 py-3 dark:border-emerald-500/15 sm:px-5">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-xs font-bold text-white shadow-sm"
          aria-hidden
        >
          {step}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {Icon ? <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden /> : null}
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50">{title}</h3>
          </div>
          {subtitle ? (
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{subtitle}</p>
          ) : null}
        </div>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}
