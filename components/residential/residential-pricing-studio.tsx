"use client";

import { Button } from "@/components/ui/button";
import { FloatingLabelInput, FloatingLabelNumericInput } from "@/components/ui/floating-label-input";
import { useToast } from "@/components/ui/toast-center";
import { PANEL_CATALOG, PANEL_TECHNOLOGY_OPTIONS } from "@/lib/commercial-panel-catalog";
import {
  defaultResidentialKwTiers,
  RESIDENTIAL_BRAND_PRESETS,
  RESIDENTIAL_INVERTER_PRESETS,
  RESIDENTIAL_WATT_PRESETS,
  RESIDENTIAL_WIRE_PRESETS,
  type ResidentialBrandOption,
  type ResidentialProposalConfig,
  type ResidentialWireBrand,
} from "@/lib/residential-requirements-schema";
import { wireBrandDisplayName } from "@/lib/residential-deck-helpers";
import { moduleCountForResidential, quoteResidentialSolar } from "@/lib/residential-solar-engine";
import { isPmSuryaGharSubsidyEligible } from "@/lib/lead-connection-types";
import { computePmSuryaGharSubsidy } from "@/lib/proposal-deck-helpers";
import type { ProposalTemplateV1 } from "@/lib/proposal-template-schema";
import { cn } from "@/lib/utils";
import {
  Cable,
  Cpu,
  Layers,
  Plus,
  Save,
  Sun,
  Trash2,
  Zap,
} from "lucide-react";
import { ResidentialBrandCatalogPanel } from "@/components/residential/residential-brand-catalog-panel";
import { ResidentialTrackComparePanel } from "@/components/residential/residential-track-compare-panel";
import {
  applyActiveBrandToConfig,
  ensureBrandCatalog,
  getActiveCatalogEntry,
  rateForSolarTrack,
  syncSolarAndPricingFromEntry,
} from "@/lib/residential-brand-catalog";
import type { PricingLineItem } from "@/lib/proposal-pricing-lines";
import { saveResidentialRequirement } from "@/lib/save-residential-requirement-client";
import { useMemo, useState } from "react";

type Props = {
  config: ResidentialProposalConfig;
  onChange: (next: ResidentialProposalConfig) => void;
  proposalId?: string | null;
  proposalLayout?: ProposalTemplateV1 | null;
  onLayoutChange?: (layout: ProposalTemplateV1) => void;
  onSaved?: () => void;
  /** Sync BOM line items when saving (Proposals workspace). */
  lineItems?: PricingLineItem[];
  /** Builder flow: create web proposal when none exists yet, return new id. */
  onCreateProposal?: () => Promise<string | null>;
  /** When false (e.g. commercial connection), subsidy is shown as ineligible and forced to ₹0. */
  subsidyEligible?: boolean;
  className?: string;
};

function inr(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function toggleBrand(list: ResidentialBrandOption[] | undefined, option: ResidentialBrandOption, max: number) {
  const cur = list ?? [];
  const key = option.brandId ?? option.brand;
  const exists = cur.some((b) => (b.brandId ?? b.brand) === key);
  if (exists) return cur.filter((b) => (b.brandId ?? b.brand) !== key);
  if (cur.length >= max) return cur;
  return [...cur, option];
}

function SectionTitle({ icon: Icon, title, hint }: { icon: typeof Sun; title: string; hint?: string }) {
  return (
    <div className="mb-3">
      <p className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
        <Icon className="h-4 w-4 text-slate-500" aria-hidden />
        {title}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p> : null}
    </div>
  );
}

