"use client";

import { Button } from "@/components/ui/button";
import {
  buildOrgPanelModule,
  PANEL_MODULE_CATALOG,
  panelModuleLabel,
} from "@/lib/panel-module-catalog";
import type { PanelSpec } from "@/lib/panel-layout";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type CatalogPayload = {
  modules: PanelSpec[];
  orgModules: PanelSpec[];
  builtInCount: number;
  updatedAt: string;
};

type ApiEnvelope = { ok: boolean; data?: CatalogPayload; error?: string };

/**
 * More → Panel catalog — admin-editable org modules for Design Studio.
 */
export function DesignPanelCatalogPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orgModules, setOrgModules] = useState<PanelSpec[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [manufacturer, setManufacturer] = useState("Waaree");
  const [wattage, setWattage] = useState(600);
  const [widthMm, setWidthMm] = useState(1134);
  const [heightMm, setHeightMm] = useState(2384);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/design-panel-catalog", { cache: "no-store" });
      const json = (await res.json()) as ApiEnvelope;
      if (!json.ok || !json.data) {
        throw new Error(json.error || "Could not load panel catalog.");
      }
      setOrgModules(json.data.orgModules);
      setUpdatedAt(json.data.updatedAt);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function persist(next: PanelSpec[]) {
    setSaving(true);
    try {
      const res = await fetch("/api/design-panel-catalog", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgModules: next }),
      });
      const json = (await res.json()) as ApiEnvelope;
      if (!json.ok || !json.data) {
        throw new Error(json.error || "Save failed");
      }
      setOrgModules(json.data.orgModules);
      setUpdatedAt(json.data.updatedAt);
      toast.success("Panel catalog saved", "Design Studio will use this list for all users.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function handleAdd() {
    const next = buildOrgPanelModule({ manufacturer, wattage, width_mm: widthMm, height_mm: heightMm });
    const exists = orgModules.some((item) => item.catalog_id === next.catalog_id);
    if (exists) {
      toast.error("Already in catalog", panelModuleLabel(next));
      return;
    }
    void persist([next, ...orgModules]);
  }

  function handleRemove(catalogId: string | null | undefined) {
    if (!catalogId) return;
    void persist(orgModules.filter((item) => item.catalog_id !== catalogId));
  }

  if (loading) {
    return (
      <div className="flex min-h-[100px] items-center justify-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading panel catalog…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
        Built-in India modules ({PANEL_MODULE_CATALOG.length}) stay in the app. Add org modules
        here — watt + frame size (mm) from the datasheet. Every Design Studio user sees the merged
        list. No live market scrape.
      </p>

      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/[0.03]">
        <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
          Add org module
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
            Brand
            <input
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs dark:border-white/10 dark:bg-slate-950"
              placeholder="Waaree"
            />
          </label>
          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
            Watt
            <input
              type="number"
              min={100}
              max={2000}
              step={5}
              value={wattage}
              onChange={(e) => setWattage(Math.max(100, Number(e.target.value) || 100))}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs dark:border-white/10 dark:bg-slate-950"
            />
          </label>
          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
            Width mm
            <input
              type="number"
              min={100}
              max={5000}
              value={widthMm}
              onChange={(e) => setWidthMm(Math.max(100, Number(e.target.value) || 100))}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs dark:border-white/10 dark:bg-slate-950"
            />
          </label>
          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
            Height mm
            <input
              type="number"
              min={100}
              max={5000}
              value={heightMm}
              onChange={(e) => setHeightMm(Math.max(100, Number(e.target.value) || 100))}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs dark:border-white/10 dark:bg-slate-950"
            />
          </label>
        </div>
        <Button
          type="button"
          size="sm"
          className="mt-3 gap-1.5"
          disabled={saving || !manufacturer.trim()}
          onClick={handleAdd}
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Add to catalog
        </Button>
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
            Org modules ({orgModules.length})
          </p>
          {updatedAt ? (
            <p className="text-[10px] text-slate-400">
              Updated {new Date(updatedAt).toLocaleString()}
            </p>
          ) : null}
        </div>
        {orgModules.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500">
            None yet — Design Studio still has the built-in list.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-slate-200 rounded-xl border border-slate-200 dark:divide-white/10 dark:border-white/10">
            {orgModules.map((item) => (
              <li
                key={item.catalog_id ?? item.model}
                className="flex items-center justify-between gap-2 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {panelModuleLabel(item)}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {item.width_mm} × {item.height_mm} mm
                  </p>
                </div>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleRemove(item.catalog_id)}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 dark:hover:bg-red-950/40"
                  aria-label={`Remove ${panelModuleLabel(item)}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
