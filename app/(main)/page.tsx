"use client";

import { DashboardCommandCenter } from "@/components/dashboard-command-center";
import { CrmCommandCenter } from "@/components/crm/crm-command-center";
import { DashboardOperationalInsights } from "@/components/dashboard-operational-insights";
import { DashboardQuickActions } from "@/components/dashboard-quick-actions";
import { DashboardFollowupWidgets } from "@/components/dashboard-followup-widgets";
import { duplicateSheetExtrasFromT, quickQuoteLabelsFromT } from "@/lib/proposal-hub-i18n";
import { QuickQuoteLauncher } from "@/components/proposals/quick-quote-launcher";
import { DashboardSectionTitle } from "@/components/dashboard-section-title";
import { DashboardCustomizeMenu } from "@/components/dashboard-customize-menu";
import { OfflineDataNotice } from "@/components/offline-data-notice";
import { GlassProjectCard, type GlassProjectSummary } from "@/components/glass-project-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FloatingLabelSelect } from "@/components/ui/floating-label-input";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import useSWR from "swr";
import {
  DASHBOARD_STATS_SWR_KEY,
  fetchDashboardStats,
  getDashboardCacheAgeMs,
  readDashboardStatsCache,
  writeDashboardStatsCache,
  type DashboardStatsPayload
} from "@/lib/dashboard-stats-client";
import { useInstallerDiscoms } from "@/hooks/use-installer-discoms";
import {
  PROPOSAL_BRANDING_UPDATED_EVENT,
  readProposalBrandingSettings,
} from "@/lib/proposal-branding-settings";
import { INDIAN_STATES_AND_UTS } from "@/lib/indian-states-uts";
import {
  INSTALLER_DISCOM_KEY,
  INSTALLER_REGION_EVENT,
  INSTALLER_STATE_KEY,
  mergeSavedDiscomOption,
  readInstallerRegion,
  resolveDiscomCode,
  writeInstallerRegion
} from "@/lib/installer-region-storage";
import { detectInstallerLocation, inferDiscomForLocation, type DetectedInstallerLocation } from "@/lib/installer-location";
import { AlertTriangle, ArrowRight, ChevronDown, Loader2, LocateFixed, MapPin, Wallet, X } from "lucide-react";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { buildMetricTrendLines, writeTrendBaseline, type MetricTrendLines } from "@/lib/dashboard-trends";
import { useLanguage } from "@/lib/language-context";
import {
  DEFAULT_DASHBOARD_LAYOUT,
  readDashboardLayout,
  writeDashboardLayout,
  type DashboardLayoutPreferences,
  type DashboardSectionId,
} from "@/lib/dashboard-layout-preferences";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";

const dashboardStagger = {
  visible: { opacity: 1 },
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.09,
      delayChildren: 0.04
    }
  }
} as const;

const dashboardItem = {
  visible: { opacity: 1, y: 0 },
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.42,
      ease: "easeOut"
    }
  }
} as const;

const INSTALLER_SETUP_DISMISSED_KEY = "sol52.dashboard.installer-setup-dismissed";

function DashboardStaggerRoot({ animate, children }: { animate: boolean; children: ReactNode }) {
  if (!animate) return <div className="flex flex-col gap-4 sm:gap-5">{children}</div>;
  return (
    <motion.div initial="hidden" animate="show" variants={dashboardStagger} className="flex flex-col gap-4 sm:gap-5">
      {children}
    </motion.div>
  );
}

function DashboardItem({
  animate,
  children,
  as = "div",
  className,
  style,
  "aria-live": ariaLive
}: {
  animate: boolean;
  children: ReactNode;
  as?: "div" | "p";
  className?: string;
  style?: CSSProperties;
  "aria-live"?: "polite" | "assertive" | "off";
}) {
  if (!animate) {
    if (as === "p") {
      return (
        <p className={className} style={style} aria-live={ariaLive}>
          {children}
        </p>
      );
    }
    return <div className={className} style={style}>{children}</div>;
  }
  if (as === "p") {
    return (
      <motion.p layout variants={dashboardItem} className={className} style={style} aria-live={ariaLive}>
        {children}
      </motion.p>
    );
  }
  return (
    <motion.div layout variants={dashboardItem} className={className} style={style}>
      {children}
    </motion.div>
  );
}

