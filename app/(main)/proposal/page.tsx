"use client";

import dynamic from "next/dynamic";
import { useLanguage } from "@/lib/language-context";
import {
  applyTariffCategoryOverride,
  estimateMonthlyKwhFromBillAmount,
  getFallbackTariffContext
} from "@/lib/tariff-engine";
import { inferMpLv12SanctionedLoadKwWhenBillOmits } from "@/lib/mp-tariff-2025-26";
import { calculateSolar, computeGrossSystemCostInr, DEFAULT_TARIFF_CONTEXT } from "@/lib/solar-engine";
import type { CustomerLead, MonthlyUnits } from "@/lib/types";
import type { TariffContext } from "@/lib/tariff-types";
import {
  countFilledMonths,
  emptyMonthlyUnits,
  mergeParsedMonthsIntoUnits,
  type ParsedBillShape
} from "@/lib/bill-parse";
import { isHtParsedBill } from "@/lib/ht-bill-sanitize";
import { INDIAN_STATES_AND_UTS } from "@/lib/indian-states-uts";
import { INSTALLER_REGION_EVENT, readInstallerRegion } from "@/lib/installer-region-storage";
import { readProposalBrandingSettings, buildInstallerIdentitySnapshot } from "@/lib/proposal-branding-settings";
import { HelpHint } from "@/components/ui/help-hint";
import { FloatingLabelInput, FloatingLabelSelect } from "@/components/ui/floating-label-input";
import { NumericTextInput } from "@/components/ui/numeric-text-input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast-center";
import {
  getBillingRule,
  getBillingUploadRequirement,
  isBillMonthAlignedForOffset
} from "@/lib/discom-billing-rules";
import { pickProposalLeadPhone, patchLeadPhoneIfProvided } from "@/lib/lead-phone";
import {
  mergeCustomerForProposal,
  mergeParsedBills,
  type ManualProposalCustomer,
} from "@/lib/merge-proposal-customer";
import { buildLeadPatchFromProposal, patchLeadFromProposal } from "@/lib/sync-proposal-lead";
import { saveResidentialRequirement } from "@/lib/save-residential-requirement-client";
import { saveCommercialRequirement } from "@/lib/save-commercial-requirement-client";
import { saveInstallerResidentialCatalog } from "@/lib/installer-rate-card-client";
import { markProposalSentIfDraft } from "@/lib/proposal-share-actions";
import { syncEquipmentPresetsFromConfig } from "@/lib/residential-equipment-presets";
import { ensureBrandCatalog } from "@/lib/residential-brand-catalog";
import {
  clearProposalBuilderSession,
  EMPTY_MANUAL_PROPOSAL_CUSTOMER,
  isProposalBuilderReloadNavigation,
  isProposalForceNewFromUrl,
  loadProposalBuilderSession,
  saveProposalBuilderSession,
  takeProposalForceNewIntent,
} from "@/lib/proposal-builder-session";
import { isBillBackedFromBuilderState } from "@/lib/proposal-bill-audit-eligibility";
import { swrDiscomsWithOfflineCache, swrTariffWithOfflineCache } from "@/lib/proposal-swr-fetchers";
import { CUSTOMERS_SWR_KEY, fetchCustomersLoose } from "@/lib/customers-client";
import { DASHBOARD_STATS_SWR_KEY } from "@/lib/dashboard-stats-client";
import { ProposalQuickPreview } from "@/components/proposal/proposal-quick-preview";
import { WorkspacePage, WorkspacePageHero } from "@/components/workspace";
import { cn } from "@/lib/utils";
import { Building2, Check, ChevronDown, Download, ExternalLink, FileUp, Globe, MessageCircle, Send, Sparkles, Zap } from "lucide-react";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { parsePrefillFromSearchParams } from "@/lib/quick-actions";
import { ProposalPresetPicker } from "@/components/proposals/os/preset-picker";
import { readDefaultCommercialPreset, readDefaultResidentialPreset } from "@/lib/proposal-default-preset-storage";
import { readActiveSalesPremiumStyle, getSalesPremiumLayoutForStyle, usesInstitutionalRenderer } from "@/lib/sales-premium-styles";
import { readDefaultGalleryKey } from "@/lib/proposal-template-gallery-storage";
import type { ProposalPresetId } from "@/lib/proposal-preset-engine";
import { ProposalOSHeader } from "@/components/proposals/os/proposal-os-header";
import { BuilderStageBar } from "@/components/proposals/os/builder-stage-bar";
import {
  monthlyUnitsFromRequirementInput,
  requirementHasConsumptionInput,
} from "@/lib/requirement-consumption-sync";
import { ProposalLivePreviewPanel } from "@/components/proposals/os/live-preview-panel";
import { BlockPlaylistEditor } from "@/components/proposals/os/block-playlist-editor";
import { ProposalLimitUpgradeModal } from "@/components/billing/proposal-limit-upgrade-modal";

import { CommercialProposalWorkspace } from "@/components/commercial/commercial-proposal-workspace";
import { ProposalReviewSheet } from "@/components/commercial/proposal-review-sheet";
import { CommercialCategorySelector } from "@/components/commercial/commercial-category-selector";
import { CommercialOrgTypePicker } from "@/components/commercial/commercial-org-type-picker";
import { CommercialInputModeSelector } from "@/components/commercial/commercial-input-mode";
import { ResidentialInputModeSelector } from "@/components/residential/residential-input-mode";
import {
  ResidentialProposalModePicker,
  type ResidentialInputMode,
} from "@/components/residential/residential-proposal-mode-picker";
import { ResidentialProposalConfigWorkspace } from "@/components/residential/residential-proposal-config-workspace";
import { ResidentialRequirementCustomerForm } from "@/components/residential/residential-requirement-customer-form";
import { isPmSuryaGharSubsidyEligible } from "@/lib/lead-connection-types";
import {
  applyConnectionTypeSubsidyPolicy,
  applyPlantCapacitySubsidySync,
  healStaleResidentialSubsidy,
  residentialAnnualGenerationUnits,
  residentialGrossCostInr,
  residentialNetCostInr,
  resolveResidentialSubsidyInr,
} from "@/lib/residential-deck-helpers";
import { moduleCountForResidential, quoteResidentialSolar } from "@/lib/residential-solar-engine";
import {
  applyCommercialFlagsToLayout,
  applyLayoutFlagsToCommercialConfig,
  defaultCommercialConfig,
  parseCommercialConfig,
  withOrgStory,
  type CommercialProposalConfig,
} from "@/lib/commercial-proposal-config";
import {
  applyResidentialFlagsToLayout,
  applyResidentialPricingSource,
  defaultResidentialConfigForBuilder,
  parseResidentialConfig,
  type ResidentialProposalConfig,
} from "@/lib/residential-proposal-config";
import { mergeConnectionPhaseFromBillText, applyConnectionPhaseSelection, connectionPhaseToManualLabel, detectConnectionPhaseFromText, type ConnectionPhase } from "@/lib/connection-phase-pricing";
import {
  getCachedResidentialBrandCatalog,
  INSTALLER_RATE_CARD_UPDATED_EVENT,
  loadInstallerRateCard,
} from "@/lib/installer-rate-card-client";
import {
  applyCommercialPanelTrackPolicy,
  panelTypeFromTrack,
  resolveCommercialPanelTrack,
} from "@/lib/commercial-panel-track-policy";
import {
  commercialTrackFromPanelType,
  plantGrossFromSharedCatalogOrFallback,
} from "@/lib/shared-plant-rate-card";
import {
  proposalPricingBlocksFromSharedCatalog,
  proposalPricingBlocksGeneration,
} from "@/lib/plant-pricing-resolver";
import {
  readResidentialDraftProposalId,
  writeResidentialDraftProposalId,
} from "@/lib/residential-brand-catalog-storage";
import {
  bindProposalDraftId,
  clearAllProposalDraftIds,
  draftFamilyForPreset,
  isCommercialPresetFamily,
  readCommercialDraftProposalId,
  readDraftProposalIdForFamily,
  writeCommercialDraftProposalId,
} from "@/lib/proposal-builder-draft";
import { getPresetDefaultLayout } from "@/lib/proposal-preset-engine";
import { builderStateFromPptInput } from "@/lib/proposal-builder-restore-from-deck";
import {
  isPlaceholderProposalCustomerName,
  resolveProposalCustomerName,
} from "@/lib/proposal-customer-placeholder";
import type { PremiumProposalPptInput } from "@/lib/proposal-ppt";
import type { ProposalTemplateV1 } from "@/lib/proposal-template-schema";
import useSWR, { useSWRConfig } from "swr";

const BillAnalysisCharts = dynamic(
  () => import("@/components/bill-analysis-charts").then((m) => ({ default: m.BillAnalysisCharts })),
  {
    ssr: false,
    loading: () => <Skeleton className="h-48 w-full rounded-2xl" />
  }
);

const PIPELINE_SWR_KEY = "/api/pipeline";
const CLIENT_REF_STORAGE_KEY = "ss_device_ref";
const LEARNED_BILL_PROFILE_KEY = "ss_bill_upload_profile_v1";

type LearnedBillProfile = {
  requiredBills: number;
  historyWindowMonths: number;
  updatedAt: string;
};

function profileKey(stateRaw: string, discomRaw: string): string {
  return `${stateRaw.trim().toLowerCase().replace(/\s+/g, " ")}::${discomRaw.trim().toLowerCase().replace(/\s+/g, " ")}`;
}

function inferProfileFromBill(parsed: ParsedBillShape): LearnedBillProfile | null {
  const historyWindow = Math.max(1, Math.min(12, parsed.consumption_history?.length ?? 0));
  if (!historyWindow || historyWindow >= 12) return { requiredBills: 1, historyWindowMonths: 12, updatedAt: new Date().toISOString() };
  const requiredBills = Math.max(1, Math.min(6, Math.ceil(12 / historyWindow)));
  return { requiredBills, historyWindowMonths: historyWindow, updatedAt: new Date().toISOString() };
}

