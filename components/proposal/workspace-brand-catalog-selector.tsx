"use client";

import { Button } from "@/components/ui/button";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import {
  WorkspaceFieldLabel,
  WorkspaceTouchChip,
  type WorkspaceTheme,
} from "@/components/proposal/workspace-mobile-ui";
import {
  addCatalogBrand,
  applyActiveBrandToConfig,
  ensureBrandCatalog,
  getActiveCatalogEntry,
  removeCatalogBrand,
  syncSolarAndPricingFromEntry,
  updateCatalogEntry,
} from "@/lib/residential-brand-catalog";
import type { ResidentialProposalConfig } from "@/lib/residential-requirements-schema";
import { cn } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

type Props = {
  config: ResidentialProposalConfig;
  onChange: (next: ResidentialProposalConfig) => void;
  theme?: WorkspaceTheme;
  className?: string;
};

/** Step 1 brand picker — select, rename, add, or remove catalog brands. */
export function WorkspaceBrandCatalogSelector({
  config,
  onChange,
  theme = "residential",
  className,
}: Props) {
  const normalized = ensureBrandCatalog(config);
  const entries = normalized.brandCatalog?.entries ?? [];
  const activeId = normalized.brandCatalog?.activeBrandId ?? entries[0]?.brandId;
  const activeEntry = entries.find((e) => e.brandId === activeId) ?? entries[0];
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

  function emit(next: ResidentialProposalConfig) {
    const withCatalog = ensureBrandCatalog(next);
    const entry = getActiveCatalogEntry(withCatalog);
    const track = withCatalog.solar.panelTrack ?? "dcr";
    if (entry && withCatalog.brandCatalog?.activeBrandId === entry.brandId) {
      onChange(syncSolarAndPricingFromEntry(withCatalog, entry, track));
      return;
    }
    onChange(withCatalog);
  }

  function selectBrand(brandId: string) {
    emit(applyActiveBrandToConfig(normalized, brandId));
  }

  function commitAdd() {
    const name = newName.trim();
    if (!name) {
      setAdding(false);
      setNewName("");
      return;
    }
    emit(addCatalogBrand(normalized, name));
    setNewName("");
    setAdding(false);
  }

  if (!entries.length) {
    return (
      <div className={className}>
        <WorkspaceFieldLabel>Brand</WorkspaceFieldLabel>
        <p className="mt-1 text-xs text-slate-500">No brands yet.</p>
        <Button type="button" variant="outline" size="sm" className="mt-2 gap-1" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" /> Add brand
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2.5", className)}>
      <WorkspaceFieldLabel>Brand</WorkspaceFieldLabel>
      <div className="flex flex-wrap gap-2">
        {entries.map((entry) => (
          <WorkspaceTouchChip
            key={entry.brandId}
            active={activeId === entry.brandId}
            theme={theme}
            onClick={() => selectBrand(entry.brandId)}
            className="min-w-[4.5rem] max-w-full px-3"
          >
            {entry.brand}
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
            label="New brand name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitAdd();
              if (e.key === "Escape") {
                setAdding(false);
                setNewName("");
              }
            }}
            className="h-11 flex-1 rounded-xl text-sm font-semibold"
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
                setNewName("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {activeEntry ? (
        <div className="flex flex-col gap-2 rounded-xl border border-slate-200/80 bg-white/90 p-2.5 dark:border-white/10 dark:bg-white/[0.03] sm:flex-row sm:flex-wrap sm:items-end">
          <div className="min-w-0 flex-1 sm:min-w-[10rem]">
            <label
              htmlFor={`brand-edit-${activeEntry.brandId}`}
              className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              Edit brand name
            </label>
            <input
              id={`brand-edit-${activeEntry.brandId}`}
              type="text"
              value={activeEntry.brand}
              onChange={(e) =>
                emit(updateCatalogEntry(normalized, activeEntry.brandId, { brand: e.target.value }))
              }
              className="ss-input h-11 w-full min-w-0 rounded-xl text-sm font-semibold"
            />
          </div>
          {entries.length > 1 ? (
            <button
              type="button"
              onClick={() => emit(removeCatalogBrand(normalized, activeEntry.brandId))}
              className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-1.5 rounded-xl border border-rose-200 px-3 text-sm font-semibold text-rose-700 touch-manipulation sm:w-auto dark:border-rose-900/50 dark:text-rose-300"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              Remove
            </button>
          ) : null}
        </div>
      ) : null}

      <p className="text-[11px] text-slate-500 dark:text-slate-400">
        kW pricing per brand: More → Rate card
      </p>
    </div>
  );
}
