"use client";

/**
 * Guided requirement-based builder — homeowner & commercial-friendly.
 * Panel brand + DCR/Non-DCR live here; pricing matrix stays in More → Rate card.
 */

import { NumericTextInput } from "@/components/ui/numeric-text-input";
import { cn } from "@/lib/utils";
import {
  estimateResidentialEmiInr,
  moduleCountForResidential,
  quoteResidentialSolar,
} from "@/lib/residential-solar-engine";
import type { ResidentialProposalConfig } from "@/lib/residential-requirements-schema";
import { PANEL_CATALOG } from "@/lib/commercial-panel-catalog";
import {
  ensureBrandCatalog,
  getActiveCatalogEntry,
  impliedRatePerWpFromPlant,
  syncSolarAndPricingFromEntry,
} from "@/lib/residential-brand-catalog";
import { WorkspaceBrandCatalogSelector } from "@/components/proposal/workspace-brand-catalog-selector";
import { WorkspaceModuleWattSelector } from "@/components/proposal/workspace-module-watt-selector";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  WorkspaceFieldLabel,
  WorkspaceMetricStrip,
  WorkspaceOptionalFold,
  WorkspaceTouchChip,
  workspaceSliderClass,
} from "@/components/proposal/workspace-mobile-ui";
import { persistEquipmentSelectionsFromConfig } from "@/lib/residential-equipment-presets";
import { IndianRupee } from "lucide-react";

type Props = {
  config: ResidentialProposalConfig;
  onChange: (next: ResidentialProposalConfig) => void;
  /** Commercial: commit plant kW without stale full-config merges. */
  onCommitPlantKw?: (kw: number) => void;
  onPlantKwEditStart?: () => void;
  netCostInr: number;
  annualSavingInr: number;
  /** Max plant capacity kW — drives slider range. Set 1000 for commercial. */
  maxPlantKw?: number;
  /** @deprecated use variant */
  segmentLabel?: string;
  variant?: "residential" | "commercial";
  className?: string;
};

const DECIMAL_KW_RE = /^[0-9]*\.?[0-9]*$/;

/** Commercial kW field — local draft until blur/Enter so parent state does not fight keystrokes. */
function CommercialPlantKwControl({
  kw,
  sliderMax,
  sliderStep,
  onCommit,
  onEditStart,
}: {
  kw: number;
  sliderMax: number;
  sliderStep: number;
  onCommit: (kw: number) => void;
  onEditStart?: () => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const draftRef = useRef<string | null>(null);

  useEffect(() => {
    if (!focused) {
      setDraft(null);
      draftRef.current = null;
    }
  }, [kw, focused]);

  const display = focused && draft !== null ? draft : String(kw);

  function commitRaw(raw: string) {
    if (raw === "" || raw === ".") return;
    const n = parseFloat(raw);
    if (!Number.isFinite(n) || n <= 0) return;
    onCommit(n);
  }

  function setDraftValue(raw: string) {
    draftRef.current = raw;
    setDraft(raw);
  }

  return (
    <>
      <input
        type="range"
        min={0.5}
        max={sliderMax}
        step={sliderStep}
        value={Math.min(Math.max(kw, 0.5), sliderMax)}
        onChange={(e) => onCommit(parseFloat(e.target.value))}
        className={workspaceSliderClass("commercial")}
      />
      <input
        type="text"
        inputMode="decimal"
        value={display}
        onFocus={() => {
          onEditStart?.();
          setFocused(true);
          setDraftValue(String(kw));
        }}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw !== "" && !DECIMAL_KW_RE.test(raw)) return;
          setDraftValue(raw);
        }}
        onBlur={() => {
          const raw = draftRef.current ?? draft ?? display;
          commitRaw(raw);
          setFocused(false);
          setDraft(null);
          draftRef.current = null;
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            const raw = draftRef.current ?? draft ?? display;
            commitRaw(raw);
            setFocused(false);
            setDraft(null);
            draftRef.current = null;
            e.currentTarget.blur();
          }
        }}
        className="w-28 rounded-xl border border-slate-200 bg-white px-2 py-2 text-center text-sm font-bold tabular-nums dark:border-white/15 dark:bg-white/5"
        aria-label="System size kW"
      />
    </>
  );
}

