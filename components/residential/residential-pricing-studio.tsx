"use client";

import { Button } from "@/components/ui/button";
import { FloatingLabelInput, FloatingLabelNumericInput } from "@/components/ui/floating-label-input";
import { useToast } from "@/components/ui/toast-center";
import { PANEL_CATALOG, PANEL_TECHNOLOGY_OPTIONS } from "@/lib/commercial-panel-catalog";
import { applyResidentialFlagsToLayout } from "@/lib/residential-proposal-config";
import {
  defaultResidentialKwTiers,
  RESIDENTIAL_BRAND_PRESETS,
  RESIDENTIAL_INVERTER_PRESETS,
  RESIDENTIAL_WATT_PRESETS,
  type ResidentialBrandOption,
  type ResidentialKwTier,
  type ResidentialProposalConfig,
} from "@/lib/residential-requirements-schema";
import { residentialCostBreakdown } from "@/lib/residential-deck-helpers";
import { computePmSuryaGharSubsidy } from "@/lib/proposal-deck-helpers";
import type { ProposalTemplateV1 } from "@/lib/proposal-template-schema";
import { cn } from "@/lib/utils";
import {
  Cable,
  Check,
  Cpu,
  IndianRupee,
  Plus,
  Save,
  Sun,
  Trash2,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";

type Props = {
  config: ResidentialProposalConfig;
  onChange: (next: ResidentialProposalConfig) => void;
  proposalId?: string | null;
  proposalLayout?: ProposalTemplateV1 | null;
  onLayoutChange?: (layout: ProposalTemplateV1) => void;
  onSaved?: () => void;
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
  const tiers = pricing.kwTiers ?? defaultResidentialKwTiers();
  const discount = pricing.discount ?? { enabled: false, type: "percent" as const, value: 0 };
  const panelOpts = config.panelBrandOptions ?? [];
  const invOpts = config.inverterBrandOptions ?? [];
  const costs = useMemo(() => residentialCostBreakdown(config), [config]);
  const defaultSubsidy = computePmSuryaGharSubsidy(solar.plantCapacityKw);

  function patch(partial: Partial<ResidentialProposalConfig>) {
    onChange({ ...config, ...partial });
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

  function applyBrandPreset(brandId: string, brand: string, watt: number) {
    const track = solar.panelTrack === "dcr" ? "DCR" : "NON_DCR";
    const hit = PANEL_CATALOG.find((e) => e.brandId === brandId && e.watt === watt && e.panelType === track);
    const nextSolar = {
      brandId,
      brand,
      watt,
      technology: hit?.technology ?? solar.technology,
      ratePerWpInr: hit?.ratePerWpInr ?? solar.ratePerWpInr,
      moduleCountOverride: undefined,
    };
    const key = brandId;
    let nextPanels = panelOpts;
    if (!panelOpts.some((p) => (p.brandId ?? p.brand) === key)) {
      nextPanels = toggleBrand(panelOpts, { brandId, brand }, 3);
    }
    patch({ panelBrandOptions: nextPanels, solar: { ...solar, ...nextSolar } });
  }

  function updateTier(index: number, patchTier: Partial<ResidentialKwTier>) {
    patchPricing({ kwTiers: tiers.map((t, i) => (i === index ? { ...t, ...patchTier } : t)) });
  }

  async function saveToProposal() {
    if (!proposalId) {
      toast.push({
        tone: "info",
        title: "Save after generate",
        description: "Create the web proposal first — then Save syncs pricing to the live link.",
      });
      return;
    }
    setSaving(true);
    try {
      const layout = applyResidentialFlagsToLayout(
        proposalLayout ?? { version: 1, blocks: [] },
        config
      );
      const res = await fetch(`/api/proposals/${proposalId}/residential-config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ residentialConfig: { ...config, inputMode: "requirement" as const }, proposalLayout: layout }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Save failed");
      onLayoutChange?.(layout);
      onSaved?.();
      toast.push({ tone: "success", title: "Residential pricing saved", description: "Web proposal updated." });
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
              DCR track, brands, kW rates, wire, and subsidy flow straight into the web proposal and BOM.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-medium text-slate-200">
            <Zap className="h-3.5 w-3.5 text-amber-300" />
            {solar.plantCapacityKw} kW · 4 u/kW/day
          </div>
        </div>
      </div>

      {/* Cost waterfall */}
      <div className="grid grid-cols-2 gap-px border-b border-slate-200/80 bg-slate-50 sm:grid-cols-4 dark:border-white/10 dark:bg-white/[0.02]">
        {[
          { label: "Gross system", value: costs.grossInr, accent: "text-slate-900 dark:text-white" },
          ...(costs.discountInr > 0
            ? [{ label: "Discount", value: -costs.discountInr, accent: "text-amber-700 dark:text-amber-300" }]
            : []),
          { label: "PM subsidy", value: -costs.subsidyInr, accent: "text-emerald-700 dark:text-emerald-400" },
          { label: "Net payable", value: costs.netInr, accent: "text-indigo-700 dark:text-indigo-300" },
        ].map((row) => (
          <div key={row.label} className="px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{row.label}</p>
            <p className={cn("mt-0.5 text-lg font-bold tabular-nums", row.accent)}>
              {row.value < 0 ? `−${inr(Math.abs(row.value))}` : inr(row.value)}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-8 p-4 sm:p-5">
        {/* DCR */}
        <div>
          <SectionTitle icon={Sun} title="Panel category" hint="DCR is subsidy-friendly; Non-DCR for premium installs." />
          <div className="flex gap-2">
            {(
              [
                { id: "dcr" as const, label: "DCR", sub: "Subsidy track" },
                { id: "non_dcr" as const, label: "Non-DCR", sub: "Open category" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => applyTrack(t.id)}
                className={cn(
                  "flex-1 rounded-xl border px-3 py-2.5 text-left transition",
                  solar.panelTrack === t.id
                    ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
                    : "border-slate-200 bg-white hover:border-slate-300 dark:border-white/15 dark:bg-white/5"
                )}
              >
                <span className="block text-sm font-bold">{t.label}</span>
                <span className="text-[10px] opacity-80">{t.sub}</span>
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {RESIDENTIAL_WATT_PRESETS.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => {
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
                }}
                className={cn(
                  "rounded-lg border px-2.5 py-1 text-xs font-semibold tabular-nums",
                  solar.watt === w
                    ? "border-slate-800 bg-slate-800 text-white"
                    : "border-slate-200 text-slate-600 dark:border-white/15"
                )}
              >
                {w} Wp
              </button>
            ))}
          </div>
        </div>

        {/* Panel brands */}
        <div>
          <SectionTitle
            icon={Sun}
            title="Panel brands"
            hint="Pick up to 3 — customer may receive any one on site. Tap to edit names."
          />
          <div className="flex flex-wrap gap-2">
            {RESIDENTIAL_BRAND_PRESETS.map((b) => {
              const active = panelOpts.some((p) => (p.brandId ?? p.brand) === b.brandId);
              return (
                <button
                  key={b.brandId}
                  type="button"
                  onClick={() => applyBrandPreset(b.brandId, b.brand, b.watt)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
                    active || solar.brandId === b.brandId
                      ? "border-amber-500 bg-amber-50 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100"
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
                onClick={() => patchPanelOptions([...panelOpts, { brand: "Custom brand" }])}
                className="inline-flex items-center gap-1 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600"
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
                    label={`Panel brand ${i + 1}`}
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
                    title="Remove"
                    onClick={() => patchPanelOptions(panelOpts.filter((_, j) => j !== i))}
                    className="mb-0.5 flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {/* Inverter */}
        <div>
          <SectionTitle icon={Cpu} title="Inverter brands" hint="Up to 2 options shown on proposal BOM." />
          <div className="flex flex-wrap gap-2">
            {RESIDENTIAL_INVERTER_PRESETS.map((name) => {
              const active = invOpts.some((p) => p.brand === name);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() =>
                    patch({
                      inverterBrandOptions: toggleBrand(invOpts, { brand: name }, 2),
                    })
                  }
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
                className="inline-flex items-center gap-1 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600"
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
                    className="mb-0.5 flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {/* Wire + technology */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <SectionTitle icon={Cable} title="DC / AC wire" />
            <div className="flex gap-2">
              {(["polycab", "havells"] as const).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => patchPricing({ wireBrand: w })}
                  className={cn(
                    "flex-1 rounded-xl border py-2.5 text-sm font-bold capitalize",
                    (pricing.wireBrand ?? "polycab") === w
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white dark:border-white/15 dark:bg-white/5"
                  )}
                >
                  {w}
                </button>
              ))}
            </div>
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
        </div>

        {/* kW tiers */}
        <div>
          <SectionTitle
            icon={IndianRupee}
            title="System price by kW"
            hint={`Active plant ${solar.plantCapacityKw} kW uses nearest tier below.`}
          />
          <ul className="space-y-2">
            {tiers.map((tier, idx) => {
              const isActive = tier.kw === solar.plantCapacityKw;
              return (
                <li
                  key={`${tier.kw}-${idx}`}
                  className={cn(
                    "grid grid-cols-[1fr_1.2fr_auto] items-end gap-2 rounded-xl border p-2",
                    isActive
                      ? "border-indigo-300 bg-indigo-50/50 dark:border-indigo-500/40 dark:bg-indigo-950/20"
                      : "border-slate-200/80 dark:border-white/10"
                  )}
                >
                  <FloatingLabelNumericInput
                    label="kW"
                    integer
                    value={tier.kw}
                    onValueChange={(n) => updateTier(idx, { kw: n ?? tier.kw })}
                    className="h-10 rounded-lg text-sm font-bold"
                  />
                  <FloatingLabelNumericInput
                    label="Gross price (₹)"
                    value={tier.priceInr}
                    onValueChange={(n) => updateTier(idx, { priceInr: n ?? tier.priceInr })}
                    className="h-10 rounded-lg text-sm font-bold"
                  />
                  <button
                    type="button"
                    disabled={tiers.length <= 1}
                    onClick={() => patchPricing({ kwTiers: tiers.filter((_, i) => i !== idx) })}
                    className="mb-0.5 flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-400 disabled:opacity-30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2 gap-1 text-xs"
            onClick={() => {
              const maxKw = tiers.reduce((m, t) => Math.max(m, t.kw), 0);
              patchPricing({ kwTiers: [...tiers, { kw: maxKw > 0 ? maxKw + 1 : 11, priceInr: 0 }] });
            }}
          >
            <Plus className="h-3.5 w-3.5" /> Add kW tier
          </Button>
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
          <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/40 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/15">
            <p className="text-xs font-bold text-emerald-950 dark:text-emerald-100">PM Surya Ghar subsidy (₹)</p>
            <p className="mt-0.5 text-[11px] text-emerald-800/80 dark:text-emerald-200/70">
              Default {inr(defaultSubsidy)} for {solar.plantCapacityKw} kW — override if needed.
            </p>
            <FloatingLabelNumericInput
              label="Subsidy amount"
              value={config.subsidy?.estimateInr ?? defaultSubsidy}
              onValueChange={(n) =>
                patch({
                  subsidy: {
                    preference: config.subsidy?.preference ?? "maximize",
                    estimateInr: n ?? defaultSubsidy,
                  },
                })
              }
              className="mt-2 h-10 rounded-lg text-sm font-bold"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 bg-slate-50/80 px-4 py-3 dark:border-white/10 dark:bg-white/[0.02] sm:px-5">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Net: <span className="tabular-nums text-indigo-700 dark:text-indigo-300">{inr(costs.netInr)}</span>
          </span>
          {proposalId ? (
            <span className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400">
              <Check className="h-3.5 w-3.5" /> Linked to web proposal
            </span>
          ) : (
            <span className="text-xs text-slate-500">Generate proposal to persist</span>
          )}
        </div>
        <Button
          type="button"
          disabled={saving}
          onClick={() => void saveToProposal()}
          className="gap-2 bg-slate-900 font-semibold hover:bg-slate-800 dark:bg-white dark:text-slate-900"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save pricing"}
        </Button>
      </div>
    </section>
  );
}
