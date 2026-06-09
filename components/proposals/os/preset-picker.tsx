"use client";

/**
 * ProposalPresetPicker — full-screen preset selection overlay.
 *
 * Layout:
 *   - Residential group: 3 cards (Sales Premium / Bank Loan / Executive Premium)
 *     + 1 small "Legacy" option
 *   - Commercial card: 1 card
 *
 * Sales Premium is the default (highlighted) residential option.
 */

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  FileText,
  Home,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import type { ProposalPresetId } from "@/lib/proposal-preset-engine";

export type { ProposalPresetId };

type Props = {
  currentPresetId: ProposalPresetId | null;
  onSelect: (id: ProposalPresetId) => void;
  onSkip: () => void;
};

type PresetCard = {
  id: ProposalPresetId;
  icon: React.ReactNode;
  label: string;
  subtitle: string;
  audience: string;
  sections: string[];
  accentFrom: string;
  accentTo: string;
  borderColor: string;
  ctaClass: string;
  isDefault?: boolean;
};

const RESIDENTIAL_PRESETS: PresetCard[] = [
  {
    id: "residential_sales_premium",
    icon: <Star className="h-6 w-6" />,
    label: "Sales Premium",
    subtitle: "Conversion-first. Savings and ROI lead — system detail follows.",
    audience: "Homeowners · 1–10 kW · ₹5L–₹25L projects",
    sections: [
      "Savings headline & 25-year ROI upfront",
      "Net cost after subsidy, payback period",
      "Technical specs & equipment BOM",
      "AMC & payment schedule",
    ],
    accentFrom: "from-amber-500",
    accentTo: "to-orange-600",
    borderColor: "border-amber-200/70",
    ctaClass:
      "bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700",
    isDefault: true,
  },
  {
    id: "residential_bank_loan",
    icon: <FileText className="h-6 w-6" />,
    label: "Bank Loan Pack",
    subtitle: "Formatted for bank loan submission. Clean documentation style.",
    audience: "Bank & subsidy applications · Any size",
    sections: [
      "Project title & cost summary sheet",
      "Itemised cost breakup",
      "Vendor & product details",
      "Declaration & signature pages",
    ],
    accentFrom: "from-sky-500",
    accentTo: "to-cyan-600",
    borderColor: "border-sky-200/70",
    ctaClass:
      "bg-gradient-to-r from-sky-500 to-cyan-600 text-white hover:from-sky-600 hover:to-cyan-700",
  },
  {
    id: "residential_executive",
    icon: <Sparkles className="h-6 w-6" />,
    label: "Executive Premium",
    subtitle: "Minimalist luxury. Architecture-portfolio feel for premium clients.",
    audience: "Premium homeowners · High-value residential",
    sections: [
      "Clean cover with financials first",
      "Minimal marketing, maximum clarity",
      "Premium typography & whitespace",
      "Selective, high-trust page order",
    ],
    accentFrom: "from-violet-500",
    accentTo: "to-purple-600",
    borderColor: "border-violet-200/70",
    ctaClass:
      "bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700",
  },
];

const COMMERCIAL_PRESET: PresetCard = {
  id: "commercial_executive",
  icon: <Building2 className="h-6 w-6" />,
  label: "Commercial Executive",
  subtitle:
    "Executive-grade C&I proposal with financial intelligence and engineering rationale.",
  audience: "Businesses · Industries · Schools · 10 kW and above",
  sections: [
    "Executive summary with ROI headline",
    "Financial intelligence (NPV / IRR / cashflow)",
    "System design & engineering rationale",
    "Net-metering & DISCOM compliance",
  ],
  accentFrom: "from-slate-600",
  accentTo: "to-slate-800",
  borderColor: "border-slate-300/70",
  ctaClass:
    "bg-gradient-to-r from-slate-600 to-slate-800 text-white hover:from-slate-700 hover:to-slate-900",
};

const MODAL_Z = "z-[10050]";

