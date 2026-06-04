"use client";

import { Button } from "@/components/ui/button";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import {
  addCatalogBrand,
  applyActiveBrandToConfig,
  ensureBrandCatalog,
} from "@/lib/residential-brand-catalog";
import { wireBrandDisplayName } from "@/lib/residential-deck-helpers";
import {
  addInverterPresetToCatalog,
  addWirePresetToCatalog,
  listInverterPresets,
  listWirePresets,
  wirePresetId,
} from "@/lib/residential-equipment-presets";
import type {
  ResidentialBrandOption,
  ResidentialProposalConfig,
  ResidentialWireBrand,
} from "@/lib/residential-requirements-schema";
import { cn } from "@/lib/utils";
import { Cable, Cpu, Plus, Sun, Trash2 } from "lucide-react";
import { useState } from "react";

type Props = {
  config: ResidentialProposalConfig;
  onChange: (next: ResidentialProposalConfig) => void;
  isCommercial?: boolean;
};

function toggleBrand(
  list: ResidentialBrandOption[] | undefined,
  option: ResidentialBrandOption,
  max: number
): ResidentialBrandOption[] {
  const cur = list ?? [];
  const key = option.brandId ?? option.brand;
  const exists = cur.some((b) => (b.brandId ?? b.brand) === key);
  if (exists) return cur.filter((b) => (b.brandId ?? b.brand) !== key);
  if (cur.length >= max) return cur;
  return [...cur, option];
}

function SectionTitle({
  icon: Icon,
  title,
  hint,
}: {
  icon: React.ElementType;
  title: string;
  hint?: string;
}) {
  return (
    <div className="mb-2">
      <p className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
        <Icon className="h-4 w-4 shrink-0 text-indigo-500" aria-hidden />
        {title}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p> : null}
    </div>
  );
}

