"use client";

import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";

export type WorkspaceTheme = "residential" | "commercial";

const themeRing = {
  residential: "accent-emerald-600",
  commercial: "accent-indigo-600",
};

const themeChipActive = {
  residential: "border-emerald-600 bg-emerald-600 text-white shadow-sm",
  commercial: "border-indigo-600 bg-indigo-600 text-white shadow-sm",
};

const themeChipIdle =
  "border-slate-200 bg-white text-slate-800 dark:border-white/15 dark:bg-white/5 dark:text-slate-200";

/** Horizontal scroll metrics — thumb-friendly on phones. */
export function WorkspaceMetricStrip({
  items,
  className,
}: {
  items: { label: string; value: string }[];
  className?: string;
}) {
  return (
    <div className={cn("-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 scrollbar-none", className)}>
      {items.map((item) => (
        <div
          key={item.label}
          className="min-w-[5.5rem] shrink-0 rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-center shadow-sm dark:border-white/10 dark:bg-white/5"
        >
          <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">{item.label}</p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-slate-900 dark:text-white">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

/** Min 44px touch target chip. */
export function WorkspaceTouchChip({
  active,
  children,
  onClick,
  theme = "residential",
  className,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  theme?: WorkspaceTheme;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 min-w-[2.75rem] items-center justify-center rounded-xl border px-3 text-sm font-semibold tabular-nums touch-manipulation transition-colors",
        active ? themeChipActive[theme] : themeChipIdle,
        className
      )}
    >
      {children}
    </button>
  );
}

export function WorkspaceFieldLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-sm font-bold text-slate-900 dark:text-white", className)}>{children}</p>;
}

/** Collapsible block for optional fields — keeps step 1 short on mobile. */
export function WorkspaceOptionalFold({
  title,
  children,
  defaultOpen = false,
  theme = "residential",
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  theme?: WorkspaceTheme;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const border =
    theme === "commercial"
      ? "border-indigo-200/70 dark:border-indigo-500/25"
      : "border-emerald-200/70 dark:border-emerald-500/25";

  return (
    <div className={cn("rounded-xl border bg-white/60 dark:bg-white/[0.03]", border)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-12 w-full items-center justify-between gap-2 px-3 py-2.5 text-left touch-manipulation"
        aria-expanded={open}
      >
        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</span>
        <ChevronDown
          className={cn("h-5 w-5 shrink-0 text-slate-400 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {open ? <div className="space-y-3 border-t border-slate-200/80 px-3 py-3 dark:border-white/10">{children}</div> : null}
    </div>
  );
}

/** Compact step card — collapsible on small screens. */
export function WorkspaceStepCard({
  step,
  title,
  subtitle,
  icon: Icon,
  children,
  theme = "residential",
  defaultOpen = true,
  className,
}: {
  step: number;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  theme?: WorkspaceTheme;
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const isCommercial = theme === "commercial";

  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border bg-white shadow-sm dark:bg-[#0c1017]",
        isCommercial ? "border-indigo-200/60 dark:border-indigo-500/20" : "border-emerald-200/60 dark:border-emerald-500/20",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full min-h-12 items-center gap-3 px-3 py-3 text-left touch-manipulation sm:cursor-default sm:pointer-events-none",
          isCommercial ? "border-b border-indigo-100/80 dark:border-indigo-500/15" : "border-b border-emerald-100/80 dark:border-emerald-500/15"
        )}
        aria-expanded={open}
      >
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white",
            isCommercial ? "bg-indigo-600" : "bg-emerald-600"
          )}
        >
          {step}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {Icon ? (
              <Icon className={cn("h-4 w-4", isCommercial ? "text-indigo-600" : "text-emerald-600")} aria-hidden />
            ) : null}
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50">{title}</h3>
          </div>
          {subtitle ? (
            <p className="mt-0.5 hidden text-xs text-slate-500 dark:text-slate-400 sm:block">{subtitle}</p>
          ) : null}
        </div>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-slate-400 transition-transform sm:hidden",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>
      <div className={cn("p-3 sm:p-4", !open && "hidden sm:block")}>{children}</div>
    </section>
  );
}

export function workspaceSliderClass(theme: WorkspaceTheme) {
  return cn("h-3 w-full touch-manipulation", themeRing[theme]);
}

export function workspaceStickySaveClass() {
  return "sticky bottom-0 z-10 -mx-4 border-t border-slate-200/90 bg-white/95 px-4 py-3 backdrop-blur-md dark:border-white/10 dark:bg-[#0c1017]/95 sm:-mx-5 pb-[max(0.75rem,env(safe-area-inset-bottom))]";
}