function PresetCardButton({
  preset,
  isSelected,
  onSelect,
  delay,
}: {
  preset: PresetCard;
  isSelected: boolean;
  onSelect: (id: ProposalPresetId) => void;
  delay: number;
}) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => onSelect(preset.id)}
      className={`proposal-os-glass-card group relative w-full rounded-2xl p-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/50 sm:p-5 ${
        isSelected ? "proposal-os-glass-card--selected ring-2 ring-teal-400/30" : ""
      }`}
    >
      {/* Accent wash */}
      <div
        className={`pointer-events-none absolute inset-0 z-0 rounded-2xl bg-gradient-to-br ${preset.accentFrom} ${preset.accentTo} opacity-0 transition-opacity duration-300 group-hover:opacity-[0.12]`}
        aria-hidden
      />

      {/* Icon + badges */}
      <div className="relative z-[1] mb-3 flex items-start justify-between">
        <div
          className={`inline-flex items-center justify-center rounded-xl bg-gradient-to-br ${preset.accentFrom} ${preset.accentTo} p-2.5 text-white shadow-md`}
        >
          {preset.icon}
        </div>
        <div className="flex items-center gap-1.5">
          {preset.isDefault && (
            <span className="rounded-full border border-amber-400/40 bg-amber-400/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-200">
              Default
            </span>
          )}
          {isSelected && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
        </div>
      </div>

      {/* Title + subtitle */}
      <h3 className="relative z-[1] text-base font-bold text-white">{preset.label}</h3>
      <p className="relative z-[1] mt-1 text-xs leading-relaxed text-slate-300/90">
        {preset.subtitle}
      </p>

      {/* Audience pill */}
      <div className="relative z-[1] mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-slate-200 backdrop-blur-sm">
        <Zap className="h-2.5 w-2.5" aria-hidden />
        {preset.audience}
      </div>

      {/* Sections list */}
      <ul className="relative z-[1] mt-3 space-y-1">
        {preset.sections.map((s) => (
          <li key={s} className="flex items-start gap-2 text-[11px] text-slate-300/85">
            <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
            {s}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div
        className={`relative z-[1] mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-lg transition-all ${preset.ctaClass}`}
      >
        Select
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </div>
    </motion.button>
  );
}

export function ProposalPresetPicker({ currentPresetId, onSelect, onSkip }: Props) {
  return (
    <AnimatePresence>
      <motion.div
        key="preset-picker-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="preset-picker-title"
        className={`proposal-os-glass-backdrop fixed inset-0 ${MODAL_Z} flex items-end justify-center p-0 sm:items-center sm:p-4`}
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="proposal-os-glass-sheet flex max-h-[min(96dvh,100%)] w-full max-w-4xl flex-col rounded-t-3xl sm:max-h-[min(92vh,960px)] sm:rounded-3xl"
        >
          <div className="proposal-os-glass-sheet-inner flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-6 sm:pb-6">
            {/* Header */}
            <div className="mb-5 text-center">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-xs font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] backdrop-blur-md">
                <Sparkles className="h-3 w-3 text-amber-400" />
                SOL.52 Proposal OS
              </div>
              <h2
                id="preset-picker-title"
                className="text-2xl font-bold tracking-tight text-white sm:text-3xl"
              >
                Choose your proposal type
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Select the format that fits your customer. You can change this at any time.
              </p>
            </div>

            {/* Residential group */}
            <div className="mb-4">
              <div className="mb-3 flex items-center gap-2">
                <Home className="h-4 w-4 text-slate-400" aria-hidden />
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Residential
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {RESIDENTIAL_PRESETS.map((preset, i) => (
                  <PresetCardButton
                    key={preset.id}
                    preset={preset}
                    isSelected={currentPresetId === preset.id}
                    onSelect={onSelect}
                    delay={i * 0.06 + 0.08}
                  />
                ))}
              </div>

              {/* Legacy option — small link */}
              <div className="mt-3 text-center">
                <button
                  type="button"
                  onClick={() => onSelect("residential_smart")}
                  className={`text-xs transition-colors ${
                    currentPresetId === "residential_smart"
                      ? "font-semibold text-white underline"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  Use Residential Legacy (classic view)
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="my-2 border-t border-white/10" />

            {/* Commercial group */}
            <div className="mt-3">
              <div className="mb-3 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-400" aria-hidden />
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Commercial &amp; Industrial
                </p>
              </div>
              <div className="max-w-sm">
                <PresetCardButton
                  preset={COMMERCIAL_PRESET}
                  isSelected={currentPresetId === "commercial_executive"}
                  onSelect={onSelect}
                  delay={0.28}
                />
              </div>
            </div>

            {/* Skip */}
            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={onSkip}
                className="text-xs text-slate-500/90 underline-offset-2 transition-colors hover:text-white hover:underline"
              >
                Skip — use Sales Premium (default)
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