export function ResidentialRequirementBuilder({
  config,
  onChange,
  onCommitPlantKw,
  onPlantKwEditStart,
  netCostInr,
  annualSavingInr,
  maxPlantKw = 50,
  segmentLabel,
  variant = segmentLabel?.toLowerCase().includes("commercial") ? "commercial" : "residential",
  className,
}: Props) {
  const solar = config.solar;
  const quote = quoteResidentialSolar(solar);
  const modules = moduleCountForResidential(solar);
  const fin = config.financing ?? { enabled: true, interestRatePct: 10.5, selectedTenureYears: 5 };
  const emi = fin.enabled
    ? estimateResidentialEmiInr(netCostInr, fin.interestRatePct ?? 10.5, fin.selectedTenureYears ?? 5)
    : 0;
  const monthlySaving = Math.round(annualSavingInr / 12);
  const isCommercial = variant === "commercial";

  // Catalog brands for brand selector
  const catalogWithEntries = ensureBrandCatalog(config);
  const rateCardMaxKw = useMemo(() => {
    if (!isCommercial) return null;
    const entry = getActiveCatalogEntry(catalogWithEntries);
    const tiers = entry?.kwTiers ?? [];
    if (!tiers.length) return null;
    return Math.max(...tiers.map((t) => t.kw));
  }, [isCommercial, catalogWithEntries]);

  function patch(partial: Partial<ResidentialProposalConfig>) {
    onChange({ ...config, ...partial });
  }

  function patchSolar(partial: Partial<typeof solar>) {
    onChange({ ...config, solar: { ...solar, ...partial } });
  }

  function commitConfig(next: ResidentialProposalConfig) {
    onChange(next);
    persistEquipmentSelectionsFromConfig(next);
  }

  function applyTrack(track: "dcr" | "non_dcr") {
    const entry = getActiveCatalogEntry(catalogWithEntries);
    if (entry) {
      commitConfig(syncSolarAndPricingFromEntry(catalogWithEntries, entry, track));
      return;
    }
    const catalogTrack = track === "dcr" ? "DCR" : "NON_DCR";
    const hit = PANEL_CATALOG.find(
      (e) => e.brandId === solar.brandId && e.watt === solar.watt && e.panelType === catalogTrack
    );
    commitConfig({
      ...config,
      solar: {
        ...solar,
        panelTrack: track,
        moduleCountOverride: undefined,
        ratePerWpInr: hit?.ratePerWpInr ?? solar.ratePerWpInr,
      },
    });
  }

  /** Module preset list + watt — single onChange so preset edits are not wiped by stale config. */
  function applyModuleConfigChange(next: ResidentialProposalConfig, selectWatt?: number) {
    if (selectWatt == null) {
      commitConfig(next);
      return;
    }
    const w = Math.max(100, Math.min(900, Math.round(selectWatt)));
    const catalog = ensureBrandCatalog(next);
    const entry = getActiveCatalogEntry(catalog);
    if (entry) {
      commitConfig({
        ...next,
        solar: {
          ...next.solar,
          watt: w,
          moduleCountOverride: undefined,
          ratePerWpInr: impliedRatePerWpFromPlant(next.solar, entry, next.solar.panelTrack ?? "dcr"),
          technology: next.solar.technology,
        },
      });
      return;
    }
    const catalogTrack = next.solar.panelTrack === "dcr" ? "DCR" : "NON_DCR";
    const hit =
      PANEL_CATALOG.find(
        (e) => e.brandId === next.solar.brandId && e.watt === w && e.panelType === catalogTrack
      ) ?? PANEL_CATALOG.find((e) => e.watt === w && e.panelType === catalogTrack);
    commitConfig({
      ...next,
      solar: {
        ...next.solar,
        watt: w,
        moduleCountOverride: undefined,
        ratePerWpInr: hit?.ratePerWpInr ?? next.solar.ratePerWpInr,
        technology: hit?.technology ?? next.solar.technology,
      },
    });
  }

  // Slider UX: step scales with range; commercial slider grows with typed kW up to schema max
  const plantKwCap = isCommercial ? Math.min(10000, maxPlantKw) : maxPlantKw;
  const sliderMax = isCommercial
    ? Math.max(plantKwCap, solar.plantCapacityKw, 100)
    : maxPlantKw;
  const sliderStep = isCommercial
    ? sliderMax > 500
      ? 10
      : sliderMax > 200
        ? 5
        : sliderMax > 50
          ? 1
          : 0.5
    : sliderMax > 500
      ? 25
      : sliderMax > 200
        ? 5
        : sliderMax > 50
          ? 1
          : 0.5;

  function applyPlantKw(raw: number | undefined) {
    if (raw == null || !Number.isFinite(raw) || raw <= 0) return;
    const cap = isCommercial ? 10000 : plantKwCap;
    const kw = Math.max(0.5, Math.min(cap, Math.round(raw * 10) / 10));
    if (onCommitPlantKw) {
      onCommitPlantKw(kw);
      return;
    }
    patchSolar({ plantCapacityKw: kw, moduleCountOverride: undefined });
  }

  const theme = isCommercial ? "commercial" : "residential";
  const wattBoxBorder = isCommercial
    ? "border-indigo-200/80 bg-indigo-50/40 dark:border-indigo-500/25 dark:bg-indigo-950/20"
    : "border-emerald-200/80 bg-emerald-50/40 dark:border-emerald-500/25 dark:bg-emerald-950/20";

  return (
    <div
      className={cn(
        "space-y-3 rounded-2xl border p-3 shadow-sm sm:space-y-4 sm:p-5",
        isCommercial
          ? "border-indigo-200/70 bg-white dark:border-indigo-500/25 dark:bg-[#0c1017]"
          : "border-emerald-200/80 bg-white dark:border-emerald-900/40 dark:bg-[#0c1017]",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white",
            isCommercial ? "bg-indigo-600" : "bg-emerald-600"
          )}
        >
          1
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Plant & panels</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Rates in More → Rate card</p>
        </div>
      </div>

      <WorkspaceMetricStrip
        items={[
          { label: "Plant", value: `${quote.actualKw} kW` },
          { label: "Panels", value: `${modules}×${solar.watt}` },
          {
            label: "Save/mo",
            value:
              monthlySaving >= 100000
                ? `₹${(monthlySaving / 100000).toFixed(1)}L`
                : monthlySaving >= 1000
                  ? `₹${Math.round(monthlySaving / 1000)}k`
                  : `₹${monthlySaving}`,
          },
          { label: "EMI", value: fin.enabled ? `₹${emi.toLocaleString("en-IN")}` : "—" },
        ]}
      />

      <section className="space-y-2">
        <WorkspaceFieldLabel>Plant size (kW)</WorkspaceFieldLabel>
        {isCommercial && rateCardMaxKw != null ? (
          <p className="hidden text-xs text-slate-500 sm:block">Rate card up to {rateCardMaxKw} kW — larger sizes use nearest tier.</p>
        ) : null}
        <div className="flex items-center gap-2">
          {isCommercial && onCommitPlantKw ? (
            <CommercialPlantKwControl
              kw={solar.plantCapacityKw}
              sliderMax={sliderMax}
              sliderStep={sliderStep}
              onCommit={applyPlantKw}
              onEditStart={onPlantKwEditStart}
            />
          ) : (
            <>
              <input
                type="range"
                min={1}
                max={sliderMax}
                step={sliderStep}
                value={Math.min(solar.plantCapacityKw, sliderMax)}
                onPointerDown={onPlantKwEditStart}
                onChange={(e) => applyPlantKw(parseFloat(e.target.value))}
                className={cn("flex-1", workspaceSliderClass(theme))}
              />
              <NumericTextInput
                value={solar.plantCapacityKw}
                onFocus={onPlantKwEditStart}
                onValueChange={(n) => applyPlantKw(n)}
                className="w-28 rounded-xl border border-slate-200 bg-white px-2 py-2 text-center text-sm font-bold tabular-nums dark:border-white/15 dark:bg-white/5"
                aria-label="System size kW"
              />
            </>
          )}
          <span className="text-sm font-bold text-slate-600">kW</span>
        </div>
      </section>

      <section className={cn("space-y-2.5 rounded-xl border p-3", wattBoxBorder)}>
        <WorkspaceModuleWattSelector
          config={config}
          onChange={applyModuleConfigChange}
          isCommercial={isCommercial}
          theme={theme}
          plantKw={solar.plantCapacityKw}
          modules={modules}
        />
      </section>

      <section className="space-y-2.5 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/5">
        <WorkspaceBrandCatalogSelector config={config} onChange={commitConfig} theme={theme} />
        <WorkspaceFieldLabel className="mt-2">Quote mode</WorkspaceFieldLabel>
        <div className="flex flex-wrap gap-2">
          {(["dcr", "non_dcr"] as const).map((t) => (
            <WorkspaceTouchChip
              key={t}
              active={solar.panelTrack === t}
              theme={theme}
              onClick={() => applyTrack(t)}
            >
              {t === "dcr" ? "DCR" : "Non-DCR"}
            </WorkspaceTouchChip>
          ))}
        </div>
      </section>

      {!isCommercial ? (
      <WorkspaceOptionalFold
        title="Home & financing"
        hint="Roof type, budget, battery backup & loan EMI — tap to expand"
        theme="residential"
        className="mt-1"
      >
      <div className="grid gap-3 sm:grid-cols-2">
        <section className="space-y-2">
          <WorkspaceFieldLabel>Roof</WorkspaceFieldLabel>
          <div className="flex flex-wrap gap-2">
            {(["flat", "slope", "mixed", "unknown"] as const).map((r) => (
              <WorkspaceTouchChip
                key={r}
                active={config.roofType === r}
                theme="residential"
                onClick={() => patch({ roofType: r })}
              >
                {r === "unknown" ? "?" : r.charAt(0).toUpperCase() + r.slice(1)}
              </WorkspaceTouchChip>
            ))}
          </div>
        </section>
        <section className="space-y-2">
          <WorkspaceFieldLabel>Budget</WorkspaceFieldLabel>
          <div className="flex flex-wrap gap-2">
            {(["economy", "balanced", "premium"] as const).map((b) => (
              <WorkspaceTouchChip
                key={b}
                active={config.budgetRange === b}
                theme="residential"
                onClick={() => patch({ budgetRange: b })}
              >
                {b.charAt(0).toUpperCase() + b.slice(1)}
              </WorkspaceTouchChip>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <section className="rounded-xl border border-slate-200/80 bg-white/80 p-3 dark:border-white/10 dark:bg-white/5">
          <label className="flex cursor-pointer items-center justify-between gap-2">
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Battery</span>
            <input
              type="checkbox"
              checked={config.battery?.required ?? false}
              onChange={(e) =>
                patch({ battery: { required: e.target.checked, capacityKwh: e.target.checked ? 5 : undefined } })
              }
              className="h-4 w-4 rounded accent-violet-600"
            />
          </label>
          <AnimatePresence>
            {config.battery?.required ? (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mt-2">
                <NumericTextInput
                  value={config.battery?.capacityKwh ?? 5}
                  fallback={5}
                  onValueChange={(n) =>
                    patch({
                      battery: {
                        required: true,
                        capacityKwh: n != null && n > 0 ? Math.min(30, n) : config.battery?.capacityKwh ?? 5,
                      },
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm dark:border-white/15 dark:bg-white/5"
                  aria-label="Battery capacity kWh"
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </section>
        <section className="rounded-xl border border-slate-200/80 bg-white/80 p-3 dark:border-white/10 dark:bg-white/5">
          <WorkspaceFieldLabel>Subsidy slide</WorkspaceFieldLabel>
          <div className="flex flex-wrap gap-2">
            {(["maximize", "standard", "none"] as const).map((s) => (
              <WorkspaceTouchChip
                key={s}
                active={(config.subsidy?.preference ?? "maximize") === s}
                theme="residential"
                onClick={() => patch({ subsidy: { preference: s } })}
              >
                {s === "maximize" ? "Max" : s === "standard" ? "Std" : "Off"}
              </WorkspaceTouchChip>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
        <label className="flex min-h-11 cursor-pointer items-center justify-between gap-2 touch-manipulation">
          <span className="text-sm font-bold text-amber-950 dark:text-amber-100">EMI on proposal</span>
          <input
            type="checkbox"
            checked={fin.enabled}
            onChange={(e) => patch({ financing: { ...fin, enabled: e.target.checked } })}
            className="h-4 w-4 rounded accent-amber-600"
          />
        </label>
        {fin.enabled ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-[10px] font-bold uppercase text-amber-800/80">Interest %</p>
              <NumericTextInput
                value={fin.interestRatePct ?? 10.5}
                fallback={10.5}
                onValueChange={(n) =>
                  patch({ financing: { ...fin, interestRatePct: n ?? fin.interestRatePct ?? 10.5 } })
                }
                className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-2 py-1.5 text-sm font-semibold dark:border-white/15 dark:bg-white/5"
                aria-label="Interest rate percent"
              />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-amber-800/80">Tenure (years)</p>
              <select
                value={fin.selectedTenureYears ?? 5}
                onChange={(e) =>
                  patch({ financing: { ...fin, selectedTenureYears: parseInt(e.target.value, 10) } })
                }
                className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-2 py-1.5 text-sm font-semibold dark:border-white/15 dark:bg-white/5"
              >
                {[3, 5, 7, 10, 15].map((y) => (
                  <option key={y} value={y}>
                    {y} years
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col justify-end rounded-lg bg-white/80 px-3 py-2 dark:bg-white/5">
              <p className="text-[10px] font-bold uppercase text-slate-500">Monthly EMI</p>
              <p className="flex items-center gap-1 text-lg font-bold tabular-nums text-amber-950 dark:text-amber-100">
                <IndianRupee className="h-4 w-4" />
                {emi.toLocaleString("en-IN")}
              </p>
              <p className="text-[10px] text-slate-500">on net ₹{netCostInr.toLocaleString("en-IN")}</p>
            </div>
          </div>
        ) : null}
      </section>
      </WorkspaceOptionalFold>
      ) : (
      <section className="rounded-xl border border-indigo-200/80 bg-indigo-50/40 p-3 dark:border-indigo-500/25 dark:bg-indigo-950/15">
        <label className="flex min-h-11 cursor-pointer items-center justify-between gap-2 touch-manipulation">
          <span className="text-sm font-bold text-indigo-950 dark:text-indigo-100">EMI on proposal</span>
          <input
            type="checkbox"
            checked={fin.enabled}
            onChange={(e) => patch({ financing: { ...fin, enabled: e.target.checked } })}
            className="h-5 w-5 rounded accent-indigo-600"
          />
        </label>
        {fin.enabled ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-xs font-bold text-slate-500">Rate %</p>
              <NumericTextInput
                value={fin.interestRatePct ?? 10.5}
                fallback={10.5}
                onValueChange={(n) =>
                  patch({ financing: { ...fin, interestRatePct: n ?? fin.interestRatePct ?? 10.5 } })
                }
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-2 text-sm font-semibold dark:border-white/15 dark:bg-white/5"
                aria-label="Interest rate percent"
              />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500">Years</p>
              <select
                value={fin.selectedTenureYears ?? 5}
                onChange={(e) =>
                  patch({ financing: { ...fin, selectedTenureYears: parseInt(e.target.value, 10) } })
                }
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-2 text-sm font-semibold dark:border-white/15 dark:bg-white/5"
              >
                {[3, 5, 7, 10, 15].map((y) => (
                  <option key={y} value={y}>
                    {y}y
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col justify-center rounded-xl bg-white/80 px-3 py-2 dark:bg-white/5">
              <p className="text-xs font-bold text-slate-500">EMI/mo</p>
              <p className="flex items-center gap-1 text-lg font-bold tabular-nums">
                <IndianRupee className="h-4 w-4" />
                {emi.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        ) : null}
      </section>
      )}
    </div>
  );
}