function DashboardPageContent() {
  const { t, locale } = useLanguage();
  const online = useOnlineStatus();
  const prefersReducedMotion = useReducedMotion();
  const [installerState, setInstallerState] = useState("");
  const [installerDiscom, setInstallerDiscom] = useState("");
  const [installerSaved, setInstallerSaved] = useState(false);
  const [installerSetupDismissed, setInstallerSetupDismissed] = useState(false);
  const [installerSetupExpanded, setInstallerSetupExpanded] = useState(false);
  const [regionHydrated, setRegionHydrated] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<DetectedInstallerLocation | null>(null);
  const [locationPhase, setLocationPhase] = useState<"idle" | "locating" | "resolving" | "confirm" | "error">("idle");
  const [locationMessage, setLocationMessage] = useState("");
  const autoLocationAttempted = useRef(false);
  const [greetingName, setGreetingName] = useState("");
  const { options: discomOptions, loading: discomListLoading } = useInstallerDiscoms(installerState);
  const discomSelectOptions = useMemo(
    () => mergeSavedDiscomOption(installerDiscom, discomOptions),
    [installerDiscom, discomOptions]
  );
  const [metricTrends, setMetricTrends] = useState<MetricTrendLines | null>(null);
  /** Only true "finger-first" pointers skip stagger — keeps entrance motion on mouse / hybrid laptops. */
  const [isPointerCoarse, setIsPointerCoarse] = useState(false);
  const [layoutPreferences, setLayoutPreferences] = useState<DashboardLayoutPreferences>(DEFAULT_DASHBOARD_LAYOUT);
  const [layoutHydrated, setLayoutHydrated] = useState(false);

  useEffect(() => {
    setLayoutPreferences(readDashboardLayout());
    setLayoutHydrated(true);
  }, []);

  const updateLayoutPreferences = useCallback((next: DashboardLayoutPreferences) => {
    setLayoutPreferences(next);
    writeDashboardLayout(next);
  }, []);

  const sectionVisible = useCallback(
    (id: DashboardSectionId) => !layoutPreferences.hidden.includes(id),
    [layoutPreferences.hidden]
  );
  const sectionOrder = useCallback(
    (id: DashboardSectionId) => layoutPreferences.order.indexOf(id),
    [layoutPreferences.order]
  );

  const detectRegionFromDevice = useCallback(async () => {
    setLocationPhase("locating");
    setLocationMessage("Location permission allow karein…");
    try {
      const location = await detectInstallerLocation();
      setDetectedLocation(location);
      setInstallerState(location.state);
      setInstallerDiscom("");
      setLocationPhase("resolving");
      setLocationMessage(`${location.city || location.district || location.state} mila. DISCOM detect ho raha hai…`);
    } catch (error) {
      const code = typeof error === "object" && error && "code" in error ? Number(error.code) : 0;
      setLocationPhase("error");
      setLocationMessage(
        code === 1
          ? "Location permission denied. Neeche state aur DISCOM manually select kar sakte hain."
          : error instanceof Error
            ? error.message
            : "Location detect nahi hui. Region manually select karein."
      );
    }
  }, []);

  useEffect(() => {
    const { state, discom } = readInstallerRegion();
    setInstallerState(state);
    setInstallerDiscom(discom);
    setInstallerSaved(Boolean(state && discom));
    try {
      setInstallerSetupDismissed(localStorage.getItem(INSTALLER_SETUP_DISMISSED_KEY) === "1");
    } catch {
      setInstallerSetupDismissed(false);
    }
    setRegionHydrated(true);
  }, []);

  /** Already-granted permission can restore the region without another prompt. */
  useEffect(() => {
    if (!regionHydrated || installerSaved || autoLocationAttempted.current) return;
    autoLocationAttempted.current = true;
    if (typeof navigator === "undefined" || !navigator.permissions?.query) return;
    void navigator.permissions.query({ name: "geolocation" }).then((permission) => {
      if (permission.state === "granted") void detectRegionFromDevice();
    }).catch(() => undefined);
  }, [detectRegionFromDevice, installerSaved, regionHydrated]);

  /** Greeting name from company profile (contact person → company name). Never hardcoded. */
  useEffect(() => {
    const syncName = () => {
      const s = readProposalBrandingSettings();
      const person = s.companyProfile?.contactPerson?.trim() ?? "";
      const company = s.installerName?.trim() ?? "";
      const resolved = person || (company && company !== "Harihar Solar" ? company : "");
      setGreetingName(resolved);
    };
    syncName();
    window.addEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, syncName);
    return () => window.removeEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, syncName);
  }, []);

  /** More / Customers se region save hone par dashboard turant sync ho. */
  useEffect(() => {
    const sync = () => {
      const { state, discom } = readInstallerRegion();
      setInstallerState(state);
      setInstallerDiscom(discom);
      setInstallerSaved(Boolean(state && discom));
      setRegionHydrated(true);
    };
    window.addEventListener(INSTALLER_REGION_EVENT, sync);
    return () => window.removeEventListener(INSTALLER_REGION_EVENT, sync);
  }, []);

  useEffect(() => {
    if (!installerState.trim()) {
      setInstallerDiscom("");
      return;
    }
    if (discomOptions.length === 0 || detectedLocation) return;
    setInstallerDiscom((prev) => resolveDiscomCode(prev.trim(), discomOptions));
  }, [detectedLocation, installerState, discomOptions]);

  useEffect(() => {
    if (!detectedLocation || discomListLoading || discomOptions.length === 0) return;
    const detectedDiscom = inferDiscomForLocation(detectedLocation, discomOptions);
    if (detectedDiscom) {
      setInstallerDiscom(detectedDiscom);
      writeInstallerRegion(detectedLocation.state, detectedDiscom);
      setInstallerSaved(true);
      setLocationPhase("idle");
      setLocationMessage("");
      setDetectedLocation(null);
      return;
    }
    setLocationPhase("confirm");
    setLocationMessage(`${detectedLocation.state} detect hua. Is area ka DISCOM confirm karein.`);
    setDetectedLocation(null);
  }, [detectedLocation, discomListLoading, discomOptions]);

  /** Purane installs: LS me state thi, DISCOM key nahi — seed sirf tab jab UI state LS se match ho. */
  useEffect(() => {
    if (!installerState.trim() || discomOptions.length === 0) return;
    let stateInLs = "";
    let discomInLs = "";
    try {
      stateInLs = localStorage.getItem(INSTALLER_STATE_KEY)?.trim() ?? "";
      discomInLs = localStorage.getItem(INSTALLER_DISCOM_KEY)?.trim() ?? "";
    } catch {
      /* ignore */
    }
    if (!stateInLs || discomInLs) return;
    if (installerState.trim() !== stateInLs) return;
    const next = resolveDiscomCode("", discomOptions);
    if (next) writeInstallerRegion(stateInLs, next);
  }, [installerState, discomOptions]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(pointer: coarse)");
    const sync = () => setIsPointerCoarse(mq.matches);
    sync();
    mq.addEventListener?.("change", sync);
    return () => mq.removeEventListener?.("change", sync);
  }, []);

  const { data, error, isLoading, isValidating, mutate } = useSWR<DashboardStatsPayload>(
    DASHBOARD_STATS_SWR_KEY,
    fetchDashboardStats,
    {
      dedupingInterval: 30_000,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      keepPreviousData: true,
      onSuccess: (payload) => writeDashboardStatsCache(payload)
    }
  );

  useLayoutEffect(() => {
    const boot = readDashboardStatsCache();
    if (boot) void mutate(boot, { revalidate: false });
  }, [mutate]);

  const showMetricSkeleton = isLoading && data === undefined && !error;
  const stats = data;
  const projectSummaries = useMemo(
    (): GlassProjectSummary[] => stats?.recentProjects ?? [],
    [stats?.recentProjects]
  );
  /** Money + blockers surfaced right under the command hero (max 2 projects). */
  const attentionProjects = useMemo(() => {
    const staleMs = 3 * 86_400_000;
    const isStale = (iso?: string | null) => {
      if (!iso) return false;
      const ts = Date.parse(iso);
      return !Number.isNaN(ts) && Date.now() - ts > staleMs;
    };
    return (stats?.recentProjects ?? [])
      .filter((p) => p.status !== "done")
      .map((p) => ({ project: p, stale: isStale(p.updatedAt) }))
      .sort((a, b) => {
        if (a.stale !== b.stale) return a.stale ? -1 : 1;
        if (a.project.status !== b.project.status) return a.project.status === "pending" ? -1 : 1;
        return (a.project.installProgress ?? 0) - (b.project.installProgress ?? 0);
      })
      .slice(0, 2);
  }, [stats?.recentProjects]);
  const shouldAnimateDashboard = !prefersReducedMotion && !isPointerCoarse;

  useEffect(() => {
    if (!stats) {
      setMetricTrends(null);
      return;
    }
    setMetricTrends(buildMetricTrendLines(stats, locale));
    writeTrendBaseline(stats);
  }, [stats, locale]);

  function saveInstallerState() {
    if (!installerState.trim() || !installerDiscom.trim()) return;
    try {
      writeInstallerRegion(installerState, installerDiscom);
      setInstallerSaved(true);
      setLocationPhase("idle");
      setLocationMessage("");
    } catch {
      setInstallerSaved(false);
    }
  }

  function dismissInstallerSetup() {
    setInstallerSetupDismissed(true);
    try {
      localStorage.setItem(INSTALLER_SETUP_DISMISSED_KEY, "1");
    } catch {
      /* private mode */
    }
  }

  return (
    <div className="workspace-dashboard" data-dashboard-density={layoutPreferences.density} data-layout-ready={layoutHydrated ? "true" : "false"}>
    <DashboardStaggerRoot animate={shouldAnimateDashboard}>
        <DashboardItem animate={shouldAnimateDashboard} className="dashboard-zone-greeting" style={{ order: -20 }}>
          <DashboardCommandCenter name={greetingName} stats={stats} loading={showMetricSkeleton} />
        </DashboardItem>

        <DashboardItem animate={shouldAnimateDashboard} className="dashboard-customize-zone" style={{ order: -10 }}>
          <DashboardCustomizeMenu value={layoutPreferences} onChange={updateLayoutPreferences} />
        </DashboardItem>

        {sectionVisible("priorities") ? <DashboardItem animate={shouldAnimateDashboard} className="dashboard-zone-command cc-hero-zone" style={{ order: sectionOrder("priorities") }}>
          <CrmCommandCenter compact />
        </DashboardItem> : null}

        {sectionVisible("agenda") ? <DashboardItem animate={shouldAnimateDashboard} className="dashboard-zone-agenda" style={{ order: sectionOrder("agenda") }}>
          <DashboardFollowupWidgets />
        </DashboardItem> : null}

        {sectionVisible("attention") && stats && (stats.pendingPayments > 0 || attentionProjects.length > 0) && (
          <DashboardItem animate={shouldAnimateDashboard} className="dashboard-zone-attention" style={{ order: sectionOrder("attention") }}>
            <DashboardSectionTitle tier="quiet">Needs attention</DashboardSectionTitle>
            <div className="mt-1.5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {stats.pendingPayments > 0 && (
                <Link
                  href="/projects"
                  className="group flex items-center gap-3 rounded-2xl border border-rose-200/80 bg-rose-50/70 p-3.5 backdrop-blur-sm transition hover:border-rose-300 hover:bg-rose-100/70 dark:border-rose-500/30 dark:bg-rose-950/25 sm:p-4"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300" aria-hidden>
                    <Wallet className="h-5 w-5" strokeWidth={2.25} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-extrabold uppercase tracking-[0.14em] text-rose-600/90 dark:text-rose-300/90">
                      Collections due
                    </span>
                    <span className="mt-0.5 block truncate text-lg font-black tabular-nums text-rose-800 dark:text-rose-200">
                      ₹{Math.round(stats.pendingPayments).toLocaleString("en-IN")}
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-rose-500 transition-transform group-hover:translate-x-0.5 dark:text-rose-300" aria-hidden />
                </Link>
              )}
              {attentionProjects.map(({ project, stale }) => (
                <Link
                  key={project.id}
                  href={`/projects/${encodeURIComponent(project.id)}`}
                  className="group flex items-center gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-3.5 backdrop-blur-sm transition hover:border-amber-300 hover:bg-amber-100/70 dark:border-amber-500/30 dark:bg-amber-950/20 sm:p-4"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200" aria-hidden>
                    <AlertTriangle className="h-5 w-5" strokeWidth={2.25} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-extrabold text-slate-900 dark:text-white">{project.name}</span>
                      <span className="shrink-0 rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-800 dark:bg-amber-950/60 dark:text-amber-200">
                        {stale ? "Stale" : project.status === "pending" ? "Pending" : "Active"}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] font-medium text-slate-600 dark:text-[#8B949E]">
                      {project.nextAction?.trim() || `${Math.round(project.installProgress)}% complete · ${project.capacityKw}`}
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-amber-500 transition-transform group-hover:translate-x-0.5 dark:text-amber-300" aria-hidden />
                </Link>
              ))}
            </div>
          </DashboardItem>
        )}

        <DashboardItem animate={shouldAnimateDashboard} style={{ order: 20 }}>
          <OfflineDataNotice
            show={!online && data !== undefined}
            cacheAgeMs={getDashboardCacheAgeMs()}
            label={t("offline_dashboardStrip")}
          />
        </DashboardItem>

        {error && data === undefined && (
          <DashboardItem animate={shouldAnimateDashboard} style={{ order: 21 }}>
            <Card className="border-amber-200/90 bg-amber-50/90 backdrop-blur-sm">
              <CardContent className="p-4 text-sm font-semibold leading-snug text-amber-950">
                {(error as Error).message ?? t("dashboard_errorLoad")} {t("dashboard_errorConnect")}
              </CardContent>
            </Card>
          </DashboardItem>
        )}

        {regionHydrated && !installerSaved && !installerSetupDismissed && (
          <DashboardItem animate={shouldAnimateDashboard} style={{ order: 22 }}>
            <Card className="overflow-hidden border-teal-200/80 bg-gradient-to-r from-white via-teal-50/65 to-cyan-50/60 shadow-sm dark:border-teal-500/25 dark:from-[#0c1017] dark:via-teal-950/20 dark:to-cyan-950/15">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-md shadow-teal-600/20" aria-hidden><MapPin className="h-4 w-4" strokeWidth={2.25} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><p className="truncate text-sm font-extrabold text-slate-950 dark:text-white">Finish installer setup</p><span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-amber-800 dark:bg-amber-500/15 dark:text-amber-200">1 step left</span></div>
                    <p className="mt-0.5 truncate text-xs font-medium text-slate-500 dark:text-slate-400">Set your state and DISCOM for accurate billing defaults.</p>
                    <div className="mt-2 h-1.5 max-w-48 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10"><span className="block h-full w-1/2 rounded-full bg-teal-500" /></div>
                  </div>
                  <button type="button" onClick={() => setInstallerSetupExpanded((value) => !value)} className="hidden min-h-10 items-center gap-1.5 rounded-xl bg-slate-950 px-3 text-xs font-extrabold text-white transition hover:bg-teal-700 sm:inline-flex dark:bg-white dark:text-slate-950" aria-expanded={installerSetupExpanded}>Complete setup <ChevronDown className={`h-4 w-4 transition-transform ${installerSetupExpanded ? "rotate-180" : ""}`} /></button>
                  <button type="button" onClick={dismissInstallerSetup} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/80 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white" aria-label="Dismiss installer setup"><X className="h-4 w-4" /></button>
                </div>
                <button type="button" onClick={() => setInstallerSetupExpanded((value) => !value)} className="mt-3 flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-slate-950 px-3 text-xs font-extrabold text-white sm:hidden dark:bg-white dark:text-slate-950" aria-expanded={installerSetupExpanded}>Complete setup <ChevronDown className={`h-4 w-4 transition-transform ${installerSetupExpanded ? "rotate-180" : ""}`} /></button>
                {installerSetupExpanded ? <div className="mt-4 space-y-3 border-t border-teal-200/70 pt-4 dark:border-white/10">
                <div className="rounded-2xl border border-teal-200/80 bg-teal-50/70 p-3 dark:border-teal-500/25 dark:bg-teal-950/20">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-teal-950 dark:text-teal-100">Location se setup karein</p>
                      <p className="mt-0.5 text-xs font-medium leading-relaxed text-teal-800/80 dark:text-teal-200/70">Mobile ya iPad par Allow tap karte hi state aur supported area ka DISCOM fill ho jayega.</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 shrink-0 gap-2 border-teal-300 bg-white font-bold text-teal-800 hover:bg-teal-100 dark:border-teal-500/40 dark:bg-slate-900 dark:text-teal-200"
                      disabled={locationPhase === "locating" || locationPhase === "resolving"}
                      onClick={() => void detectRegionFromDevice()}
                    >
                      {locationPhase === "locating" || locationPhase === "resolving" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <LocateFixed className="h-4 w-4" aria-hidden />}
                      {locationPhase === "locating" ? "Finding location…" : locationPhase === "resolving" ? "Finding DISCOM…" : "Use my location"}
                    </Button>
                  </div>
                  {locationMessage ? <p className={`mt-2 text-xs font-semibold ${locationPhase === "error" ? "text-rose-700 dark:text-rose-300" : "text-teal-800 dark:text-teal-200"}`} role="status">{locationMessage}</p> : null}
                </div>
                <div className="flex flex-col gap-2 md:flex-row md:flex-nowrap md:items-center md:gap-3">
                  <FloatingLabelSelect
                    label={t("dashboard_selectState")}
                    suppressHydrationWarning
                    value={installerState}
                    onChange={(e) => setInstallerState(e.target.value)}
                    className="h-12"
                    containerClassName="md:flex-1"
                  >
                    <option value="">{t("dashboard_selectState")}</option>
                    {INDIAN_STATES_AND_UTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </FloatingLabelSelect>
                  <FloatingLabelSelect
                    label={t("dashboard_selectDiscom")}
                    suppressHydrationWarning
                    value={installerDiscom}
                    disabled={!installerState.trim()}
                    onChange={(e) => setInstallerDiscom(e.target.value)}
                    className="h-12 disabled:opacity-60"
                    containerClassName="md:flex-1"
                    aria-label={t("dashboard_selectDiscom")}
                  >
                    {!installerState.trim() ? (
                      <option value="">{t("dashboard_selectDiscom")}</option>
                    ) : discomListLoading && discomSelectOptions.length === 0 ? (
                      <option value="">{t("dashboard_loadingDiscoms")}</option>
                    ) : (
                      <>
                        <option value="">{t("dashboard_selectDiscom")}</option>
                        {discomSelectOptions.map((d) => (
                          <option key={d.id} value={d.code}>
                            {d.name} ({d.code})
                          </option>
                        ))}
                      </>
                    )}
                  </FloatingLabelSelect>
                  <Button
                    type="button"
                    variant="emeraldCta"
                    size="lg"
                    className="h-12 w-full min-w-0 shrink-0 md:min-w-[7rem] md:flex-1"
                    disabled={!installerState.trim() || !installerDiscom.trim()}
                    onClick={saveInstallerState}
                  >
                    {t("actions_save")}
                  </Button>
                </div>
                </div> : null}
              </CardContent>
            </Card>
          </DashboardItem>
        )}

        {regionHydrated && installerSaved && (
          <DashboardItem animate={shouldAnimateDashboard} style={{ order: 23 }}>
            <Link
              href="/more"
              className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-solar-200/80 bg-solar-50/80 px-3 py-1.5 text-xs font-semibold text-solar-800 backdrop-blur-sm transition hover:border-solar-300 hover:bg-solar-100/80 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
            >
              <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} aria-hidden />
              <span className="truncate">
                {installerState}
                {installerDiscom.trim() ? ` · ${installerDiscom}` : ""}
              </span>
              <span className="shrink-0 text-solar-500 dark:text-emerald-300/80">· Edit</span>
            </Link>
          </DashboardItem>
        )}

        {isValidating && data !== undefined && (
          <DashboardItem
            animate={shouldAnimateDashboard}
            as="p"
            className="text-center text-[10px] font-semibold text-indigo-500/90 dark:text-muted-foreground sm:text-xs"
            aria-live="polite"
            style={{ order: 24 }}
          >
            {t("actions_refreshing")}
          </DashboardItem>
        )}

        {sectionVisible("insights") ? <DashboardItem animate={shouldAnimateDashboard} className="dashboard-zone-insights" style={{ order: sectionOrder("insights") }}>
          <div className="ws-zone-surface">
            <DashboardSectionTitle>{t("dashboard_operationalInsights")}</DashboardSectionTitle>
            <DashboardOperationalInsights stats={stats} trends={metricTrends} loading={showMetricSkeleton} />
          </div>
        </DashboardItem> : null}

        {sectionVisible("projects") ? <DashboardItem animate={shouldAnimateDashboard} className="dashboard-zone-secondary" style={{ order: sectionOrder("projects") }}>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <DashboardSectionTitle tier="quiet">{t("dashboard_projectActivity")}</DashboardSectionTitle>
            <Link
              href="/projects?view=hidden"
              className="shrink-0 text-[11px] font-bold uppercase tracking-wide text-indigo-600 underline-offset-4 hover:underline dark:text-indigo-300 sm:text-xs"
            >
              Manage visibility →
            </Link>
          </div>
          {projectSummaries.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 md:gap-5 lg:grid-cols-3 lg:gap-6">
              {projectSummaries.map((project) => (
                <GlassProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <Card className="glass-surface border-white/55">
              <CardContent className="p-4 text-sm font-semibold text-slate-700">No active projects yet.</CardContent>
            </Card>
          )}
        </DashboardItem> : null}

        {sectionVisible("quick-actions") ? <DashboardItem animate={shouldAnimateDashboard} className="dashboard-zone-tertiary" style={{ order: sectionOrder("quick-actions") }}>
          <QuickQuoteLauncher
            className="mb-4"
            labels={quickQuoteLabelsFromT(t)}
          />
          <div className="glass-panel-premium p-4 sm:p-5 md:p-6">
            <DashboardSectionTitle tier="quiet">{t("dashboard_quickActions")}</DashboardSectionTitle>
            <p className="mb-4 -mt-1 text-xs font-medium text-slate-500 dark:text-[#8B949E] sm:text-sm">
              {t("dashboard_quickActionsSub")}
            </p>
            <DashboardQuickActions />
          </div>
        </DashboardItem> : null}
      </DashboardStaggerRoot>
    </div>
  );
}

export default DashboardPageContent;