export function ResidentialPricingStudio({
  config,
  onChange,
  proposalId,
  proposalLayout,
  onLayoutChange,
  onSaved,
  lineItems,
  onCreateProposal,
  subsidyEligible: subsidyEligibleProp,
  className,
}: Props) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const solar = config.solar;
  const pricing = config.pricing ?? {
    kwTiers: defaultResidentialKwTiers(),
    panelTechnology: solar.technology ?? "Mono PERC",
    wireBrand: "polycab" as const,
    discount: { enabled: false, type: "percent" as const, value: 0 },
  };
  const discount = pricing.discount ?? { enabled: false, type: "percent" as const, value: 0 };
  const catalogEntry = getActiveCatalogEntry(ensureBrandCatalog(config));
  const panelOpts = config.panelBrandOptions ?? [];
  const invOpts = config.inverterBrandOptions ?? [];
  const wireOpts = pricing.wireBrandOptions?.length
    ? pricing.wireBrandOptions
    : pricing.wireBrand
      ? [pricing.wireBrand]
      : (["polycab"] as ResidentialWireBrand[]);
  const panelQuote = useMemo(() => quoteResidentialSolar(solar), [solar]);
  const panelCount = panelQuote.moduleCount;
  const defaultSubsidy = computePmSuryaGharSubsidy(solar.plantCapacityKw);
  const subsidyEligible =
    subsidyEligibleProp ?? isPmSuryaGharSubsidyEligible(config.connectionType);

  function patch(partial: Partial<ResidentialProposalConfig>) {
    onChange(ensureBrandCatalog({ ...config, ...partial }));
  }

  function patchPricing(partial: Partial<NonNullable<ResidentialProposalConfig["pricing"]>>) {
    onChange({ ...config, pricing: { ...pricing, ...partial } });
  }

  function patchSolar(partial: Partial<typeof solar>) {
    onChange({ ...config, solar: { ...solar, ...partial } });
  }

  function patchPanelOptions(next: ResidentialBrandOption[]) {
    const primary = next[0];
    patch({
      panelBrandOptions: next,
      solar: primary
        ? { ...solar, brand: primary.brand, brandId: primary.brandId }
        : solar,
    });
  }

  function applyTrack(track: "dcr" | "non_dcr") {
    const base = ensureBrandCatalog(config);
    const entry = getActiveCatalogEntry(base);
    if (entry) {
      onChange(syncSolarAndPricingFromEntry(base, entry, track));
      return;
    }
    const catalogTrack = track === "dcr" ? "DCR" : "NON_DCR";
    const hit = PANEL_CATALOG.find(
      (e) =>
        e.brandId === solar.brandId &&
        e.watt === solar.watt &&
        e.panelType === catalogTrack
    );
    patchSolar({
      panelTrack: track,
      moduleCountOverride: undefined,
      ratePerWpInr: hit?.ratePerWpInr ?? solar.ratePerWpInr,
      technology: hit?.technology ?? solar.technology,
    });
  }

  function patchWireOptions(next: ResidentialWireBrand[]) {
    const wireBrandOptions = next.slice(0, 2);
    patchPricing({ wireBrandOptions, wireBrand: wireBrandOptions[0] ?? "polycab" });
  }

  function toggleWire(wire: ResidentialWireBrand) {
    const cur = wireOpts;
    if (cur.includes(wire)) {
      patchWireOptions(cur.filter((w) => w !== wire));
      return;
    }
    if (cur.length >= 2) return;
    patchWireOptions([...cur, wire]);
  }

  function applyWatt(watt: number) {
    const w = Math.max(100, Math.min(900, Math.round(watt)));
    const entry = catalogEntry;
    if (entry) {
      patchSolar({
        watt: w,
        moduleCountOverride: undefined,
        ratePerWpInr: rateForSolarTrack(entry, solar.panelTrack ?? "dcr"),
        technology: solar.technology,
      });
      return;
    }
    const track = solar.panelTrack === "dcr" ? "DCR" : "NON_DCR";
    const hit =
      PANEL_CATALOG.find(
        (e) => e.brandId === solar.brandId && e.watt === w && e.panelType === track
      ) ?? PANEL_CATALOG.find((e) => e.watt === w && e.panelType === track);
    patchSolar({
      watt: w,
      moduleCountOverride: undefined,
      ratePerWpInr: hit?.ratePerWpInr ?? solar.ratePerWpInr,
      technology: hit?.technology ?? solar.technology,
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      let id = proposalId?.trim() || null;
      if (!id && onCreateProposal) {
        id = await onCreateProposal();
        if (!id) {
          toast.push({
            tone: "error",
            title: "Could not save",
            description: "Create the web proposal first, then try Save again.",
          });
          return;
        }
      }
      if (!id) {
        toast.push({
          tone: "info",
          title: "Generate proposal first",
          description: "Tap Generate to create the web proposal, then Save will sync all pricing fields.",
        });
        return;
      }

      const result = await saveResidentialRequirement({
        proposalId: id,
        config,
        proposalLayout,
        lineItems,
      });
      if (!result.ok) {
        throw new Error(result.error ?? "Save failed");
      }
      if (result.proposalLayout) onLayoutChange?.(result.proposalLayout);
      onSaved?.();
      toast.push({
        tone: "success",
        title: "Saved",
        description: "Residential pricing and proposal settings are updated.",
      });
    } catch (e) {
      toast.push({
        tone: "error",
        title: "Save failed",
        description: e instanceof Error ? e.message : "",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-white/10 dark:bg-[#0c1017]",
        className
      )}
    >
      <div className="border-b border-slate-200/80 bg-slate-900 px-4 py-4 text-white dark:border-white/10 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Residential · Requirement</p>
            <h3 className="text-lg font-semibold tracking-tight">Pricing &amp; system catalog</h3>
            <p className="mt-1 max-w-xl text-xs text-slate-300">
              Brand catalog first — DCR ₹/Wp &amp; kW prices sync to plant sizing, comparison table, and saved proposal.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-medium text-slate-200">
            <Zap className="h-3.5 w-3.5 text-amber-300" />
            {solar.plantCapacityKw} kW · 4 u/kW/day
          </div>
        </div>
      </div>

      <div className="space-y-8 p-4 sm:p-5">
        <ResidentialBrandCatalogPanel
          config={config}
          onChange={(next) => onChange(ensureBrandCatalog(next))}
        />

        {/* Plant sizing — editable watt drives panel count */}
        <div className="rounded-2xl border border-indigo-200/80 bg-indigo-50/30 p-4 dark:border-indigo-500/30 dark:bg-indigo-950/20">
          <SectionTitle
            icon={Layers}
            title="Solar plant sizing"
            hint="Panel count = plant kW × 1000 ÷ module wattage (rounded up)."
          />
          <div className="mb-3 flex gap-2">
            {(
              [
                { id: "dcr" as const, label: "DCR" },
                { id: "non_dcr" as const, label: "Non-DCR" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => applyTrack(t.id)}
                className={cn(
                  "rounded-lg border px-4 py-2 text-xs font-bold",
                  solar.panelTrack === t.id
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white dark:border-white/15"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <FloatingLabelNumericInput
              label="Module wattage (Wp)"
              integer
              value={solar.watt}
              onValueChange={(n) => applyWatt(n ?? solar.watt)}
              className="h-11 rounded-xl text-sm font-bold"
            />
            <div className="flex flex-wrap gap-2 sm:col-span-2 sm:justify-end">
              {RESIDENTIAL_WATT_PRESETS.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => applyWatt(w)}
                  className={cn(
                    "rounded-lg border px-2.5 py-1.5 text-xs font-semibold tabular-nums",
                    solar.watt === w
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-slate-200 text-slate-600"
                  )}
                >
                  {w}W
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-indigo-200/60 bg-white/80 p-3 text-center dark:border-indigo-500/20 dark:bg-white/5">
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-500">Plant</p>
              <p className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">{solar.plantCapacityKw} kW</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-500">Panels</p>
              <p className="text-lg font-bold tabular-nums text-indigo-800 dark:text-indigo-200">
                {panelCount} nos
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-500">Installed DC</p>
              <p className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">{panelQuote.actualKw} kW</p>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-400">
            Formula: ceil({solar.plantCapacityKw} × 1000 ÷ {solar.watt}) = <strong>{panelCount} panels</strong> — shown on
            web proposal &amp; BOM spec line.
          </p>
        </div>

        <div>
          <SectionTitle icon={Sun} title="Panel technology" />
          <select
            value={pricing.panelTechnology ?? solar.technology ?? ""}
            onChange={(e) => {
              const panelTechnology = e.target.value;
              patchPricing({ panelTechnology });
              patchSolar({ technology: panelTechnology || solar.technology });
            }}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold dark:border-white/15 dark:bg-white/5"
          >
            <option value="">—</option>
            {PANEL_TECHNOLOGY_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Equipment catalog — proposal + BOM brands */}
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-4 dark:border-white/15 dark:bg-white/[0.02] sm:p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Proposal &amp; BOM</p>
          <h4 className="mt-1 text-base font-bold text-slate-900 dark:text-white">Equipment brands on customer link</h4>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            Pick panel (2–3), inverter (2), and wire (2). Edited names appear on the system-design page and BOM brand column.
          </p>

          <div className="mt-6 space-y-6">
            <div>
              <SectionTitle icon={Sun} title="Panel brands (2–3)" hint="Any one may be supplied on site." />
              <div className="flex flex-wrap gap-2">
                {(config.brandCatalog?.entries ?? []).map((b) => {
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
                {panelOpts.length < 3 ? (
                  <button
                    type="button"
                    onClick={() => patchPanelOptions([...panelOpts, { brand: "Custom panel" }])}
                    className="inline-flex items-center gap-1 rounded-lg border border-dashed px-3 py-1.5 text-xs font-semibold text-slate-600"
                  >
                    <Plus className="h-3 w-3" /> Add
                  </button>
                ) : null}
              </div>
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
              <SectionTitle icon={Cpu} title="Inverter brands (2)" />
              <div className="flex flex-wrap gap-2">
                {RESIDENTIAL_INVERTER_PRESETS.map((name) => {
                  const active = invOpts.some((p) => p.brand === name);
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => patch({ inverterBrandOptions: toggleBrand(invOpts, { brand: name }, 2) })}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-xs font-semibold",
                        active
                          ? "border-indigo-500 bg-indigo-600 text-white"
                          : "border-slate-200 text-slate-700 dark:border-white/15"
                      )}
                    >
                      {name}
                    </button>
                  );
                })}
                {invOpts.length < 2 ? (
                  <button
                    type="button"
                    onClick={() => patch({ inverterBrandOptions: [...invOpts, { brand: "Custom inverter" }] })}
                    className="inline-flex items-center gap-1 rounded-lg border border-dashed px-3 py-1.5 text-xs font-semibold text-slate-600"
                  >
                    <Plus className="h-3 w-3" /> Add
                  </button>
                ) : null}
              </div>
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
              <SectionTitle icon={Cable} title="DC / AC wire (2)" hint="Shown on BOM cabling row." />
              <div className="flex flex-wrap gap-2">
                {RESIDENTIAL_WIRE_PRESETS.map((w) => {
                  const active = wireOpts.includes(w);
                  return (
                    <button
                      key={w}
                      type="button"
                      onClick={() => toggleWire(w)}
                      className={cn(
                        "rounded-lg border px-4 py-2 text-sm font-bold",
                        active
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white dark:border-white/15"
                      )}
                    >
                      {wireBrandDisplayName(w)}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                On proposal:{" "}
                <span className="font-bold text-slate-900 dark:text-white">
                  {wireOpts.map(wireBrandDisplayName).join(" / ") || "—"}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Discount + subsidy override */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200/80 p-3 dark:border-white/10">
            <label className="flex cursor-pointer items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Customer discount</span>
              <input
                type="checkbox"
                checked={discount.enabled}
                onChange={(e) => patchPricing({ discount: { ...discount, enabled: e.target.checked } })}
                className="h-4 w-4 rounded accent-slate-800"
              />
            </label>
            {discount.enabled ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <select
                  value={discount.type}
                  onChange={(e) =>
                    patchPricing({
                      discount: { ...discount, type: e.target.value as "percent" | "fixed_inr" },
                    })
                  }
                  className="h-10 rounded-lg border border-slate-200 bg-white px-2 text-sm font-semibold dark:border-white/15 dark:bg-white/5"
                >
                  <option value="percent">Percent %</option>
                  <option value="fixed_inr">Fixed ₹</option>
                </select>
                <FloatingLabelNumericInput
                  label={discount.type === "percent" ? "Discount %" : "Discount ₹"}
                  value={discount.value}
                  onValueChange={(n) => patchPricing({ discount: { ...discount, value: n ?? 0 } })}
                  className="h-10 rounded-lg text-sm font-bold"
                />
              </div>
            ) : null}
          </div>
          <div
            className={cn(
              "rounded-xl border px-3 pb-3 pt-4",
              subsidyEligible
                ? "border-emerald-200/70 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/15"
                : "border-slate-200/80 bg-slate-50/60 dark:border-white/10 dark:bg-white/[0.03]"
            )}
          >
            <p
              className={cn(
                "mb-3 text-xs font-bold",
                subsidyEligible ? "text-emerald-950 dark:text-emerald-100" : "text-slate-700 dark:text-slate-300"
              )}
            >
              PM Surya Ghar subsidy
            </p>
            {subsidyEligible ? (
              <>
                <FloatingLabelNumericInput
                  label="Subsidy amount (₹)"
                  value={config.subsidy?.estimateInr ?? defaultSubsidy}
                  onValueChange={(n) =>
                    patch({
                      subsidy: {
                        preference: config.subsidy?.preference ?? "maximize",
                        estimateInr: n ?? defaultSubsidy,
                      },
                    })
                  }
                  labelBackgroundClassName="bg-emerald-50 dark:bg-emerald-950/40"
                  className="h-11 rounded-lg pt-4 text-sm font-bold"
                />
                <p className="mt-2 text-[11px] text-emerald-800/80 dark:text-emerald-200/70">
                  Default {inr(defaultSubsidy)} for {solar.plantCapacityKw} kW — override if needed.
                </p>
              </>
            ) : (
              <div className="rounded-lg border border-slate-200/90 bg-white/80 px-3 py-2.5 dark:border-white/10 dark:bg-white/5">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Ineligible</p>
                <p className="mt-1 text-[11px] leading-snug text-slate-600 dark:text-slate-400">
                  PM Surya Ghar subsidy applies to domestic connections only. Commercial, industrial, and HT
                  connections are not eligible — net cost equals price after discount.
                </p>
              </div>
            )}
          </div>
        </div>

        <ResidentialTrackComparePanel config={config} onChange={onChange} />
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200/80 bg-slate-50/80 px-4 py-4 dark:border-white/10 dark:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {proposalId
            ? "Saves plant sizing, brands, kW tiers, subsidy, and DCR comparison to this proposal."
            : onCreateProposal
              ? "Creates or updates the web proposal with all fields above."
              : "Generate the web proposal first, then Save will sync these settings."}
        </p>
        <Button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
          className="w-full gap-2 bg-slate-900 font-semibold hover:bg-slate-800 dark:bg-white dark:text-slate-900 sm:w-auto sm:min-w-[10rem]"
        >
          <Save className="h-4 w-4" aria-hidden />
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </section>
  );
}
