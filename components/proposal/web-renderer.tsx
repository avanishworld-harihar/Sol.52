"use client";

/**
 * ProposalWebRenderer — the block-loop rendering engine for the Proposal OS.
 *
 * Architecture:
 *   ProposalDocument.layout.blocks[]   (ordered, enabled/disabled)
 *       ↓ filter: enabled = true
 *       ↓ check:  isBlockEligible(blockId, eligibilityCtx)
 *       ↓ lookup: WEB_RENDERER_REGISTRY[blockId] → renderKey + pageDataAttr + bridgeKey
 *       ↓ render: renderBlockByKey(renderKey, ctx)
 *
 * Design constraints:
 *   - Residential proposals (preset = "residential_smart") continue to use the
 *     existing ProposalView component unchanged. The WebRenderer is for the
 *     commercial_executive preset and future presets.
 *   - All section components imported here are the SAME components used in
 *     proposal-view.tsx — just now accessible via named exports added in Phase B.
 *   - The WebRenderer manages its own state (lang, darkMode, amcYears) exactly
 *     as ProposalView does — they are independent renderer instances.
 *
 * Backward compatibility:
 *   - This file does NOT modify proposal-view.tsx behavior.
 *   - Adding new block IDs only requires adding a case here + a registry entry.
 *   - Blocks without registry entries render as null (skipped with console.warn).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { MotionConfig } from "framer-motion";
import { Download, Languages, MessageCircle, Moon, Sun, Presentation } from "lucide-react";

import type { ProposalDocument } from "@/lib/proposal-document-ir";
import { summarizeProposalDeck, type PremiumProposalPptInput, type ProposalDeckSummary } from "@/lib/proposal-ppt";
import type { ProposalBlockId } from "@/lib/proposal-block-registry";
import type { BlockRenderContext } from "@/lib/proposal-block-context";
import { resolveStoryVariant, type ProposalPresetId } from "@/lib/proposal-preset-engine";
import {
  getEnabledProposalBlocksInOrder,
  getEnabledProposalBlocksInSection,
} from "@/lib/proposal-layout-merge";
import {
  WEB_RENDERER_REGISTRY,
  isBlockEligible,
  getJourneyBridgeText,
  type BlockRenderKey,
} from "@/lib/proposal-web-renderer-registry";
import { dict, monthLabels } from "@/lib/proposal-i18n";
import type { ProposalLang } from "@/lib/proposal-i18n";
import { hindiHonoredDisplayName } from "@/lib/roman-name-to-devanagari";
import {
  applyProposalRouteShellTheme,
  readProposalWebTheme,
  writeProposalWebTheme,
} from "@/lib/proposal-web-theme";
import {
  PROPOSAL_BRANDING_UPDATED_EVENT,
  readProposalBrandingSettings,
  resolveInstallerDisplayName,
  resolveProposalBrandConfig,
} from "@/lib/proposal-branding-settings";
import { JourneyBridge, ProposalJourneyProgress } from "@/components/proposal/proposal-journey";
import { isProposalBillAuditBacked } from "@/lib/proposal-bill-audit-eligibility";
import { PROPOSAL_PREMIUM_DOC_CLASS } from "@/lib/proposal-premium-design";

// ── Residential section components (re-exported from proposal-view.tsx) ───────
import {
  HeroCover,
  CompanyProfileSection,
  DeepAuditSection,
  EconomicsSection,
  SystemRequirementSection,
  EnvironmentSection,
  TechnicalProposalSection,
  BomSection,
  SurveyAndWorkflowSection,
  ServiceAmcSection,
  PaymentSection,
  CommercialAndAmcSection,
  BankingSection,
  ClosingSection,
} from "@/app/(public)/proposal/[id]/proposal-view";

// ── Commercial block components ───────────────────────────────────────────────
import { BlockExecutiveSummary } from "@/components/proposal/blocks/block-executive-summary";
import { BlockSystemRequirements } from "@/components/proposal/blocks/block-system-requirements";
import { BlockFinancialIntelligence } from "@/components/proposal/blocks/block-financial-intelligence";
import { BlockEngineeringRationale } from "@/components/proposal/blocks/block-engineering-rationale";
// Wave 3 P7
import { BrandComparisonCard } from "@/components/proposals/blocks/brand-comparison";
import { BlockDcrComparison } from "@/components/proposal/blocks/commercial/block-dcr-comparison";
import { ResidentialTrackCompareSection } from "@/components/proposal/blocks/residential/block-residential-track-compare";
import { parseResidentialConfig } from "@/lib/residential-proposal-config";
import { BlockCapacityScenarios } from "@/components/proposal/blocks/commercial/block-capacity-scenarios";
import { BlockCommercialFinancing } from "@/components/proposal/blocks/commercial/block-commercial-financing";
import { BlockDgHybrid } from "@/components/proposal/blocks/commercial/block-dg-hybrid";
import { BlockInvestmentSummary } from "@/components/proposal/blocks/residential/block-investment-summary";
import { BlockTechnicalSummary } from "@/components/proposal/blocks/residential/block-technical-summary";
import { BlockResidentialTerms } from "@/components/proposal/blocks/residential/block-residential-terms";
import { BlockCustomerDocuments } from "@/components/proposal/blocks/residential/block-customer-documents";
import { ProposalAppendixShell } from "@/components/proposal/appendix/proposal-appendix-shell";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProposalWebRendererProps = {
  /** The compiled ProposalDocument IR from Phase A compiler. */
  document: ProposalDocument;
  /** Deck summary — required for section components. Pass from server when raw_input has no embedded summary. */
  summary?: ProposalDeckSummary;
  /** Optional override — when true, show site survey page. */
  showSurveyWorkflowSection?: boolean;
};

