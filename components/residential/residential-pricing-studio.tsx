"use client";

import { Button } from "@/components/ui/button";
import { FloatingLabelInput, FloatingLabelNumericInput } from "@/components/ui/floating-label-input";
import { useToast } from "@/components/ui/toast-center";
import { PANEL_TECHNOLOGY_OPTIONS } from "@/lib/commercial-panel-catalog";
import {
  defaultResidentialKwTiers,
  RESIDENTIAL_INVERTER_PRESETS,
  RESIDENTIAL_WIRE_PRESETS,
  type ResidentialBrandOption,
  type ResidentialProposalConfig,
  type ResidentialWireBrand,
} from "@/lib/residential-requirements-schema";
import { wireBrandDisplayName } from "@/lib/residential-deck-helpers";
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
import { ResidentialBrandComparePanel } from "@/components/residential/residential-brand-compare-panel";
import { ResidentialTrackComparePanel } from "@/components/residential/residential-track-compare-panel";
import { applyActiveBrandToConfig, ensureBrandCatalog } from "@/lib/residential-brand-catalog";
import type { PricingLineItem } from "@/lib/proposal-pricing-lines";
import { saveInstallerResidentialCatalog } from "@/lib/installer-rate-card-client";
import { saveResidentialRequirement } from "@/lib/save-residential-requirement-client";
import type { CommercialProposalConfig } from "@/lib/commercial-proposal-config";
import { saveCommercialRequirement } from "@/lib/save-commercial-requirement-client";
import { CommercialPricingExtrasPanel } from "@/components/commercial/commercial-pricing-extras-panel";
import { ResidentialStepSection } from "@/components/residential/residential-step-section";
import {
  WorkspaceFieldLabel,
  WorkspaceOptionalFold,
  workspaceStickySaveClass,
} from "@/components/proposal/workspace-mobile-ui";
import type { ProposalDeckSummary } from "@/lib/proposal-ppt";
import { useState } from "react";

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
  /** Saves pricing + generates the web proposal in one step (proposal builder). */
  onSaveAndGenerate?: () => Promise<void>;
  /** When false (e.g. commercial connection), subsidy is shown as ineligible and forced to ₹0. */
  subsidyEligible?: boolean;
  /** Hide the brand catalog matrix (editing is done in More → Rate card). */
  hideCatalogPanel?: boolean;
  /** Commercial proposals hub — saves pricing + commercialConfig together. */
  saveMode?: "residential" | "commercial";
  variant?: "residential" | "commercial";
  commercialConfig?: CommercialProposalConfig;
  onCommercialConfigChange?: (next: CommercialProposalConfig) => void;
  summary?: ProposalDeckSummary;
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
      {hint ? <p className="mt-0.5 hidden text-xs text-slate-500 sm:block dark:text-slate-400">{hint}</p> : null}
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
  onSaveAndGenerate,
  saveMode = "residential",
  variant = saveMode === "commercial" ? "commercial" : "residential",
  commercialConfig,
  onCommercialConfigChange,
  summary,
  subsidyEligible: subsidyEligibleProp,
  hideCatalogPanel = false,
  className,
}: Props) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const isCommercial = variant === "commercial";
  const solar = config.solar;
  const pricing = config.pricing ?? {
    kwTiers: defaultResidentialKwTiers(),
    panelTechnology: solar.technology ?? "Mono PERC",
    wireBrand: "polycab" as const,
    discount: { enabled: false, type: "percent" as const, value: 0 },
  };
  const discount = pricing.discount ?? { enabled: false, type: "percent" as const, value: 0 };
  const panelOpts = config.panelBrandOptions ?? [];
  const invOpts = config.inverterBrandOptions ?? [];
  const wireOpts = pricing.wireBrandOptions?.length
    ? pricing.wireBrandOptions
    : pricing.wireBrand
      ? [pricing.wireBrand]
      : (["polycab"] as ResidentialWireBrand[]);
  const defaultSubsidy = computePmSuryaGharSubsidy(solar.plantCapacityKw);
  const subsidyEligible =
    subsidyEligibleProp ?? isPmSuryaGharSubsidyEligible(config.connectionType);

  function patch(partial: Partial<ResidentialProposalConfig>) {
    onChange(ensureBrandCatalog({ ...config, ...partial }));
  }

  function patchPricing(partial: Partial<NonNullable<ResidentialProposalConfig["pricing"]>>) {
    onChange({ ...config, pricing: { ...pricing, ...partial } });
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

  async function runSaveToProposal(): Promise<string | null> {
    const catalogConfig = ensureBrandCatalog(config);
    await saveInstallerResidentialCatalog(catalogConfig.brandCatalog!);

    let id = proposalId?.trim() || null;
    if (!id && onCreateProposal) {
      id = await onCreateProposal();
    }
    if (!id) return null;

    const result =
      saveMode === "commercial" && commercialConfig
        ? await saveCommercialRequirement({
            proposalId: id,
            pricingConfig: catalogConfig,
            commercialConfig,
            proposalLayout,
            lineItems,
          })
        : await saveResidentialRequirement({
            proposalId: id,
            config: catalogConfig,
            proposalLayout,
            lineItems,
          });
    if (!result.ok) {
      throw new Error(result.error ?? "Save failed");
    }
    if (result.proposalLayout) onLayoutChange?.(result.proposalLayout);
    return id;
  }

  async function handleSave() {
    setSaving(true);
    try {
      const id = await runSaveToProposal();
      if (!id) {
        onSaved?.();
        toast.push({
          tone: "success",
          title: "Catalog saved",
          description:
            "kW prices saved to More → Rate card. Generate a web proposal to sync this customer draft to the cloud.",
        });
        return;
      }
      onSaved?.();
      toast.push({
        tone: "success",
        title: "Saved",
        description:
          saveMode === "commercial"
            ? "Commercial pricing and site options synced to this deal."
            : "Saved to central Rate card and this proposal (bill & requirement).",
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

  async function handleSaveAndGenerate() {
    if (!onSaveAndGenerate) {
      await handleSave();
      return;
    }
    setSaving(true);
    try {
      await onSaveAndGenerate();
      onSaved?.();
    } catch (e) {
      toast.push({
        tone: "error",
        title: "Save & generate failed",
        description: e instanceof Error ? e.message : "",
      });
    } finally {
      setSaving(false);
    }
  }

  const equipmentBrandsContent = (
    <div className="space-y-6">
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
                    ? isCommercial
                      ? "border-indigo-500 bg-indigo-600 text-white"
                      : "border-emerald-600 bg-emerald-600 text-white"
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
                    ? isCommercial
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-emerald-700 bg-emerald-700 text-white"
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
  );

  const residentialPricingAdjustments = (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-200/80 p-3 dark:border-white/10">
        <label className="flex cursor-pointer items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Customer discount</span>
          <input
            type="checkbox"
            checked={discount.enabled}
            onChange={(e) => patchPricing({ discount: { ...discount, enabled: e.target.checked } })}
            className="h-4 w-4 rounded accent-emerald-600"
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
              PM Surya Ghar subsidy applies to domestic connections only. Commercial, industrial, and HT connections are
              not eligible — net cost equals price after discount.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border bg-white shadow-sm dark:bg-[#0c1017]",
        isCommercial
          ? "border-indigo-200/70 dark:border-indigo-500/25"
          : "border-emerald-200/70 dark:border-emerald-500/25",
        className
      )}
    >
      <div
        className={cn(
          "border-b px-4 py-4 sm:px-5",
          isCommercial
            ? "border-indigo-500/20 bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 text-white"
            : "border-emerald-500/20 bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white"
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className={cn("text-[10px] font-bold uppercase tracking-widest", isCommercial ? "text-indigo-300" : "text-emerald-300")}>
              Step 2+
            </p>
            <h3 className="text-lg font-semibold tracking-tight">
              {isCommercial ? "Quote & equipment" : "Proposal options"}
            </h3>
            <p className={cn("mt-0.5 text-xs", isCommercial ? "text-indigo-100/90" : "text-emerald-100/90")}>
              Rates: More → Rate card
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-sm font-bold tabular-nums">
            <Zap className="h-4 w-4 text-amber-300 shrink-0" aria-hidden />
            {solar.plantCapacityKw} kW
          </div>
        </div>
      </div>

      <div className="space-y-3 p-3 sm:space-y-4 sm:p-4">
        {!hideCatalogPanel ? (
          <ResidentialBrandCatalogPanel
            config={config}
            onChange={(next) => onChange(ensureBrandCatalog(next))}
          />
        ) : null}

        {/* Plant sizing — residential only (commercial: step 1 above) */}
        {isCommercial ? (
          <div>
            <SectionTitle icon={Sun} title="Panel technology" />
            <select
              value={pricing.panelTechnology ?? solar.technology ?? "Mono PERC"}
              onChange={(e) => {
                const panelTechnology = e.target.value || "Mono PERC";
                onChange({
                  ...config,
                  pricing: { ...pricing, panelTechnology },
                  solar: { ...solar, technology: panelTechnology },
                });
              }}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold dark:border-white/15 dark:bg-white/5"
            >
              {PANEL_TECHNOLOGY_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <ResidentialStepSection step={2} title="Panel type" icon={Sun} defaultOpen>
            <select
              value={pricing.panelTechnology ?? solar.technology ?? "Mono PERC"}
              onChange={(e) => {
                const panelTechnology = e.target.value || "Mono PERC";
                onChange({
                  ...config,
                  pricing: { ...pricing, panelTechnology },
                  solar: { ...solar, technology: panelTechnology },
                });
              }}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold dark:border-white/15 dark:bg-white/5"
            >
              {PANEL_TECHNOLOGY_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </ResidentialStepSection>
        )}

        {/* Equipment brands — proposal + BOM */}
        {isCommercial ? (
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3 dark:border-white/15 dark:bg-white/[0.02]">
            <WorkspaceFieldLabel className="mb-3">Brands on proposal</WorkspaceFieldLabel>
            {equipmentBrandsContent}
          </div>
        ) : (
          <ResidentialStepSection step={3} title="Brands on proposal" icon={Cpu} defaultOpen>
            {equipmentBrandsContent}
          </ResidentialStepSection>
        )}

        {/* Discount + subsidy — residential step 4; commercial: discount only */}
        {isCommercial ? (
          <div className="rounded-xl border border-indigo-200/60 bg-indigo-50/40 p-3 dark:border-indigo-500/20 dark:bg-indigo-950/15">
            <label className="flex cursor-pointer items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Customer discount (this deal)</span>
              <input
                type="checkbox"
                checked={discount.enabled}
                onChange={(e) => patchPricing({ discount: { ...discount, enabled: e.target.checked } })}
                className="h-4 w-4 rounded accent-indigo-600"
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
            <p className="mt-2 hidden text-[11px] text-slate-500 sm:block">No PM subsidy — net = rate − discount.</p>
          </div>
        ) : (
          <ResidentialStepSection step={4} title="Discount & subsidy" icon={Layers} defaultOpen={false}>
            {residentialPricingAdjustments}
          </ResidentialStepSection>
        )}

        <WorkspaceOptionalFold title="Compare brands & tracks" defaultOpen={false} theme={isCommercial ? "commercial" : "residential"}>
          <ResidentialBrandComparePanel config={config} onChange={onChange} />
          <ResidentialTrackComparePanel config={config} onChange={onChange} />
        </WorkspaceOptionalFold>

        {isCommercial && commercialConfig && onCommercialConfigChange && summary ? (
          <CommercialPricingExtrasPanel
            config={commercialConfig}
            summary={summary}
            systemKw={solar.plantCapacityKw}
            onChange={onCommercialConfigChange}
          />
        ) : null}
      </div>

      <div className={workspaceStickySaveClass()}>
        <p className="mb-2 hidden text-xs text-slate-500 sm:block">
          {onSaveAndGenerate ? "Saves settings and opens shareable proposal." : "Syncs to this proposal."}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            disabled={saving}
            onClick={() => void (onSaveAndGenerate ? handleSaveAndGenerate() : handleSave())}
            className={cn(
              "h-12 w-full gap-2 text-base font-semibold sm:min-w-[11rem]",
              isCommercial
                ? "bg-indigo-700 hover:bg-indigo-800 dark:bg-indigo-500"
                : "bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600"
            )}
          >
            <Save className="h-5 w-5" aria-hidden />
            {saving ? "Saving…" : onSaveAndGenerate ? "Save & share proposal" : "Save"}
          </Button>
          {onSaveAndGenerate ? (
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => void handleSave()}
              className="h-12 w-full font-semibold sm:w-auto"
            >
              Save only
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
