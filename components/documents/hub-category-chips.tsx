"use client";

import { cn } from "@/lib/utils";

export type HubCategoryChip = {
  id: string;
  label: string;
  count: number;
};

type Props = {
  chips: HubCategoryChip[];
  activeId: string;
  onSelect: (id: string) => void;
  className?: string;
};

export function HubCategoryChips({ chips, activeId, onSelect, className }: Props) {
  return (
    <div className={cn("flex gap-1.5 overflow-x-auto pb-1", className)}>
      {chips.map((chip) => {
        const active = chip.id === activeId;
        return (
          <button
            key={chip.id}
            type="button"
            onClick={() => onSelect(chip.id)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-[11px] font-bold tabular-nums",
              active
                ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
                : "border-slate-200 text-slate-600 dark:border-white/10 dark:text-slate-400"
            )}
          >
            {chip.label}
            <span className={cn("ml-1", active ? "opacity-90" : "opacity-60")}>
              ({chip.count})
            </span>
          </button>
        );
      })}
    </div>
  );
}
