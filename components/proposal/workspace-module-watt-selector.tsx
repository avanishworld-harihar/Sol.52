"use client";

import { Button } from "@/components/ui/button";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import {
  WorkspaceFieldLabel,
  WorkspaceTouchChip,
  type WorkspaceTheme,
} from "@/components/proposal/workspace-mobile-ui";
import {
  addModuleWattPreset,
  clampModuleWatt,
  removeModuleWattPreset,
  resolveModuleWattPresets,
} from "@/lib/module-watt-presets";
import type { ResidentialProposalConfig } from "@/lib/residential-requirements-schema";
import { cn } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

type Props = {
  config: ResidentialProposalConfig;
  /** Apply preset list changes and optional watt selection in one update (avoids stale config overwrites). */
  onChange: (next: ResidentialProposalConfig, selectWatt?: number) => void;
  isCommercial: boolean;
  theme?: WorkspaceTheme;
  plantKw: number;
  modules: number;
  className?: string;
};

/** Step 1 module Wp chips — select, add, or remove preset wattages. */
export function WorkspaceModuleWattSelector({
  config,
  onChange,
  isCommercial,
  theme = "residential",
  plantKw,
  modules,
  className,
}: Props) {
  const solar = config.solar;
  const presets = resolveModuleWattPresets(config, isCommercial);
  const activeWatt = solar.watt;
  const [adding, setAdding] = useState(false);
  const [newWatt, setNewWatt] = useState("");

  function commitAdd() {
    const parsed = Number(newWatt);
    if (!Number.isFinite(parsed) || parsed < 100) {
      setAdding(false);
      setNewWatt("");
      return;
    }
    const w = clampModuleWatt(parsed);
    onChange(addModuleWattPreset(config, w, isCommercial), w);
    setNewWatt("");
    setAdding(false);
  }

  function commitRemove() {
    if (presets.length <= 1) return;
    const next = removeModuleWattPreset(config, activeWatt, isCommercial);
    const remaining = resolveModuleWattPresets(next, isCommercial);
    if (remaining.length === presets.length) return;
    const fallback = remaining.includes(activeWatt) ? activeWatt : remaining[0]!;
    onChange(next, fallback);
  }

  const actionBtnClass = cn(
    "inline-flex min-h-11 items-center gap-1 rounded-xl border border-dashed px-2.5 text-sm font-semibold touch-manipulation",
    theme === "commercial"
      ? "border-indigo-300 text-indigo-700 dark:border-indigo-500/40 dark:text-indigo-300"
      : "border-emerald-300 text-emerald-800 dark:border-emerald-500/40 dark:text-emerald-300"
  );

  return (
    <div className={cn("space-y-2.5", className)}>
      <WorkspaceFieldLabel>Module (Wp)</WorkspaceFieldLabel>
      <p className="text-xs tabular-nums text-slate-600 dark:text-slate-400">
        {plantKw} kW → <strong>{modules} panels</strong>
      </p>
      <div className="flex flex-wrap gap-2">
        {presets.map((w) => (
          <WorkspaceTouchChip
            key={w}
            active={activeWatt === w}
            theme={theme}
            onClick={() => onChange(config, w)}
            className="min-w-[4rem] px-3"
          >
            {w}W
          </WorkspaceTouchChip>
        ))}
      </div>
      {!adding ? (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setAdding(true)} className={actionBtnClass}>
            <Plus className="h-4 w-4 shrink-0" aria-hidden />
            Add
          </button>
          {presets.length > 1 ? (
            <button
              type="button"
              onClick={commitRemove}
              title={`Remove ${activeWatt}W from list`}
              className={cn(
                actionBtnClass,
                "border-rose-200 text-rose-700 dark:border-rose-900/50 dark:text-rose-300"
              )}
            >
              <Trash2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="text-xs">Remove</span>
            </button>
          ) : null}
        </div>
      ) : null}

      {adding ? (
        <div className="flex flex-col gap-2 rounded-xl border border-slate-200/90 bg-white p-2.5 dark:border-white/10 dark:bg-white/[0.03] sm:flex-row sm:items-end">
          <FloatingLabelInput
            label="Module wattage (Wp)"
            inputMode="numeric"
            value={newWatt}
            onChange={(e) => setNewWatt(e.target.value.replace(/[^\d]/g, ""))}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitAdd();
              if (e.key === "Escape") {
                setAdding(false);
                setNewWatt("");
              }
            }}
            className="h-11 flex-1 rounded-xl text-sm font-semibold tabular-nums"
            autoFocus
          />
          <div className="flex gap-2">
            <Button type="button" size="sm" className="h-11 flex-1 sm:flex-none" onClick={commitAdd}>
              Add
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-11 flex-1 sm:flex-none"
              onClick={() => {
                setAdding(false);
                setNewWatt("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
