"use client";

import { useToast } from "@/components/ui/toast-center";
import { Button } from "@/components/ui/button";
import { buildProposalEditHref } from "@/lib/proposal-edit-url";
import { buildProposalUrl } from "@/lib/quick-actions";
import {
  getCachedResidentialBrandCatalog,
  INSTALLER_RATE_CARD_UPDATED_EVENT,
  loadInstallerRateCard,
} from "@/lib/installer-rate-card-client";
import { createQuickRequirementProposal, resolveQuickQuotePresetOptions } from "@/lib/quick-requirement-proposal-client";
import { detectConnectionPhaseFromText, type ConnectionPhase } from "@/lib/connection-phase-pricing";
import { proposalHubCustomerLabel } from "@/lib/proposal-customer-placeholder";
import {
  copyPublicProposalLink,
  openWhatsAppWithProposal,
  type ProposalShareMetrics,
} from "@/lib/proposal-share-actions";
import {
  FEATURED_REQUIREMENT_KW,
  formatQuickQuoteInr,
  previewQuickRequirementQuote,
} from "@/lib/requirement-size-presets";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Copy, FileText, MessageCircle, Sparkles, X, Zap } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

export type QuickQuoteLauncherLabels = {
  title: string;
  subtitle: string;
  netLabel: string;
  creating: string;
  createdTitle: string;
  createdSubtitle: string;
  editSend: string;
  copyLink: string;
  whatsapp: string;
  billQuote: string;
  customize: string;
  equipmentHint: string;
  limitError: string;
  createError: string;
};

const DEFAULT_LABELS: QuickQuoteLauncherLabels = {
  title: "Quick quote",
  subtitle: "Tap a size — your rate card, no bill needed",
  netLabel: "Net",
  creating: "Creating…",
  createdTitle: "Proposal ready",
  createdSubtitle: "Update customer name, then share",
  editSend: "Edit & send",
  copyLink: "Copy link",
  whatsapp: "WhatsApp",
  billQuote: "Bill-based quote",
  customize: "Customize equipment",
  equipmentHint: "From your rate card",
  limitError: "Proposal limit reached — upgrade your plan",
  createError: "Could not create proposal",
};

type SuccessState = {
  id: string;
  shareUrl: string;
  systemKw: number;
  netCostInr: number;
  customerName: string;
  phaseSurchargeInr: number;
  phone?: string;
};