export function ResidentialEquipmentBrandsSection({ config, onChange, isCommercial = false }: Props) {
  const normalized = ensureBrandCatalog(config);
  const catalog = normalized.brandCatalog!;
  const catalogBrands = catalog.entries ?? [];
  const inverterPresets = listInverterPresets(catalog);
  const wirePresets = listWirePresets(catalog);
  const solar = config.solar;
  const pricing = config.pricing ?? {};
  const panelOpts = config.panelBrandOptions ?? [];
  const invOpts = config.inverterBrandOptions ?? [];
  const wireOpts = pricing.wireBrandOptions?.length
    ? pricing.wireBrandOptions
    : pricing.wireBrand
      ? [pricing.wireBrand]
      : (["polycab"] as ResidentialWireBrand[]);

  const [addingInverter, setAddingInverter] = useState(false);
  const [newInverter, setNewInverter] = useState("");
  const [addingWire, setAddingWire] = useState(false);
  const [newWire, setNewWire] = useState("");
  const [addingPanel, setAddingPanel] = useState(false);
  const [newPanel, setNewPanel] = useState("");

  const activeChip = isCommercial
    ? "border-indigo-500 bg-indigo-600 text-white"
    : "border-emerald-600 bg-emerald-600 text-white";
  const wireActiveChip = isCommercial
    ? "border-slate-900 bg-slate-900 text-white"
    : "border-emerald-700 bg-emerald-700 text-white";

  function patch(partial: Partial<ResidentialProposalConfig>) {
    onChange(ensureBrandCatalog({ ...config, ...partial }));
  }

  function patchCatalog(nextCatalog: typeof catalog) {
    onChange({ ...config, brandCatalog: nextCatalog });
  }

  function patchPricing(partial: Partial<NonNullable<ResidentialProposalConfig["pricing"]>>) {
    onChange({ ...config, pricing: { ...pricing, ...partial } });
  }

  function patchPanelOptions(next: ResidentialBrandOption[]) {
    const primary = next[0];
    patch({
      panelBrandOptions: next,
      solar: primary ? { ...solar, brand: primary.brand, brandId: primary.brandId } : solar,
    });
  }

  function patchWireOptions(next: ResidentialWireBrand[]) {
    const wireBrandOptions = next.slice(0, 2);
    patchPricing({ wireBrandOptions, wireBrand: wireBrandOptions[0] ?? "polycab" });
  }

  function toggleWire(wire: string) {
    const id = wirePresetId(wire);
    const cur = wireOpts;
    if (cur.some((w) => wirePresetId(w) === id)) {
      patchWireOptions(cur.filter((w) => wirePresetId(w) !== id));
      return;
    }
    if (cur.length >= 2) return;
    patchWireOptions([...cur, id]);
  }

  function commitNewInverter() {
    const name = newInverter.trim();
    if (!name) {
      setAddingInverter(false);
      return;
    }
    const nextCatalog = addInverterPresetToCatalog(catalog, name);
    patchCatalog(nextCatalog);
    const cur = invOpts;
    if (cur.length < 2 && !cur.some((p) => p.brand.toLowerCase() === name.toLowerCase())) {
      patch({ inverterBrandOptions: [...cur, { brand: name }] });
    }
    setNewInverter("");
    setAddingInverter(false);
  }

  function commitNewWire() {
    const name = newWire.trim();
    if (!name) {
      setAddingWire(false);
      return;
    }
    const nextCatalog = addWirePresetToCatalog(catalog, name);
    patchCatalog(nextCatalog);
    const id = wirePresetId(name);
    const cur = wireOpts;
    if (cur.length < 2 && !cur.some((w) => wirePresetId(w) === id)) {
      patchWireOptions([...cur, id]);
    }
    setNewWire("");
    setAddingWire(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <SectionTitle icon={Sun} title="Panel brands (2–3)" hint="Saved to More → Rate card · any one on site." />
        <div className="flex flex-wrap gap-2">
          {catalogBrands.map((b) => {
            const active = panelOpts.some((p) => (p.brandId ?? p.brand) === b.brandId);
            return (
              <button
                key={b.brandId}
                type="button"
                onClick={() => onChange(applyActiveBrandToConfig(ensureBrandCatalog(config), b.brandId))}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-semibold",
                  active
                    ? "border-amber-500 bg-amber-50 text-amber-950 dark:bg-amber-950/40"
                    : "border-slate-200 text-slate-700 dark:border-white/15"
                )}
              >
                {b.brand}
              </button>
            );
          })}
          {!addingPanel && panelOpts.length < 3 ? (
            <button
              type="button"
              onClick={() => setAddingPanel(true)}
              className="inline-flex items-center gap-1 rounded-lg border border-dashed px-3 py-1.5 text-xs font-semibold text-slate-600"
            >
              <Plus className="h-3 w-3" /> Add brand
            </button>
          ) : null}
        </div>
        {addingPanel ? (
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end">
            <FloatingLabelInput
              label="New panel brand"
              value={newPanel}
              onChange={(e) => setNewPanel(e.target.value)}
              className="h-10 flex-1 rounded-lg text-sm font-semibold"
              autoFocus
            />
            <Button
              type="button"
              size="sm"
              onClick={() => {
                const name = newPanel.trim();
                if (name) onChange(addCatalogBrand(normalized, name));
                setNewPanel("");
                setAddingPanel(false);
              }}
            >
              Save
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setAddingPanel(false)}>
              Cancel
            </Button>
          </div>
        ) : null}
        {panelOpts.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {panelOpts.map((p, i) => (
              <li key={`p-${i}`} className="flex items-end gap-2">
                <FloatingLabelInput
                  label={`Panel ${i + 1}`}
                  value={p.brand}
                  onChange={(e) => {
                    const next = [...panelOpts];
                    next[i] = { ...p, brand: e.target.value };
                    patchPanelOptions(next);
                  }}
                  className="h-10 flex-1 rounded-lg text-sm font-semibold"
                />
                <button
                  type="button"
                  onClick={() => patchPanelOptions(panelOpts.filter((_, j) => j !== i))}
                  className="mb-0.5 flex h-10 w-10 items-center justify-center rounded-lg border text-slate-400 hover:text-rose-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div>
        <SectionTitle
          icon={Cpu}
          title="Inverter brands (2)"
          hint="Add a brand once — it appears here on every future proposal."
        />
        <div className="flex flex-wrap gap-2">
          {inverterPresets.map((name) => {
            const active = invOpts.some((p) => p.brand.toLowerCase() === name.toLowerCase());
            return (
              <button
                key={name}
                type="button"
                onClick={() => patch({ inverterBrandOptions: toggleBrand(invOpts, { brand: name }, 2) })}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-semibold",
                  active ? activeChip : "border-slate-200 text-slate-700 dark:border-white/15"
                )}
              >
                {name}
              </button>
            );
          })}
          {!addingInverter && invOpts.length < 2 ? (
            <button
              type="button"
              onClick={() => setAddingInverter(true)}
              className="inline-flex items-center gap-1 rounded-lg border border-dashed px-3 py-1.5 text-xs font-semibold text-slate-600"
            >
              <Plus className="h-3 w-3" /> Add brand
            </button>
          ) : null}
        </div>
        {addingInverter ? (
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end">
            <FloatingLabelInput
              label="New inverter brand"
              value={newInverter}
              onChange={(e) => setNewInverter(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && commitNewInverter()}
              className="h-10 flex-1 rounded-lg text-sm font-semibold"
              autoFocus
            />
            <Button type="button" size="sm" onClick={commitNewInverter}>
              Save
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setAddingInverter(false)}>
              Cancel
            </Button>
          </div>
        ) : null}
        {invOpts.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {invOpts.map((p, i) => (
              <li key={`inv-${i}`} className="flex items-end gap-2">
                <FloatingLabelInput
                  label={`Inverter ${i + 1}`}
                  value={p.brand}
                  onChange={(e) => {
                    const next = [...invOpts];
                    next[i] = { brand: e.target.value };
                    patch({ inverterBrandOptions: next });
                  }}
                  className="h-10 flex-1 rounded-lg text-sm font-semibold"
                />
                <button
                  type="button"
                  onClick={() => patch({ inverterBrandOptions: invOpts.filter((_, j) => j !== i) })}
                  className="mb-0.5 flex h-10 w-10 items-center justify-center rounded-lg border text-slate-400 hover:text-rose-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div>
        <SectionTitle
          icon={Cable}
          title="DC / AC wire (2)"
          hint="Add custom wire brands — saved for next proposal · shown on BOM."
        />
        <div className="flex flex-wrap gap-2">
          {wirePresets.map((label) => {
            const id = wirePresetId(label);
            const active = wireOpts.some((w) => wirePresetId(w) === id);
            return (
              <button
                key={label}
                type="button"
                onClick={() => toggleWire(label)}
                className={cn(
                  "rounded-lg border px-4 py-2 text-sm font-bold",
                  active ? wireActiveChip : "border-slate-200 bg-white dark:border-white/15"
                )}
              >
                {wireBrandDisplayName(id)}
              </button>
            );
          })}
          {!addingWire && wireOpts.length < 2 ? (
            <button
              type="button"
              onClick={() => setAddingWire(true)}
              className="inline-flex items-center gap-1 rounded-lg border border-dashed px-3 py-1.5 text-xs font-semibold text-slate-600"
            >
              <Plus className="h-3 w-3" /> Add brand
            </button>
          ) : null}
        </div>
        {addingWire ? (
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end">
            <FloatingLabelInput
              label="New wire brand"
              value={newWire}
              onChange={(e) => setNewWire(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && commitNewWire()}
              className="h-10 flex-1 rounded-lg text-sm font-semibold"
              autoFocus
            />
            <Button type="button" size="sm" onClick={commitNewWire}>
              Save
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setAddingWire(false)}>
              Cancel
            </Button>
          </div>
        ) : null}
        <p className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-400">
          On proposal:{" "}
          <span className="font-bold text-slate-900 dark:text-white">
            {wireOpts.map((w) => wireBrandDisplayName(w)).join(" / ") || "—"}
          </span>
        </p>
      </div>
    </div>
  );
}
