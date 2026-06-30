import { cn } from "@/lib/utils";

/** Shared shell for operations dashboard panels */
export function opsPanelClass(className?: string) {
  return cn(
    "rounded-2xl border border-slate-200/90 bg-white shadow-[0_8px_30px_-12px_rgba(15,23,42,0.1)] dark:border-white/10 dark:bg-[#0c1017]",
    className
  );
}

export function opsPanelTitleClass(className?: string) {
  return cn(
    "text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400 sm:text-xs",
    className
  );
}