export function QuickQuoteLauncher({
  className,
  labels: labelOverrides,
  leadId,
  customerName,
  customerPhone,
  connectionPhaseHint,
  onCreated,
  compact,
}: {
  className?: string;
  labels?: Partial<QuickQuoteLauncherLabels>;
  leadId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  /** Bill OCR or CRM connection type text — auto-applies three-phase when detected. */
  connectionPhaseHint?: string | null;
  onCreated?: (proposalId: string) => void;
  compact?: boolean;
}) {
  const labels = { ...DEFAULT_LABELS, ...labelOverrides };
  const toast = useToast();
  const reduced = useReducedMotion();
  const [catalogTick, setCatalogTick] = useState(0);
  const [busyKw, setBusyKw] = useState<number | null>(null);
  const [success, setSuccess] = useState<SuccessState | null>(null);

  const refreshCatalog = useCallback(() => setCatalogTick((n) => n + 1), []);

  useEffect(() => {
    void loadInstallerRateCard();
    refreshCatalog();
    window.addEventListener(INSTALLER_RATE_CARD_UPDATED_EVENT, refreshCatalog);
    return () => window.removeEventListener(INSTALLER_RATE_CARD_UPDATED_EVENT, refreshCatalog);
  }, [refreshCatalog]);

  const catalog = useMemo(() => {
    void catalogTick;
    return getCachedResidentialBrandCatalog();
  }, [catalogTick]);

  const tiles = useMemo(
    () =>
      FEATURED_REQUIREMENT_KW.map((kw) => ({
        kw,
        preview: previewQuickRequirementQuote(kw, catalog),
      })),
    [catalog]
  );

  const equipmentLine = useMemo(() => {
    const sample = tiles[1] ?? tiles[0];
    if (!sample) return "";
    const phase =
      catalog?.equipmentDefaults?.connectionPhase === "three_phase" ? "3-phase" : null;
    return [sample.preview.panelBrand, `${sample.preview.moduleWatt}W`, phase]
      .filter(Boolean)
      .join(" · ");
  }, [tiles, catalog]);

  const resolvedConnectionPhase = useMemo((): ConnectionPhase | undefined => {
    const detected = detectConnectionPhaseFromText(connectionPhaseHint);
    return detected ?? undefined;
  }, [connectionPhaseHint]);

  const resolvedCustomerName = customerName?.trim() || undefined;

  async function handleCreate(kw: number) {
    if (busyKw != null) return;
    setBusyKw(kw);
    setSuccess(null);
    try {
      const preview = previewQuickRequirementQuote(kw, catalog);
      const result = await createQuickRequirementProposal({
        kw,
        ...(resolvedCustomerName ? { customerName: resolvedCustomerName } : {}),
        ...(leadId?.trim() ? { leadId: leadId.trim() } : {}),
        ...(resolvedConnectionPhase ? { connectionPhase: resolvedConnectionPhase } : {}),
      });
      if (!result.ok || !result.id) {
        if (result.code === "proposal_limit_reached" || result.code === "trial_expired" || result.code === "no_subscription") {
          toast.error(labels.createError, labels.limitError);
        } else {
          toast.error(labels.createError, result.error ?? "");
        }
        return;
      }
      const shareUrl =
        result.shareUrl ??
        (typeof window !== "undefined" ? `${window.location.origin}/proposal/${result.id}` : "");
      setSuccess({
        id: result.id,
        shareUrl,
        systemKw: result.systemKw ?? kw,
        netCostInr: result.netCostInr ?? 0,
        customerName: result.customerName ?? resolvedCustomerName ?? proposalHubCustomerLabel(""),
        phaseSurchargeInr: preview.phaseSurchargeInr,
        phone: customerPhone?.trim() || undefined,
      });
      onCreated?.(result.id);
      toast.success(labels.createdTitle, `${kw} kW · ${formatQuickQuoteInr(result.netCostInr ?? 0)} net`);
    } finally {
      setBusyKw(null);
    }
  }

  function shareMetricsFromSuccess(s: SuccessState): ProposalShareMetrics {
    return {
      customerName: s.customerName,
      systemKw: s.systemKw,
      netCostInr: s.netCostInr,
      annualSavingInr: 0,
      paybackLabel: "—",
      phone: s.phone,
      phaseSurchargeInr: s.phaseSurchargeInr > 0 ? s.phaseSurchargeInr : undefined,
      connectionPhase: s.phaseSurchargeInr > 0 ? "three_phase" : undefined,
    };
  }

  return (
    <section
      className={cn(
        "quick-quote-launcher rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.07] via-white to-slate-50 p-4 shadow-sm dark:from-emerald-950/30 dark:via-[#0f1419] dark:to-[#0a0e12] sm:p-5",
        className
      )}
      aria-label={labels.title}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm dark:bg-emerald-500">
              <Zap className="h-4 w-4" aria-hidden />
            </span>
            <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-lg">
              {labels.title}
            </h2>
          </div>
          <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400 sm:text-sm">
            {labels.subtitle}
          </p>
        </div>
        {!compact ? (
          <Link
            href={buildProposalUrl({
              preset: resolveQuickQuotePresetOptions().presetId,
              inputMode: "bill",
            })}
            className="hidden shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-white/10 dark:hover:text-slate-200 sm:inline-flex"
          >
            <FileText className="h-3.5 w-3.5" aria-hidden />
            {labels.billQuote}
          </Link>
        ) : null}
      </div>

      <div
        className={cn(
          "mt-4 grid gap-2",
          compact ? "grid-cols-3 sm:grid-cols-5" : "grid-cols-2 min-[420px]:grid-cols-3 sm:grid-cols-5"
        )}
      >
        {tiles.map((tile, i) => {
          const busy = busyKw === tile.kw;
          const disabled = busyKw != null && !busy;
          return (
            <motion.button
              key={tile.kw}
              type="button"
              disabled={disabled}
              onClick={() => void handleCreate(tile.kw)}
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              className={cn(
                "group relative flex min-h-[5.25rem] flex-col items-center justify-center rounded-xl border px-2 py-3 text-center transition touch-manipulation",
                "border-slate-200/90 bg-white shadow-sm hover:border-emerald-400/60 hover:shadow-md",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-emerald-500/40",
                busy && "border-emerald-500/50 ring-2 ring-emerald-500/25"
              )}
            >
              <span className="text-lg font-black tabular-nums tracking-tight text-slate-900 dark:text-white">
                {tile.kw}
                <span className="ml-0.5 text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">kW</span>
              </span>
              <span className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {labels.netLabel}
              </span>
              <span className="text-sm font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
                {busy ? "…" : formatQuickQuoteInr(tile.preview.netInr)}
              </span>
            </motion.button>
          );
        })}
      </div>

      {equipmentLine ? (
        <p className="mt-3 text-center text-[11px] font-medium text-slate-500 dark:text-slate-400">
          <Sparkles className="mr-1 inline h-3 w-3 opacity-70" aria-hidden />
          {equipmentLine}
          <span className="mx-1 opacity-40">·</span>
          {labels.equipmentHint}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold">
        <Link
          href="/more/rate-card"
          className="text-slate-500 underline-offset-2 hover:text-emerald-700 hover:underline dark:text-slate-400 dark:hover:text-emerald-300"
        >
          {labels.customize}
        </Link>
        {compact ? (
          <Link
            href={buildProposalUrl({
              preset: resolveQuickQuotePresetOptions().presetId,
              inputMode: "bill",
            })}
            className="text-slate-500 underline-offset-2 hover:text-emerald-700 hover:underline dark:text-slate-400"
          >
            {labels.billQuote}
          </Link>
        ) : null}
      </div>

      {success ? (
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-xl border border-emerald-500/30 bg-white/90 p-3 dark:bg-emerald-950/20 sm:p-4"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-50">{labels.createdTitle}</p>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                {success.systemKw} kW · {formatQuickQuoteInr(success.netCostInr)} · {labels.createdSubtitle}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSuccess(null)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Button
              asChild
              className="h-11 flex-1 gap-2 bg-emerald-600 font-semibold hover:bg-emerald-700"
            >
              <Link
                href={buildProposalEditHref({
                  proposalId: success.id,
                  leadId,
                  inputMode: "requirement",
                })}
              >
                {labels.editSend}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1 gap-2"
              onClick={() => void copyPublicProposalLink(success.id).then(() => toast.success(labels.copyLink, "Ready to paste"))}
            >
              <Copy className="h-4 w-4" aria-hidden />
              {labels.copyLink}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1 gap-2"
              onClick={() => {
                openWhatsAppWithProposal(shareMetricsFromSuccess(success), success.id);
                void copyPublicProposalLink(success.id);
              }}
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              {labels.whatsapp}
            </Button>
          </div>
        </motion.div>
      ) : null}
    </section>
  );
}
