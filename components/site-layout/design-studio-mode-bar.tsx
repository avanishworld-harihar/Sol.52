"use client";

import { cn } from "@/lib/utils";
import {
  DESIGN_STUDIO_INSPECTOR_MODE_LABELS,
  type DesignStudioInspectorMode,
} from "./design-studio-inspector-mode";

const MODES: DesignStudioInspectorMode[] = [
  "locate",
  "roof",
  "panels",
  "shadow",
  "eng",
  "layers",
  "labels",
];

export function DesignStudioModeBar({
  mode,
  onChange,
  mobileViewOnly,
}: {
  mode: DesignStudioInspectorMode;
  onChange: (mode: DesignStudioInspectorMode) => void;
  mobileViewOnly?: boolean;
}) {
  const visible = mobileViewOnly
    ? (["shadow", "layers"] as DesignStudioInspectorMode[])
    : MODES;

  return (
    <div className="flex shrink-0 items-center gap-0.5 overflow-x-auto border-b border-slate-200 bg-slate-50/95 px-2 py-1.5 scrollbar-none dark:border-white/10 dark:bg-slate-900/90">
      {visible.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn(
            "shrink-0 rounded-md px-2.5 py-1.5 text-[11px] font-bold tracking-wide transition",
            mode === id
              ? "bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900"
              : "text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
          )}
        >
          {DESIGN_STUDIO_INSPECTOR_MODE_LABELS[id]}
        </button>
      ))}
    </div>
  );
}
