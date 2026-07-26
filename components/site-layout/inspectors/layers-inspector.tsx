"use client";

import type { PlacedPanel } from "@/lib/panel-layout";
import type { SiteObstruction } from "@/lib/site-layout";
import { Eye, EyeOff, Layers, Lock, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";

const OBS_LABELS: Record<string, string> = {
  water_tank: "Water tank",
  tree: "Tree",
  chimney: "Chimney",
  parapet: "Parapet",
  other: "Other",
};

export function DesignStudioLayersInspector({
  roofSectionCount,
  activeRoofIndex,
  onSelectRoofSection,
  panels,
  selectedPanelIds,
  onSelectAllPanels,
  onClearPanelSelection,
  obstructions,
  selectedObstructionId,
  onSelectObstruction,
  showPanels,
  showObstructions,
  showShadows,
  onToggleShowPanels,
  onToggleShowObstructions,
  onToggleShowShadows,
  mobileViewOnly,
}: {
  roofSectionCount: number;
  activeRoofIndex: number;
  onSelectRoofSection: (index: number) => void;
  panels: PlacedPanel[];
  selectedPanelIds: string[];
  onSelectAllPanels: () => void;
  onClearPanelSelection: () => void;
  obstructions: SiteObstruction[];
  selectedObstructionId: string | null;
  onSelectObstruction: (id: string | null) => void;
  showPanels: boolean;
  showObstructions: boolean;
  showShadows: boolean;
  onToggleShowPanels: () => void;
  onToggleShowObstructions: () => void;
  onToggleShowShadows: () => void;
  mobileViewOnly?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <Layers className="h-4 w-4 text-slate-500" aria-hidden />
        <p className="text-xs font-extrabold text-slate-900 dark:text-white">Layers</p>
      </div>
      <p className="text-[10px] leading-relaxed text-slate-500">
        Select a layer to focus it on the map. Eye toggles hide overlays only — design data stays
        saved.
      </p>

      <div className="space-y-1 rounded-lg border border-slate-200 p-1.5 dark:border-white/10">
        <p className="px-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
          Visibility
        </p>
        <VisRow label="Panels" on={showPanels} onToggle={onToggleShowPanels} />
        <VisRow
          label="Obstructions"
          on={showObstructions}
          onToggle={onToggleShowObstructions}
        />
        <VisRow label="Shadows" on={showShadows} onToggle={onToggleShowShadows} />
      </div>

      <div className="space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
          Roof sections ({roofSectionCount})
        </p>
        {roofSectionCount === 0 ? (
          <p className="text-[11px] text-slate-500">No roof drawn yet.</p>
        ) : (
          Array.from({ length: roofSectionCount }, (_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onSelectRoofSection(index)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg border px-2.5 py-2 text-left text-[11px] font-semibold",
                activeRoofIndex === index
                  ? "border-teal-600 bg-teal-50 text-teal-900 dark:border-teal-500 dark:bg-teal-950/40 dark:text-teal-100"
                  : "border-slate-200 text-slate-700 dark:border-white/10 dark:text-slate-200"
              )}
            >
              Section {index + 1}
            </button>
          ))
        )}
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Panels ({panels.length})
          </p>
          {!mobileViewOnly && panels.length > 0 ? (
            <div className="flex gap-1">
              <button
                type="button"
                className="text-[10px] font-bold text-blue-700 hover:underline"
                onClick={onSelectAllPanels}
              >
                Select all
              </button>
              <button
                type="button"
                className="text-[10px] font-bold text-slate-500 hover:underline"
                onClick={onClearPanelSelection}
              >
                Clear
              </button>
            </div>
          ) : null}
        </div>
        {panels.length === 0 ? (
          <p className="text-[11px] text-slate-500">No panels placed.</p>
        ) : (
          <div className="max-h-36 space-y-0.5 overflow-y-auto rounded-lg border border-slate-100 p-1 dark:border-white/5">
            {panels.slice(0, 40).map((panel) => {
              const selected = selectedPanelIds.includes(panel.id);
              return (
                <div
                  key={panel.id}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-semibold",
                    selected
                      ? "bg-blue-50 text-blue-900 dark:bg-blue-950/40 dark:text-blue-100"
                      : "text-slate-600 dark:text-slate-300"
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">{panel.id}</span>
                  {panel.is_locked ? (
                    <Lock className="h-3 w-3 shrink-0 opacity-60" aria-hidden />
                  ) : (
                    <Unlock className="h-3 w-3 shrink-0 opacity-40" aria-hidden />
                  )}
                </div>
              );
            })}
            {panels.length > 40 ? (
              <p className="px-2 py-1 text-[10px] text-slate-400">+{panels.length - 40} more</p>
            ) : null}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
          Obstructions ({obstructions.length})
        </p>
        {obstructions.length === 0 ? (
          <p className="text-[11px] text-slate-500">None placed.</p>
        ) : (
          obstructions.map((obs) => {
            const selected = selectedObstructionId === obs.id;
            const label = OBS_LABELS[obs.type] ?? obs.type;
            return (
              <button
                key={obs.id}
                type="button"
                onClick={() => onSelectObstruction(selected ? null : obs.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg border px-2.5 py-2 text-left text-[11px] font-semibold",
                  selected
                    ? "border-blue-600 bg-blue-50 text-blue-900 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-100"
                    : "border-slate-200 text-slate-700 dark:border-white/10 dark:text-slate-200"
                )}
              >
                <span>{label}</span>
                <span className="text-[10px] font-medium text-slate-400">
                  {obs.height_ft != null ? `${obs.height_ft} ft` : ""}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function VisRow({
  label,
  on,
  onToggle,
}: {
  label: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5"
    >
      <span>{label}</span>
      {on ? (
        <Eye className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
      ) : (
        <EyeOff className="h-3.5 w-3.5 text-slate-400" aria-hidden />
      )}
    </button>
  );
}