function createClientRef(): string {
  const c = typeof globalThis !== "undefined" ? (globalThis.crypto as Crypto | undefined) : undefined;
  const uuid = c?.randomUUID?.();
  if (uuid) return `ss-${uuid}`;
  return `ss-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function billInrFromParsed(v: number | string | null | undefined): number | undefined {
  if (v == null || v === "") return undefined;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = parseFloat(String(v).replace(/,/g, "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Keep only the first meaningful token from connection_type so bill-printed codes
 * like "LT" / "LV2.2" / "LT-II" are not expanded by the AI into long descriptions.
 * Max 40 chars; strips trailing " - description" patterns.
 */
function truncateConnectionType(raw: string): string {
  if (!raw) return "";
  // Remove " - " and anything after it (AI often appends " - Low Tension / Commercial…")
  const cleaned = raw.replace(/\s*[-–]\s+(low tension|high tension|commercial|domestic|industrial|lt|ht).*/i, "").trim();
  return cleaned.slice(0, 40).trim();
}

/** Normalize phase label for forms (MPEZ prints "SINGLE"). */
function normalizeBillPhaseLabel(raw?: string | null): string {
  const s = raw?.trim() ?? "";
  if (!s) return "";
  const u = s.toUpperCase();
  if (/\bSINGLE\b|1\s*-?\s*PH/.test(u)) return "Single";
  if (/\bTHREE\b|3\s*-?\s*PH/.test(u)) return "Three";
  return s;
}

function parseManualContractKva(s: string): number | undefined {
  const t = s.trim();
  if (!t) return undefined;
  const n = parseFloat(t.replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

/** MP smart billing — bill OCR cross-checks forwarded to the PPT / proposal API. */
function buildMpSmartBillingApiPayload(manual: ManualProposalCustomer, latestBill: ParsedBillShape | null, previousBill: ParsedBillShape | null) {
  const ref = latestBill ?? previousBill;
  const purpose =
    manual.purposeOfSupply.trim() || ref?.purpose_of_supply?.trim() || ref?.connection_type?.trim() || "";
  const cd = parseManualContractKva(manual.contractDemandKva) ?? billInrFromParsed(ref?.contract_demand_kva ?? null);
  return {
    ...(purpose ? { purposeOfSupply: purpose } : {}),
    ...(cd != null ? { contractDemandKva: cd } : {}),
    ...(billInrFromParsed(ref?.energy_charges_inr) != null
      ? { billEnergyChargesInr: billInrFromParsed(ref?.energy_charges_inr) }
      : {}),
    ...(billInrFromParsed(ref?.electricity_duty_inr) != null
      ? { billElectricityDutyInr: billInrFromParsed(ref?.electricity_duty_inr) }
      : {}),
    ...(billInrFromParsed(ref?.fppas_inr) != null
      ? { billFppasInr: billInrFromParsed(ref?.fppas_inr) }
      : {}),
    ...(billInrFromParsed(ref?.fixed_charges_inr) != null
      ? { billFixedChargeInr: billInrFromParsed(ref?.fixed_charges_inr) }
      : {}),
    ...(billInrFromParsed(ref?.metered_unit_consumption) != null
      ? { referenceBillUnits: billInrFromParsed(ref?.metered_unit_consumption) }
      : {})
  };
}

type PersistenceSnapshotResponse = {
  latestBillUpload?: {
    parsedBill?: ParsedBillShape | null;
    monthlyUnits?: Partial<MonthlyUnits> | null;
  } | null;
  latestCalculation?: {
    monthlyUnits?: MonthlyUnits | null;
    manualSnapshot?: Partial<ManualProposalCustomer> | null;
    latestBill?: ParsedBillShape | null;
    previousBill?: ParsedBillShape | null;
  } | null;
};

type UploadTask = {
  slot: "latest" | number;
  file: File;
};

function ProposalPageContent() {
  const { t } = useLanguage();
  const toast = useToast();
  const { mutate: mutateGlobal } = useSWRConfig();

  /** Set in mount effect — never read sessionStorage during useState (SSR/hydration safe). */
  const hadSessionOnMountRef = useRef(false);
  const skipProposalRestoreRef = useRef(false);
  const skipServerRestoreRef = useRef(false);
  /** Deep-link + restore refs — must be declared before mount effects that touch them. */
  const deepLinkLeadIdRef = useRef<string | null>(null);
  const deepLinkProposalIdRef = useRef<string | null>(null);
  /** Opening `/proposal?proposalId=…` — do not wipe units/bills with CRM lead seed. */
  const restoringExistingProposalRef = useRef(false);
  /** Saved plant kW from proposal — block bill auto-resize from clobbering catalog. */
  const proposalPlantLockedRef = useRef(false);
  const [deckRestoreReady, setDeckRestoreReady] = useState(false);

  const [monthlyUnits, setMonthlyUnits] = useState<MonthlyUnits>(() => emptyMonthlyUnits());
  const [latestBill, setLatestBill] = useState<ParsedBillShape | null>(null);
  const [additionalBills, setAdditionalBills] = useState<(ParsedBillShape | null)[]>([]);
  const [auditedMonthTotals, setAuditedMonthTotals] = useState<Partial<Record<keyof MonthlyUnits, number>>>({});
  const [billAnalysis, setBillAnalysis] = useState("");
  const [billAnalysisTone, setBillAnalysisTone] = useState<"neutral" | "success" | "warning" | "error">("neutral");
  const [scanTimingBadge, setScanTimingBadge] = useState("");
  const [isAnalyzingLatest, setIsAnalyzingLatest] = useState(false);
  const [isAnalyzingAdditional, setIsAnalyzingAdditional] = useState<boolean[]>([]);
  const [isPptDownloading, setIsPptDownloading] = useState(false);
  const [isCopyingSummary, setIsCopyingSummary] = useState(false);
  const [isWebProposalBusy, setIsWebProposalBusy] = useState(false);
  const [proposalLimitModalOpen, setProposalLimitModalOpen] = useState(false);
  const [proposalLimitPlanName, setProposalLimitPlanName] = useState<string | null>(null);
  const [latestWebProposalUrl, setLatestWebProposalUrl] = useState<string | null>(null);
  const [draftProposalId, setDraftProposalId] = useState<string | null>(null);
  // Proposal Builder Settings — language + EMI only (logo, bank, AMC, site photos live in More > Company Profile).
  const [proposalLang, setProposalLang] = useState<"en" | "hi">("en");
  const [financeRatePct, setFinanceRatePct] = useState(7);
  /** Set when a walk-in lead was auto-created during the last generate (for CRM deep-link). */
  const [lastAutoLeadId, setLastAutoLeadId] = useState<string | null>(null);
  const [showProposalSettings, setShowProposalSettings] = useState(false);
  const [overrideSolarKw, setOverrideSolarKw] = useState("");
  const [overridePanels, setOverridePanels] = useState("");
  const [installerState, setInstallerState] = useState("");
  const [installerDiscom, setInstallerDiscom] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [clientRef, setClientRef] = useState("");
  const [hydratedFromServer, setHydratedFromServer] = useState(false);
  const [learnedBillProfiles, setLearnedBillProfiles] = useState<Record<string, LearnedBillProfile>>({});

  // ── URL prefill (Wave 2 P5) ─────────────────────────────────────────────────
  // Read ?preset=…&orgType=…&kw=…&lang=…&story=… on first render only.
  // useSearchParams() is safe here — the page is already a client component.
  const router = useRouter();
  const searchParams = useSearchParams();
  /** Live query — must stay reactive so Edit proposal for another customer replaces the builder. */
  const urlProposalId = (searchParams.get("proposalId") ?? "").trim();
  const urlLeadId = (searchParams.get("leadId") ?? "").trim();
  useEffect(() => {
    void loadInstallerRateCard();
  }, []);

  const urlPrefill = useMemo(
    () => parsePrefillFromSearchParams(searchParams),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // intentionally run once; URL params are consumed on mount
  );

  // ── Proposal OS UI state ────────────────────────────────────────────────────
  const [osPresetId, setOsPresetId] = useState<ProposalPresetId | null>(
    urlPrefill.preset ?? null
  );
  // When a preset is pre-selected via URL, skip the preset picker overlay.
  const [showPresetPicker, setShowPresetPicker] = useState(!urlPrefill.preset);
  const [showBlockPlaylist, setShowBlockPlaylist] = useState(false);
  const [showReviewSheet, setShowReviewSheet] = useState(false);
  const [commercialConfig, setCommercialConfig] = useState<CommercialProposalConfig | null>(null);
  const [proposalLayout, setProposalLayout] = useState<ProposalTemplateV1 | null>(null);
  // Commercial input mode — "bill" uses existing upload flow; "requirement" shows simple form
  const [commercialInputMode, setCommercialInputMode] = useState<"bill" | "requirement">("bill");
  const [residentialInputMode, setResidentialInputMode] = useState<ResidentialInputMode>(
    urlPrefill.inputMode === "requirement" ? "requirement" : "bill"
  );
  // Mode picker (bill vs requirement) — only relevant for legacy residential_smart
  const [showResidentialModePicker, setShowResidentialModePicker] = useState(
    (urlPrefill.preset as string | undefined) === "residential_smart" && !urlPrefill.inputMode
  );
  const [showCommercialOrgPicker, setShowCommercialOrgPicker] = useState(
    isCommercialPresetFamily(urlPrefill.preset) && !urlPrefill.orgType
  );
  const [residentialConfig, setResidentialConfig] = useState<ResidentialProposalConfig | null>(null);
  /** Commercial bill path — same Smart catalog + pricing studio as residential. */
  const [commercialPricingConfig, setCommercialPricingConfig] = useState<ResidentialProposalConfig | null>(null);
  // Requirement-mode form fields (written to manual state on change)
  const [requirementMonthlyKwh, setRequirementMonthlyKwh] = useState("");
  const [requirementMonthlyBill, setRequirementMonthlyBill] = useState("");
  const [requirementNotes, setRequirementNotes] = useState("");

  const lastCalcPersistSignatureRef = useRef("");
  /** After user edits plant kW, block bill-audit from overwriting manual sizing. */
  const commercialPlantKwTouchedRef = useRef(false);
  const lastCommercialBillUploadKeyRef = useRef("");
  /** Bill-path kW auto-seed runs once per bill upload — not on every tariff recalc. */
  const lastCommercialBillKwSeedKeyRef = useRef("");
  const residentialPlantKwTouchedRef = useRef(false);
  const lastResidentialBillKwSeedKeyRef = useRef("");
  const uploadQueueRef = useRef<UploadTask[]>([]);
  const uploadWorkerRunningRef = useRef(false);
  const [manual, setManual] = useState<ManualProposalCustomer>(EMPTY_MANUAL_PROPOSAL_CUSTOMER);
  const step1Label = stripStepPrefix(t("proposal_step1SelectLead"));
  const step2Label = stripStepPrefix(t("proposal_step2BillUploads"));
  const monthlyUnitsTitle = stripManualSuffix(t("proposal_monthlyUnitsTitle"));

  useEffect(() => {
    const refreshFromRateCard = () => {
      setCommercialPricingConfig((prev) => {
        if (!prev) return prev;
        return applyCommercialPanelTrackPolicy(
          applyResidentialPricingSource(prev),
          manual.connectionType
        );
      });
      setResidentialConfig((prev) => {
        if (!prev) return prev;
        return applyResidentialPricingSource(prev);
      });
    };
    window.addEventListener(INSTALLER_RATE_CARD_UPDATED_EVENT, refreshFromRateCard);
    return () => window.removeEventListener(INSTALLER_RATE_CARD_UPDATED_EVENT, refreshFromRateCard);
  }, [manual.connectionType]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const forceNew =
        isProposalForceNewFromUrl(params) || takeProposalForceNewIntent();
      if (forceNew) {
        skipProposalRestoreRef.current = true;
        restoringExistingProposalRef.current = false;
        proposalPlantLockedRef.current = false;
        deepLinkProposalIdRef.current = null;
        clearAllProposalDraftIds();
        setDraftProposalId(null);
        setCommercialConfig(null);
        setCommercialPricingConfig(null);
        setResidentialConfig(null);
        setProposalLayout(null);
        clearProposalBuilderSession();
        params.delete("new");
        const qs = params.toString();
        window.history.replaceState(
          {},
          "",
          qs ? `${window.location.pathname}?${qs}` : window.location.pathname
        );
      }
    }

    if (skipProposalRestoreRef.current) {
      const { state, discom } = readInstallerRegion();
      if (state) setInstallerState(state);
      if (discom) setInstallerDiscom(discom);
      let ref = localStorage.getItem(CLIENT_REF_STORAGE_KEY);
      if (!ref) {
        ref = createClientRef();
        localStorage.setItem(CLIENT_REF_STORAGE_KEY, ref);
      }
      setClientRef(ref);
      return;
    }

    if (isProposalBuilderReloadNavigation()) {
      clearProposalBuilderSession();
      skipServerRestoreRef.current = true;
      setHydratedFromServer(true);
    } else {
      const hasProposalDeepLink = Boolean(
        new URLSearchParams(window.location.search).get("proposalId")?.trim()
      );
      const snap = loadProposalBuilderSession();
      // Never paint a previous customer over an Edit-proposal deep link.
      if (snap && !hasProposalDeepLink) {
        hadSessionOnMountRef.current = true;
        setManual(snap.manual);
        setMonthlyUnits(snap.monthlyUnits);
        setLatestBill(snap.latestBill);
        setAdditionalBills(snap.additionalBills);
        setAuditedMonthTotals(snap.auditedMonthTotals);
        setOverrideSolarKw(snap.overrideSolarKw);
        setOverridePanels(snap.overridePanels);
        if (snap.requirementMonthlyKwh != null) setRequirementMonthlyKwh(snap.requirementMonthlyKwh);
        if (snap.requirementMonthlyBill != null) setRequirementMonthlyBill(snap.requirementMonthlyBill);
      }
    }

    const { state, discom } = readInstallerRegion();
    if (state) setInstallerState(state);
    if (discom) setInstallerDiscom(discom);

    let ref = localStorage.getItem(CLIENT_REF_STORAGE_KEY);
    if (!ref) {
      ref = createClientRef();
      localStorage.setItem(CLIENT_REF_STORAGE_KEY, ref);
    }
    setClientRef(ref);
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem(LEARNED_BILL_PROFILE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Record<string, LearnedBillProfile>;
      setLearnedBillProfiles(parsed);
    } catch {
      // ignore malformed local cache
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LEARNED_BILL_PROFILE_KEY, JSON.stringify(learnedBillProfiles));
  }, [learnedBillProfiles]);

  // Persist session across tab switches — debounced so typing does not freeze the UI.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      saveProposalBuilderSession({
        manual,
        monthlyUnits,
        latestBill,
        additionalBills,
        auditedMonthTotals,
        overrideSolarKw,
        overridePanels,
        requirementMonthlyKwh,
        requirementMonthlyBill,
      });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [manual, monthlyUnits, latestBill, additionalBills, auditedMonthTotals, overrideSolarKw, overridePanels, requirementMonthlyKwh, requirementMonthlyBill]);

  useEffect(() => {
    const sync = () => {
      const { state, discom } = readInstallerRegion();
      if (state) setInstallerState(state);
      if (discom) setInstallerDiscom(discom);
    };
    window.addEventListener(INSTALLER_REGION_EVENT, sync);
    return () => window.removeEventListener(INSTALLER_REGION_EVENT, sync);
  }, []);

  useEffect(() => {
    setHydratedFromServer(false);
  }, [selectedLeadId]);

  // deepLinkLeadIdRef and its effects are declared below, after `customers` is in scope.

  const stateForSizing = manual.state.trim() || installerState;
  const discomQuery = manual.discom.trim() || installerDiscom.trim();
  const stateQuery = manual.state.trim() || installerState.trim();
  const connectedLoadKw = useMemo(() => {
    const parsed = parseConnectedLoadKw(manual.sanctionedLoad);
    if (parsed != null && parsed > 0) return parsed;
    const ref = latestBill ?? additionalBills.find((b): b is ParsedBillShape => Boolean(b));
    const kw = inferMpLv12SanctionedLoadKwWhenBillOmits({
      sanctioned_load: ref?.sanctioned_load,
      state: (manual.state || ref?.state || "").trim() || undefined,
      discom: (manual.discom || ref?.discom || "").trim() || undefined,
      connection_type: manual.connectionType || ref?.connection_type,
      purpose_of_supply: manual.purposeOfSupply || ref?.purpose_of_supply || undefined,
      phase: manual.phase || ref?.phase,
      tariff_category: manual.tariffCategory || ref?.tariff_category
    });
    return kw ?? null;
  }, [
    manual.sanctionedLoad,
    manual.state,
    manual.discom,
    manual.connectionType,
    manual.purposeOfSupply,
    manual.phase,
    manual.tariffCategory,
    latestBill,
    additionalBills
  ]);
  const areaProfile = useMemo(() => inferAreaProfile(manual), [manual]);
  const residentialSubsidyEligible = useMemo(
    () =>
      isPmSuryaGharSubsidyEligible(manual.connectionType) &&
      (residentialConfig?.solar.panelTrack ?? "dcr") === "dcr",
    [manual.connectionType, residentialConfig?.solar.panelTrack]
  );
  const billingRule = useMemo(() => getBillingRule(stateQuery, discomQuery), [stateQuery, discomQuery]);
  const learnedProfile = useMemo(() => {
    if (!stateQuery || !discomQuery) return null;
    return learnedBillProfiles[profileKey(stateQuery, discomQuery)] ?? null;
  }, [stateQuery, discomQuery, learnedBillProfiles]);
  const billProfileUrl =
    stateQuery && discomQuery
      ? `/api/discom-bill-profile?state=${encodeURIComponent(stateQuery)}&discom=${encodeURIComponent(discomQuery)}`
      : null;
  const { data: syncedBillProfileRes } = useSWR(
    billProfileUrl,
    async (url: string) => {
      const res = await fetch(url, { cache: "no-store" });
      const payload = (await res.json()) as {
        ok?: boolean;
        data?: { requiredBills?: number; historyWindowMonths?: number; updatedAt?: string | null } | null;
      };
      if (!payload.ok || !payload.data) return null;
      const profile = payload.data;
      const requiredBills = Math.max(1, Number(profile.requiredBills ?? 1) || 1);
      const historyWindowMonths = Math.max(1, Number(profile.historyWindowMonths ?? 6) || 6);
      return {
        requiredBills,
        historyWindowMonths,
        updatedAt: String(profile.updatedAt ?? new Date().toISOString())
      } as LearnedBillProfile;
    },
    { revalidateOnFocus: false, dedupingInterval: 120_000 }
  );
  // Keep required uploader count consistent across devices by using server profile only.
  const effectiveLearnedProfile = syncedBillProfileRes ?? null;
  const normalizeUploadRequirement = useCallback(
    (input: ReturnType<typeof getBillingUploadRequirement>): ReturnType<typeof getBillingUploadRequirement> => {
      // MP seasonal mode should stay deterministic: latest + one 6-month-back bill.
      const isMpSeasonalMode =
        billingRule.mode === "latest_and_months_back" &&
        (billingRule.secondaryOffsetMonths ?? 0) === 6 &&
        (billingRule.historyWindowMonthsPerBill ?? 0) === 6;
      if (!isMpSeasonalMode) return input;
      const cappedRequired = Math.min(2, Math.max(1, input.requiredBills));
      return {
        requiredBills: cappedRequired,
        secondaryOffsets: input.secondaryOffsets.slice(0, Math.max(0, cappedRequired - 1)),
        secondaryLabels: input.secondaryLabels.slice(0, Math.max(0, cappedRequired - 1))
      };
    },
    [billingRule]
  );
  const uploadRequirement = useMemo(
    () => {
      const detectedHistoryMonths = latestBill?.consumption_history?.length ?? effectiveLearnedProfile?.historyWindowMonths ?? null;
      const base = normalizeUploadRequirement(getBillingUploadRequirement(billingRule, latestBill?.bill_month, detectedHistoryMonths));
      if (base.requiredBills > 1) return base;
      if (!effectiveLearnedProfile || effectiveLearnedProfile.requiredBills <= 1) return base;
      return normalizeUploadRequirement(
        getBillingUploadRequirement(
        {
          ...billingRule,
          mode: "latest_and_months_back",
          secondaryOffsetMonths: effectiveLearnedProfile.historyWindowMonths,
          historyWindowMonthsPerBill: effectiveLearnedProfile.historyWindowMonths,
          targetCoverageMonths: 12,
          minBillsRequired: effectiveLearnedProfile.requiredBills
        },
        latestBill?.bill_month,
        effectiveLearnedProfile.historyWindowMonths
      ));
    },
    [billingRule, latestBill?.bill_month, latestBill?.consumption_history, effectiveLearnedProfile, normalizeUploadRequirement]
  );
  const previousBill = additionalBills[0] ?? null;
  const isAnySecondaryBusy = isAnalyzingAdditional.some(Boolean);
  const isCommercialBillMode =
    isCommercialPresetFamily(osPresetId) && commercialInputMode === "bill";
  const uploadedCoverageMonths = useMemo(() => {
    const merged = new Set<keyof MonthlyUnits>();
    const allBills = [latestBill, ...additionalBills].filter(Boolean) as ParsedBillShape[];
    for (const bill of allBills) {
      for (const key of extractDetectedMonths(bill).keys()) merged.add(key);
    }
    return merged.size;
  }, [latestBill, additionalBills]);
  /** Month-name keys the latest bill already covers — secondary cards must not re-show these. */
  const latestClaimedMonthKeys = useMemo(() => {
    const keys = new Set(extractDetectedMonths(latestBill).keys());
    const latestMonthKey = monthKeyFromBillLabel(latestBill?.bill_month);
    if (latestMonthKey) keys.add(latestMonthKey);
    return keys;
  }, [latestBill]);
  const requiredSecondaryCount = useMemo(() => {
    // HT bills carry full CD/MD/PF/ToD + kWh in a single bill — no history table.
    if (isCommercialBillMode && osPresetId === "commercial_ht") return 0;
    if (isCommercialBillMode) return 1; // Commercial bill flow requires exactly latest + 1 previous bill.
    const base = Math.max(0, uploadRequirement.requiredBills - 1);
    if (uploadedCoverageMonths < 12) return base;
    // If we already covered all 12 months with uploaded bills, don't force extra slots.
    return Math.min(base, additionalBills.filter(Boolean).length);
  }, [isCommercialBillMode, osPresetId, uploadRequirement.requiredBills, uploadedCoverageMonths, additionalBills]);
  const secondaryAlignment = useMemo(
    () =>
      uploadRequirement.secondaryOffsets.map((offset, idx) => {
        const current = additionalBills[idx]?.bill_month ?? null;
        const aligned = isBillMonthAlignedForOffset(latestBill?.bill_month, current, offset);
        return { offset, current, aligned };
      }),
    [uploadRequirement.secondaryOffsets, additionalBills, latestBill?.bill_month]
  );
  const hasRequiredBillInputs = Boolean(latestBill) &&
    additionalBills.slice(0, requiredSecondaryCount).filter(Boolean).length === requiredSecondaryCount &&
    secondaryAlignment.every((item, idx) => idx >= requiredSecondaryCount || item.aligned);
  /** Commercial bill flow: latest + one history bill is enough (no strict month alignment). */
  const commercialBillsReady =
    Boolean(latestBill) &&
    additionalBills.slice(0, requiredSecondaryCount).filter(Boolean).length >= requiredSecondaryCount;
  const billsReadyForCommercialFlow = isCommercialBillMode ? commercialBillsReady : hasRequiredBillInputs;
  const tariffUrl = `/api/tariff-context?state=${encodeURIComponent(stateQuery)}&discom=${encodeURIComponent(discomQuery)}`;
  const discomsUrl = `/api/discoms?state=${encodeURIComponent(stateQuery)}`;

  const { data: tariffRes } = useSWR(tariffUrl, swrTariffWithOfflineCache, {
    revalidateOnFocus: false,
    dedupingInterval: 600_000
  });
  const tariffContext: TariffContext = tariffRes?.data ?? DEFAULT_TARIFF_CONTEXT;
  const effectiveTariffContext = useMemo(
    () =>
      applyTariffCategoryOverride(tariffContext, {
        state: stateQuery,
        discom: discomQuery,
        tariffCategory: manual.tariffCategory || latestBill?.tariff_category || additionalBills[0]?.tariff_category || "",
        connectedLoadKw: connectedLoadKw ?? undefined,
        areaProfile,
        billMonth: latestBill?.bill_month || additionalBills[0]?.bill_month || undefined
      }),
    [tariffContext, stateQuery, discomQuery, manual.tariffCategory, latestBill, additionalBills, connectedLoadKw, areaProfile]
  );

  const { data: discomsRes } = useSWR(discomsUrl, swrDiscomsWithOfflineCache, {
    revalidateOnFocus: false,
    dedupingInterval: 600_000
  });
  const discomOptions = discomsRes?.data ?? [];

  const {
    data: customersData,
    isLoading: isCustomersSwrLoading
  } = useSWR(CUSTOMERS_SWR_KEY, fetchCustomersLoose, {
    revalidateOnFocus: false,
    dedupingInterval: 25_000,
    keepPreviousData: true
  });
  const customers: CustomerLead[] = customersData ?? [];
  const isCustomersLoading = isCustomersSwrLoading && customersData === undefined;

  /**
   * Deep-link auto-select: `/proposal?leadId=<id>` lands here from the CRM
   * "Send proposal" CTA. Declared here so `customers` is in scope (it is a
   * `const` derived from SWR data above — referencing it earlier causes a
   * TypeScript "used before declaration" error).
   */
  /** Until CRM pick applies, keeps `leadId` from URL so `/api/calculations` can load saved bill/calc. */
  const [urlLeadIdForRestore, setUrlLeadIdForRestore] = useState("");
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (skipProposalRestoreRef.current) return;
    if (urlLeadId) {
      deepLinkLeadIdRef.current = urlLeadId;
      setUrlLeadIdForRestore(urlLeadId);
    }
    if (urlProposalId) {
      restoringExistingProposalRef.current = true;
      deepLinkProposalIdRef.current = urlProposalId;
      writeResidentialDraftProposalId(urlProposalId);
      writeCommercialDraftProposalId(urlProposalId);
      setDraftProposalId(urlProposalId);
      // Keep proposalId in the URL so soft-nav between deals reloads the correct deck.
    }
  }, [urlLeadId, urlProposalId]);
  useEffect(() => {
    const id = (urlLeadId || deepLinkLeadIdRef.current || "").trim();
    if (!id || !customers.length) return;
    if (selectedLeadId === id) return;
    const lead = customers.find((c) => c.id === id);
    if (!lead) return;
    setSelectedLeadId(id);
    if (restoringExistingProposalRef.current || urlProposalId) {
      applyLeadFromCrmLight(lead);
    } else {
      applyLeadFromCrm(lead);
      setUrlLeadIdForRestore("");
    }
    deepLinkLeadIdRef.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customers, selectedLeadId, urlLeadId, urlProposalId]);
  const restoreLeadKey = (selectedLeadId || urlLeadIdForRestore).trim();
  const restoreUrl =
    clientRef.length > 0 || restoreLeadKey.length > 0
      ? (() => {
          const p = new URLSearchParams();
          if (clientRef.length > 0) p.set("clientRef", clientRef);
          if (restoreLeadKey.length > 0) p.set("leadId", restoreLeadKey);
          return `/api/calculations?${p.toString()}`;
        })()
      : null;
  const { data: restoreRes } = useSWR(restoreUrl, async (url: string) => {
    const res = await fetch(url, { cache: "no-store" });
    const json = (await res.json()) as { ok?: boolean; data?: PersistenceSnapshotResponse };
    if (!json.ok) return null;
    return json.data ?? null;
  });

  const result = useMemo(
    () =>
      calculateSolar(monthlyUnits, effectiveTariffContext, {
        stateForSizing,
        discom: discomQuery,
        connectedLoadKw: connectedLoadKw ?? undefined,
        areaProfile,
        billMonth: latestBill?.bill_month || additionalBills[0]?.bill_month || undefined
      }),
    [monthlyUnits, effectiveTariffContext, stateForSizing, discomQuery, connectedLoadKw, areaProfile, latestBill?.bill_month, additionalBills]
  );

  const isCommercialRequirement =
    isCommercialPresetFamily(osPresetId) && commercialInputMode === "requirement";
  const isResidentialSmart = (osPresetId as string | null) === "residential_smart";
  const isAnyResidential =
    osPresetId != null && !isCommercialPresetFamily(osPresetId);
  const isResidentialRequirement = isAnyResidential && residentialInputMode === "requirement";
  const isResidentialBill = isAnyResidential && residentialInputMode === "bill";
  const canEstimateBillToKwh = Boolean(manual.state.trim() && manual.discom.trim());
  const showCommercialBillDetailsForm = !isCommercialBillMode || billsReadyForCommercialFlow;

  const applyResidentialRequirementConsumption = useCallback(
    (kwh: string, billInr: string) => {
      const next = monthlyUnitsFromRequirementInput(
        kwh,
        canEstimateBillToKwh ? billInr : "",
        effectiveTariffContext
      );
      if (next) setMonthlyUnits(next);
      else if (!kwh.trim() && !billInr.trim()) setMonthlyUnits(emptyMonthlyUnits());
    },
    [canEstimateBillToKwh, effectiveTariffContext]
  );

  useEffect(() => {
    if (!isResidentialRequirement && !isCommercialRequirement) return;
    applyResidentialRequirementConsumption(requirementMonthlyKwh, requirementMonthlyBill);
  }, [
    isResidentialRequirement,
    isCommercialRequirement,
    requirementMonthlyKwh,
    requirementMonthlyBill,
    applyResidentialRequirementConsumption,
  ]);

  /** Auto-select three-phase + enable surcharge toggle when bill OCR indicates 3-phase. */
  useEffect(() => {
    const phaseText = manual.phase?.trim();
    if (!phaseText) return;
    setResidentialConfig((prev) => {
      if (!prev) return prev;
      const next = mergeConnectionPhaseFromBillText(prev, phaseText);
      return next === prev ? prev : next;
    });
    setCommercialPricingConfig((prev) => {
      if (!prev) return prev;
      const next = mergeConnectionPhaseFromBillText(prev, phaseText);
      return next === prev ? prev : next;
    });
  }, [manual.phase, Boolean(residentialConfig), Boolean(commercialPricingConfig)]);

  const requirementConnectionPhase = useMemo((): ConnectionPhase | undefined => {
    return (
      detectConnectionPhaseFromText(manual.phase) ??
      residentialConfig?.pricing?.connectionPhase ??
      commercialPricingConfig?.pricing?.connectionPhase
    );
  }, [manual.phase, residentialConfig?.pricing?.connectionPhase, commercialPricingConfig?.pricing?.connectionPhase]);

  const handleRequirementConnectionPhase = useCallback((phase: ConnectionPhase) => {
    setManual((p) => ({ ...p, phase: connectionPhaseToManualLabel(phase) }));
    setResidentialConfig((prev) => (prev ? applyConnectionPhaseSelection(prev, phase) : prev));
    setCommercialPricingConfig((prev) => (prev ? applyConnectionPhaseSelection(prev, phase) : prev));
  }, []);

  const commercialRequirementSuggestedKw = useMemo(() => {
    if (!isCommercialRequirement) return undefined;
    if (!requirementHasConsumptionInput(requirementMonthlyKwh, requirementMonthlyBill)) return undefined;
    return result.solarKw > 0 ? result.solarKw : undefined;
  }, [isCommercialRequirement, requirementMonthlyKwh, requirementMonthlyBill, result.solarKw]);

  const requirementEstimatedKwh = useMemo(() => {
    if (!isResidentialRequirement || !canEstimateBillToKwh) return null;
    if (requirementMonthlyKwh.trim()) return null; // kWh entered directly — no need to show estimate
    const bill = parseFloat(requirementMonthlyBill.replace(/,/g, "").trim());
    if (!Number.isFinite(bill) || bill <= 0) return null;
    const est = estimateMonthlyKwhFromBillAmount(bill, effectiveTariffContext);
    return est > 0 ? Math.round(est) : null;
  }, [isResidentialRequirement, canEstimateBillToKwh, requirementMonthlyKwh, requirementMonthlyBill, effectiveTariffContext]);

  const useResidentialCatalog = isAnyResidential && Boolean(residentialConfig);
  const useCommercialCatalog =
    isCommercialPresetFamily(osPresetId) && Boolean(commercialPricingConfig);

  const effectiveResult = useMemo(() => {
    if (useResidentialCatalog && residentialConfig) {
      const priced = applyResidentialPricingSource(residentialConfig);
      const q = quoteResidentialSolar(priced.solar);
      const solarKw = priced.solar.plantCapacityKw;
      const panels = q.moduleCount;
      const annualGeneration = residentialAnnualGenerationUnits(solarKw);
      const grossCost = residentialGrossCostInr(priced);
      const centralSubsidy = residentialSubsidyEligible
        ? resolveResidentialSubsidyInr(priced, true)
        : 0;
      const netCost = residentialNetCostInr(priced, {
        connectionType: manual.connectionType,
        subsidyEligible: residentialSubsidyEligible,
      });
      const annualSavings = Math.round(annualGeneration * 8 * 0.85);
      const monthlySavings = Math.round(annualSavings / 12);
      const paybackYears = annualSavings > 0 ? Number((netCost / annualSavings).toFixed(1)) : 0;
      const savings25yr = annualSavings * 25;
      const profit25yr = savings25yr - netCost;
      return {
        ...result,
        solarKw,
        panels,
        annualGeneration,
        annualSavings,
        monthlySavings,
        newMonthlyBill: Math.max(0, result.currentMonthlyBill - monthlySavings),
        grossCost,
        centralSubsidy,
        netCost,
        paybackYears,
        paybackDisplay: `${paybackYears} years`,
        savings25yr,
        profit25yr,
      };
    }
    if (useCommercialCatalog && commercialPricingConfig) {
      // Always pull latest Smart catalog from installer rate card (not a stale snapshot).
      const cfg = applyCommercialPanelTrackPolicy(
        applyResidentialPricingSource(commercialPricingConfig),
        manual.connectionType
      );
      const q = quoteResidentialSolar(cfg.solar);
      const solarKw = cfg.solar.plantCapacityKw;
      const panels = q.moduleCount;
      const annualGeneration = Math.round(solarKw * 1500);
      const grossCost = residentialGrossCostInr(cfg);
      const centralSubsidy = 0;
      const netCost = residentialNetCostInr(cfg, { subsidyEligible: false });
      const annualSavings = Math.round(annualGeneration * 8 * 0.85);
      const monthlySavings = Math.round(annualSavings / 12);
      const paybackYears = annualSavings > 0 ? Number((netCost / annualSavings).toFixed(1)) : 0;
      const savings25yr = annualSavings * 25;
      const profit25yr = savings25yr - netCost;
      return {
        ...result,
        solarKw,
        panels,
        annualGeneration,
        annualSavings,
        monthlySavings,
        newMonthlyBill: Math.max(0, result.currentMonthlyBill - monthlySavings),
        grossCost,
        centralSubsidy,
        netCost,
        paybackYears,
        paybackDisplay: `${paybackYears} years`,
        savings25yr,
        profit25yr,
      };
    }
    const kwRaw = parseFloat(overrideSolarKw);
    const solarKw = kwRaw > 0 ? Math.round(kwRaw * 10) / 10 : result.solarKw;
    const panelsRaw = parseInt(overridePanels);
    const panels = panelsRaw > 0 ? panelsRaw : Math.ceil((solarKw * 1000) / (residentialConfig?.solar.watt ?? 540));
    const annualGeneration = Math.round(solarKw * 1500);
    const selfUse = Math.min(annualGeneration, result.annualUnits);
    const billBasedMonthlySavings = Math.round(
      (result.currentMonthlyBill * (selfUse / Math.max(result.annualUnits, 1))) * 0.9
    );
    const genBasedAnnualSavings = Math.round(annualGeneration * 8 * 0.85);
    const isCommercial = isCommercialPresetFamily(osPresetId);
    const annualSavings =
      isCommercial && result.currentMonthlyBill <= 0
        ? genBasedAnnualSavings
        : billBasedMonthlySavings * 12;
    const monthlySavings = Math.round(annualSavings / 12);
    const sharedCatalog = getCachedResidentialBrandCatalog();
    const commercialTrack = isCommercial
      ? resolveCommercialPanelTrack(manual.connectionType, solarKw)
      : commercialTrackFromPanelType(commercialConfig?.panel?.panelType);
    const grossCost = isCommercial
      ? plantGrossFromSharedCatalogOrFallback(solarKw, commercialTrack, sharedCatalog)
      : computeGrossSystemCostInr(solarKw);
    const centralSubsidy = isCommercial
      ? 0
      : solarKw <= 2
        ? Math.round(solarKw * 30000)
        : Math.min(78000, Math.round(60000 + (solarKw - 2) * 18000));
    const netCost = Math.max(0, grossCost - centralSubsidy);
    const paybackYears = annualSavings > 0 ? Number((netCost / annualSavings).toFixed(1)) : 0;
    const savings25yr = annualSavings * 25;
    const profit25yr = savings25yr - netCost;
    return {
      ...result,
      solarKw,
      panels,
      annualGeneration,
      annualSavings,
      monthlySavings,
      newMonthlyBill: Math.max(0, result.currentMonthlyBill - monthlySavings),
      grossCost,
      centralSubsidy,
      netCost,
      paybackYears,
      paybackDisplay: `${paybackYears} years`,
      savings25yr,
      profit25yr
    };
  }, [
    overrideSolarKw,
    overridePanels,
    result,
    useResidentialCatalog,
    residentialConfig,
    useCommercialCatalog,
    commercialPricingConfig,
    residentialSubsidyEligible,
    manual.connectionType,
    osPresetId,
    commercialConfig?.panel?.panelType,
  ]);

  const autoPanelCount = useMemo(() => {
    if (useResidentialCatalog && residentialConfig) {
      return moduleCountForResidential(residentialConfig.solar);
    }
    const kwRaw = parseFloat(overrideSolarKw);
    const solarKw = kwRaw > 0 ? kwRaw : result.solarKw;
    const watt = residentialConfig?.solar.watt ?? 540;
    return Math.ceil((solarKw * 1000) / watt);
  }, [overrideSolarKw, result.solarKw, useResidentialCatalog, residentialConfig]);

  const filledMonths = useMemo(() => countFilledMonths(monthlyUnits), [monthlyUnits]);
  const annualUnits = useMemo(
    () =>
      (["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"] as const).reduce(
        (s, k) => s + (monthlyUnits[k] || 0),
        0
      ),
    [monthlyUnits]
  );

  const leadSelected = Boolean(selectedLeadId);
  const activeLead = useMemo(
    () => customers.find((c) => c.id === selectedLeadId) ?? null,
    [customers, selectedLeadId]
  );

  // Reactive bill-backed status for live preview
  const isBillBackedLive = latestBill != null;

  const hideBillUploadSteps = isCommercialRequirement || isResidentialRequirement;
  const catalogBuilderActive =
    Boolean(residentialConfig && (isResidentialRequirement || isResidentialBill)) ||
    Boolean(
      commercialPricingConfig &&
        commercialConfig &&
        isCommercialPresetFamily(osPresetId) &&
        (isCommercialRequirement || (isCommercialBillMode && commercialBillsReady))
    );

  // Drives BuilderStageBar active/completed state in real-time.
  const osActiveStageIndex = useMemo(() => {
    const hasClient = Boolean(manual.leadContactName || manual.officialBillName || selectedLeadId);
    const hasEnergy =
      isBillBackedLive ||
      requirementHasConsumptionInput(requirementMonthlyKwh, requirementMonthlyBill) ||
      Object.values(monthlyUnits).some((v) => v > 0);
    const hasSystem = effectiveResult.solarKw > 0;
    if (!hasClient) return 0;
    if (!hasEnergy) return 1;
    if (!hasSystem) return 2;
    return 3;
  }, [
    manual.leadContactName,
    manual.officialBillName,
    selectedLeadId,
    isBillBackedLive,
    monthlyUnits,
    requirementMonthlyKwh,
    requirementMonthlyBill,
    effectiveResult.solarKw,
  ]);

  const osCompletedStages = useMemo(() => {
    const stages: number[] = [];
    const hasClient = Boolean(manual.leadContactName || manual.officialBillName || selectedLeadId);
    const hasEnergy =
      isBillBackedLive ||
      requirementHasConsumptionInput(requirementMonthlyKwh, requirementMonthlyBill) ||
      Object.values(monthlyUnits).some((v) => v > 0);
    const hasSystem = effectiveResult.solarKw > 0;
    if (hasClient) stages.push(0);
    if (hasEnergy) stages.push(1);
    if (hasSystem) stages.push(2);
    return stages;
  }, [
    manual.leadContactName,
    manual.officialBillName,
    selectedLeadId,
    isBillBackedLive,
    monthlyUnits,
    requirementMonthlyKwh,
    requirementMonthlyBill,
    effectiveResult.solarKw,
  ]);

  useEffect(() => {
    setAdditionalBills((prev) => {
      if (prev.length === requiredSecondaryCount) return prev;
      if (prev.length > requiredSecondaryCount) return prev.slice(0, requiredSecondaryCount);
      return [...prev, ...Array.from({ length: requiredSecondaryCount - prev.length }, () => null)];
    });
    setIsAnalyzingAdditional((prev) => {
      if (prev.length === requiredSecondaryCount) return prev;
      if (prev.length > requiredSecondaryCount) return prev.slice(0, requiredSecondaryCount);
      return [...prev, ...Array.from({ length: requiredSecondaryCount - prev.length }, () => false)];
    });
  }, [requiredSecondaryCount]);

  useEffect(() => {
    if (skipServerRestoreRef.current) return;
    if (!restoreRes || hydratedFromServer) return;
    if (restoringExistingProposalRef.current && !deckRestoreReady) return;

    const calc = restoreRes.latestCalculation;
    const bill = restoreRes.latestBillUpload;
    const hasServerPayload = Boolean(calc || bill);
    if (!hasServerPayload) {
      if (!restoringExistingProposalRef.current) setHydratedFromServer(true);
      return;
    }

    if (hadSessionOnMountRef.current && !restoringExistingProposalRef.current) {
      setHydratedFromServer(true);
      return;
    }

    const mergeManualFields = (snap: Partial<Record<string, string>>, fillEmptyOnly: boolean) => {
      setManual((prev) => {
        const merged: ManualProposalCustomer = { ...prev };
        for (const key of Object.keys(EMPTY_MANUAL_PROPOSAL_CUSTOMER) as (keyof ManualProposalCustomer)[]) {
          const value = snap[key];
          if (typeof value !== "string" || !value.trim()) continue;
          if (fillEmptyOnly) {
            if (!merged[key]?.trim()) merged[key] = value;
          } else {
            merged[key] = value;
          }
        }
        return merged;
      });
    };

    if (calc?.monthlyUnits) {
      setMonthlyUnits((prev) => {
        if (countFilledMonths(prev) > 0) return prev;
        return mergeParsedMonthsIntoUnits(emptyMonthlyUnits(), calc.monthlyUnits ?? undefined);
      });
    } else if (bill?.monthlyUnits) {
      setMonthlyUnits((prev) => {
        const hasCurrentData = countFilledMonths(prev) > 0;
        if (hasCurrentData) return prev;
        return mergeParsedMonthsIntoUnits(emptyMonthlyUnits(), bill.monthlyUnits ?? undefined);
      });
    }

    if (calc?.manualSnapshot) {
      mergeManualFields(
        calc.manualSnapshot as Partial<Record<string, string>>,
        !restoringExistingProposalRef.current
      );
    }
    if (calc?.latestBill) setLatestBill((prev) => prev ?? calc.latestBill ?? null);
    else if (bill?.parsedBill) setLatestBill((prev) => prev ?? bill.parsedBill ?? null);
    const billToAdd = calc?.previousBill;
    if (billToAdd) {
      setAdditionalBills((prev) => {
        if (prev.length === 0) return [billToAdd];
        const next = [...prev];
        if (!next[0]) next[0] = billToAdd;
        return next;
      });
    }

    if (!billAnalysis) {
      setBillAnalysis(t("proposal_billAutofillDone"));
    }
    setHydratedFromServer(true);
  }, [restoreRes, hydratedFromServer, billAnalysis, t, deckRestoreReady]);

  useEffect(() => {
    if (!clientRef) return;
    if (filledMonths === 0 && !latestBill && additionalBills.every((b) => !b)) return;

    const payload = {
      clientRef,
      leadId: selectedLeadId || undefined,
      monthlyUnits,
      result,
      stateForSizing: stateForSizing || undefined,
      discom: manual.discom.trim() || undefined,
      tariffLabel: `${effectiveTariffContext.discomLabel} • ${effectiveTariffContext.source}`,
      manualSnapshot: manualSnapshot(manual),
      latestBill,
      previousBill: additionalBills[0] ?? null
    };
    const signature = JSON.stringify(payload);
    if (signature === lastCalcPersistSignatureRef.current) return;

    const timer = window.setTimeout(() => {
      void fetch("/api/calculations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).then(() => {
        lastCalcPersistSignatureRef.current = signature;
      });
    }, 900);

    return () => window.clearTimeout(timer);
  }, [clientRef, filledMonths, latestBill, additionalBills, manual, monthlyUnits, result, selectedLeadId, stateForSizing, effectiveTariffContext]);

  function setSlotBusy(slot: "latest" | number, busy: boolean) {
    if (slot === "latest") {
      setIsAnalyzingLatest(busy);
      return;
    }
    setIsAnalyzingAdditional((prev) => {
      const next = [...prev];
      next[slot] = busy;
      return next;
    });
  }

  async function processBillUploadTask(task: UploadTask) {
    const { file, slot } = task;
    setScanTimingBadge("Scanning...");
    toast.info("Processing bill", "SOL.52 is reading and calibrating this bill in background.");
    setSlotBusy(slot, true);
    try {
      const base64Data = await fileToBase64(file);
      const mimeType =
        file.type ||
        (file.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg");

      const billTypeHint: "auto" | "lt" | "ht" =
        osPresetId === "commercial_ht" || /\bHT\b|\bHV\b/i.test(manual.connectionType)
          ? "ht"
          : // LOCKED residential / LT commercial path: always "lt" (never "auto").
            // Keeps HT industrial rules out of MP domestic Proposal OS uploads.
            // See lib/residential-bill-path-lock.ts + lib/bill-scan-lanes.ts.
            "lt";
      const expectedBillMonthHint =
        typeof slot === "number"
          ? uploadRequirement.secondaryLabels[slot] ??
            (latestBill?.bill_month
              ? `Bill around 6 months before ${latestBill.bill_month}`
              : undefined)
          : undefined;
      const response = await fetch("/api/analyze-bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base64Data,
          mimeType,
          discomCode: manual.discom.trim() || installerDiscom.trim() || undefined,
          billTypeHint,
          clientRef: clientRef || undefined,
          leadId: selectedLeadId || undefined,
          expectedBillMonthHint
        })
      });
      const payload = await response.json();
      if (!payload.ok) throw new Error(payload.error || "Bill analysis failed");
      const scannerMode = payload.scannerMode as "anthropic" | "fallback_manual" | "local_pdf" | undefined;
      const learningGuardActive = Boolean(payload.learningGuardAlert);
      const aiModelTier = payload.aiModelTier as "haiku" | "sonnet" | "fallback" | undefined;
      const scanDurationMs = Number(payload.scanDurationMs ?? 0);
      const analysisMessages = [
        payload.learningUpdateInfo?.message,
        payload.tariffCycleInfo?.message,
        payload.tariffAlert?.message,
        payload.discoveryAlert?.message,
        payload.parseQualityAlert?.message,
        payload.calibrationAlert?.message,
        payload.learningGuardAlert?.message,
        payload.aiFallbackAlert?.message
      ].filter((v): v is string => typeof v === "string" && v.trim().length > 0);
      const canUseScannerAutofill = scannerMode !== "fallback_manual";
      const modelLabel =
        scannerMode === "anthropic"
          ? aiModelTier === "sonnet"
            ? "Claude Sonnet"
            : "Claude Haiku"
          : scannerMode === "local_pdf"
            ? "Local PDF Parser"
            : "Manual Verify";
      const seconds = scanDurationMs > 0 ? (scanDurationMs / 1000).toFixed(1) : null;
      setScanTimingBadge(seconds ? `${modelLabel} • ${seconds}s` : modelLabel);
      if (analysisMessages.length > 0) {
        const joined = analysisMessages.join(" ");
        const withScannerNote =
          scannerMode === "local_pdf"
            ? `${modelLabel} scan complete. ${joined}`
            : canUseScannerAutofill
              ? `${modelLabel} scan complete. ${joined}`
              : `AI scan issue. ${joined}`;
        setBillAnalysis(withScannerNote);
        setBillAnalysisTone(scannerMode === "fallback_manual" ? "warning" : "neutral");
      }

      const data = payload.data as ParsedBillShape;
      const detectedHt = isHtParsedBill(data, billTypeHint);
      if (isCommercialPresetFamily(osPresetId) && detectedHt && osPresetId !== "commercial_ht") {
        setOsPresetId("commercial_ht");
        setProposalLayout(getPresetDefaultLayout("commercial_ht"));
        toast.info(
          "HT bill detected",
          "Supply voltage / HV tariff / demand / ToD data found. Proposal switched to HT Industrial."
        );
      }
      // Build parsedUnits with smart priority:
      //   1. History fills histBase (from consumption_history — most reliable for past months).
      //   2. data.months: only the CURRENT bill month overwrites; other months only fill empties.
      const histUnits = buildUnitsFromConsumptionHistory(data);
      const histBase = emptyMonthlyUnits();
      for (const k of MONTH_KEYS) { if (histUnits[k]) histBase[k] = histUnits[k] as number; }
      const billCurrentKey = monthKeyFromBillLabel(data.bill_month); // e.g. "apr" for APR-2026
      const parsedUnits = (() => {
        const out = { ...histBase };
        if (data.months) {
          for (const k of MONTH_KEYS) {
            const raw = data.months[k];
            if (raw == null) continue;
            const v = typeof raw === "number" ? raw : parseInt(String(raw).replace(/[^\d]/g, ""), 10);
            if (!Number.isFinite(v) || v <= 0) continue;
            if (k === billCurrentKey || !out[k]) out[k] = Math.round(v);
          }
        }
        return out as typeof histBase;
      })();
      const parsedMonthCount = countFilledMonths(parsedUnits);
      const missingMonthHint =
        parsedMonthCount < 4
          ? `Only ${parsedMonthCount} month(s) detected. Please verify missing months manually for accurate proposal.`
          : "";
      if (slot === "latest") {
        setLatestBill(data);
        const inferred = learningGuardActive ? null : inferProfileFromBill(data);
        if (inferred && data.state?.trim() && data.discom?.trim()) {
          const key = profileKey(data.state, data.discom);
          setLearnedBillProfiles((prev) => ({ ...prev, [key]: inferred }));
        }
      } else {
        setAdditionalBills((prev) => {
          const next = [...prev];
          next[slot] = data;
          return next;
        });
      }

      const parsedMonthKey = monthKeyFromBillLabel(data.bill_month);
      const parsedMonthTotal =
        numericBillAmount(data.current_month_bill_amount_inr) ?? numericBillAmount(data.total_amount_payable_inr);
      if (parsedMonthKey && parsedMonthTotal != null && parsedMonthTotal > 0) {
        setAuditedMonthTotals((prev) => ({ ...prev, [parsedMonthKey]: parsedMonthTotal }));
      }

      setManual((prev) => ({
        ...prev,
        /** Bill account holder → official name; never overwrite friendly lead name. */
        officialBillName:
          slot === "latest" && data.name?.trim()
            ? data.name.trim()
            : prev.officialBillName || data.name || "",
        city: prev.city || data.district || "",
        discom: prev.discom || data.discom || "",
        state: prev.state || data.state || "",
        consumerId: prev.consumerId || data.consumer_id || "",
        meterNumber: prev.meterNumber || data.meter_number || "",
        connectionDate: prev.connectionDate || data.connection_date || "",
        phase: prev.phase || normalizeBillPhaseLabel(data.phase) || "",
        billPhone: prev.billPhone || data.registered_mobile || "",
        connectionType: detectedHt ? "HT" : prev.connectionType || truncateConnectionType(data.connection_type || ""),
        sanctionedLoad: (() => {
          const keep = prev.sanctionedLoad.trim();
          if (keep) return prev.sanctionedLoad;
          const printed = data.sanctioned_load?.trim();
          if (printed) return printed;
          const kw = inferMpLv12SanctionedLoadKwWhenBillOmits({
            sanctioned_load: "",
            state: data.state,
            discom: data.discom,
            connection_type: data.connection_type,
            purpose_of_supply: data.purpose_of_supply ?? undefined,
            phase: data.phase,
            tariff_category: data.tariff_category
          });
          return kw != null ? `${kw} kW` : "";
        })(),
        billingAddress: prev.billingAddress || data.address || "",
        tariffCategory: prev.tariffCategory || data.tariff_category || "",
        purposeOfSupply:
          prev.purposeOfSupply ||
          (typeof data.purpose_of_supply === "string" ? data.purpose_of_supply : "") ||
          data.connection_type ||
          "",
        contractDemandKva:
          prev.contractDemandKva ||
          (data.contract_demand_kva != null ? String(data.contract_demand_kva).trim() : ""),
        maxDemandKva:
          prev.maxDemandKva ||
          (data.max_demand_kva != null
            ? String(data.max_demand_kva).trim()
            : data.billing_demand_kva != null
              ? String(data.billing_demand_kva).trim()
              : ""),
        avgPowerFactor:
          prev.avgPowerFactor ||
          (data.avg_power_factor != null ? String(data.avg_power_factor).trim() : ""),
        kvahUnits:
          prev.kvahUnits ||
          (data.kvah_units != null ? String(data.kvah_units).trim() : "")
      }));

      setMonthlyUnits((prev) => {
        const base = slot === "latest" ? emptyMonthlyUnits() : prev;
        // History fills first (lower priority) — only for empty slots.
        const histU = buildUnitsFromConsumptionHistory(data);
        for (const k of MONTH_KEYS) { if (histU[k] && !base[k]) base[k] = histU[k] as number; }

        // Smart merge from data.months:
        //   • Current bill month key → always trust the AI/safety-net metered value.
        //   • All other months (history) → only fill if slot is STILL EMPTY.
        //     This prevents the AI from overwriting a history-derived correct value
        //     with a neighbouring-month value it confused (e.g., putting DEC's 194
        //     into the NOV slot when processing the DEC-2025 bill).
        const currentKey = parsedMonthKey; // e.g. "dec" for bill_month="DEC-2025"
        const merged = { ...base };
        if (data.months) {
          for (const k of MONTH_KEYS) {
            const raw = data.months[k];
            if (raw == null) continue;
            const v = typeof raw === "number" ? raw : parseInt(String(raw).replace(/[^\d]/g, ""), 10);
            if (!Number.isFinite(v) || v <= 0) continue;
            // For the current bill month: always override (metered reading is authoritative).
            // For history months: only fill slots that are empty (history takes priority).
            if (k === currentKey || !merged[k]) merged[k] = Math.round(v);
          }
        }
        if (slot !== "latest") return merged;
        // Never invent seasonal "fake" units. That produced ~180×multipliers
        // (e.g. 184/194/187…) when AI failed — looks like a read but is wrong.
        // Leave empty months blank so the user re-uploads or fills manually.
        return merged;
      });
      if (analysisMessages.length === 0) {
        if (scannerMode === "local_pdf") {
          setBillAnalysis(
            `${modelLabel} scan complete. ${missingMonthHint}`.trim()
          );
          setBillAnalysisTone("warning");
        } else if (canUseScannerAutofill) {
          setBillAnalysis(`${modelLabel} scan complete. ${missingMonthHint}`.trim());
          setBillAnalysisTone("success");
        } else {
          setBillAnalysis("Upload saved in manual mode. Please verify monthly units before continuing.");
          setBillAnalysisTone("warning");
        }
      } else if (canUseScannerAutofill) {
        const extraHint = missingMonthHint ? ` ${missingMonthHint}` : "";
        setBillAnalysis((prev) => `${prev}${extraHint}`.trim());
        setBillAnalysisTone("success");
      }
      if (scannerMode === "fallback_manual") {
        toast.info("Manual verify mode", "AI scan did not complete — please fill or check monthly units.");
      } else {
        toast.success("Bill analyzed", `${modelLabel} updated bill details.`);
      }
      if (selectedLeadId) {
        void syncSelectedLeadFromBills();
      }
    } catch (error) {
      setScanTimingBadge("");
      setBillAnalysis(error instanceof Error ? error.message : t("proposal_errorAnalyze"));
      setBillAnalysisTone("error");
      toast.error("Bill analysis failed", error instanceof Error ? error.message : t("proposal_errorAnalyze"));
    } finally {
      setSlotBusy(slot, false);
    }
  }

  async function runUploadQueue() {
    if (uploadWorkerRunningRef.current) return;
    uploadWorkerRunningRef.current = true;
    try {
      while (uploadQueueRef.current.length > 0) {
        const next = uploadQueueRef.current.shift();
        if (!next) continue;
        await processBillUploadTask(next);
      }
    } finally {
      uploadWorkerRunningRef.current = false;
      if (uploadQueueRef.current.length > 0) {
        void runUploadQueue();
      }
    }
  }

  function onBillUpload(file: File | null, slot: "latest" | number) {
    if (!file) return;
    // Keep only the latest queued upload for each slot.
    uploadQueueRef.current = uploadQueueRef.current.filter((task) => task.slot !== slot);
    uploadQueueRef.current.push({
      slot,
      file
    });
    setSlotBusy(slot, true);
    if (uploadWorkerRunningRef.current) {
      setScanTimingBadge("Queued...");
    }
    void runUploadQueue();
  }

  function onMonthChange(key: keyof MonthlyUnits, value: string) {
    const n = parseInt(value || "0", 10);
    setMonthlyUnits((prev) => ({ ...prev, [key]: Number.isNaN(n) ? 0 : Math.max(0, n) }));
  }

  function resetProposalForm() {
    uploadQueueRef.current = [];
    uploadWorkerRunningRef.current = false;
    setSelectedLeadId("");
    setMonthlyUnits(emptyMonthlyUnits());
    setLatestBill(null);
    setAdditionalBills(Array.from({ length: requiredSecondaryCount }, () => null));
    setAuditedMonthTotals({});
    setBillAnalysis("");
    setBillAnalysisTone("neutral");
    setScanTimingBadge("");
    setLatestWebProposalUrl(null);
    setOverrideSolarKw("");
    setOverridePanels("");
    setShowProposalSettings(false);
    setManual({ ...EMPTY_MANUAL_PROPOSAL_CUSTOMER });
    clearProposalBuilderSession();
  }

  function applyLeadFromCrmLight(lead: CustomerLead) {
    setManual((prev) => ({
      ...prev,
      leadContactName: lead.name,
      officialBillName: (lead.consumer_name ?? "").trim() || prev.officialBillName,
      leadPhone: lead.phone ?? prev.leadPhone,
      city: lead.city || prev.city,
      state: (lead.state ?? "").trim() || prev.state,
      discom: lead.discom || prev.discom,
      area: (lead.area ?? "").trim() || prev.area,
      location: (lead.location ?? "").trim() || prev.location,
      connectionType: (lead.connection_type ?? "").trim() || prev.connectionType,
    }));
  }

  function applyLeadFromCrm(lead: CustomerLead) {
    setAuditedMonthTotals({});
    setManual((prev) => ({
      ...prev,
      leadContactName: lead.name,
      leadPhone: lead.phone ?? "",
      officialBillName: (lead.consumer_name ?? "").trim(),
      city: lead.city,
      state: (lead.state ?? "").trim() || prev.state,
      discom: lead.discom,
      area: (lead.area ?? "").trim() || prev.area,
      location: (lead.location ?? "").trim() || prev.location,
      connectionType: (lead.connection_type ?? "").trim() || prev.connectionType,
      purposeOfSupply: "",
      contractDemandKva: ""
    }));
    const seedCtx = getFallbackTariffContext(installerState, lead.discom);
    const monthlyKwh = estimateMonthlyKwhFromBillAmount(lead.monthly_bill, seedCtx);
    const perMonth = Math.max(0, Math.round(monthlyKwh));
    const next = emptyMonthlyUnits();
    (Object.keys(next) as (keyof MonthlyUnits)[]).forEach((k) => {
      next[k] = perMonth;
    });
    setMonthlyUnits(next);
    setBillAnalysis("");
    setBillAnalysisTone("neutral");
  }

  /**
   * CRM v2: every generated proposal is tied to a lead. Existing CRM picks pass
   * through; walk-ins get a lead row on first generate (Customers + pipeline).
   */
  function syncCrmCachesAfterProposal(leadId: string) {
    const proposalPhone = pickProposalLeadPhone(manual.leadPhone, manual.billPhone);
    if (proposalPhone) void patchLeadPhoneIfProvided(leadId, proposalPhone);
    void mutateGlobal(PIPELINE_SWR_KEY);
    void mutateGlobal(CUSTOMERS_SWR_KEY, undefined, { revalidate: true });
    void mutateGlobal(DASHBOARD_STATS_SWR_KEY);
  }

  const syncSelectedLeadFromBills = useCallback(async () => {
    if (!selectedLeadId) return;
    const patch = buildLeadPatchFromProposal(manual, latestBill, previousBill, {
      monthlyBillInr: effectiveResult.currentMonthlyBill,
      leadPhone: manual.leadPhone,
      billPhone: manual.billPhone,
    });
    if (!patch) return;
    /** Never rename CRM lead into a different household member. */
    try {
      const leadRes = await fetch(`/api/customers/${encodeURIComponent(selectedLeadId)}`);
      const leadJson = (await leadRes.json()) as { ok?: boolean; data?: { name?: string } };
      const linkedName = leadJson.data?.name ?? "";
      if (linkedName && patch.name) {
        const { personNamesLikelyDifferent } = await import("@/lib/crm-household");
        if (personNamesLikelyDifferent(linkedName, patch.name)) {
          const { name: _drop, ...rest } = patch;
          const ok = await patchLeadFromProposal(selectedLeadId, rest);
          if (ok) syncCrmCachesAfterProposal(selectedLeadId);
          return;
        }
      }
    } catch {
      /* continue with full patch */
    }
    const ok = await patchLeadFromProposal(selectedLeadId, patch);
    if (ok) {
      syncCrmCachesAfterProposal(selectedLeadId);
      setManual((prev) => ({
        ...prev,
        leadContactName: prev.leadContactName || patch.name || prev.leadContactName,
        officialBillName:
          prev.officialBillName || patch.consumer_name || prev.officialBillName,
        city: prev.city || patch.city || prev.city,
        state: prev.state || patch.state || prev.state,
        discom: prev.discom || patch.discom || prev.discom,
        consumerId: prev.consumerId || patch.consumer_id || prev.consumerId,
      }));
    }
  }, [
    selectedLeadId,
    manual,
    latestBill,
    previousBill,
    effectiveResult.currentMonthlyBill,
    syncCrmCachesAfterProposal,
  ]);

  async function ensureLeadIdForProposal(): Promise<{ leadId: string | null; created: boolean }> {
    const merged = mergeCustomerForProposal(manual, mergeParsedBills(latestBill, previousBill));
    const leadName = resolveProposalCustomerName(manual.leadContactName);
    const billName = resolveProposalCustomerName(
      manual.officialBillName,
      merged?.name
    );
    const proposalPhone = pickProposalLeadPhone(manual.leadPhone, manual.billPhone);

    if (selectedLeadId) {
      /** Split only when friendly lead name differs — bill (father) name is consumer_name, not a new lead. */
      if (leadName) {
        try {
          const leadRes = await fetch(`/api/customers/${encodeURIComponent(selectedLeadId)}`);
          const leadJson = (await leadRes.json()) as {
            ok?: boolean;
            data?: { name?: string; consumer_name?: string | null };
          };
          const linkedName = leadJson.data?.name ?? "";
          const linkedConsumer = leadJson.data?.consumer_name ?? "";
          const { personNamesLikelyDifferent, personNamesLikelySame } = await import(
            "@/lib/crm-household"
          );
          const sameLead = linkedName && !personNamesLikelyDifferent(linkedName, leadName);
          const billIsLinkedConsumer =
            billName &&
            linkedConsumer &&
            personNamesLikelySame(linkedConsumer, billName);
          if (linkedName && !sameLead && !billIsLinkedConsumer) {
            const createLeadResp = await fetch("/api/customers", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: leadName,
                consumer_name: billName || undefined,
                city: manual.city.trim() || "Unknown",
                state: manual.state.trim() || undefined,
                discom: manual.discom.trim() || installerDiscom || "Unknown",
                monthly_bill: Math.max(0, Math.round(effectiveResult.currentMonthlyBill || 0)),
                phone: proposalPhone || undefined,
                status: "new",
                area: manual.area.trim() || undefined,
                connection_type: manual.connectionType.trim() || undefined,
                force_new: true,
                is_whatsapp_contact: false,
              }),
            });
            if (createLeadResp.ok) {
              const j = (await createLeadResp.json()) as { data?: { id?: string } };
              const leadId = j.data?.id ?? "";
              if (leadId) {
                setSelectedLeadId(leadId);
                setLastAutoLeadId(leadId);
                return { leadId, created: true };
              }
            }
          }
        } catch {
          /* fall through to sync existing */
        }
      }
      await syncSelectedLeadFromBills();
      return { leadId: selectedLeadId, created: false };
    }

    if (!leadName && !billName) {
      return { leadId: null, created: false };
    }
    const createLeadResp = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: leadName || billName,
        consumer_name: leadName && billName && leadName !== billName ? billName : undefined,
        city: manual.city.trim() || "Unknown",
        state: manual.state.trim() || undefined,
        discom: manual.discom.trim() || installerDiscom || "Unknown",
        monthly_bill: Math.max(0, Math.round(effectiveResult.currentMonthlyBill || 0)),
        phone: proposalPhone || undefined,
        status: "new",
        area: manual.area.trim() || undefined,
        connection_type: manual.connectionType.trim() || undefined,
        force_new: true,
      })
    });
    if (!createLeadResp.ok) {
      const j = (await createLeadResp.json().catch(() => ({}))) as { error?: string };
      throw new Error(j.error || "Could not create lead in Customers");
    }
    const j = (await createLeadResp.json()) as { data?: { id?: string } };
    const leadId = j.data?.id ?? "";
    if (!leadId) throw new Error("Lead create response missing id");
    setSelectedLeadId(leadId);
    setLastAutoLeadId(leadId);
    return { leadId, created: true };
  }

  function buildProposalExtrasPayload() {
    const branding = readProposalBrandingSettings();
    const identity = buildInstallerIdentitySnapshot(branding);
    const sanctionedLoadKw = (() => {
      const s = manual.sanctionedLoad?.trim();
      if (s) {
        const num = Number(s.replace(/[^0-9.]/g, ""));
        if (Number.isFinite(num) && num > 0) return num;
      }
      const ref = latestBill ?? previousBill;
      return (
        inferMpLv12SanctionedLoadKwWhenBillOmits({
          sanctioned_load: ref?.sanctioned_load,
          state: manual.state || ref?.state,
          discom: manual.discom || ref?.discom,
          connection_type: manual.connectionType || ref?.connection_type,
          purpose_of_supply: manual.purposeOfSupply || ref?.purpose_of_supply,
          phase: manual.phase || ref?.phase,
          tariff_category: manual.tariffCategory || ref?.tariff_category
        }) ?? undefined
      );
    })();
    const siteImages = (branding.proposalSiteImages ?? [])
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .slice(0, 6);
    return {
      lang: proposalLang,
      amcSelectedYears: branding.amcSelectedYears,
      financeOption: { interestRatePct: financeRatePct, tenuresYears: [3, 5, 7] as number[] },
      installerName: identity.installerName,
      installerContact: identity.installerContact || undefined,
      installerTagline: identity.installerTagline,
      customerProfile: {
        consumerId: manual.consumerId || undefined,
        meterNumber: manual.meterNumber || undefined,
        connectionDate: manual.connectionDate || undefined,
        connectionType: manual.connectionType || undefined,
        phase: manual.phase || undefined,
        sanctionedLoadKw
      },
      bankDetails: {
        accountName: branding.bankAccountName.trim() || undefined,
        accountNumber: branding.bankAccountNumber.trim() || undefined,
        ifsc: branding.bankIfsc.trim() || undefined,
        branch: branding.bankBranch.trim() || undefined,
        upiId: branding.bankUpiId.trim() || undefined,
        paymentQrCodeUrl: branding.paymentQrCodeUrl.trim() || undefined
      },
      siteImages: siteImages.length > 0 ? siteImages : undefined,
      installerLogoUrl: identity.installerLogoUrl,
      brandDisplayMode: identity.brandDisplayMode,
      brandSectionConfig: identity.brandSectionConfig,
      companyProfile: identity.companyProfile,
      ...(osPresetId === "residential_zenith"
        ? { galleryThemeKey: "zenith" }
        : osPresetId === "residential_premium_luxe"
          ? { galleryThemeKey: "luxe" }
          : osPresetId === "residential_luxe_noir"
            ? { galleryThemeKey: "luxe_noir" }
            : osPresetId === "residential_blueprint"
              ? { galleryThemeKey: "blueprint" }
              : osPresetId === "residential_quantum"
                ? { galleryThemeKey: "quantum" }
                : osPresetId === "residential_emerald"
                  ? { galleryThemeKey: "emerald" }
                : osPresetId === "residential_lumina"
                  ? { galleryThemeKey: "lumina" }
                  : osPresetId === "residential_executive"
                  ? { galleryThemeKey: "golden" }
                  : {}),
      proposalLayout: (() => {
        const presetForLayout = osPresetId ?? "residential_zenith";
        let layout = proposalLayout;
        if (!layout) {
          /* Isolated renderers — empty layout is fine */
        }
        if (!layout) return undefined;
        if (useResidentialCatalog && residentialConfig) {
          return applyResidentialFlagsToLayout(layout, residentialConfig);
        }
        if (useCommercialCatalog && commercialPricingConfig) {
          const builderEmiOn = commercialPricingConfig.financing?.enabled !== false;
          const financingEnabled =
            commercialConfig?.financing?.enabled === true && builderEmiOn;
          return applyCommercialFlagsToLayout(layout, {
            ...(commercialConfig ?? {}),
            financing: {
              ...commercialConfig?.financing,
              enabled: financingEnabled,
            },
            dcrComparison: {
              enabled: false,
              brandId: commercialPricingConfig.trackCompare?.compareBrandId,
              watt: commercialPricingConfig.solar.watt,
            },
            brandComparison: {
              enabled: commercialPricingConfig.brandCompare?.enabled === true,
              brandIdA: commercialPricingConfig.brandCompare?.brandIdA,
              brandIdB: commercialPricingConfig.brandCompare?.brandIdB,
              proposalTrack:
                commercialPricingConfig.brandCompare?.proposalTrack ?? "dcr",
            },
            capacityScenarios: commercialConfig?.capacityScenarios,
          });
        }
        return layout;
      })(),
      commercialConfig: (() => {
        if (!isCommercialPresetFamily(osPresetId)) return undefined;
        if (!commercialConfig) return undefined;
        // Builder "EMI on proposal" lives on residentialConfig.financing — keep deck in sync.
        const builderEmiOn = commercialPricingConfig?.financing?.enabled !== false;
        const enabled = commercialConfig.financing?.enabled === true && builderEmiOn;
        return {
          ...commercialConfig,
          financing: {
            ...commercialConfig.financing,
            enabled,
            interestRatePct:
              commercialConfig.financing?.interestRatePct ??
              commercialPricingConfig?.financing?.interestRatePct ??
              9.5,
            selectedTenureYears:
              commercialConfig.financing?.selectedTenureYears ??
              commercialPricingConfig?.financing?.selectedTenureYears ??
              7,
          },
        };
      })(),
      htBillInputs: (() => {
        if (!isCommercialPresetFamily(osPresetId)) return undefined;
        const ref = latestBill ?? previousBill;
        const num = (v: number | string | null | undefined): number | undefined => {
          if (v == null || v === "") return undefined;
          const n = typeof v === "number" ? v : Number(String(v).replace(/[^0-9.]/g, ""));
          return Number.isFinite(n) && n >= 0 ? n : undefined;
        };
        const pf = num(manual.avgPowerFactor) ?? num(ref?.avg_power_factor);
        const todUnits = ref?.tod_units
          ? {
              tod1: num(ref.tod_units.tod1),
              tod2: num(ref.tod_units.tod2),
              tod3: num(ref.tod_units.tod3),
              tod4: num(ref.tod_units.tod4),
            }
          : undefined;
        const inputs = {
          contractDemandKva: num(manual.contractDemandKva) ?? num(ref?.contract_demand_kva),
          billingDemandKva: num(ref?.billing_demand_kva),
          maxDemandKva: num(manual.maxDemandKva) ?? num(ref?.max_demand_kva),
          avgPowerFactor: pf != null && pf > 0 && pf <= 1 ? pf : undefined,
          kvahUnits: num(manual.kvahUnits) ?? num(ref?.kvah_units),
          kwhUnits: num(ref?.kwh_units),
          todUnits,
          energyChargesInr: num(ref?.energy_charges_inr),
          demandChargesInr: num(ref?.demand_charges_inr) ?? num(ref?.fixed_charges_inr),
          electricityDutyInr: num(ref?.electricity_duty_inr),
          fppasInr: num(ref?.fppas_inr),
          pfSurchargeInr: num(ref?.pf_welding_surcharge_inr),
          supplyVoltage: ref?.supply_voltage?.trim().slice(0, 20) || undefined,
          billMonth: ref?.bill_month?.trim() || undefined,
        };
        const hasAny = Object.entries(inputs).some(([key, value]) =>
          key === "todUnits"
            ? Object.values(value ?? {}).some((v) => v !== undefined)
            : value !== undefined
        );
        return hasAny ? inputs : undefined;
      })(),
      residentialConfig:
        useResidentialCatalog && residentialConfig
          ? {
              ...residentialConfig,
              inputMode: residentialInputMode,
              pricingSource: residentialConfig.pricingSource ?? "rate_card",
              connectionType:
                manual.connectionType.trim() || residentialConfig.connectionType || undefined,
            }
          : useCommercialCatalog && commercialPricingConfig
            ? applyCommercialPanelTrackPolicy(
                applyResidentialPricingSource({
                  ...commercialPricingConfig,
                  inputMode: "bill",
                  pricingSource: commercialPricingConfig.pricingSource ?? "rate_card",
                  connectionType:
                    manual.connectionType.trim() ||
                    commercialPricingConfig.connectionType ||
                    undefined,
                  financing: {
                    ...commercialPricingConfig.financing,
                    enabled:
                      commercialConfig?.financing?.enabled === true &&
                      commercialPricingConfig.financing?.enabled !== false,
                    interestRatePct:
                      commercialConfig?.financing?.interestRatePct ??
                      commercialPricingConfig.financing?.interestRatePct ??
                      10.5,
                    selectedTenureYears:
                      commercialConfig?.financing?.selectedTenureYears ??
                      commercialPricingConfig.financing?.selectedTenureYears ??
                      5,
                    tenuresYears:
                      commercialPricingConfig.financing?.tenuresYears ?? [3, 5, 7, 10],
                  },
                }),
                manual.connectionType
              )
            : undefined,
      pricingSource:
        useResidentialCatalog && residentialConfig
          ? residentialConfig.pricingSource ?? "rate_card"
          : useCommercialCatalog && commercialPricingConfig
            ? commercialPricingConfig.pricingSource ?? "rate_card"
            : isCommercialPresetFamily(osPresetId)
              ? "rate_card"
              : undefined,
      sharedPlantCatalog: (() => {
        const cached = getCachedResidentialBrandCatalog();
        if (cached?.entries?.length) return cached;
        if (residentialConfig?.brandCatalog?.entries?.length) return residentialConfig.brandCatalog;
        if (commercialPricingConfig?.brandCatalog?.entries?.length) return commercialPricingConfig.brandCatalog;
        return undefined;
      })(),
      storyMode: urlPrefill.story ?? commercialConfig?.storyMode,
      storySegment: commercialConfig?.orgType ?? urlPrefill.orgType,
    };
  }

  useEffect(() => {
    if (!isCommercialPresetFamily(osPresetId)) return;
    // Don't clobber a restored commercial deck with defaults.
    if (restoringExistingProposalRef.current && !deckRestoreReady) return;
    const kw = effectiveResult?.solarKw ?? urlPrefill.kw ?? 60;
    setCommercialConfig((prev) =>
      prev ?? withOrgStory(defaultCommercialConfig(kw), urlPrefill.orgType, urlPrefill.story)
    );
    setCommercialPricingConfig((prev) => {
      if (prev) {
        return applyCommercialPanelTrackPolicy(prev, manual.connectionType);
      }
      return applyCommercialPanelTrackPolicy(
        defaultResidentialConfigForBuilder(kw, "bill"),
        manual.connectionType
      );
    });
    setProposalLayout((prev) => prev ?? getPresetDefaultLayout(osPresetId ?? "commercial_executive"));
  }, [
    osPresetId,
    urlPrefill.kw,
    urlPrefill.orgType,
    urlPrefill.story,
    manual.connectionType,
    deckRestoreReady,
    effectiveResult?.solarKw,
  ]);

  useEffect(() => {
    if (!isCommercialPresetFamily(osPresetId)) return;
    if (restoringExistingProposalRef.current && !deckRestoreReady) return;
    let cancelled = false;
    void loadInstallerRateCard().then(() => {
      if (cancelled) return;
      setCommercialPricingConfig((prev) => {
        const kw = prev?.solar.plantCapacityKw ?? urlPrefill.kw ?? 60;
        const base = prev ?? defaultResidentialConfigForBuilder(kw, "bill");
        const synced = applyCommercialPanelTrackPolicy(
          applyResidentialPricingSource(base),
          manual.connectionType
        );
        if (!prev) return synced;
        return {
          ...synced,
          solar: {
            ...synced.solar,
            plantCapacityKw: prev.solar.plantCapacityKw,
            watt: prev.solar.watt,
            moduleCountOverride: prev.solar.moduleCountOverride,
          },
        };
      });
    });
    return () => {
      cancelled = true;
    };
  }, [osPresetId, urlPrefill.kw, deckRestoreReady, manual.connectionType]);

  const commercialBillUploadKey = useMemo(
    () => `${latestBill?.bill_month ?? ""}|${additionalBills[0]?.bill_month ?? ""}`,
    [latestBill?.bill_month, additionalBills]
  );

  useEffect(() => {
    if (commercialBillUploadKey !== lastCommercialBillUploadKeyRef.current) {
      lastCommercialBillUploadKeyRef.current = commercialBillUploadKey;
      lastCommercialBillKwSeedKeyRef.current = "";
      commercialPlantKwTouchedRef.current = false;
      lastResidentialBillKwSeedKeyRef.current = "";
      residentialPlantKwTouchedRef.current = false;
    }
  }, [commercialBillUploadKey]);

  const markResidentialPlantKwTouched = useCallback(() => {
    residentialPlantKwTouchedRef.current = true;
    proposalPlantLockedRef.current = true;
  }, []);

  const commitResidentialPlantKw = useCallback((kw: number) => {
    residentialPlantKwTouchedRef.current = true;
    proposalPlantLockedRef.current = true;
    setResidentialConfig((prev) => {
      if (!prev) return prev;
      const next = {
        ...prev,
        solar: { ...prev.solar, plantCapacityKw: kw, moduleCountOverride: undefined },
      };
      return applyPlantCapacitySubsidySync(next, prev.solar.plantCapacityKw);
    });
  }, []);

  const markCommercialPlantKwTouched = useCallback(() => {
    commercialPlantKwTouchedRef.current = true;
  }, []);

  const commitCommercialPlantKw = useCallback(
    (kw: number) => {
      commercialPlantKwTouchedRef.current = true;
      setCommercialPricingConfig((prev) => {
        const inputMode = isCommercialBillMode ? "bill" : "requirement";
        const base =
          prev ??
          defaultResidentialConfigForBuilder(kw, inputMode);
        const next: ResidentialProposalConfig = {
          ...base,
          solar: { ...base.solar, plantCapacityKw: kw, moduleCountOverride: undefined },
        };
        const synced = applyCommercialPanelTrackPolicy(next, manual.connectionType);
        return {
          ...synced,
          solar: {
            ...synced.solar,
            plantCapacityKw: kw,
            watt: prev?.solar.watt ?? synced.solar.watt,
            moduleCountOverride: undefined,
          },
        };
      });
    },
    [isCommercialBillMode, manual.connectionType]
  );

  const commitCommercialPricingConfig = useCallback(
    (next: ResidentialProposalConfig) => {
      setCommercialPricingConfig((prev) => {
        if (
          prev &&
          Math.abs(prev.solar.plantCapacityKw - next.solar.plantCapacityKw) > 0.001
        ) {
          commercialPlantKwTouchedRef.current = true;
        }
        const synced = applyCommercialPanelTrackPolicy(next, manual.connectionType);
        return {
          ...synced,
          solar: {
            ...synced.solar,
            plantCapacityKw: next.solar.plantCapacityKw,
            watt: next.solar.watt,
            moduleCountOverride: next.solar.moduleCountOverride,
          },
        };
      });
      setCommercialConfig((prev) => {
        if (!prev) return prev;
        const track = next.solar.panelTrack ?? "dcr";
        const financingEnabled = next.financing?.enabled === true;
        const merged: CommercialProposalConfig = {
          ...prev,
          panel: {
            catalogId: prev.panel?.catalogId ?? "waaree-540-dcr",
            brandId: next.solar.brandId ?? prev.panel?.brandId,
            watt: next.solar.watt,
            panelType: panelTypeFromTrack(track),
            ratePerWpInr: next.solar.ratePerWpInr,
            technology: next.solar.technology,
          },
          dcrComparison: {
            enabled: next.trackCompare?.enabled === true,
            brandId: next.trackCompare?.compareBrandId ?? next.solar.brandId,
            watt: next.solar.watt,
          },
          brandComparison: {
            enabled: next.brandCompare?.enabled === true,
            brandIdA: next.brandCompare?.brandIdA,
            brandIdB: next.brandCompare?.brandIdB,
            proposalTrack: next.brandCompare?.proposalTrack ?? "dcr",
          },
          financing: {
            ...prev.financing,
            enabled: financingEnabled,
            interestRatePct:
              next.financing?.interestRatePct ?? prev.financing?.interestRatePct ?? 9.5,
            selectedTenureYears:
              next.financing?.selectedTenureYears ?? prev.financing?.selectedTenureYears ?? 7,
            tenuresYears: prev.financing?.tenuresYears ?? [5, 7, 10],
          },
        };
        if (proposalLayout) {
          setProposalLayout(applyCommercialFlagsToLayout(proposalLayout, merged));
        }
        return merged;
      });
    },
    [manual.connectionType, proposalLayout]
  );

  const commitCommercialConfigChange = useCallback(
    (next: CommercialProposalConfig) => {
      setCommercialConfig(next);
      if (proposalLayout) {
        setProposalLayout(applyCommercialFlagsToLayout(proposalLayout, next));
      }
      // Keep builder "EMI on proposal" checkbox in sync with control-center / narrative EMI.
      setCommercialPricingConfig((prev) => {
        if (!prev) return prev;
        const enabled = next.financing?.enabled === true;
        if (prev.financing?.enabled === enabled) return prev;
        return {
          ...prev,
          financing: {
            ...prev.financing,
            enabled,
            interestRatePct:
              next.financing?.interestRatePct ?? prev.financing?.interestRatePct ?? 10.5,
            selectedTenureYears:
              next.financing?.selectedTenureYears ?? prev.financing?.selectedTenureYears ?? 5,
            tenuresYears: prev.financing?.tenuresYears ?? [3, 5, 7, 10],
          },
        };
      });
    },
    [proposalLayout]
  );

  const commitCommercialLayoutChange = useCallback((layout: ProposalTemplateV1) => {
    setCommercialConfig((prev) => {
      if (!prev) {
        setProposalLayout(layout);
        return prev;
      }
      const synced = applyLayoutFlagsToCommercialConfig(prev, layout);
      setProposalLayout(applyCommercialFlagsToLayout(layout, synced));
      setCommercialPricingConfig((pricingPrev) => {
        if (!pricingPrev) return pricingPrev;
        const enabled = synced.financing?.enabled === true;
        if (pricingPrev.financing?.enabled === enabled) return pricingPrev;
        return {
          ...pricingPrev,
          financing: {
            ...pricingPrev.financing,
            enabled,
            interestRatePct:
              synced.financing?.interestRatePct ?? pricingPrev.financing?.interestRatePct ?? 10.5,
            selectedTenureYears:
              synced.financing?.selectedTenureYears ??
              pricingPrev.financing?.selectedTenureYears ??
              5,
            tenuresYears: pricingPrev.financing?.tenuresYears ?? [3, 5, 7, 10],
          },
        };
      });
      return synced;
    });
  }, []);

  /** Requirement: sync kW from monthly kWh. Bill path: seed once per bill upload — never fight manual kW. */
  useEffect(() => {
    if (!useCommercialCatalog || !commercialPricingConfig) return;

    if (isCommercialBillMode) {
      if (!commercialBillsReady || commercialPlantKwTouchedRef.current) return;
      if (lastCommercialBillKwSeedKeyRef.current === commercialBillUploadKey) return;
      const fromBill = Math.round(result.solarKw * 10) / 10;
      if (fromBill <= 0) return;
      lastCommercialBillKwSeedKeyRef.current = commercialBillUploadKey;
      setCommercialPricingConfig((prev) => {
        if (!prev) return prev;
        if (Math.abs(prev.solar.plantCapacityKw - fromBill) < 0.05) return prev;
        return applyCommercialPanelTrackPolicy(
          {
            ...prev,
            solar: {
              ...prev.solar,
              plantCapacityKw: fromBill,
              moduleCountOverride: undefined,
            },
          },
          manual.connectionType
        );
      });
      return;
    }

    if (!isCommercialRequirement || commercialPlantKwTouchedRef.current) return;
    const fromRequirement = result.solarKw;
    if (fromRequirement <= 0) return;
    setCommercialPricingConfig((prev) => {
      if (!prev || Math.abs(prev.solar.plantCapacityKw - fromRequirement) < 0.05) return prev;
      return applyCommercialPanelTrackPolicy(
        {
          ...prev,
          solar: {
            ...prev.solar,
            plantCapacityKw: fromRequirement,
            moduleCountOverride: undefined,
          },
        },
        manual.connectionType
      );
    });
  }, [
    useCommercialCatalog,
    isCommercialBillMode,
    isCommercialRequirement,
    commercialBillsReady,
    commercialBillUploadKey,
    result.solarKw,
    manual.connectionType,
  ]);

  useEffect(() => {
    if (!isCommercialPresetFamily(osPresetId) || !commercialPricingConfig) return;
    setCommercialPricingConfig((prev) => {
      if (!prev) return prev;
      const next = applyCommercialPanelTrackPolicy(prev, manual.connectionType);
      if (
        next.solar.panelTrack === prev.solar.panelTrack &&
        next.solar.ratePerWpInr === prev.solar.ratePerWpInr &&
        (next.connectionType ?? "") === (prev.connectionType ?? "")
      ) {
        return prev;
      }
      return {
        ...next,
        solar: {
          ...next.solar,
          plantCapacityKw: prev.solar.plantCapacityKw,
          watt: prev.solar.watt,
          moduleCountOverride: prev.solar.moduleCountOverride,
        },
      };
    });
  }, [osPresetId, manual.connectionType]);

  useEffect(() => {
    if (!isCommercialPresetFamily(osPresetId) || !commercialPricingConfig) return;
    const track = commercialPricingConfig.solar.panelTrack ?? "dcr";
    const panelType = panelTypeFromTrack(track);
    setCommercialConfig((prev) => {
      if (!prev?.panel || prev.panel.panelType === panelType) return prev;
      return {
        ...prev,
        panel: {
          ...prev.panel,
          panelType,
          ratePerWpInr: commercialPricingConfig.solar.ratePerWpInr,
          brandId: commercialPricingConfig.solar.brandId ?? prev.panel.brandId,
          watt: commercialPricingConfig.solar.watt,
        },
      };
    });
  }, [
    osPresetId,
    commercialPricingConfig?.solar.panelTrack,
    commercialPricingConfig?.solar.ratePerWpInr,
    commercialPricingConfig?.solar.brandId,
    commercialPricingConfig?.solar.watt,
  ]);

  useEffect(() => {
    if (!isAnyResidential) return;
    if (restoringExistingProposalRef.current && !deckRestoreReady) return;
    const kw = result.solarKw > 0 ? result.solarKw : urlPrefill.kw ?? 5;
    setResidentialConfig(
      (prev) => prev ?? defaultResidentialConfigForBuilder(kw, residentialInputMode)
    );
    const presetForLayout = osPresetId ?? "residential_zenith";
    setProposalLayout((prev) => {
      if (prev) return prev;
      return getPresetDefaultLayout(presetForLayout);
    });
  }, [isAnyResidential, osPresetId, result.solarKw, urlPrefill.kw, residentialInputMode, deckRestoreReady]);

  useEffect(() => {
    if (!isAnyResidential) return;
    if (restoringExistingProposalRef.current && !deckRestoreReady) return;
    let cancelled = false;
    void loadInstallerRateCard().then(() => {
      if (cancelled) return;
      setResidentialConfig((prev) => {
        const kw = prev?.solar.plantCapacityKw ?? (result.solarKw > 0 ? result.solarKw : urlPrefill.kw ?? 5);
        const base = prev ?? defaultResidentialConfigForBuilder(kw, residentialInputMode);
        return applyResidentialPricingSource(base);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [isAnyResidential, residentialInputMode, result.solarKw, urlPrefill.kw, deckRestoreReady]);

  useEffect(() => {
    if (!isAnyResidential) return;
    setResidentialConfig((prev) => {
      if (!prev || prev.inputMode === residentialInputMode) return prev;
      return { ...prev, inputMode: residentialInputMode };
    });
  }, [isAnyResidential, residentialInputMode]);

  useEffect(() => {
    if (!draftProposalId || !osPresetId) return;
    bindProposalDraftId(osPresetId, draftProposalId);
  }, [draftProposalId, osPresetId]);

  /** Restore saved proposal (deep-link or family-scoped session draft) into the builder. */
  useEffect(() => {
    if (skipProposalRestoreRef.current) return;
    const deepLink = urlProposalId || deepLinkProposalIdRef.current?.trim() || null;
    // Prefer deep-link; otherwise restore only the draft matching URL/preset prefill family.
    const preferCommercial =
      isCommercialPresetFamily(urlPrefill.preset) ||
      isCommercialPresetFamily(osPresetId);
    const familyDraft = preferCommercial
      ? readCommercialDraftProposalId()
      : readResidentialDraftProposalId();
    // If no preset yet, try either family (deep-link already wrote both).
    const draftId =
      deepLink ||
      familyDraft ||
      (!urlPrefill.preset ? readResidentialDraftProposalId() || readCommercialDraftProposalId() : null);
    if (!draftId) return;
    restoringExistingProposalRef.current = true;
    setDeckRestoreReady(false);
    // Always bind the target id — `prev ?? draftId` kept the previous customer on soft-nav.
    setDraftProposalId(draftId);
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/proposals/${draftId}`, { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const json = (await res.json()) as {
          ok?: boolean;
          leadId?: string | null;
          customerName?: string;
          location?: string | null;
          presetId?: string;
          pptInput?: PremiumProposalPptInput;
        };
        if (!json.ok || cancelled) return;

        const preset = json.presetId;
        const isCommercial = isCommercialPresetFamily(preset);
        const restoredCommercialPreset: ProposalPresetId =
          preset === "commercial_ht" ? "commercial_ht" : "commercial_executive";
        if (preset) {
          const normalized: ProposalPresetId = isCommercial
            ? preset === "commercial_ht"
              ? "commercial_ht"
              : "commercial_executive"
            : preset === "residential_zenith" || preset === "zenith"
              ? "residential_zenith"
              : preset === "residential_premium_luxe" ||
                  preset === "luxe" ||
                  preset === "premium_luxe" ||
                  preset === "atelier"
                ? "residential_premium_luxe"
                : preset === "residential_luxe_noir" ||
                    preset === "luxe_noir" ||
                    preset === "premium_luxe_noir" ||
                    preset === "noir"
                  ? "residential_luxe_noir"
                  : preset === "residential_blueprint" ||
                      preset === "blueprint" ||
                      preset === "investment_blueprint"
                    ? "residential_blueprint"
                    : preset === "residential_quantum" || preset === "quantum"
                      ? "residential_quantum"
                      : preset === "residential_emerald" ||
                          preset === "emerald" ||
                          preset === "emerald_signature"
                        ? "residential_emerald"
                        : preset === "residential_lumina" ||
                            preset === "lumina"
                          ? "residential_lumina"
                        : preset === "residential_executive"
                        ? "residential_executive"
                        : "residential_executive";
          setOsPresetId((prev) => prev ?? normalized);
          setShowPresetPicker(false);
          setShowCommercialOrgPicker(false);
          bindProposalDraftId(normalized, draftId);
        }

        if (json.leadId) {
          const lid = String(json.leadId).trim();
          if (lid) {
            deepLinkLeadIdRef.current = lid;
            setSelectedLeadId(lid);
            setUrlLeadIdForRestore(lid);
          }
        }

        if (json.pptInput && typeof json.pptInput === "object") {
          const restoredName = json.customerName?.trim() ?? "";
          const deck = builderStateFromPptInput(json.pptInput, {
            customerName: json.customerName,
            location: json.location,
          });
          if (countFilledMonths(deck.monthlyUnits) > 0) {
            setMonthlyUnits(deck.monthlyUnits);
          }
          setManual((prev) => {
            const restoredContact =
              deck.manual.leadContactName ||
              (!isPlaceholderProposalCustomerName(restoredName) ? restoredName : "") ||
              "";
            const restoredBill =
              deck.manual.officialBillName || restoredName || "";
            // Deep-link / Edit proposal: prefer this deck over leftover session customer.
            if (deepLink) {
              return {
                ...prev,
                ...deck.manual,
                leadContactName: restoredContact || prev.leadContactName,
                officialBillName: restoredBill || prev.officialBillName,
                leadPhone: deck.manual.leadPhone || prev.leadPhone,
                connectionType:
                  deck.manual.connectionType ||
                  (preset === "commercial_ht" ? "HT" : isCommercial ? "LT" : "") ||
                  prev.connectionType,
              };
            }
            return {
              ...prev,
              ...deck.manual,
              leadContactName: prev.leadContactName || restoredContact,
              officialBillName: prev.officialBillName || restoredBill,
              leadPhone: prev.leadPhone || deck.manual.leadPhone,
              connectionType:
                prev.connectionType ||
                deck.manual.connectionType ||
                (preset === "commercial_ht" ? "HT" : isCommercial ? "LT" : ""),
            };
          });
          if (deck.overrideSolarKw) setOverrideSolarKw(deck.overrideSolarKw);
          if (deck.overridePanels) setOverridePanels(deck.overridePanels);
          if (!isCommercial && deck.residentialInputMode) {
            setResidentialInputMode(deck.residentialInputMode);
            setShowResidentialModePicker(false);
          }
        }

        if (isCommercial) {
          const commCfg = parseCommercialConfig(json.pptInput?.commercialConfig);
          if (commCfg) {
            setCommercialConfig(commCfg);
            setShowCommercialOrgPicker(false);
          }
          const pricingCfg = parseResidentialConfig(json.pptInput?.residentialConfig);
          if (pricingCfg) {
            setCommercialPricingConfig(
              applyCommercialPanelTrackPolicy(pricingCfg, json.pptInput?.connectionType)
            );
            if (pricingCfg.solar.plantCapacityKw > 0) proposalPlantLockedRef.current = true;
            const mode = pricingCfg.inputMode;
            if (mode === "bill" || mode === "requirement") {
              setCommercialInputMode(mode);
            }
          }
          const layout = json.pptInput?.proposalLayout;
          if (layout && typeof layout === "object") {
            const parsedLayout = layout as ProposalTemplateV1;
            setProposalLayout((prev) => {
              const base = prev ?? parsedLayout;
              return commCfg ? applyCommercialFlagsToLayout(base, commCfg) : parsedLayout;
            });
          } else if (commCfg) {
            setProposalLayout((prev) =>
              prev
                ? applyCommercialFlagsToLayout(prev, commCfg)
                : applyCommercialFlagsToLayout(getPresetDefaultLayout(restoredCommercialPreset), commCfg)
            );
          } else {
            setProposalLayout((prev) => prev ?? getPresetDefaultLayout(restoredCommercialPreset));
          }
        } else {
          const cfg = parseResidentialConfig(json.pptInput?.residentialConfig);
          if (cfg) {
            setResidentialConfig(healStaleResidentialSubsidy(cfg));
            if (cfg.solar.plantCapacityKw > 0) proposalPlantLockedRef.current = true;
            const mode = cfg.inputMode;
            if (mode === "bill" || mode === "requirement") {
              setResidentialInputMode(mode);
              setShowResidentialModePicker(false);
            }
          }

          const layout = json.pptInput?.proposalLayout;
          if (layout && typeof layout === "object") {
            const parsedLayout = layout as ProposalTemplateV1;
            setProposalLayout((prev) => {
              const base = prev ?? parsedLayout;
              return cfg ? applyResidentialFlagsToLayout(base, cfg) : parsedLayout;
            });
          } else if (cfg) {
            setProposalLayout((prev) =>
              prev ? applyResidentialFlagsToLayout(prev, cfg) : prev
            );
          }
        }

        if (!cancelled) {
          setDeckRestoreReady(true);
        }
      } catch {
        if (!cancelled) {
          setDeckRestoreReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // Re-run when Edit proposal opens a different deal (same /proposal route, new query).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlProposalId]);

  /** Bill path: seed kW once per bill upload — never fight manual kW (same as commercial bill). */
  useEffect(() => {
    if (!isResidentialBill || !residentialConfig) return;
    if (restoringExistingProposalRef.current && !deckRestoreReady) return;
    if (residentialPlantKwTouchedRef.current) return;
    if (lastResidentialBillKwSeedKeyRef.current === commercialBillUploadKey) return;
    const fromBill = Math.round(result.solarKw * 10) / 10;
    if (fromBill <= 0) return;
    lastResidentialBillKwSeedKeyRef.current = commercialBillUploadKey;
    setResidentialConfig((prev) => {
      if (!prev || Math.abs(prev.solar.plantCapacityKw - fromBill) < 0.05) return prev;
      const next = {
        ...prev,
        solar: { ...prev.solar, plantCapacityKw: fromBill, moduleCountOverride: undefined },
      };
      return applyPlantCapacitySubsidySync(next, prev.solar.plantCapacityKw);
    });
  }, [isResidentialBill, commercialBillUploadKey, result.solarKw, residentialConfig, deckRestoreReady]);

  /** Requirement path: size plant from monthly kWh / bill until user edits kW. */
  useEffect(() => {
    if (!isResidentialRequirement || !residentialConfig) return;
    if (residentialPlantKwTouchedRef.current || proposalPlantLockedRef.current) return;
    if (!requirementHasConsumptionInput(requirementMonthlyKwh, requirementMonthlyBill)) return;
    const fromRequirement = result.solarKw;
    if (fromRequirement <= 0) return;
    setResidentialConfig((prev) => {
      if (!prev || Math.abs(prev.solar.plantCapacityKw - fromRequirement) < 0.05) return prev;
      const next = {
        ...prev,
        solar: { ...prev.solar, plantCapacityKw: fromRequirement, moduleCountOverride: undefined },
      };
      return applyPlantCapacitySubsidySync(next, prev.solar.plantCapacityKw);
    });
  }, [
    isResidentialRequirement,
    result.solarKw,
    requirementMonthlyKwh,
    requirementMonthlyBill,
    residentialConfig,
  ]);

  useEffect(() => {
    if (!isAnyResidential) return;
    setResidentialConfig((prev) => {
      if (!prev) return prev;
      return applyConnectionTypeSubsidyPolicy(prev, manual.connectionType);
    });
  }, [isAnyResidential, manual.connectionType]);

  useEffect(() => {
    if (!isAnyResidential || !residentialSubsidyEligible) return;
    setResidentialConfig((prev) => {
      if (!prev) return prev;
      const healed = healStaleResidentialSubsidy(prev);
      if ((healed.subsidy?.estimateInr ?? 0) === (prev.subsidy?.estimateInr ?? 0)) return prev;
      return healed;
    });
  }, [
    isAnyResidential,
    residentialSubsidyEligible,
    residentialConfig?.solar.plantCapacityKw,
  ]);

  async function downloadPremiumPpt() {
    setIsPptDownloading(true);
    try {
      const merged = mergeCustomerForProposal(manual, latestBill || previousBill);
      const customerName = merged?.name?.trim() || manual.officialBillName || manual.leadContactName || "Customer";
      const location = formatProposalLocationLine(manual, merged?.district);
      const uploadedBills = [latestBill, ...additionalBills];
      const monthlyBillActuals = buildMonthlyBillActualsFromBills(uploadedBills, auditedMonthTotals);
      const monthlyAuditOverrides = buildMonthlyAuditOverridesFromBills(uploadedBills);
      const response = await fetch("/api/proposal-ppt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          location,
          systemKw: effectiveResult.solarKw,
          yearlyBill: effectiveResult.currentMonthlyBill * 12,
          afterSolar: effectiveResult.newMonthlyBill * 12,
          saving: effectiveResult.annualSavings,
          paybackYears: effectiveResult.paybackYears,
          monthlyUnits,
          state: manual.state || latestBill?.state || previousBill?.state || installerState || "Madhya Pradesh",
          discom: manual.discom || latestBill?.discom || previousBill?.discom || installerDiscom || "MPPKVVCL",
          connectionType: manual.connectionType || latestBill?.connection_type || previousBill?.connection_type || "",
          tariffCategory: manual.tariffCategory || latestBill?.tariff_category || previousBill?.tariff_category || "",
          connectedLoadKw: connectedLoadKw ?? undefined,
          areaProfile,
          billMonth: latestBill?.bill_month || previousBill?.bill_month || undefined,
          currentMonthBillAmountInr:
            latestBill?.current_month_bill_amount_inr ??
            previousBill?.current_month_bill_amount_inr ??
            null,
          monthlyBillActuals,
          monthlyAuditOverrides,
          ...buildMpSmartBillingApiPayload(manual, latestBill, previousBill),
          grossSystemCostInr: effectiveResult.grossCost,
          pmSuryaGharSubsidyInr: effectiveResult.centralSubsidy,
          netCostInr: effectiveResult.netCost,
          ...buildProposalExtrasPayload()
        })
      });
      if (!response.ok) {
        const json = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(json.error || "PPT download failed");
      }
      const blob = await response.blob();
      const fileName = `${customerName.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "").trim() || "customer"}-premium-proposal.pptx`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setBillAnalysis(error instanceof Error ? error.message : "Premium PPT download failed");
    } finally {
      setIsPptDownloading(false);
    }
  }

  async function copyWhatsAppSummary() {
    setIsCopyingSummary(true);
    try {
      const customer = manual.officialBillName || manual.leadContactName || "Customer";
      const text = [
        `SOL.52 Solar Snapshot`,
        `Customer: ${customer}`,
        `System size: ${effectiveResult.solarKw} kW`,
        `Net investment: ₹${effectiveResult.netCost.toLocaleString("en-IN")}`,
        `Annual saving: ₹${effectiveResult.annualSavings.toLocaleString("en-IN")}`,
        `Payback: ${effectiveResult.paybackDisplay}`,
        `25Y profit estimate: ₹${effectiveResult.profit25yr.toLocaleString("en-IN")}`
      ].join("\n");
      await navigator.clipboard.writeText(text);
      toast.success("Summary copied", "WhatsApp-ready proposal summary copied.");
    } catch (error) {
      toast.error("Copy failed", error instanceof Error ? error.message : "Clipboard not available.");
    } finally {
      setIsCopyingSummary(false);
    }
  }

  async function openProposalLimitModal() {
    try {
      const res = await fetch("/api/billing/usage", { cache: "no-store" });
      const json = (await res.json()) as { data?: { planName?: string } | null };
      setProposalLimitPlanName(json.data?.planName ?? null);
    } catch {
      setProposalLimitPlanName(null);
    }
    setProposalLimitModalOpen(true);
  }

  async function persistProposalToServer(): Promise<{
    id: string;
    shareUrl: string;
    leadCreated: boolean;
    leadId: string | null;
  } | null> {
    const pricingBlockReason = (() => {
      if (useResidentialCatalog && residentialConfig) {
        return proposalPricingBlocksGeneration(residentialConfig);
      }
      if (useCommercialCatalog && commercialPricingConfig) {
        const cfg = applyCommercialPanelTrackPolicy(commercialPricingConfig, manual.connectionType);
        return proposalPricingBlocksGeneration(cfg);
      }
      if (isCommercialPresetFamily(osPresetId) && !commercialPricingConfig) {
        const catalog =
          residentialConfig?.brandCatalog ?? getCachedResidentialBrandCatalog();
        const kw = effectiveResult.solarKw;
        const track = resolveCommercialPanelTrack(manual.connectionType, kw);
        return proposalPricingBlocksFromSharedCatalog(catalog, kw, track);
      }
      return null;
    })();
    if (pricingBlockReason) {
      toast.error("Pricing incomplete", pricingBlockReason);
      return null;
    }

    setLastAutoLeadId(null);
    const { leadId, created: leadCreated } = await ensureLeadIdForProposal();
    const merged = mergeCustomerForProposal(manual, mergeParsedBills(latestBill, previousBill));
    const customerName =
      resolveProposalCustomerName(merged?.name, manual.officialBillName, manual.leadContactName) ||
      "Customer";
    const location = formatProposalLocationLine(manual, merged?.district);
    const uploadedBills = [latestBill, ...additionalBills];
    const monthlyBillActuals = buildMonthlyBillActualsFromBills(uploadedBills, auditedMonthTotals);
    const monthlyAuditOverrides = buildMonthlyAuditOverridesFromBills(uploadedBills);
    const billBacked = isBillBackedFromBuilderState({
      latestBill,
      previousBill,
      additionalBills,
      monthlyUnits,
      auditedMonthTotals,
      monthlyBillActuals,
    });
    const proposalBody = {
        customerName,
        location,
        systemKw: effectiveResult.solarKw,
        yearlyBill: effectiveResult.currentMonthlyBill * 12,
        afterSolar: effectiveResult.newMonthlyBill * 12,
        saving: effectiveResult.annualSavings,
        paybackYears: effectiveResult.paybackYears,
        monthlyUnits,
        state: manual.state || latestBill?.state || previousBill?.state || installerState || "Madhya Pradesh",
        discom: manual.discom || latestBill?.discom || previousBill?.discom || installerDiscom || "MPPKVVCL",
        connectionType: manual.connectionType || latestBill?.connection_type || previousBill?.connection_type || "",
        tariffCategory: manual.tariffCategory || latestBill?.tariff_category || previousBill?.tariff_category || "",
        connectedLoadKw: connectedLoadKw ?? undefined,
        areaProfile,
        billMonth: latestBill?.bill_month || previousBill?.bill_month || undefined,
        currentMonthBillAmountInr:
          latestBill?.current_month_bill_amount_inr ??
          previousBill?.current_month_bill_amount_inr ??
          null,
        monthlyBillActuals,
        monthlyAuditOverrides,
        clientRef: clientRef || undefined,
        leadId: leadId ?? undefined,
        ...buildMpSmartBillingApiPayload(manual, latestBill, previousBill),
        grossSystemCostInr: effectiveResult.grossCost,
        pmSuryaGharSubsidyInr: effectiveResult.centralSubsidy,
        netCostInr: effectiveResult.netCost,
        panels: effectiveResult.panels,
        dataSource: isResidentialBill ? "bill" : isResidentialRequirement ? "requirement" : billBacked ? "bill" : "requirement",
        presetId: osPresetId ?? "residential_zenith",
        ...buildProposalExtrasPayload(),
    };

    const existingProposalId = (() => {
      const deep = deepLinkProposalIdRef.current?.trim() || null;
      if (deep) return deep;
      const family = draftFamilyForPreset(osPresetId);
      const familyDraft = readDraftProposalIdForFamily(family)?.trim() || null;
      if (familyDraft) return familyDraft;
      const inMemory = draftProposalId?.trim() || null;
      if (!inMemory) return null;
      // Refuse cross-family overwrite: in-memory id must match this family's key.
      if (family === "commercial" && readCommercialDraftProposalId() === inMemory) return inMemory;
      if (family === "residential" && readResidentialDraftProposalId() === inMemory) return inMemory;
      return null;
    })();

    if (existingProposalId) {
      const response = await fetch(`/api/proposals/${existingProposalId}/deck`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(proposalBody),
      });
      if (!response.ok) {
        const json = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(json.error || "proposal_update_failed");
      }
      const json = (await response.json()) as { ok: boolean; id?: string; shareUrl?: string };
      if (!json.ok || !json.id) throw new Error("proposal_update_failed");
      const shareUrl = json.shareUrl || `${window.location.origin}/proposal/${json.id}`;
      setLatestWebProposalUrl(shareUrl);
      setDraftProposalId(json.id);
      bindProposalDraftId(osPresetId, json.id);
      if (leadId) syncCrmCachesAfterProposal(leadId);
      return { id: json.id, shareUrl, leadCreated, leadId };
    }

    const response = await fetch("/api/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(proposalBody),
    });
    if (!response.ok) {
      const json = (await response.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
      };
      if (response.status === 402) {
        if (
          json.code === "proposal_limit_reached" ||
          json.code === "trial_expired" ||
          json.code === "no_subscription"
        ) {
          await openProposalLimitModal();
        }
        toast.error("Cannot create proposal", json.error || "Billing or plan limit blocked this proposal.");
        return null;
      }
      if (response.status === 409 || json.code === "preset_not_allowed") {
        toast.error(
          "Database preset blocked",
          json.error ||
            (osPresetId === "commercial_ht"
              ? "Run migration 067_add_commercial_ht_preset.sql in Supabase SQL Editor, then retry."
              : "Run migration 065_restore_commercial_executive_preset.sql in Supabase SQL Editor, then retry.")
        );
        return null;
      }
      if (response.status === 503) {
        toast.error("Save failed", json.error || "Proposal could not be saved to the database.");
        return null;
      }
      throw new Error(json.error || "Web proposal failed");
    }
    const json = (await response.json()) as { ok: boolean; id?: string; shareUrl?: string; persisted?: boolean; error?: string };
    if (!json.ok) throw new Error(json.error || "Web proposal could not be created");
    if (json.persisted === false) {
      toast.error("Save failed", t("proposal_persistFailed"));
      return null;
    }
    if (!json.id) throw new Error("Web proposal could not be created");
    const shareUrl = json.shareUrl || `${window.location.origin}/proposal/${json.id}`;
    setLatestWebProposalUrl(shareUrl);
    setDraftProposalId(json.id);
    bindProposalDraftId(osPresetId, json.id);
    if (leadId) syncCrmCachesAfterProposal(leadId);
    return { id: json.id, shareUrl, leadCreated, leadId };
  }

  const saveAndGenerateWebProposal = useCallback(async () => {
    setIsWebProposalBusy(true);
    try {
      await syncSelectedLeadFromBills();

      if (useResidentialCatalog && residentialConfig?.brandCatalog) {
        const synced = syncEquipmentPresetsFromConfig(ensureBrandCatalog(residentialConfig));
        await saveInstallerResidentialCatalog(synced.brandCatalog!);
      } else if (useCommercialCatalog && commercialPricingConfig?.brandCatalog) {
        const synced = syncEquipmentPresetsFromConfig(ensureBrandCatalog(commercialPricingConfig));
        await saveInstallerResidentialCatalog(synced.brandCatalog!);
      }

      const saved = await persistProposalToServer();
      if (!saved?.id) return;

      await markProposalSentIfDraft(saved.id);

      if (useResidentialCatalog && residentialConfig) {
        const cfg = ensureBrandCatalog(residentialConfig);
        const savedCfg = await saveResidentialRequirement({
          proposalId: saved.id,
          config: cfg,
          proposalLayout: proposalLayout ?? undefined,
        });
        if (!savedCfg.ok) {
          throw new Error(savedCfg.error ?? "Could not save residential pricing config.");
        }
      } else if (useCommercialCatalog && commercialPricingConfig && commercialConfig) {
        const savedComm = await saveCommercialRequirement({
          proposalId: saved.id,
          pricingConfig: ensureBrandCatalog(
            applyCommercialPanelTrackPolicy(commercialPricingConfig, manual.connectionType)
          ),
          commercialConfig,
          proposalLayout: proposalLayout ?? undefined,
        });
        if (!savedComm.ok) {
          throw new Error(savedComm.error ?? "Could not save commercial pricing config.");
        }
      }

      try {
        await navigator.clipboard.writeText(saved.shareUrl);
        toast.success(
          "Proposal saved & generated",
          saved.leadCreated ? t("proposal_leadCreatedSub") : "Share link copied — paste on WhatsApp."
        );
      } catch {
        toast.success(
          "Proposal saved & generated",
          saved.leadCreated ? t("proposal_leadCreatedSub") : "Share link saved below."
        );
      }
      window.open(saved.shareUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(
        "Save & generate failed",
        error instanceof Error ? error.message : "Could not save and generate proposal."
      );
      throw error;
    } finally {
      setIsWebProposalBusy(false);
    }
  }, [
    syncSelectedLeadFromBills,
    useResidentialCatalog,
    residentialConfig,
    useCommercialCatalog,
    commercialPricingConfig,
    commercialConfig,
    proposalLayout,
    manual.connectionType,
    persistProposalToServer,
    toast,
    t,
  ]);

  async function generateWebProposal() {
    setIsWebProposalBusy(true);
    try {
      await syncSelectedLeadFromBills();
      const saved = await persistProposalToServer();
      if (!saved) return;
      try {
        await navigator.clipboard.writeText(saved.shareUrl);
        toast.success(
          "Web proposal ready",
          saved.leadCreated ? t("proposal_leadCreatedSub") : "Share link copied — paste on WhatsApp."
        );
      } catch {
        toast.success(
          "Web proposal ready",
          saved.leadCreated ? t("proposal_leadCreatedSub") : "Share link saved below."
        );
      }
      window.open(saved.shareUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error("Web proposal failed", error instanceof Error ? error.message : "Could not generate web proposal.");
    } finally {
      setIsWebProposalBusy(false);
    }
  }

  /** Persist edits without opening share / regenerating the customer tab. */
  async function saveProposalEdits() {
    setIsWebProposalBusy(true);
    try {
      await syncSelectedLeadFromBills();

      if (useResidentialCatalog && residentialConfig?.brandCatalog) {
        const synced = syncEquipmentPresetsFromConfig(ensureBrandCatalog(residentialConfig));
        await saveInstallerResidentialCatalog(synced.brandCatalog!);
      } else if (useCommercialCatalog && commercialPricingConfig?.brandCatalog) {
        const synced = syncEquipmentPresetsFromConfig(ensureBrandCatalog(commercialPricingConfig));
        await saveInstallerResidentialCatalog(synced.brandCatalog!);
      }

      const saved = await persistProposalToServer();
      if (!saved?.id) return;

      if (useResidentialCatalog && residentialConfig) {
        const cfg = ensureBrandCatalog(residentialConfig);
        const savedCfg = await saveResidentialRequirement({
          proposalId: saved.id,
          config: cfg,
          proposalLayout: proposalLayout ?? undefined,
        });
        if (!savedCfg.ok) {
          throw new Error(savedCfg.error ?? "Could not save residential pricing config.");
        }
      } else if (useCommercialCatalog && commercialPricingConfig && commercialConfig) {
        const savedComm = await saveCommercialRequirement({
          proposalId: saved.id,
          pricingConfig: ensureBrandCatalog(
            applyCommercialPanelTrackPolicy(commercialPricingConfig, manual.connectionType)
          ),
          commercialConfig,
          proposalLayout: proposalLayout ?? undefined,
        });
        if (!savedComm.ok) {
          throw new Error(savedComm.error ?? "Could not save commercial pricing config.");
        }
      }

      toast.success("Proposal saved", "Edited details are saved. Use Generate when you want to open/share.");
    } catch (error) {
      toast.error(
        "Save failed",
        error instanceof Error ? error.message : "Could not save proposal edits."
      );
    } finally {
      setIsWebProposalBusy(false);
    }
  }

  function shareLatestOnWhatsApp() {
    if (!latestWebProposalUrl) return;
    const customer = manual.officialBillName || manual.leadContactName || "Customer";
    const text = [
      `Namaste ${customer} Ã°Å¸Å’Å¾`,
      ``,
      `${effectiveResult.solarKw} kW solar proposal aapke liye taiyaar hai:`,
      `• Net cost: ₹${effectiveResult.netCost.toLocaleString("en-IN")}`,
      `• Annual saving: ₹${effectiveResult.annualSavings.toLocaleString("en-IN")}`,
      `• Payback: ${effectiveResult.paybackDisplay}`,
      ``,
      `Full interactive proposal: ${latestWebProposalUrl}`
    ].join("\n");
    const phone = (manual.leadPhone || manual.billPhone || "").replace(/[^\d]/g, "");
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const osCustomerName = manual.leadContactName || manual.officialBillName;

  return (
    <>
      {/* Proposal OS — Preset Picker overlay */}
      {showPresetPicker && (
        <ProposalPresetPicker
          onSelectResidential={() => {
            // Don't inherit a commercial draft into residential flow.
            writeCommercialDraftProposalId(null);
            if (isCommercialPresetFamily(osPresetId)) {
              setDraftProposalId(null);
            }
            const id = readDefaultResidentialPreset();
            setOsPresetId(id);
            setShowPresetPicker(false);
            if (!urlPrefill.inputMode) {
              setShowResidentialModePicker(true);
            }
          }}
          onSelectCommercial={() => {
            // Fresh commercial draft — never PATCH a residential / prior commercial row.
            writeResidentialDraftProposalId(null);
            writeCommercialDraftProposalId(null);
            setDraftProposalId(null);
            setCommercialConfig(null);
            setCommercialPricingConfig(null);
            setProposalLayout(null);
            setShowPresetPicker(false);
            setShowCommercialOrgPicker(true);
          }}
          onSkip={() => {
            writeCommercialDraftProposalId(null);
            setOsPresetId(readDefaultResidentialPreset());
            setResidentialInputMode("bill");
            setShowPresetPicker(false);
          }}
          onDismiss={() => router.push("/proposals")}
        />
      )}

      {showCommercialOrgPicker ? (
        <CommercialOrgTypePicker
          open
          onSelect={(orgType, defaultKw) => {
            writeCommercialDraftProposalId(null);
            setDraftProposalId(null);
            setOsPresetId(readDefaultCommercialPreset());
            setCommercialConfig(
              withOrgStory(defaultCommercialConfig(defaultKw), orgType, urlPrefill.story)
            );
            setCommercialInputMode("requirement");
            setShowCommercialOrgPicker(false);
            setManual((prev) => ({
              ...prev,
              connectionType: prev.connectionType || "commercial",
            }));
            if (!overrideSolarKw.trim()) {
              setOverrideSolarKw(String(defaultKw));
            }
          }}
          onBack={() => {
            setShowCommercialOrgPicker(false);
            setShowPresetPicker(true);
            setOsPresetId(null);
          }}
          onDismiss={() => router.push("/proposals")}
        />
      ) : null}

      {showResidentialModePicker && isAnyResidential ? (
        <ResidentialProposalModePicker
          open
          currentMode={residentialInputMode}
          onSelect={(mode) => {
            setResidentialInputMode(mode);
            setShowResidentialModePicker(false);
          }}
          onBack={() => {
            setShowResidentialModePicker(false);
            setShowPresetPicker(true);
            setOsPresetId(null);
          }}
          onDismiss={() => router.push("/proposals")}
        />
      ) : null}

      {/* Block playlist drawer */}
      {showBlockPlaylist && (
        <BlockPlaylistEditor
          presetId={osPresetId}
          onClose={() => setShowBlockPlaylist(false)}
        />
      )}

      {(isCommercialPresetFamily(osPresetId) || useResidentialCatalog) && proposalLayout ? (
        <ProposalReviewSheet
          open={showReviewSheet}
          onClose={() => setShowReviewSheet(false)}
          presetId={osPresetId ?? "residential_zenith"}
          layout={proposalLayout}
          onLayoutChange={
            isCommercialPresetFamily(osPresetId)
              ? commitCommercialLayoutChange
              : setProposalLayout
          }
        />
      ) : null}

      {/*
       * Mobile floating generate FAB — visible below lg when customer name is filled.
       * Sits above the bottom nav (bottom-[5.5rem] matches the nav height + safe area).
       * Hidden on lg+ since the LivePreviewPanel already has a visible generate button.
       * z-[90] — below shell topbar (z-100) and modals (z-10050+) but above page content.
       */}
      {osCustomerName && !showPresetPicker && !showBlockPlaylist && (
        <div className="fixed bottom-[5.5rem] right-4 z-[90] flex flex-col items-end gap-2 lg:hidden">
          <button
            type="button"
            disabled={isWebProposalBusy}
            onClick={() => void saveProposalEdits()}
            aria-label="Save proposal"
            className={cn(
              "flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 shadow-[0_8px_24px_rgba(0,0,0,0.14)] transition-all active:scale-95 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100",
              isWebProposalBusy && "opacity-70 cursor-not-allowed"
            )}
          >
            <span>{isWebProposalBusy ? "Saving…" : "Save"}</span>
          </button>
          <button
            type="button"
            disabled={isWebProposalBusy}
            onClick={() =>
              void (catalogBuilderActive ? saveAndGenerateWebProposal() : generateWebProposal())
            }
            aria-label={isCommercialPresetFamily(osPresetId) ? "Generate Commercial Proposal" : "Generate Web Proposal"}
            className={cn(
              "flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-white shadow-[0_8px_24px_rgba(0,0,0,0.22)] transition-all active:scale-95",
              isCommercialPresetFamily(osPresetId)
                ? "bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 shadow-sky-900/20"
                : "bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-teal-900/20",
              isWebProposalBusy && "opacity-70 cursor-not-allowed"
            )}
          >
            {isWebProposalBusy ? (
              <Skeleton className="h-4 w-4 rounded-full bg-white/30" />
            ) : isCommercialPresetFamily(osPresetId) ? (
              <Building2 className="h-4 w-4 shrink-0" aria-hidden />
            ) : (
              <Globe className="h-4 w-4 shrink-0" aria-hidden />
            )}
            <span>{isWebProposalBusy ? "Generating…" : "Generate"}</span>
          </button>
        </div>
      )}

      <WorkspacePage tone="workflow" stagger={false}>
        {/* Proposal OS — branded header */}
        <ProposalOSHeader
          presetId={osPresetId}
          onChangePreset={() => {
            setShowCommercialOrgPicker(false);
            setShowPresetPicker(true);
          }}
          customerName={osCustomerName || undefined}
        />

        {/* OS layout: form (flex-1) + live preview panel (fixed width, desktop) */}
        <div className="flex items-start gap-4 lg:gap-6">
          {/* Main builder column */}
          <div className="min-w-0 flex-1 pb-6 sm:pb-8">
            <BuilderStageBar
              presetId={osPresetId}
              activeStageIndex={osActiveStageIndex}
              completedStages={osCompletedStages}
            />

            {/* Commercial Executive — Category selector (PHASE A) */}
            {isCommercialPresetFamily(osPresetId) && commercialConfig && (
              <CommercialCategorySelector
                value={commercialConfig.orgType}
                onChange={(orgType, defaultKw) => {
                  setCommercialConfig((prev) =>
                    prev ? { ...prev, orgType } : { orgType }
                  );
                  // Seed kW only when the field is empty / default
                  if (!overrideSolarKw || parseFloat(overrideSolarKw) === (effectiveResult?.solarKw ?? 0)) {
                    setOverrideSolarKw(String(defaultKw));
                    setOverridePanels("");
                  }
                }}
                className="mb-4"
              />
            )}

            {/* ─── EXISTING FORM CONTENT (unchanged) ─── */}
            <div id="step-1-anchor" className={`ss-step-card space-y-2 overflow-visible ${isCommercialPresetFamily(osPresetId) ? "ring-1 ring-sky-200/60" : ""}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="ss-step-chip">Step 1</span>
            {isCommercialPresetFamily(osPresetId) && (
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700">
                <Building2 className="h-2.5 w-2.5" />
                Commercial
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={resetProposalForm}
            className="rounded-full border border-slate-300 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-600 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
          >
            Clear Form
          </button>
        </div>
        <FloatingLabelSelect
          label={step1Label}
          suppressHydrationWarning
          value={selectedLeadId}
          onChange={(e) => {
            const id = e.target.value;
            setSelectedLeadId(id);
            if (!id) {
              setManual((p) => ({ ...p, leadContactName: "", leadPhone: "" }));
              setBillAnalysis("");
              setBillAnalysisTone("neutral");
              return;
            }
            const lead = customers.find((c) => c.id === id);
            if (lead) applyLeadFromCrm(lead);
          }}
        >
              <option value="">
                {isCustomersLoading ? "लोड हो रही है..." : " "}
              </option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} — {c.city} ({c.discom}){c.phone ? ` · ${c.phone}` : ""}
            </option>
          ))}
        </FloatingLabelSelect>
        <HelpHint
          label={t("proposal_step1LeadHint")}
          detail={t("proposal_step1LeadHint_detail")}
        />
        {!leadSelected ? (
          <HelpHint
            tone="tip"
            label={t("proposal_walkInCrmHint")}
            detail={t("proposal_walkInCrmHint_detail")}
          />
        ) : null}

        {isAnyResidential ? (
          <ResidentialInputModeSelector
            mode={residentialInputMode}
            onModeChange={(m) => {
              setResidentialInputMode(m);
            }}
          />
        ) : null}

        {isResidentialRequirement ? (
          <ResidentialRequirementCustomerForm
            fields={{
              contactName: manual.leadContactName,
              state: manual.state,
              discom: manual.discom,
              connectionType: manual.connectionType,
              location: manual.location,
              city: manual.city,
              phone: manual.leadPhone,
              monthlyKwh: requirementMonthlyKwh,
              monthlyBillInr: requirementMonthlyBill,
            }}
            canEstimateBillToKwh={canEstimateBillToKwh}
            estimatedKwhFromBill={requirementEstimatedKwh ?? undefined}
            suggestedSolarKw={
              requirementHasConsumptionInput(requirementMonthlyKwh, requirementMonthlyBill) && result.solarKw > 0
                ? result.solarKw
                : undefined
            }
            onContactName={(v) => setManual((p) => ({ ...p, leadContactName: v }))}
            onState={(v) => setManual((p) => ({ ...p, state: v, discom: v === p.state ? p.discom : "" }))}
            onDiscom={(v) => setManual((p) => ({ ...p, discom: v }))}
            onConnectionType={(v) => {
              setManual((p) => ({ ...p, connectionType: v }));
              setResidentialConfig((prev) => (prev ? applyConnectionTypeSubsidyPolicy(prev, v) : prev));
            }}
            onLocation={(v) => setManual((p) => ({ ...p, location: v }))}
            onCity={(v) => setManual((p) => ({ ...p, city: v }))}
            onPhone={(v) => setManual((p) => ({ ...p, leadPhone: v }))}
            onMonthlyKwh={(v) => {
              setRequirementMonthlyKwh(v);
              if (v.trim()) setRequirementMonthlyBill("");
              applyResidentialRequirementConsumption(v, v.trim() ? "" : requirementMonthlyBill);
            }}
            onMonthlyBillInr={(v) => {
              setRequirementMonthlyBill(v);
              if (v.trim()) setRequirementMonthlyKwh("");
              applyResidentialRequirementConsumption(requirementMonthlyKwh, v);
            }}
            connectionPhase={requirementConnectionPhase}
            onConnectionPhase={handleRequirementConnectionPhase}
          />
        ) : null}

        {isResidentialRequirement && residentialConfig ? (
          <ResidentialProposalConfigWorkspace
            config={residentialConfig}
            subsidyEligible={residentialSubsidyEligible}
            netCostInr={effectiveResult.netCost}
            annualSavingInr={effectiveResult.annualSavings}
            onCommitPlantKw={commitResidentialPlantKw}
            onPlantKwEditStart={markResidentialPlantKwTouched}
            onChange={(next) => {
              setResidentialConfig((prev) => {
                const synced =
                  prev && Math.abs(prev.solar.plantCapacityKw - next.solar.plantCapacityKw) > 0.001
                    ? applyPlantCapacitySubsidySync(next, prev.solar.plantCapacityKw)
                    : next;
                if (
                  prev &&
                  Math.abs(prev.solar.plantCapacityKw - synced.solar.plantCapacityKw) > 0.001
                ) {
                  residentialPlantKwTouchedRef.current = true;
                  proposalPlantLockedRef.current = true;
                }
                return synced;
              });
              if (proposalLayout) {
                setProposalLayout(applyResidentialFlagsToLayout(proposalLayout, next));
              }
            }}
            proposalId={draftProposalId}
            proposalLayout={proposalLayout}
            onLayoutChange={setProposalLayout}
            onCreateProposal={async () => {
              const saved = await persistProposalToServer();
              if (saved?.id) setDraftProposalId(saved.id);
              return saved?.id ?? null;
            }}
            onSaveAndGenerate={() => saveAndGenerateWebProposal()}
            onOpenReview={() => setShowReviewSheet(true)}
            paybackDisplay={effectiveResult.paybackDisplay}
            onDownloadPpt={() => void downloadPremiumPpt()}
            onCopySummary={() => void copyWhatsAppSummary()}
            pptDownloading={isPptDownloading}
            copySummaryBusy={isCopyingSummary}
            generateBusy={isWebProposalBusy}
          />
        ) : null}

        {isCommercialPresetFamily(osPresetId) ? (
          <div className="ss-step-card">
            <span className="ss-step-chip">Connection</span>
            <h2 className="text-base font-bold text-brand-900 sm:text-lg">
              Commercial connection type
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              HT choose karne par AI Contract Demand, Billing Demand, kWh/kVAh, PF aur TOD1–TOD4 ko priority se read karega.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setOsPresetId("commercial_executive");
                  setManual((prev) => ({ ...prev, connectionType: "LT" }));
                  setProposalLayout(getPresetDefaultLayout("commercial_executive"));
                }}
                className={cn(
                  "rounded-xl border px-4 py-3 text-left transition",
                  osPresetId === "commercial_executive"
                    ? "border-sky-500 bg-sky-50 ring-2 ring-sky-500/20"
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <strong className="block text-sm text-slate-900">LT Commercial</strong>
                <span className="mt-1 block text-[11px] text-slate-500">
                  Standard commercial bill
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setOsPresetId("commercial_ht");
                  setManual((prev) => ({ ...prev, connectionType: "HT" }));
                  setCommercialInputMode("bill");
                  setProposalLayout(getPresetDefaultLayout("commercial_ht"));
                }}
                className={cn(
                  "rounded-xl border px-4 py-3 text-left transition",
                  osPresetId === "commercial_ht"
                    ? "border-teal-600 bg-teal-50 ring-2 ring-teal-500/20"
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <strong className="block text-sm text-slate-900">HT / HV Industrial</strong>
                <span className="mt-1 block text-[11px] text-slate-500">
                  11/33/132 kV · CD/MD · PF · ToD
                </span>
              </button>
            </div>
          </div>
        ) : null}

        {isCommercialPresetFamily(osPresetId) ? (
          <CommercialInputModeSelector
            mode={commercialInputMode}
            onModeChange={(m) => {
              setCommercialInputMode(m);
              if (m === "bill") {
                setRequirementMonthlyKwh("");
                setRequirementNotes("");
              }
            }}
            contactName={manual.leadContactName}
            orgName={manual.officialBillName}
            phone={manual.leadPhone}
            city={manual.city}
            monthlyKwh={requirementMonthlyKwh}
            notes={requirementNotes}
            onContactName={(v) => setManual((p) => ({ ...p, leadContactName: v }))}
            onOrgName={(v) => setManual((p) => ({ ...p, officialBillName: v }))}
            onPhone={(v) => setManual((p) => ({ ...p, leadPhone: v }))}
            onCity={(v) => setManual((p) => ({ ...p, city: v }))}
            onMonthlyKwh={(v) => {
              setRequirementMonthlyKwh(v);
              applyResidentialRequirementConsumption(v, "");
            }}
            onNotes={setRequirementNotes}
            suggestedSystemKw={commercialRequirementSuggestedKw}
            connectionPhase={requirementConnectionPhase}
            onConnectionPhase={handleRequirementConnectionPhase}
          />
        ) : null}

        {isCommercialPresetFamily(osPresetId) &&
        isCommercialRequirement &&
        commercialPricingConfig &&
        commercialConfig ? (
          <CommercialProposalWorkspace
            pricingConfig={commercialPricingConfig}
            commercialConfig={commercialConfig}
            onPricingConfigChange={commitCommercialPricingConfig}
            onCommitPlantKw={commitCommercialPlantKw}
            onPlantKwEditStart={markCommercialPlantKwTouched}
            onCommercialConfigChange={commitCommercialConfigChange}
            summary={{
              systemKw: commercialPricingConfig.solar.plantCapacityKw,
              annualSaving: effectiveResult.annualSavings,
              netCost: effectiveResult.netCost,
            } as import("@/lib/proposal-ppt").ProposalDeckSummary}
            netCostInr={effectiveResult.netCost}
            annualSavingInr={effectiveResult.annualSavings}
            proposalId={draftProposalId ?? ""}
            proposalLayout={proposalLayout}
            onLayoutChange={commitCommercialLayoutChange}
            onOpenReview={() => setShowReviewSheet(true)}
            onCreateProposal={async () => {
              const saved = await persistProposalToServer();
              if (saved?.id) setDraftProposalId(saved.id);
              return saved?.id ?? null;
            }}
            onSaved={async () => {
              const saved = await persistProposalToServer();
              if (saved?.id) setDraftProposalId(saved.id);
            }}
            onSaveAndGenerate={() => saveAndGenerateWebProposal()}
            paybackDisplay={effectiveResult.paybackDisplay}
            onDownloadPpt={() => void downloadPremiumPpt()}
            onCopySummary={() => void copyWhatsAppSummary()}
            pptDownloading={isPptDownloading}
            copySummaryBusy={isCopyingSummary}
            generateBusy={isWebProposalBusy}
          />
        ) : null}

      </div>

      {leadSelected && manual.leadContactName && !hideBillUploadSteps ? (
        <ProposalQuickPreview
          customerName={manual.leadContactName}
          city={activeLead?.city ?? manual.city}
          discom={activeLead?.discom ?? manual.discom}
          systemKw={effectiveResult.solarKw}
          annualSavingsInr={effectiveResult.annualSavings}
          netCostInr={effectiveResult.netCost}
          paybackLabel={effectiveResult.paybackDisplay}
          billOptionalHint={t("proposal_quickPathHint")}
          onGenerate={() => void generateWebProposal()}
          busy={isWebProposalBusy}
        />
      ) : null}

      {!hideBillUploadSteps ? (
      <div id="step-2-anchor" className={`ss-step-card ${isCommercialPresetFamily(osPresetId) ? "ring-1 ring-sky-200/60" : ""}`}>
        <span className="ss-step-chip">Step 2</span>
        <h2 className="flex flex-col gap-1 text-base font-bold text-brand-900 sm:flex-row sm:items-center sm:gap-2 sm:text-lg">
          <span className="flex items-center gap-2">
            <FileUp className="h-5 w-5 shrink-0 text-brand-600" />
            <span className="leading-snug">{step2Label}</span>
          </span>
        </h2>
        <HelpHint
          className="mt-2"
          label={`${t("proposal_step2BillUploadsSub")}${billingRule.averagingHint ? ` ${billingRule.averagingHint}` : ""}`}
          detail={t("proposal_step2BillUploadsSub_detail")}
        />

        <>
        {!leadSelected ? (
          <HelpHint
            className="mt-2"
            tone="warn"
            label={t("proposal_billPersistLeadHint")}
            detail={t("proposal_billPersistLeadHint_detail")}
          />
        ) : null}
        {uploadRequirement.requiredBills > 1 ? (
          <p className="mt-1 text-[11px] font-semibold text-indigo-700 sm:text-xs">
            {t("proposal_uploadPlannerMulti", { n: uploadRequirement.requiredBills })}
          </p>
        ) : (
          <p className="mt-1 text-[11px] font-semibold text-slate-500 sm:text-xs">
            {t("proposal_uploadPlannerLearn")}
          </p>
        )}
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <UploadCard
            title={billingRule.latestBillLabel}
            subtitle={t("proposal_latestSubShort")}
            busy={isAnalyzingLatest}
            parsedBill={latestBill}
            onPick={(file) => onBillUpload(file, "latest")}
          />
          {Array.from({ length: requiredSecondaryCount }, (_, idx) => {
            const targetLabel = uploadRequirement.secondaryLabels[idx] ?? `Bill ${idx + 2}`;
            const alignState = secondaryAlignment[idx];
            const mismatchHint =
              alignState && alignState.current && !alignState.aligned
                ? `Uploaded ${alignState.current} • Please match ${targetLabel}`
                : `Required • ${targetLabel}`;
            // Secondary cards yield month-names already lit on the latest card (e.g. Jul-2026
            // on latest vs Jul-2025 row inside Jan bill history — same badge label, different years).
            return (
              <UploadCard
                key={`secondary-card-${idx}`}
                title={targetLabel}
                subtitle={mismatchHint}
                busy={Boolean(isAnalyzingAdditional[idx])}
                parsedBill={additionalBills[idx] ?? null}
                claimedMonthKeys={latestClaimedMonthKeys}
                onPick={(file) => onBillUpload(file, idx)}
              />
            );
          })}
        </div>
        <div className="mt-4 space-y-3 border-t border-brand-100/70 pt-4">
          <h3 className="text-sm font-extrabold tracking-wide text-brand-900 sm:text-base">
            {monthlyUnitsTitle}
          </h3>
          <p className="text-[11px] font-medium leading-snug text-slate-600 sm:text-xs">
            Auto-filled from first bill upload for quick verification. You can edit any month manually.
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {MONTH_KEYS.map((m) => (
              <FloatingLabelInput
                key={m}
                label={m.toUpperCase()}
                inputMode="numeric"
                autoComplete="off"
                min={0}
                value={monthlyUnits[m] || ""}
                onChange={(e) => onMonthChange(m, e.target.value)}
                className="min-h-10 text-xs sm:text-sm"
              />
            ))}
          </div>
        </div>
        {!hasRequiredBillInputs && billingRule.minBillsRequired > 1 && !(isCommercialBillMode && commercialBillsReady) ? (
          <p className="mt-2 text-xs font-bold text-amber-700 sm:text-sm">
            SOL.52 requirement: upload {uploadRequirement.requiredBills} bills ({billingRule.latestBillLabel} + required history bills) to continue.
          </p>
        ) : null}
        {billAnalysis ? (
          <>
            {scanTimingBadge ? (
              <p className="mt-3 inline-flex rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[10px] font-bold text-brand-700 sm:text-xs">
                {scanTimingBadge}
              </p>
            ) : null}
            <p
              className={cn(
                "mt-2 text-xs font-semibold leading-snug sm:text-sm",
                billAnalysisTone === "success"
                  ? "text-emerald-700"
                  : billAnalysisTone === "warning"
                    ? "text-amber-700"
                    : billAnalysisTone === "error"
                      ? "text-rose-700"
                      : "text-slate-700"
              )}
            >
              {billAnalysis}
            </p>
          </>
        ) : null}
        <p className="mt-1.5 text-[11px] font-medium leading-snug text-slate-500 sm:text-xs">
          {t("proposal_annualUnitsLine", { annual: annualUnits.toLocaleString("en-IN"), filled: filledMonths })}
        </p>
        </>
      </div>
      ) : null}

      {/* Bill analysis charts — bill-based paths only */}
      {!hideBillUploadSteps && (
        <div className="ss-card p-4 sm:p-5">
          <BillAnalysisCharts
            monthlyUnits={monthlyUnits}
            result={result}
            tariffContext={effectiveTariffContext}
            parsedBill={latestBill || previousBill}
          />
        </div>
      )}

      {/* Connection & bill details fields — bill-based paths only */}
      {!hideBillUploadSteps && showCommercialBillDetailsForm && (
      <div className="ss-card space-y-3 p-4 sm:space-y-4 sm:p-5">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-brand-700 sm:text-sm">{t("proposal_manualHeading")}</h3>
          <p className="mt-1 text-[11px] font-medium leading-snug text-slate-600 sm:text-xs">{t("proposal_manualSubCrm")}</p>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <FloatingLabelInput
            label={t("proposal_officialBillNamePlaceholder")}
            containerClassName="sm:col-span-2"
            value={manual.officialBillName}
            onChange={(e) => setManual((p) => ({ ...p, officialBillName: e.target.value }))}
          />

          {!leadSelected && (
            <FloatingLabelInput
              label={t("proposal_walkInContactPlaceholder")}
              value={manual.leadContactName}
              onChange={(e) => setManual((p) => ({ ...p, leadContactName: e.target.value }))}
            />
          )}
          <FloatingLabelInput
            label="Lead / Contact Mobile No."
            value={manual.leadPhone}
            onChange={(e) => setManual((p) => ({ ...p, leadPhone: e.target.value }))}
          />
          <FloatingLabelInput
            label="Bill Registered Mobile No."
            value={manual.billPhone}
            onChange={(e) => setManual((p) => ({ ...p, billPhone: e.target.value }))}
          />

          <FloatingLabelInput
            label={`${t("customers_placeholderCity")} / district`}
            value={manual.city}
            onChange={(e) => setManual((p) => ({ ...p, city: e.target.value }))}
          />
          <FloatingLabelSelect
            label={t("proposal_statePlaceholder")}
            suppressHydrationWarning
            value={manual.state}
            onChange={(e) => setManual((p) => ({ ...p, state: e.target.value }))}
          >
            <option value="">{t("proposal_statePlaceholder")}</option>
            {INDIAN_STATES_AND_UTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </FloatingLabelSelect>
          <FloatingLabelInput
            label="Consumer ID / CA number"
            value={manual.consumerId}
            onChange={(e) => setManual((p) => ({ ...p, consumerId: e.target.value }))}
          />
          <FloatingLabelInput
            label="Meter number"
            value={manual.meterNumber}
            onChange={(e) => setManual((p) => ({ ...p, meterNumber: e.target.value }))}
          />
          <FloatingLabelInput
            label="Connection date (as on bill)"
            type="text"
            value={manual.connectionDate}
            onChange={(e) => setManual((p) => ({ ...p, connectionDate: e.target.value }))}
          />
          <FloatingLabelInput
            label="Phase (as on bill, e.g. Single phase)"
            value={manual.phase}
            onChange={(e) => setManual((p) => ({ ...p, phase: e.target.value }))}
          />
          <FloatingLabelInput
            label={t("proposal_connectionPlaceholder")}
            value={manual.connectionType}
            onChange={(e) => setManual((p) => ({ ...p, connectionType: e.target.value }))}
          />
          <FloatingLabelInput
            label="Purpose of supply (as on bill, e.g. Shops/Showrooms)"
            value={manual.purposeOfSupply}
            onChange={(e) => setManual((p) => ({ ...p, purposeOfSupply: e.target.value }))}
          />
          <FloatingLabelInput
            label="Sanctioned load (e.g. 5 kW, 8.5 kVA)"
            value={manual.sanctionedLoad}
            onChange={(e) => setManual((p) => ({ ...p, sanctionedLoad: e.target.value }))}
          />
          <FloatingLabelInput
            label="Contract demand — kVA (if printed separately)"
            value={manual.contractDemandKva}
            onChange={(e) => setManual((p) => ({ ...p, contractDemandKva: e.target.value }))}
          />
          {/\bht\b|\bhv[-\s.]?\d|\b(11|33|66|132)\s*kv\b/i.test(
            [
              manual.connectionType,
              manual.tariffCategory,
              latestBill?.tariff_category ?? "",
              latestBill?.supply_voltage ?? "",
              previousBill?.supply_voltage ?? "",
            ].join(" ")
          ) && (
            <>
              <FloatingLabelInput
                label="Max Demand recorded — kVA (HT)"
                value={manual.maxDemandKva}
                onChange={(e) => setManual((p) => ({ ...p, maxDemandKva: e.target.value }))}
              />
              <FloatingLabelInput
                label="Avg Power Factor (HT, e.g. 0.87)"
                value={manual.avgPowerFactor}
                onChange={(e) => setManual((p) => ({ ...p, avgPowerFactor: e.target.value }))}
              />
              <FloatingLabelInput
                label="kVAh billed units (HT month)"
                value={manual.kvahUnits}
                onChange={(e) => setManual((p) => ({ ...p, kvahUnits: e.target.value }))}
              />
            </>
          )}
          <FloatingLabelInput
            label="Tariff category (e.g. DS-I, BPL, Commercial)"
            value={manual.tariffCategory}
            onChange={(e) => setManual((p) => ({ ...p, tariffCategory: e.target.value }))}
          />
          <FloatingLabelInput
            label="Billing address (as on bill)"
            containerClassName="sm:col-span-2"
            value={manual.billingAddress}
            onChange={(e) => setManual((p) => ({ ...p, billingAddress: e.target.value }))}
          />
        </div>
      </div>
      )}

      {/* Bill details summary — bill-based paths only */}
      {!hideBillUploadSteps && (latestBill || previousBill || manual.officialBillName) && (
        <div className="ss-card space-y-2 p-4 sm:p-5">
          <h3 className="text-xs font-bold uppercase tracking-wide text-brand-700 sm:text-sm">{t("proposal_billDetails")}</h3>
          <div className="grid gap-1 text-xs font-semibold text-slate-800 sm:text-sm">
            {[
              [t("proposal_rowLeadContact"), manual.leadContactName || "—"],
              [t("proposal_rowOfficialBillName"), manual.officialBillName || latestBill?.name || previousBill?.name],
              ["Consumer ID", latestBill?.consumer_id || previousBill?.consumer_id || manual.consumerId],
              ["Meter", latestBill?.meter_number || previousBill?.meter_number || manual.meterNumber],
              ["DISCOM", latestBill?.discom || previousBill?.discom || manual.discom],
              ["State", latestBill?.state || previousBill?.state || manual.state],
              ["Latest bill month", latestBill?.bill_month],
              ["Previous bill month", previousBill?.bill_month]
            ].map(([label, val]) =>
              val ? (
                <div
                  key={String(label)}
                  className="flex flex-col gap-0.5 border-b border-brand-50 py-1.5 last:border-0 sm:flex-row sm:justify-between sm:gap-2"
                >
                  <span className="shrink-0 text-slate-600 dark:text-slate-400">{label}</span>
                  <span className="break-words text-right text-sm font-bold text-slate-900 dark:text-slate-50 sm:text-base">{String(val)}</span>
                </div>
              ) : null
            )}
          </div>
        </div>
      )}

      {isCommercialPresetFamily(osPresetId) &&
      isCommercialBillMode &&
      commercialBillsReady &&
      commercialPricingConfig &&
      commercialConfig ? (
        <CommercialProposalWorkspace
          pricingConfig={commercialPricingConfig}
          commercialConfig={commercialConfig}
          onPricingConfigChange={commitCommercialPricingConfig}
          onCommitPlantKw={commitCommercialPlantKw}
          onPlantKwEditStart={markCommercialPlantKwTouched}
          onCommercialConfigChange={commitCommercialConfigChange}
          summary={{
            systemKw: commercialPricingConfig.solar.plantCapacityKw,
            annualSaving: effectiveResult.annualSavings,
            netCost: effectiveResult.netCost,
          } as import("@/lib/proposal-ppt").ProposalDeckSummary}
          netCostInr={effectiveResult.netCost}
          annualSavingInr={effectiveResult.annualSavings}
          proposalId={draftProposalId ?? ""}
          proposalLayout={proposalLayout}
          onLayoutChange={commitCommercialLayoutChange}
          onOpenReview={() => setShowReviewSheet(true)}
          onCreateProposal={async () => {
            const saved = await persistProposalToServer();
            if (saved?.id) setDraftProposalId(saved.id);
            return saved?.id ?? null;
          }}
          onSaved={async () => {
            const saved = await persistProposalToServer();
            if (saved?.id) setDraftProposalId(saved.id);
          }}
          onSaveAndGenerate={() => saveAndGenerateWebProposal()}
          paybackDisplay={effectiveResult.paybackDisplay}
          onDownloadPpt={() => void downloadPremiumPpt()}
          onCopySummary={() => void copyWhatsAppSummary()}
          pptDownloading={isPptDownloading}
          copySummaryBusy={isCopyingSummary}
          generateBusy={isWebProposalBusy}
        />
      ) : null}

      {/* Recommended solar — legacy bill-only; residential uses smart catalog instead */}
      {!hideBillUploadSteps && !isResidentialSmart && !isCommercialPresetFamily(osPresetId) && (
        <div className="ss-card p-4 sm:p-5">
          <h2 className="text-base font-extrabold text-brand-900 sm:text-lg">{t("proposal_recommended")}</h2>
          <p className="mt-2 break-words text-2xl font-extrabold tabular-nums text-solar-600 sm:text-3xl lg:text-4xl">
            ₹{effectiveResult.annualSavings.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-700 sm:text-sm">{t("proposal_annualSavingsLine")}</p>
        </div>
      )}

      {isResidentialBill && residentialConfig ? (
        <ResidentialProposalConfigWorkspace
          config={residentialConfig}
          subsidyEligible={residentialSubsidyEligible}
          netCostInr={effectiveResult.netCost}
          annualSavingInr={effectiveResult.annualSavings}
          billBackedHint
          onCommitPlantKw={commitResidentialPlantKw}
          onPlantKwEditStart={markResidentialPlantKwTouched}
          onChange={(next) => {
            setResidentialConfig((prev) => {
              if (
                prev &&
                Math.abs(prev.solar.plantCapacityKw - next.solar.plantCapacityKw) > 0.001
              ) {
                residentialPlantKwTouchedRef.current = true;
                proposalPlantLockedRef.current = true;
              }
              return next;
            });
            if (proposalLayout) {
              setProposalLayout(applyResidentialFlagsToLayout(proposalLayout, next));
            }
          }}
          proposalId={draftProposalId}
          proposalLayout={proposalLayout}
          onLayoutChange={setProposalLayout}
          onCreateProposal={async () => {
            const saved = await persistProposalToServer();
            if (saved?.id) setDraftProposalId(saved.id);
            return saved?.id ?? null;
          }}
          onSaveAndGenerate={() => saveAndGenerateWebProposal()}
          onOpenReview={() => setShowReviewSheet(true)}
          paybackDisplay={effectiveResult.paybackDisplay}
          onDownloadPpt={() => void downloadPremiumPpt()}
          onCopySummary={() => void copyWhatsAppSummary()}
          pptDownloading={isPptDownloading}
          copySummaryBusy={isCopyingSummary}
          generateBusy={isWebProposalBusy}
        />
      ) : null}

      {isCommercialBillMode && !commercialBillsReady ? (
        <div className="ss-card rounded-xl border border-sky-200/70 bg-sky-50/60 p-4 text-xs font-semibold text-sky-800 sm:p-5">
          Upload latest bill + one previous bill to unlock customer details, commercial executive setup, and proposal settings.
        </div>
      ) : null}
      {(!isCommercialBillMode || (commercialBillsReady && !commercialPricingConfig)) &&
        !catalogBuilderActive && (
      <div id="step-3-anchor" className={`ss-card space-y-4 p-4 sm:p-5 ${isCommercialPresetFamily(osPresetId) ? "ring-1 ring-sky-200/60" : ""}`}>
        {useResidentialCatalog ? (
          <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/60 px-3 py-2.5 text-xs text-emerald-950 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-100">
            <p className="font-semibold">Ready to generate your homeowner proposal</p>
            <p className="mt-1 opacity-90">
              Review sections, then tap Generate. Adjust plant, panel brand, and pricing here before
              sharing.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowReviewSheet(true)}
                className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-[11px] font-bold text-emerald-800"
              >
                Review proposal sections
              </button>
            </div>
          </div>
        ) : null}

        {!hideBillUploadSteps && !isResidentialSmart ? (
        <>
        {/* Solar System Size — editable (non-residential bill paths only) */}
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">
            {t("proposal_solarSizeLabel")}
            {overrideSolarKw && parseFloat(overrideSolarKw) !== result.solarKw && (
              <span className="ml-2 font-semibold text-indigo-500">Auto: {result.solarKw} kW</span>
            )}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {/* Editable custom input — text mode prevents browser mangling of digits */}
            <div className="flex items-center gap-1 rounded-lg border border-brand-300 bg-white px-3 py-1.5">
              <NumericTextInput
                value={
                  overrideSolarKw !== ""
                    ? (() => {
                        const n = parseFloat(overrideSolarKw);
                        return Number.isFinite(n) ? n : undefined;
                      })()
                    : undefined
                }
                fallback={result.solarKw}
                onValueChange={(v) => {
                  setOverrideSolarKw(v !== undefined ? String(v) : "");
                  setOverridePanels("");
                }}
                className="w-20 bg-transparent text-base font-extrabold text-brand-700 outline-none"
                aria-label={t("proposal_solarSizeLabel")}
              />
              <span className="text-sm font-bold text-brand-700">kW</span>
            </div>
            {/* Preset dropdown */}
            <select
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 focus:border-brand-400 focus:outline-none"
              value={overrideSolarKw || String(result.solarKw)}
              onChange={(e) => { setOverrideSolarKw(e.target.value); setOverridePanels(""); }}
            >
              {[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 11, 12, 13, 14, 15, 17.5, 20, 25, 30, 40, 50, 60, 75, 80, 100, 125, 150, 200, 250, 300, 400, 500].map((v) => (
                <option key={v} value={String(v)}>{v} kW</option>
              ))}
            </select>
            {overrideSolarKw && (
              <button
                type="button"
                onClick={() => { setOverrideSolarKw(""); setOverridePanels(""); }}
                className="rounded-full border border-slate-300 px-2.5 py-1 text-xs font-bold text-slate-400 hover:text-red-500"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Panels — editable */}
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">
            {t("proposal_panelsLabel")}
            <span className="ml-2 font-normal normal-case text-slate-400">(Auto: {autoPanelCount} panels @ 540W)</span>
          </p>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-brand-300 bg-white px-3 py-1.5">
              <NumericTextInput
                integer
                value={
                  overridePanels !== ""
                    ? (() => {
                        const n = parseInt(overridePanels, 10);
                        return Number.isFinite(n) ? n : undefined;
                      })()
                    : undefined
                }
                fallback={autoPanelCount}
                onValueChange={(v) => setOverridePanels(v !== undefined ? String(v) : "")}
                className="w-16 bg-transparent text-base font-extrabold text-brand-700 outline-none"
                aria-label={t("proposal_panelsLabel")}
              />
              <span className="text-sm font-bold text-brand-700">panels</span>
            </div>
            {overridePanels && (
              <button
                type="button"
                onClick={() => setOverridePanels("")}
                className="rounded-full border border-slate-300 px-2.5 py-1 text-xs font-bold text-slate-400 hover:text-red-500"
              >
                Reset
              </button>
            )}
          </div>
        </div>
        </>
        ) : null}

        <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
          <p className="text-xs font-semibold text-slate-700 sm:text-sm">
            {t("proposal_netCost")}: <span className="break-words font-extrabold text-brand-700">₹{effectiveResult.netCost.toLocaleString("en-IN")}</span>
          </p>
          <p className="text-xs font-semibold text-slate-700 sm:text-sm">
            {t("proposal_payback")}: <span className="font-extrabold text-brand-700">{effectiveResult.paybackDisplay}</span>
          </p>
        </div>
        {/* Proposal language — inline toggle */}
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Language</span>
          <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-0.5">
            <button
              type="button"
              onClick={() => setProposalLang("en")}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${proposalLang === "en" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setProposalLang("hi")}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${proposalLang === "hi" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              हिंदी
            </button>
          </div>
        </div>

        <div id="step-4-anchor" className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {isCommercialPresetFamily(osPresetId) && proposalLayout ? (
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-300 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700 shadow-sm transition hover:bg-sky-100 dark:border-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
              onClick={() => setShowReviewSheet(true)}
            >
              <Building2 className="h-4 w-4" />
              Review sections
              <span className="rounded-full bg-sky-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {proposalLayout.blocks.filter((b) => b.enabled).length}
              </span>
            </button>
          ) : null}
          <button
            type="button"
            className={`ss-cta-primary sm:text-base ${isCommercialPresetFamily(osPresetId) ? "from-sky-600 via-sky-500 to-indigo-600 hover:from-sky-700 hover:to-indigo-700" : ""}`}
            onClick={() => void generateWebProposal()}
            disabled={isWebProposalBusy}
          >
            {isWebProposalBusy ? (
              <Skeleton className="mr-2 h-4 w-4 rounded-full" />
            ) : isCommercialPresetFamily(osPresetId) ? (
              <Building2 className="mr-2 h-4 w-4" />
            ) : (
              <Globe className="mr-2 h-4 w-4" />
            )}
            {isCommercialPresetFamily(osPresetId) ? "Generate Commercial Proposal" : "Generate Web Proposal"}
          </button>
          <button
            type="button"
            className="ss-cta-secondary sm:text-base"
            onClick={() => void downloadPremiumPpt()}
            disabled={isPptDownloading}
          >
            {isPptDownloading ? <Skeleton className="mr-2 h-4 w-4 rounded-full" /> : <Download className="mr-2 h-4 w-4" />}
            Download PPT
          </button>
          <button
            type="button"
            className="ss-cta-secondary border-teal-500 text-teal-700 hover:bg-teal-50 sm:text-base"
            onClick={() => void copyWhatsAppSummary()}
            disabled={isCopyingSummary}
          >
            {isCopyingSummary ? <Skeleton className="mr-2 h-4 w-4 rounded-full" /> : <MessageCircle className="mr-2 h-4 w-4" />}
            Copy Summary
          </button>
        </div>
        {latestWebProposalUrl ? (
          <div className="mt-3 rounded-lg border border-teal-200 bg-teal-50/60 p-3 text-xs sm:text-sm">
            <p className="font-semibold text-teal-900">Web proposal link ready</p>
            <p className="mt-1 break-all font-mono text-[11px] text-teal-800 sm:text-xs">{latestWebProposalUrl}</p>
            {lastAutoLeadId ? (
              <p className="mt-2 text-[11px] text-teal-800">
                {t("proposal_leadCreatedSub")}{" "}
                <button
                  type="button"
                  className="font-bold underline underline-offset-2"
                  onClick={() => router.push(`/customers?lead=${encodeURIComponent(lastAutoLeadId)}`)}
                >
                  Open in Customers
                </button>
              </p>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className="ss-cta-secondary text-xs sm:text-sm"
                onClick={() => {
                  navigator.clipboard.writeText(latestWebProposalUrl).catch(() => undefined);
                  toast.success("Link copied", "Web proposal URL copied to clipboard.");
                }}
              >
                Copy link
              </button>
              <button type="button" className="ss-cta-primary text-xs sm:text-sm" onClick={shareLatestOnWhatsApp}>
                <Send className="mr-1.5 h-3.5 w-3.5" /> Send on WhatsApp
              </button>
            </div>
          </div>
        ) : null}
      </div>
      )}

      {catalogBuilderActive && latestWebProposalUrl ? (
        <div className="ss-card mt-4 rounded-xl border border-teal-200 bg-teal-50/60 p-4 text-xs sm:text-sm">
          <p className="font-semibold text-teal-900">Web proposal link ready</p>
          <p className="mt-1 break-all font-mono text-[11px] text-teal-800 sm:text-xs">{latestWebProposalUrl}</p>
          {lastAutoLeadId ? (
            <p className="mt-2 text-[11px] text-teal-800">
              {t("proposal_leadCreatedSub")}{" "}
              <button
                type="button"
                className="font-bold underline underline-offset-2"
                onClick={() => router.push(`/customers?lead=${encodeURIComponent(lastAutoLeadId)}`)}
              >
                Open in Customers
              </button>
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              className="ss-cta-secondary text-xs sm:text-sm"
              onClick={() => {
                navigator.clipboard.writeText(latestWebProposalUrl).catch(() => undefined);
                toast.success("Link copied", "Web proposal URL copied to clipboard.");
              }}
            >
              Copy link
            </button>
            <button type="button" className="ss-cta-primary text-xs sm:text-sm" onClick={shareLatestOnWhatsApp}>
              <Send className="mr-1.5 h-3.5 w-3.5" /> Send on WhatsApp
            </button>
          </div>
        </div>
      ) : null}
          </div>{/* end main builder column */}

          {/* Live preview panel — visible at lg+ (iPad Pro, desktop) */}
          <div className="hidden lg:block lg:w-60 lg:shrink-0 xl:w-72 2xl:w-80">
            <ProposalLivePreviewPanel
              presetId={osPresetId}
              customerName={osCustomerName}
              city={activeLead?.city ?? manual.city}
              systemKw={effectiveResult.solarKw}
              annualSaving={effectiveResult.annualSavings}
              netCost={effectiveResult.netCost}
              paybackLabel={effectiveResult.paybackDisplay}
              isBillBacked={isResidentialBill}
              billUploaded={isBillBackedLive}
              latestProposalUrl={latestWebProposalUrl}
              onSave={() => void saveProposalEdits()}
              onGenerate={() => void generateWebProposal()}
              busy={isWebProposalBusy}
              onEditBlocks={() => setShowBlockPlaylist(true)}
            />
          </div>
        </div>{/* end OS layout flex */}
      </WorkspacePage>
      <ProposalLimitUpgradeModal
        open={proposalLimitModalOpen}
        onClose={() => setProposalLimitModalOpen(false)}
        planName={proposalLimitPlanName}
      />
    </>
  );
}

export default function ProposalPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center px-4">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading proposal builder…</p>
        </div>
      }
    >
      <ProposalPageContent />
    </Suspense>
  );
}

function formatProposalLocationLine(manual: ManualProposalCustomer, districtFromBill?: string | null): string {
  const cityPart = (districtFromBill ?? manual.city ?? "").trim();
  return [manual.location?.trim(), cityPart, manual.state?.trim()].filter(Boolean).join(", ");
}

function manualSnapshot(manual: ManualProposalCustomer): Record<string, string> {
  return {
    leadContactName: manual.leadContactName,
    leadPhone: manual.leadPhone,
    billPhone: manual.billPhone,
    officialBillName: manual.officialBillName,
    city: manual.city,
    discom: manual.discom,
    state: manual.state,
    area: manual.area,
    location: manual.location,
    consumerId: manual.consumerId,
    meterNumber: manual.meterNumber,
    connectionDate: manual.connectionDate,
    phase: manual.phase,
    connectionType: manual.connectionType,
    sanctionedLoad: manual.sanctionedLoad,
    billingAddress: manual.billingAddress,
    tariffCategory: manual.tariffCategory,
    purposeOfSupply: manual.purposeOfSupply,
    contractDemandKva: manual.contractDemandKva
  };
}

const MONTH_KEYS: (keyof MonthlyUnits)[] = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const MONTH_LABELS: Record<keyof MonthlyUnits, string> = {
  jan: "Jan",
  feb: "Feb",
  mar: "Mar",
  apr: "Apr",
  may: "May",
  jun: "Jun",
  jul: "Jul",
  aug: "Aug",
  sep: "Sep",
  oct: "Oct",
  nov: "Nov",
  dec: "Dec"
};
const MONTH_LOOKUP: Record<string, keyof MonthlyUnits> = {
  jan: "jan",
  january: "jan",
  feb: "feb",
  february: "feb",
  mar: "mar",
  march: "mar",
  apr: "apr",
  april: "apr",
  may: "may",
  jun: "jun",
  june: "jun",
  jul: "jul",
  july: "jul",
  aug: "aug",
  august: "aug",
  sep: "sep",
  sept: "sep",
  september: "sep",
  oct: "oct",
  october: "oct",
  nov: "nov",
  november: "nov",
  dec: "dec",
  december: "dec"
};

function normalizeMonthToken(raw: string): keyof MonthlyUnits | null {
  const token = raw.toLowerCase().replace(/[^a-z]/g, "");
  return MONTH_LOOKUP[token] ?? null;
}

function monthKeyFromBillLabel(label: string | undefined): keyof MonthlyUnits | null {
  if (!label) return null;
  const parts = label
    .split(/[\s/-]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  for (const part of parts) {
    const key = normalizeMonthToken(part);
    if (key) return key;
  }
  return null;
}

function numericBillAmount(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) return Math.round(raw);
  const parsed = Number.parseFloat(String(raw ?? "").replace(/[^\d.]/g, ""));
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed);
}

function pickActualMonthBillAmount(bill: ParsedBillShape): number | null {
  const currentMonth = numericBillAmount(bill.current_month_bill_amount_inr);
  if (currentMonth != null && currentMonth > 0) return currentMonth;

  // `total_amount_payable_inr` often includes arrears/NFP carry-forwards, so use
  // it only when no separate current-month line is present and arrears are absent.
  const principalArrear = Number.parseFloat(String(bill.principal_arrear_inr ?? "").replace(/[^\d.-]/g, ""));
  const hasArrear = Number.isFinite(principalArrear) && Math.abs(principalArrear) > 0.5;
  if (bill.nfp_flag || hasArrear) return null;

  return numericBillAmount(bill.total_amount_payable_inr);
}

function parseConnectionMonthIndex(raw: string | undefined): number | null {
  if (!raw) return null;
  const m = raw.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (!m) return null;
  const month = Number.parseInt(m[2], 10);
  let year = Number.parseInt(m[3], 10);
  if (!Number.isFinite(month) || month < 1 || month > 12) return null;
  if (!Number.isFinite(year)) return null;
  if (year < 100) year += 2000;
  return year * 12 + (month - 1);
}

function parseHistoryMonthIndex(raw: string | undefined): number | null {
  if (!raw) return null;
  const text = raw.trim().toLowerCase();
  if (!text) return null;
  const yearMatch = text.match(/(20\d{2}|\d{2})/);
  if (!yearMatch) return null;
  let year = Number.parseInt(yearMatch[1], 10);
  if (year < 100) year += 2000;
  const parts = text.split(/[\s/-]+/).filter(Boolean);
  for (const part of parts) {
    const monthKey = normalizeMonthToken(part);
    if (!monthKey) continue;
    const monthIdx = MONTH_KEYS.indexOf(monthKey);
    if (monthIdx < 0) return null;
    return year * 12 + monthIdx;
  }
  return null;
}

function parseBillMonthIndex(raw: string | undefined): number | null {
  if (!raw) return null;
  const text = raw.trim().toLowerCase();
  if (!text) return null;
  const yearMatch = text.match(/(20\d{2}|\d{2})/);
  if (!yearMatch) return null;
  let year = Number.parseInt(yearMatch[1], 10);
  if (year < 100) year += 2000;
  const parts = text.split(/[\s/-]+/).filter(Boolean);
  for (const part of parts) {
    const monthKey = normalizeMonthToken(part);
    if (!monthKey) continue;
    const monthIdx = MONTH_KEYS.indexOf(monthKey);
    if (monthIdx < 0) return null;
    return year * 12 + monthIdx;
  }
  return null;
}

function buildMonthlyBillActualsFromBills(
  bills: Array<ParsedBillShape | null | undefined>,
  seedActuals?: Partial<Record<keyof MonthlyUnits, number>>
): Partial<Record<keyof MonthlyUnits, number>> {
  const out: Partial<Record<keyof MonthlyUnits, number>> = { ...(seedActuals ?? {}) };
  for (const bill of bills) {
    if (!bill) continue;
    const key = monthKeyFromBillLabel(bill.bill_month);
    if (!key) continue;
    const amount = pickActualMonthBillAmount(bill);
    if (amount != null && amount > 0) out[key] = amount;
  }
  return out;
}

function buildMonthlyAuditOverridesFromBills(
  bills: Array<ParsedBillShape | null | undefined>
): Partial<Record<keyof MonthlyUnits, {
  netPayableInr: number;
  energyInr?: number;
  fixedInr?: number;
  fppasInr?: number;
  electricityDutyInr?: number;
  units?: number;
  pfSurchargeInr?: number;
}>> {
  const out: Partial<Record<keyof MonthlyUnits, {
    netPayableInr: number;
    energyInr?: number;
    fixedInr?: number;
    fppasInr?: number;
    electricityDutyInr?: number;
    units?: number;
    pfSurchargeInr?: number;
  }>> = {};

  for (const bill of bills) {
    if (!bill) continue;
    const key = monthKeyFromBillLabel(bill.bill_month);
    if (!key) continue;
    const net = pickActualMonthBillAmount(bill);
    if (net == null || net <= 0) continue;

    const energyInr = billInrFromParsed(bill.energy_charges_inr) ?? undefined;
    const fixedInr = billInrFromParsed(bill.fixed_charges_inr) ?? undefined;
    const fppasInr = billInrFromParsed(bill.fppas_inr) ?? undefined;
    const electricityDutyInr = billInrFromParsed(bill.electricity_duty_inr) ?? undefined;
    const unitsVal = billInrFromParsed(bill.metered_unit_consumption) ?? undefined;

    // Welding/PF Surcharge: prefer explicit OCR field; fall back to computing
    // the gap between the printed net and standard components so that
    // energy + fixed + duty + fuel + pfSurcharge === total in all cases.
    let pfSurchargeInr: number | undefined;
    const explicitPf = billInrFromParsed(bill.pf_welding_surcharge_inr);
    if (explicitPf != null && explicitPf > 0) {
      pfSurchargeInr = explicitPf;
    } else if (
      energyInr != null && fixedInr != null &&
      fppasInr != null && electricityDutyInr != null
    ) {
      const compSum = energyInr + fixedInr + fppasInr + electricityDutyInr;
      const gap = net - compSum;
      if (gap > 50) pfSurchargeInr = Math.round(gap);
    }

    out[key] = {
      netPayableInr: net,
      ...(energyInr != null ? { energyInr } : {}),
      ...(fixedInr != null ? { fixedInr } : {}),
      ...(fppasInr != null ? { fppasInr } : {}),
      ...(electricityDutyInr != null ? { electricityDutyInr } : {}),
      ...(unitsVal != null ? { units: unitsVal } : {}),
      ...(pfSurchargeInr != null ? { pfSurchargeInr } : {})
    };
  }

  return out;
}

/**
 * Detects which calendar months this bill actually reports data for, tagged with the
 * best-known YEAR for each (so two upload cards can both legitimately show e.g. "Jul" —
 * one for Jul-2026 (this bill's own current month), the other for Jul-2025 (a prior
 * month inside a different bill's own 6-month history table) — without looking like a
 * duplicate/wrong badge. Map value is the 4-digit year, or null if it truly can't be
 * inferred.
 *
 * IMPORTANT: merges BOTH `months` and `consumption_history` (never one-or-the-other).
 * Previously this returned early as soon as `months` had ANY entry, which silently hid
 * real history rows whenever the model only partially filled `months` (e.g. the new
 * MPPKVVCL 2-page bill layout, whose page-1 "CONSUMPTION HISTORY" table has extra
 * MD/PF columns and can trip up partial extraction) — making the coverage badges look
 * incomplete even though the row-level history data was captured correctly.
 */
function extractDetectedMonths(parsed: ParsedBillShape | null): Map<keyof MonthlyUnits, number | null> {
  const detected = new Map<keyof MonthlyUnits, number | null>();
  if (!parsed) return detected;

  const connectionMonthIndex = parseConnectionMonthIndex(parsed.connection_date);
  const billMonthIndex = parseBillMonthIndex(parsed.bill_month);

  // Concrete filled month slots from this bill's own `months` object (year resolved below).
  if (parsed.months) {
    for (const key of MONTH_KEYS) {
      const raw = parsed.months[key];
      if (raw == null) continue;
      const n = typeof raw === "number" ? raw : Number.parseInt(String(raw).replace(/[^\d]/g, ""), 10);
      if (Number.isFinite(n) && n > 0) detected.set(key, null);
    }
  }

  // Row-level consumption_history carries an explicit "MMM-YYYY" label — always merge
  // it in on top of `months` (never skip it), since it is the most reliable year source.
  const history = parsed.consumption_history ?? [];
  for (const row of history) {
    if (!row || Number(row.units) <= 0) continue;
    const rowMonthIndex = parseHistoryMonthIndex(String(row.month ?? ""));
    if (connectionMonthIndex != null && rowMonthIndex != null && rowMonthIndex < connectionMonthIndex) continue;
    const parts = String(row.month ?? "")
      .split(/[\s/-]+/)
      .map((part) => part.trim())
      .filter(Boolean);
    for (const part of parts) {
      const normalized = normalizeMonthToken(part);
      if (normalized) {
        detected.set(normalized, rowMonthIndex != null ? Math.floor(rowMonthIndex / 12) : null);
        break;
      }
    }
  }

  // The bill's own current month always gets its printed year, explicitly (overrides guesses).
  const billKey = monthKeyFromBillLabel(parsed.bill_month);
  if (billKey) detected.set(billKey, billMonthIndex != null ? Math.floor(billMonthIndex / 12) : null);

  // No explicit months/history data at all → best-effort trailing window from bill_month.
  if (detected.size === 0 && billMonthIndex != null) {
    let window = 6;
    if (connectionMonthIndex != null && billMonthIndex >= connectionMonthIndex) {
      const monthsSinceConnection = billMonthIndex - connectionMonthIndex + 1;
      window = Math.max(1, Math.min(6, monthsSinceConnection));
    }
    for (let offset = 0; offset < window; offset += 1) {
      const monthAbs = billMonthIndex - offset;
      const monthIdx = ((monthAbs % 12) + 12) % 12;
      detected.set(MONTH_KEYS[monthIdx], Math.floor(monthAbs / 12));
    }
    return detected;
  }

  // Best-guess a year for any month still untagged (e.g. came only from `months`, no
  // matching history row): pick the most recent occurrence of that calendar month at
  // or before the bill month — history/previous-month tables never point to the future.
  if (billMonthIndex != null) {
    for (const [key, year] of detected) {
      if (year != null) continue;
      const monthIdx = MONTH_KEYS.indexOf(key);
      let guessYear = Math.floor(billMonthIndex / 12);
      if (guessYear * 12 + monthIdx > billMonthIndex) guessYear -= 1;
      detected.set(key, guessYear);
    }
  }

  return detected;
}

/** Secondary upload-card badges: this bill's detected months minus anything the latest bill already claims. */
function extractSecondaryCardMonths(
  parsed: ParsedBillShape | null,
  claimedMonthKeys: ReadonlySet<keyof MonthlyUnits> | undefined
): Map<keyof MonthlyUnits, number | null> {
  const detected = extractDetectedMonths(parsed);
  if (!claimedMonthKeys?.size) return detected;
  const filtered = new Map(detected);
  for (const key of claimedMonthKeys) filtered.delete(key);
  return filtered;
}

function buildUnitsFromConsumptionHistory(parsed: ParsedBillShape | null): Partial<MonthlyUnits> {
  const out: Partial<MonthlyUnits> = {};
  if (!parsed) return out;
  const history = parsed.consumption_history ?? [];
  const billIdx = parseBillMonthIndex(parsed.bill_month);

  // Track the highest year seen for each month key so that if the same calendar
  // month appears multiple times (e.g. APR-2025 and APR-2026), only the most
  // recent year's value is kept. This prevents the "same month last year" row
  // in the MP DISCOM history table (APR-2025) from overwriting more recent data.
  const yearForKey: Partial<Record<string, number>> = {};

  for (const row of history) {
    if (!row) continue;
    const units = Number(row.units ?? 0);
    if (!Number.isFinite(units) || units <= 0) continue;
    const rawMonth = String(row.month ?? "");
    const rowIdx = parseHistoryMonthIndex(rawMonth);
    // Drop same-month-last-year (and older) rows — they are YoY reference only.
    if (billIdx != null && rowIdx != null) {
      const delta = billIdx - rowIdx;
      if (delta < 0 || delta > 11) continue;
    }
    const parts = rawMonth.split(/[\s/-]+/).map((part) => part.trim()).filter(Boolean);

    // Extract year from the month string (e.g. "APR-2025" → year 2025)
    let rowYear = 0;
    for (const part of parts) {
      const n = Number(part);
      if (Number.isFinite(n) && n >= 2000 && n <= 2100) { rowYear = n; break; }
    }

    for (const part of parts) {
      const key = normalizeMonthToken(part);
      if (!key) continue;
      const existing = yearForKey[key] ?? 0;
      if (rowYear >= existing) {
        out[key as keyof MonthlyUnits] = Math.max(0, Math.round(units));
        yearForKey[key] = rowYear;
      }
      break;
    }
  }
  return out;
}

function parseLatestMonthIndex(label: string | undefined): number {
  if (!label) return new Date().getMonth();
  const parts = label.split(/[\s/-]+/).map((p) => p.trim()).filter(Boolean);
  for (const part of parts) {
    const m = normalizeMonthToken(part);
    if (m) return MONTH_KEYS.indexOf(m);
  }
  return new Date().getMonth();
}

function deriveBaseUnits(parsed: ParsedBillShape): number {
  const monthValues = MONTH_KEYS.map((k) => Number(parsed.months?.[k] ?? 0)).filter((n) => Number.isFinite(n) && n > 0);
  if (monthValues.length > 0) return Math.max(1, Math.round(monthValues[0]));
  const history = (parsed.consumption_history ?? [])
    .map((h) => Number(h?.units ?? 0))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (history.length > 0) {
    const avg = history.reduce((a, b) => a + b, 0) / history.length;
    return Math.max(1, Math.round(avg));
  }
  const maybeMonthly = Number((parsed as any).months_average ?? 0);
  if (Number.isFinite(maybeMonthly) && maybeMonthly > 0) return Math.round(maybeMonthly);
  return 180;
}

function buildSixMonthAutofill(parsed: ParsedBillShape): Partial<MonthlyUnits> {
  const latestIndex = parseLatestMonthIndex(parsed.bill_month);
  const baseUnits = deriveBaseUnits(parsed);
  const seasonalMultipliers = [1, 0.96, 0.92, 1.04, 1.08, 1.02];
  const result: Partial<MonthlyUnits> = {};

  for (let offset = 0; offset < 6; offset += 1) {
    const monthIndex = (latestIndex - offset + 12) % 12;
    const key = MONTH_KEYS[monthIndex];
    const parsedValue = Number(parsed.months?.[key] ?? 0);
    const fallback = Math.max(0, Math.round(baseUnits * seasonalMultipliers[offset]));
    result[key] = Number.isFinite(parsedValue) && parsedValue > 0 ? Math.round(parsedValue) : fallback;
  }

  return result;
}

function stripStepPrefix(label: string): string {
  return label
    .replace(/^\s*(step|चरण|படி)\s*\d+\s*[:\-]\s*/iu, "")
    .trim();
}

function stripManualSuffix(label: string): string {
  return label
    .replace(/\s*\(\s*manual override\s*\)\s*/iu, "")
    .replace(/\s*\(\s*मैनुअल ओवरराइड\s*\)\s*/iu, "")
    .trim();
}

function parseConnectedLoadKw(raw: string): number | null {
  const value = raw.trim().toLowerCase();
  if (!value) return null;
  const match = value.match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const numeric = Number(match[1]);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  if (value.includes("kva")) return Number((numeric * 0.9).toFixed(2));
  return numeric;
}

function inferAreaProfile(manual: ManualProposalCustomer): "urban" | "rural" | undefined {
  const text = [manual.tariffCategory, manual.connectionType, manual.billingAddress, manual.city]
    .join(" ")
    .toLowerCase();
  if (!text.trim()) return undefined;
  if (text.includes("rural") || text.includes("gramin") || text.includes("village") || text.includes("gaon")) {
    return "rural";
  }
  if (text.includes("urban") || text.includes("city") || text.includes("nagar")) {
    return "urban";
  }
  return undefined;
}

function UploadCard({
  title,
  subtitle,
  busy,
  parsedBill,
  claimedMonthKeys,
  onPick
}: {
  title: string;
  subtitle: string;
  busy: boolean;
  parsedBill: ParsedBillShape | null;
  /** Month names already marked checked on the latest-bill card. Secondary cards
   *  must not light up the same month-name even if their own history table contains
   *  it (e.g. "Jul" in a Jan-bill's history refers to Jul-2025, while the latest
   *  card's "Jul" is Jul-2026 — two different years, one name). */
  claimedMonthKeys?: ReadonlySet<keyof MonthlyUnits>;
  onPick: (file: File | null) => void;
}) {
  const detectedMonths = extractSecondaryCardMonths(parsedBill, claimedMonthKeys);
  const topRowMonths = MONTH_KEYS.slice(0, 6);
  const bottomRowMonths = MONTH_KEYS.slice(6);

  return (
    <div className="space-y-2">
      <label
        className={cn(
          "flex min-h-[7.5rem] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-teal-300/80 bg-emerald-50/65 px-3 py-5 shadow-inner transition sm:min-h-[8rem] sm:px-4 sm:py-6",
          busy ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-teal-500 hover:bg-emerald-50"
        )}
      >
        <input
          className="sr-only"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={(event) => onPick(event.target.files?.[0] ?? null)}
          disabled={busy}
        />
        <div className="text-center">
          <p className="text-sm font-extrabold text-brand-800">{title}</p>
          <p className="text-xs font-semibold text-slate-500">{subtitle}</p>
        </div>
        {busy ? (
          <Skeleton className="mt-3 h-8 w-8 rounded-full" />
        ) : (
          <FileUp className="mt-3 h-8 w-8 text-brand-500" />
        )}
      </label>
      <div className="space-y-1.5">
        <div className="grid grid-cols-6 gap-1">
          {topRowMonths.map((month) => {
            const checked = detectedMonths.has(month);
            const year = detectedMonths.get(month);
            return (
              <span
                key={`top-${month}`}
                title={checked && year ? `${MONTH_LABELS[month]}-${year}` : undefined}
                className={cn(
                  "inline-flex items-center justify-center rounded-md border px-1 py-1 text-[10px] font-bold tracking-wide sm:text-[11px]",
                  checked
                    ? "border-emerald-500/70 bg-emerald-100 text-emerald-800"
                    : "border-slate-200 bg-slate-100 text-slate-500"
                )}
              >
                {checked ? (
                  <span className="inline-flex items-center justify-center gap-0.5">
                    <Check className="h-2.5 w-2.5 shrink-0" aria-hidden />
                    {MONTH_LABELS[month]}
                    {year ? <span className="opacity-70">&rsquo;{String(year).slice(-2)}</span> : null}
                  </span>
                ) : (
                  MONTH_LABELS[month]
                )}
              </span>
            );
          })}
        </div>
        <div className="grid grid-cols-6 gap-1">
          {bottomRowMonths.map((month) => {
            const checked = detectedMonths.has(month);
            const year = detectedMonths.get(month);
            return (
              <span
                key={`bottom-${month}`}
                title={checked && year ? `${MONTH_LABELS[month]}-${year}` : undefined}
                className={cn(
                  "inline-flex items-center justify-center rounded-md border px-1 py-1 text-[10px] font-bold tracking-wide sm:text-[11px]",
                  checked
                    ? "border-emerald-500/70 bg-emerald-100 text-emerald-800"
                    : "border-slate-200 bg-slate-100 text-slate-500"
                )}
              >
                {checked ? (
                  <span className="inline-flex items-center justify-center gap-0.5">
                    <Check className="h-2.5 w-2.5 shrink-0" aria-hidden />
                    {MONTH_LABELS[month]}
                    {year ? <span className="opacity-70">&rsquo;{String(year).slice(-2)}</span> : null}
                  </span>
                ) : (
                  MONTH_LABELS[month]
                )}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

