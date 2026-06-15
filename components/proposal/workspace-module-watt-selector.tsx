"use client";

import { Button } from "@/components/ui/button";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { NumericTextInput } from "@/components/ui/numeric-text-input";
import {
  WorkspaceFieldLabel,
  WorkspaceTouchChip,
  type WorkspaceTheme,
} from "@/components/proposal/workspace-mobile-ui";
import {
  addModuleWattPreset,
  clampModuleWatt,
  removeModuleWattPreset,
  replaceModuleWattPreset,
  resolveModuleWattPresets,
} from "@/lib/module-watt-presets";
import type { ResidentialProposalConfig } from "@/lib/residential-requirements-schema";
import { cn } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

type Props = {
  config: ResidentialProposalConfig;
  onChange: (next: ResidentialProposalConfig) => void;
  onSelectWatt: (watt: number) => void;
  isCommercial: boolean;
  theme?: WorkspaceTheme;
  plantKw: number;
  modules: number;
  className?: string;
};

/** Step 1 module Wp chips — select, add, edit, or remove preset wattages. */
export function WorkspaceModuleWattSelector({
  config,
  onChange,
  onSelectWatt,
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

  function emit(next: ResidentialProposalConfig, selectWatt?: number) {
    onChange(next);
    if (selectWatt != null) onSelectWatt(selectWatt);
  }

  function selectWatt(w: number) {
    onSelectWatt(clampModuleWatt(w));
  }

  function commitAdd() {
    const parsed = Number(newWatt);
    if (!Number.isFinite(parsed) || parsed < 100) {
      setAdding(false);
      setNewWatt("");
      return;
    }
    const w = clampModuleWatt(parsed);
    emit(addModuleWattPreset(config, w, isCommercial), w);
    setNewWatt("");
    setAdding(false);
  }

  function commitRemove(watt: number) {
    const next = removeModuleWattPreset(config, watt, isCommercial);
    const remaining = resolveModuleWattPresets(next, isCommercial);
    if (remaining.length === presets.length) return;
    if (clampModuleWatt(watt) === activeWatt) {
      emit(next, remaining[0]!);
      return;
    }
    emit(next);
  }

  function commitEdit(fromWatt: number, toRaw: number | undefined) {
    if (toRaw == null || !Number.isFinite(toRaw) || toRaw < 100) return;
    const to = clampModuleWatt(toRaw);
    const from = clampModuleWatt(fromWatt);
    if (from === to) return;
    const next = replaceModuleWattPreset(config, from, to, isCommercial);
    if (activeWatt === from) {
      emit(next, to);
      return;
    }
    emit(next);
  }

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
            onClick={() => selectWatt(w)}
            className="min-w-[4rem] px-3"
          >
            {w}W
          </WorkspaceTouchChip>
        ))}
        {!adding ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className={cn(
              "inline-flex min-h-11 items-center gap-1 rounded-xl border border-dashed px-3 text-sm font-semibold touch-manipulation",
              theme === "commercial"
                ? "border-indigo-300 text-indigo-700 dark:border-indigo-500/40 dark:text-indigo-300"
                : "border-emerald-300 text-emerald-800 dark:border-emerald-500/40 dark:text-emerald-300"
            )}
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden />
            Add
          </button>
        ) : null}
      </div>

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

      {presets.includes(activeWatt) ? (
        <div className="flex flex-col gap-2 rounded-xl border border-slate-200/80 bg-white/90 p-2.5 dark:border-white/10 dark:bg-white/[0.03] sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Edit {activeWatt}W
            </label>
            <NumericTextInput
              integer
              value={activeWatt}
              onValueChange={(n) => commitEdit(activeWatt, n)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-2 text-center text-sm font-bold tabular-nums dark:border-white/15 dark:bg-white/5"
              aria-label="Edit module wattage"
            />
          </div>
          {presets.length > 1 ? (
            <button
              type="button"
              onClick={() => commitRemove(activeWatt)}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-rose-200 px-3 text-sm font-semibold text-rose-700 touch-manipulation dark:border-rose-900/50 dark:text-rose-300"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              Remove
            </button>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-2 rounded-xl border border-amber-200/80 bg-amber-50/50 p-2.5 dark:border-amber-900/40 dark:bg-amber-950/20 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Custom Wp
            </label>
            <NumericTextInput
              integer
              value={activeWatt}
              onValueChange={(n) => {
                if (n != null && n >= 100) onSelectWatt(clampModuleWatt(n));
              }}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-2 text-center text-sm font-bold tabular-nums dark:border-white/15 dark:bg-white/5"
              aria-label="Custom module wattage"
            />
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-11 shrink-0"
            onClick={() => emit(addModuleWattPreset(config, activeWatt, isCommercial), activeWatt)}
          >
            Save to list
          </Button>
        </div>
      )}
    </div>
  );
}