// ─── Sales Premium render overrides (inline — no generic resolver module) ───

function resolveSalesPremiumRenderKey(
  blockId: ProposalBlockId,
  defaultKey: BlockRenderKey
): BlockRenderKey {
  switch (blockId) {
    case "technical_specifications":
      return "technical_summary";
    case "bom_material_list":
      return "bom_only";
    case "payment_terms":
      return "payment_milestones_only";
    default:
      return defaultKey;
  }
}

// ─── Block render dispatch ────────────────────────────────────────────────────

export function renderBlockByKey(
  renderKey: BlockRenderKey,
  ctx: BlockRenderContext
): React.ReactNode {
  const { summary, lang, D, darkMode, siteImages, honoredDisplay } = ctx;
  const monthLbls = ctx.monthLbls;

  switch (renderKey) {
    case "cover":
      return (
        <HeroCover
          D={D}
          lang={lang}
          summary={summary}
          installerLogoUrl={ctx.installerLogoUrl}
          brandConfig={ctx.brandConfig}
          siteImages={siteImages}
          darkMode={darkMode}
        />
      );

    case "about_company":
      return (
        <CompanyProfileSection
          D={D}
          lang={lang}
          summary={summary}
          siteImages={siteImages}
        />
      );

    case "executive_summary":
      return (
        <BlockExecutiveSummary
          summary={summary}
          lang={lang}
          D={D}
          darkMode={darkMode}
          installer={ctx.installer}
          honoredDisplay={honoredDisplay}
          storyVariant={ctx.storyVariant}
        />
      );

    case "bill_audit":
      return (
        <DeepAuditSection
          D={D}
          summary={summary}
          monthLbls={monthLbls}
          lang={lang}
        />
      );

    case "economics":
      return (
        <EconomicsSection
          D={D}
          summary={summary}
          monthLbls={monthLbls}
          lang={lang}
          mode={ctx.presetId === "residential_sales_premium" ? "savings_narrative" : "full"}
        />
      );

    case "investment_summary":
      return <BlockInvestmentSummary summary={summary} lang={lang} D={D} />;

    case "technical_summary":
      return <BlockTechnicalSummary summary={summary} lang={lang} D={D} />;

    case "bom_only":
      return <BomSection D={D} lang={lang} summary={summary} />;

    case "payment_milestones_only":
      return <PaymentSection D={D} summary={summary} lang={lang} />;

    case "terms_conditions":
      return <BlockResidentialTerms lang={lang} installerName={ctx.installer.name} />;

    case "customer_documents":
      return <BlockCustomerDocuments lang={lang} />;

    case "system_requirements":
      return (
        <BlockSystemRequirements
          summary={summary}
          lang={lang}
          D={D}
          darkMode={darkMode}
        />
      );

    case "environment":
      return (
        <EnvironmentSection D={D} summary={summary} lang={lang} />
      );

    case "technical_and_bom":
      return (
        <>
          <TechnicalProposalSection D={D} lang={lang} summary={summary} />
          <BomSection D={D} lang={lang} summary={summary} />
        </>
      );

    case "amc":
      return (
        <ServiceAmcSection D={D} lang={lang} summary={summary} />
      );

    case "commercial_payment":
      return (
        <>
          <PaymentSection D={D} summary={summary} lang={lang} />
          <CommercialAndAmcSection
            D={D}
            summary={summary}
            selectedAmcYears={ctx.selectedAmcYears}
            onAmcChange={ctx.onAmcChange}
            lang={lang}
          />
        </>
      );

    case "banking_closing":
      return (
        <>
          <BankingSection
            D={D}
            summary={summary}
            siteImages={siteImages}
            proposalId={ctx.proposalId}
            lang={lang}
          />
          <ClosingSection
            D={D}
            summary={summary}
            siteImages={siteImages}
            onShare={ctx.onShare}
            onDownload={ctx.onDownload}
            installer={ctx.installer}
            brandConfig={ctx.brandConfig}
            downloading={ctx.downloading}
            lang={lang}
            honoredDisplay={honoredDisplay}
          />
        </>
      );

    case "survey_workflow":
      return (
        <SurveyAndWorkflowSection D={D} lang={lang} siteImages={siteImages} />
      );

    case "payback_analysis":
      return (
        <BlockFinancialIntelligence
          summary={summary}
          lang={lang}
          D={D}
          darkMode={darkMode}
        />
      );

    case "financial_intelligence":
      return (
        <BlockFinancialIntelligence
          summary={summary}
          lang={lang}
          D={D}
          darkMode={darkMode}
        />
      );

    case "engineering_rationale":
      return (
        <BlockEngineeringRationale
          summary={summary}
          lang={lang}
          D={D}
          darkMode={darkMode}
        />
      );

    case "brand_comparison":
      return (
        <BrandComparisonCard
          summary={summary}
          lang={lang}
          darkMode={darkMode}
          dcrOnly={ctx.presetId === "commercial_executive"}
          catalog={
            ctx.residentialConfig?.brandCatalog ?? ctx.pptInput.sharedPlantCatalog ?? null
          }
          brandIdA={
            ctx.residentialConfig?.brandCompare?.brandIdA ??
            ctx.commercialConfig?.brandComparison?.brandIdA
          }
          brandIdB={
            ctx.residentialConfig?.brandCompare?.brandIdB ??
            ctx.commercialConfig?.brandComparison?.brandIdB
          }
          enabled={
            ctx.presetId === "residential_smart"
              ? ctx.residentialConfig?.brandCompare?.enabled === true
              : ctx.residentialConfig?.brandCompare?.enabled === true ||
                ctx.commercialConfig?.brandComparison?.enabled !== false
          }
        />
      );

    case "dcr_comparison":
      if (ctx.presetId === "commercial_executive") return null;
      if (ctx.residentialConfig?.trackCompare?.enabled) {
        return (
          <ResidentialTrackCompareSection
            lang={lang}
            darkMode={darkMode}
            trackCompare={ctx.residentialConfig.trackCompare}
            highlightPlantKw={ctx.residentialConfig.solar.plantCapacityKw}
          />
        );
      }
      return (
        <BlockDcrComparison
          summary={summary}
          lang={lang}
          darkMode={darkMode}
          commercialConfig={ctx.commercialConfig}
        />
      );

    case "capacity_scenarios":
      return (
        <BlockCapacityScenarios
          summary={summary}
          lang={lang}
          darkMode={darkMode}
          commercialConfig={ctx.commercialConfig}
          residentialConfig={ctx.residentialConfig}
        />
      );

    case "commercial_financing":
      return (
        <BlockCommercialFinancing
          summary={summary}
          lang={lang}
          darkMode={darkMode}
          commercialConfig={ctx.commercialConfig}
        />
      );

    case "dg_hybrid":
      return (
        <BlockDgHybrid
          summary={summary}
          lang={lang}
          darkMode={darkMode}
          commercialConfig={ctx.commercialConfig}
        />
      );

    default:
      return null;
  }
}

