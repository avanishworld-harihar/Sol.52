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
import { COMMERCIAL_PANEL_WATT_PRESETS } from "@/lib/commercial-bom-panels";
import { PANEL_CATALOG } from "@/lib/commercial-panel-catalog";
import {
  applyActiveBrandToConfig,
  ensureBrandCatalog,
  getActiveCatalogEntry,
  impliedRatePerWpFromPlant,
  syncSolarAndPricingFromEntry,
} from "@/lib/residential-brand-catalog";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Battery,
  Building2,
  Calculator,
  IndianRupee,
  Layers,
  Leaf,
  Sun,
  Zap,
} from "lucide-react";

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

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-semibold transition-all touch-manipulation",
        active
          ? "border-emerald-500 bg-emerald-600 text-white shadow-sm"
          : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 dark:border-white/15 dark:bg-white/5 dark:text-slate-200"
      )}
    >
      {children}
    </button>
  );
}

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
        className="flex-1 accent-indigo-600"
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
  const catalogBrands = catalogWithEntries.brandCatalog?.entries ?? [];
  const activeBrandId = catalogWithEntries.brandCatalog?.activeBrandId ?? catalogBrands[0]?.brandId;
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

  function applyBrand(brandId: string) {
    onChange(applyActiveBrandToConfig(catalogWithEntries, brandId));
  }

  function applyTrack(track: "dcr" | "non_dcr") {
    const entry = getActiveCatalogEntry(catalogWithEntries);
    if (entry) {
      onChange(syncSolarAndPricingFromEntry(catalogWithEntries, entry, track));
      return;
    }
    const catalogTrack = track === "dcr" ? "DCR" : "NON_DCR";
    const hit = PANEL_CATALOG.find(
      (e) => e.brandId === solar.brandId && e.watt === solar.watt && e.panelType === catalogTrack
    );
    patchSolar({ panelTrack: track, moduleCountOverride: undefined, ratePerWpInr: hit?.ratePerWpInr ?? solar.ratePerWpInr });
  }

  function applyWatt(watt: number) {
    const w = Math.max(100, Math.min(900, Math.round(watt)));
    const entry = getActiveCatalogEntry(catalogWithEntries);
    if (entry) {
      patchSolar({
        watt: w,
        moduleCountOverride: undefined,
        ratePerWpInr: impliedRatePerWpFromPlant(solar, entry, solar.panelTrack ?? "dcr"),
        technology: solar.technology,
      });
      return;
    }
    const catalogTrack = solar.panelTrack === "dcr" ? "DCR" : "NON_DCR";
    const hit =
      PANEL_CATALOG.find(
        (e) => e.brandId === solar.brandId && e.watt === w && e.panelType === catalogTrack
      ) ?? PANEL_CATALOG.find((e) => e.watt === w && e.panelType === catalogTrack);
    patchSolar({
      watt: w,
      moduleCountOverride: undefined,
      ratePerWpInr: hit?.ratePerWpInr ?? solar.ratePerWpInr,
      technology: hit?.technology ?? solar.technology,
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
    if (isCommercial && onCommitPlantKw) {
      onCommitPlantKw(kw);
      return;
    }
    patchSolar({ plantCapacityKw: kw, moduleCountOverride: undefined });
  }

  return (
    <div
      className={cn(
        "space-y-4 rounded-2xl border p-4 shadow-sm sm:p-5",
        isCommercial
          ? "border-indigo-200/70 bg-gradient-to-br from-indigo-50/90 via-white to-slate-50/80 dark:border-indigo-500/25 dark:from-indigo-950/25 dark:via-[#0f1419] dark:to-slate-950/30"
          : "border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 via-white to-amber-50/40 dark:border-emerald-900/40 dark:from-emerald-950/30 dark:via-[#0f1419] dark:to-amber-950/20",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow",
            isCommercial ? "bg-gradient-to-br from-indigo-600 to-sky-600" : "bg-gradient-to-br from-emerald-500 to-teal-600"
          )}
        >
          {isCommercial ? (
            <span className="text-sm font-bold tabular-nums">1</span>
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </div>
        <div>
          <p
            className={cn(
              "text-[10px] font-bold uppercase tracking-widest",
              isCommercial ? "text-indigo-700 dark:text-indigo-300" : "text-emerald-700 dark:text-emerald-400"
            )}
          >
            {isCommercial ? "Step 1 · Plant & brand" : "Residential · Requirement-based"}
          </p>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {isCommercial ? "System size & panel selection" : "Panel & Solar Plant Sizing"}
          </h3>
          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
            {isCommercial
              ? "kW, active brand, and DCR / Non-DCR — rates from More → Rate card."
              : "No bill needed — size from requirements and generate a homeowner-friendly proposal."}
          </p>
        </div>
      </div>

      {/* Live summary strip */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: "System", value: `${quote.actualKw} kW` },
          { label: "Panels", value: `${modules} × ${solar.watt}W` },
          { label: "Est. saving/mo", value: `₹${monthlySaving.toLocaleString("en-IN")}` },
          { label: "EMI/mo", value: fin.enabled ? `₹${emi.toLocaleString("en-IN")}` : "—" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-white/80 bg-white/90 px-2.5 py-2 text-center shadow-sm dark:border-white/10 dark:bg-white/5"
          >
            <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">{s.label}</p>
            <p className="mt-0.5 text-sm font-bold tabular-nums text-slate-900 dark:text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Panel brand + DCR/Non-DCR */}
      <section className="space-y-3 rounded-xl border border-slate-200/80 bg-white/80 p-3 dark:border-white/10 dark:bg-white/5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Panel brand &amp; quote mode</p>
        {catalogBrands.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {catalogBrands.map((entry) => (
              <button
                key={entry.brandId}
                type="button"
                onClick={() => applyBrand(entry.brandId)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                  activeBrandId === entry.brandId
                    ? "border-indigo-500 bg-indigo-600 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300 dark:border-white/15 dark:bg-white/5 dark:text-slate-200"
                )}
              >
                {entry.brandId}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-slate-500">
            Add brands in <strong>More → Rate card</strong> — they will appear here.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {(["dcr", "non_dcr"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => applyTrack(t)}
              className={cn(
                "rounded-lg border px-4 py-1.5 text-xs font-bold",
                solar.panelTrack === t
                  ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
                  : "border-slate-200 bg-white text-slate-700 dark:border-white/15 dark:bg-white/5 dark:text-slate-200"
              )}
            >
              {t === "dcr" ? "DCR" : "Non-DCR"}
            </button>
          ))}
        </div>
      </section>

      {/* Plant kW — commercial first, then wattage */}
      <section className="space-y-2">
        <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
          Required system size (kW)
        </label>
        {isCommercial ? (
          <div className="space-y-1 text-[11px] text-slate-500">
            <p>Set kW with slider or type a number and press Enter — then choose module wattage below.</p>
            {rateCardMaxKw != null ? (
              <p className="text-amber-800/90 dark:text-amber-200/90">
                Rate card pricing is set up to <strong>{rateCardMaxKw} kW</strong> — you can still enter any
                system size (e.g. 5 kW or 100 kW); cost uses the nearest lower tier or ₹/Wp from the catalog.
              </p>
            ) : null}
          </div>
        ) : null}
        <div className="flex items-center gap-3">
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
                onChange={(e) => applyPlantKw(parseFloat(e.target.value))}
                className={cn("flex-1", isCommercial ? "accent-indigo-600" : "accent-emerald-600")}
              />
              <NumericTextInput
                value={solar.plantCapacityKw}
                onValueChange={(n) => applyPlantKw(n)}
                className="w-28 rounded-xl border border-slate-200 bg-white px-2 py-2 text-center text-sm font-bold tabular-nums dark:border-white/15 dark:bg-white/5"
                aria-label="System size kW"
              />
            </>
          )}
          <span className="text-sm font-bold text-slate-600">kW</span>
        </div>
        {!isCommercial ? (
          <p className="text-[11px] text-slate-500">
            At {solar.watt}W per panel → <strong>{modules} panels</strong> · max {maxPlantKw} kW
          </p>
        ) : null}
      </section>

      {/* Module wattage — commercial (after kW is set) */}
      {isCommercial ? (
        <section className="space-y-3 rounded-xl border border-indigo-200/80 bg-indigo-50/40 p-3 dark:border-indigo-500/25 dark:bg-indigo-950/20">
          <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 dark:text-indigo-300">
            Module wattage (Wp)
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">
            For <strong>{solar.plantCapacityKw} kW</strong>: panel count = ceil(kW × 1000 ÷ Wp).
          </p>
          <div className="flex flex-wrap gap-2">
            {COMMERCIAL_PANEL_WATT_PRESETS.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => applyWatt(w)}
                className={cn(
                  "rounded-lg border px-2.5 py-1.5 text-xs font-semibold tabular-nums transition-all",
                  solar.watt === w
                    ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300 dark:border-white/15 dark:bg-white/5 dark:text-slate-200"
                )}
              >
                {w}W
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Custom Wp</span>
              <NumericTextInput
                integer
                value={solar.watt}
                onValueChange={(n) => {
                  if (n != null && n >= 100) applyWatt(n);
                }}
                className="w-24 rounded-xl border border-slate-200 bg-white px-2 py-2 text-center text-sm font-bold tabular-nums dark:border-white/15 dark:bg-white/5"
                aria-label="Custom module wattage"
              />
            </label>
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-xl border border-indigo-200/60 bg-white/90 p-3 text-center dark:border-indigo-500/20 dark:bg-white/5">
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-500">Plant (AC)</p>
              <p className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">{solar.plantCapacityKw} kW</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-500">Panels</p>
              <p className="text-lg font-bold tabular-nums text-indigo-800 dark:text-indigo-200">{modules} nos</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-500">Installed DC</p>
              <p className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">{quote.actualKw} kW</p>
            </div>
          </div>
        </section>
      ) : null}

      {/* Roof + budget — residential homeowner path only */}
      {!isCommercial ? (
      <div className="grid gap-3 sm:grid-cols-2">
        <section className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
            <Building2 className="h-3.5 w-3.5" /> Roof type
          </label>
          <div className="flex flex-wrap gap-2">
            {(["flat", "slope", "mixed", "unknown"] as const).map((r) => (
              <Chip key={r} active={config.roofType === r} onClick={() => patch({ roofType: r })}>
                {r === "unknown" ? "Not sure" : r.charAt(0).toUpperCase() + r.slice(1)}
              </Chip>
            ))}
          </div>
        </section>
        <section className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
            <Layers className="h-3.5 w-3.5" /> Budget range
          </label>
          <div className="flex flex-wrap gap-2">
            {(["economy", "balanced", "premium"] as const).map((b) => (
              <Chip key={b} active={config.budgetRange === b} onClick={() => patch({ budgetRange: b })}>
                {b.charAt(0).toUpperCase() + b.slice(1)}
              </Chip>
            ))}
          </div>
        </section>
      </div>
      ) : null}

      {/* Battery + subsidy — residential only */}
      {!isCommercial ? (
      <div className="grid gap-3 sm:grid-cols-2">
        <section className="rounded-xl border border-slate-200/80 bg-white/80 p-3 dark:border-white/10 dark:bg-white/5">
          <label className="flex cursor-pointer items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Battery className="h-4 w-4 text-violet-500" /> Battery backup
            </span>
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
          <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
            <Leaf className="h-4 w-4 text-emerald-500" /> Subsidy preference
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {(["maximize", "standard", "none"] as const).map((s) => (
              <Chip
                key={s}
                active={(config.subsidy?.preference ?? "maximize") === s}
                onClick={() => patch({ subsidy: { preference: s } })}
              >
                {s === "maximize" ? "Max subsidy" : s === "standard" ? "Standard" : "No subsidy slide"}
              </Chip>
            ))}
          </div>
        </section>
      </div>
      ) : null}

      {/* EMI */}
      <section
        className={cn(
          "rounded-xl border p-4",
          isCommercial
            ? "border-indigo-200/80 bg-indigo-50/50 dark:border-indigo-500/25 dark:bg-indigo-950/15"
            : "border-amber-200/80 bg-gradient-to-r from-amber-50/90 to-orange-50/50 dark:border-amber-900/40 dark:from-amber-950/20"
        )}
      >
        <label className="flex cursor-pointer items-center justify-between gap-2">
          <span
            className={cn(
              "flex items-center gap-2 text-sm font-bold",
              isCommercial ? "text-indigo-950 dark:text-indigo-100" : "text-amber-950 dark:text-amber-100"
            )}
          >
            <Calculator className="h-4 w-4" />{" "}
            {isCommercial ? "Financing & EMI (customer proposal)" : "Financing & EMI story"}
          </span>
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
        ) : (
          <p className="mt-2 text-xs text-amber-900/70 dark:text-amber-200/70">Enable to show EMI options on the proposal.</p>
        )}
      </section>

      <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
        <Zap className={cn("h-3 w-3", isCommercial ? "text-indigo-500" : "text-emerald-500")} />
        {isCommercial
          ? "Continue with quote, equipment, and site options below — then use Save and generate proposal."
          : "Set kW above, complete pricing below, then tap Save and generate proposal at the bottom."}
      </p>
    </div>
  );
}