// ─── Renderer ────────────────────────────────────────────────────────────────

export function ProposalWebRenderer({
  document: doc,
  summary: summaryProp,
  showSurveyWorkflowSection = false,
}: ProposalWebRendererProps) {
  const [lang, setLang] = useState<ProposalLang>(doc.lang ?? "en");
  const [darkMode, setDarkMode] = useState(false);
  const [selectedAmcYears, setSelectedAmcYears] = useState<1 | 5 | 10>(1);
  const [downloading, setDownloading] = useState(false);
  const [displayInstallerLogoUrl, setDisplayInstallerLogoUrl] = useState("");

  const rawSummary = useMemo((): ProposalDeckSummary | null => {
    if (summaryProp) return summaryProp;
    const embedded = (doc.raw_input as Record<string, unknown> | undefined)?.summary;
    if (embedded && typeof embedded === "object") {
      return embedded as ProposalDeckSummary;
    }
    const ppt = doc.raw_input as PremiumProposalPptInput | undefined;
    if (ppt?.monthlyUnits) {
      try {
        return summarizeProposalDeck(ppt);
      } catch {
        return null;
      }
    }
    return null;
  }, [summaryProp, doc.raw_input]);

  if (!rawSummary) {
    console.warn("[ProposalWebRenderer] No proposal summary available — cannot render.");
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-slate-600">
        This proposal could not be loaded. Please regenerate from the builder or contact your installer.
      </div>
    );
  }

  return (
    <ProposalWebRendererInner
      doc={doc}
      summary={rawSummary}
      lang={lang}
      setLang={setLang}
      darkMode={darkMode}
      setDarkMode={setDarkMode}
      selectedAmcYears={selectedAmcYears}
      setSelectedAmcYears={setSelectedAmcYears}
      downloading={downloading}
      setDownloading={setDownloading}
      displayInstallerLogoUrl={displayInstallerLogoUrl}
      setDisplayInstallerLogoUrl={setDisplayInstallerLogoUrl}
      showSurveyWorkflowSection={showSurveyWorkflowSection}
    />
  );
}

// ─── Inner renderer (state already initialized above) ────────────────────────

function ProposalWebRendererInner({
  doc,
  summary,
  lang,
  setLang,
  darkMode,
  setDarkMode,
  selectedAmcYears,
  setSelectedAmcYears,
  downloading,
  setDownloading,
  displayInstallerLogoUrl,
  setDisplayInstallerLogoUrl,
  showSurveyWorkflowSection,
}: {
  doc: ProposalDocument;
  summary: import("@/lib/proposal-ppt").ProposalDeckSummary;
  lang: ProposalLang;
  setLang: (l: ProposalLang) => void;
  darkMode: boolean;
  setDarkMode: (d: boolean) => void;
  selectedAmcYears: 1 | 5 | 10;
  setSelectedAmcYears: (y: 1 | 5 | 10) => void;
  downloading: boolean;
  setDownloading: (d: boolean) => void;
  displayInstallerLogoUrl: string;
  setDisplayInstallerLogoUrl: (u: string) => void;
  showSurveyWorkflowSection: boolean;
}) {
  // Theme sync
  useEffect(() => {
    const preferred = readProposalWebTheme() === "dark";
    setDarkMode(preferred);
    applyProposalRouteShellTheme(preferred ? "dark" : "light");
  }, []);

  useEffect(() => {
    writeProposalWebTheme(darkMode ? "dark" : "light");
    applyProposalRouteShellTheme(darkMode ? "dark" : "light");
    globalThis.document?.documentElement && (globalThis.document.documentElement.dataset.proposalTheme = darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    const sync = () => {
      const branding = readProposalBrandingSettings();
      const fromServer = doc.installer.logo_url?.trim() ?? "";
      const fromLocal = branding.installerLogoUrl?.trim() ?? "";
      setDisplayInstallerLogoUrl(fromServer || fromLocal);
    };
    sync();
    window.addEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, sync);
    return () => window.removeEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, sync);
  }, [doc.installer.logo_url]);

  const D = dict(lang);
  const monthLbls = monthLabels(lang);
  const honoredDisplay = useMemo(
    () => (lang === "hi" ? hindiHonoredDisplayName(summary.honoredName) : summary.honoredName),
    [lang, summary.honoredName]
  );

  const billAuditBacked = isProposalBillAuditBacked(
    (doc.raw_input as import("@/lib/proposal-ppt").PremiumProposalPptInput) ?? { monthlyUnits: { jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0, jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0 } }
  );

  const presetId = doc.preset_id as ProposalPresetId;

  // Installer data from IR — overlay local branding (logo + name) when saved in More tab
  const branding = readProposalBrandingSettings();
  const resolvedInstallerName = resolveInstallerDisplayName(branding);
  const installer = {
    name:
      resolvedInstallerName ||
      (doc.installer.name?.trim() && doc.installer.name !== "Harihar Solar"
        ? doc.installer.name.trim()
        : ""),
    contact: doc.installer.contact ?? "",
    tagline: doc.installer.tagline ?? "",
  };

  async function downloadPpt() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/proposals/${doc.proposal_id}/ppt?lang=${lang}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = globalThis.document.createElement("a");
      a.href = url;
      a.download = `${doc.customer.name.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "").trim() || "customer"}-proposal.pptx`;
      globalThis.document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
  }

  function shareWhatsApp() {
    if (typeof window === "undefined") return;
    const link = `${window.location.origin}/proposal/${doc.proposal_id}`;
    const text = [
      `${summary.honoredName} ke liye ${summary.systemKw} kW solar proposal taiyaar hai.`,
      `Net cost: ₹${Math.round(summary.netCost).toLocaleString("en-IN")} | Saving: ₹${Math.round(summary.annualSaving).toLocaleString("en-IN")}/yr`,
      link,
    ].join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }

  // Wave 3 P6: resolve story variant from pptInput fields (additive, null-safe)
  const rawInput = (doc.raw_input as import("@/lib/proposal-ppt").PremiumProposalPptInput) ?? ({} as import("@/lib/proposal-ppt").PremiumProposalPptInput);
  const storyVariant = resolveStoryVariant(
    presetId,
    rawInput.storySegment ?? null,
    rawInput.storyMode ?? null,
    lang
  );

  // Build render context
  const brandConfig = resolveProposalBrandConfig({ pptInput: rawInput, settings: branding });

  const ctx: BlockRenderContext = {
    summary,
    pptInput: rawInput,
    lang,
    monthLbls,
    D,
    darkMode,
    honoredDisplay,
    proposalId: doc.proposal_id,
    presetId,
    installer,
    installerLogoUrl: displayInstallerLogoUrl || undefined,
    brandConfig,
    siteImages: rawInput.siteImages,
    billAuditBacked,
    showSurveyWorkflowSection,
    selectedAmcYears,
    onAmcChange: setSelectedAmcYears,
    onShare: shareWhatsApp,
    onDownload: downloadPpt,
    downloading,
    storyVariant,
    commercialConfig: rawInput.commercialConfig ?? null,
    residentialConfig: parseResidentialConfig(rawInput.residentialConfig),
  };

  const eligibilityCtx = { billAuditBacked, presetId, showSurveySection: showSurveyWorkflowSection };
  const isSalesPremium = presetId === "residential_sales_premium";

  type PageEntry = {
    blockId: ProposalBlockId;
    renderKey: BlockRenderKey;
    pageDataAttr: string;
    bridgeKey?: string;
  };

  function buildPageList(blockIds: ProposalBlockId[]): PageEntry[] {
    const renderedKeys = new Set<BlockRenderKey>();
    const pages: PageEntry[] = [];

    for (const blockId of blockIds) {
      const meta = WEB_RENDERER_REGISTRY[blockId];
      if (!meta) continue;
      if (!isBlockEligible(blockId, eligibilityCtx)) continue;

      const renderKey = isSalesPremium
        ? resolveSalesPremiumRenderKey(blockId, meta.renderKey)
        : meta.renderKey;

      if (!isSalesPremium && renderedKeys.has(renderKey)) continue;
      if (isSalesPremium && renderKey !== "bom_only" && renderedKeys.has(renderKey)) continue;

      renderedKeys.add(renderKey);
      pages.push({
        blockId,
        renderKey,
        pageDataAttr: meta.pageDataAttr,
        bridgeKey: meta.bridgeKey,
      });
    }

    return pages;
  }

  const flowBlockIds = isSalesPremium
    ? getEnabledProposalBlocksInSection(doc.layout, "flow")
    : getEnabledProposalBlocksInOrder(doc.layout);
  const appendixBlockIds = isSalesPremium
    ? getEnabledProposalBlocksInSection(doc.layout, "appendix")
    : [];

  const flowPages = buildPageList(flowBlockIds);
  const appendixPages = buildPageList(appendixBlockIds);

  if (flowPages.length === 0 && appendixPages.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-slate-600">
        This proposal has no visible sections. Regenerate from the builder or pick a theme in Settings →
        Proposal templates.
      </div>
    );
  }

  return (
    <MotionConfig transition={{ duration: 0.35, ease: "easeOut" }} reducedMotion="user">
      <div
        className={`proposal-document ${PROPOSAL_PREMIUM_DOC_CLASS} proposal-journey-connected proposal-responsive-doc mx-auto w-full max-w-[210mm] px-4 pb-32 pt-6 sm:px-8 sm:pt-10 print:max-w-none print:p-0 print:pb-0 transition-colors duration-300 ${
          lang === "hi" ? "lang-hi " : ""
        }${darkMode ? "text-white" : ""}`}
        data-theme={darkMode ? "dark" : "light"}
        data-preset={presetId}
      >
        {/* Floating controls */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 print:hidden">
          <ProposalJourneyProgress
            showSurvey={showSurveyWorkflowSection}
            billAuditBacked={billAuditBacked}
            presetId={presetId}
            className="flex-1 min-w-0"
          />
        </div>
        <div className="mb-4 flex flex-wrap items-center justify-end gap-2 print:hidden">
          <button
            type="button"
            onClick={() => setLang(lang === "en" ? "hi" : "en")}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors ${
              darkMode
                ? "border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Languages className="h-3.5 w-3.5" />
            {lang === "en" ? "हिन्दी" : "English"}
          </button>
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors ${
              darkMode
                ? "border-yellow-500/50 bg-yellow-900/40 text-yellow-300 hover:bg-yellow-900/60"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {darkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            {darkMode ? "Light" : "Dark"}
          </button>
          <button
            type="button"
            onClick={() => { if (typeof window !== "undefined") window.print(); }}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors ${
              darkMode
                ? "border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Download className="h-3.5 w-3.5" />
            {lang === "en" ? "Print / PDF" : "प्रिंट / PDF"}
          </button>
          <a
            href={`/proposal/${ctx.proposalId}/present`}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors ${
              darkMode
                ? "border-violet-500/40 bg-violet-900/30 text-violet-300 hover:bg-violet-900/50"
                : "border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100"
            }`}
          >
            <Presentation className="h-3.5 w-3.5" />
            {lang === "en" ? "Present" : "प्रेज़ेंट"}
          </a>
        </div>

        {/* Active reading flow */}
        {flowPages.map(({ blockId, renderKey, pageDataAttr, bridgeKey }) => (
          <div key={`flow-${blockId}-${renderKey}`}>
            <div className="proposal-page" data-page={pageDataAttr}>
              {renderBlockByKey(renderKey, ctx)}
            </div>
            {bridgeKey ? (
              <JourneyBridge
                text={getJourneyBridgeText(
                  isSalesPremium && bridgeKey === "afterSavings" ? "afterSavingsPremium" : bridgeKey,
                  lang
                )}
                lang={lang}
              />
            ) : null}
          </div>
        ))}

        {/* Appendix — Sales Premium v1 only */}
        {appendixPages.length > 0 ? (
          <ProposalAppendixShell lang={lang}>
            {appendixPages.map(({ blockId, renderKey, pageDataAttr }) => (
              <div key={`appendix-${blockId}-${renderKey}`} className="proposal-page proposal-page--appendix" data-page={pageDataAttr}>
                {renderBlockByKey(renderKey, ctx)}
              </div>
            ))}
          </ProposalAppendixShell>
        ) : null}

        {/* Sticky mobile action bar */}
        <div
          className={`fixed bottom-0 left-0 right-0 z-30 border-t px-4 py-3 backdrop-blur sm:hidden print:hidden ${
            darkMode ? "border-white/10 bg-slate-950/95" : "border-slate-200 bg-white/95"
          }`}
        >
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
            <button
              type="button"
              onClick={shareWhatsApp}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow active:scale-95"
            >
              <MessageCircle className="h-4 w-4" /> {D["cta.whatsapp"]}
            </button>
            <button
              type="button"
              onClick={downloadPpt}
              disabled={downloading}
              className="flex flex-1 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm active:scale-95"
            >
              <Download className="h-4 w-4" /> {downloading ? "…" : D["cta.downloadPpt"]}
            </button>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
