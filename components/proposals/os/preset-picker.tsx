"use client";

/**
 * ProposalPresetPicker — choose project category only (Residential vs Commercial).
 * Residential template (Sales Premium / Bank Loan / Executive) is set in More → Proposal templates.
 */

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Building2, Home, Sparkles } from "lucide-react";
import Link from "next/link";
import {
  labelForCommercialTemplate,
  labelForResidentialTemplate,
  readDefaultCommercialPreset,
  readDefaultResidentialPreset,
} from "@/lib/proposal-default-preset-storage";

type Props = {
  onSelectResidential: () => void;
  onSelectCommercial: () => void;
  onSkip: () => void;
};

const MODAL_Z = "z-[10050]";

type CategoryCard = {
  id: "residential" | "commercial";
  icon: React.ReactNode;
  label: string;
  subtitle: string;
  detail: string;
  accentFrom: string;
  accentTo: string;
  ctaClass: string;
  onSelect: () => void;
};

function CategoryCardButton({ card, delay }: { card: CategoryCard; delay: number }) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      onClick={card.onSelect}
      className="proposal-os-glass-card group relative w-full rounded-2xl p-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/50 sm:p-6"
    >
      <div
        className={`pointer-events-none absolute inset-0 z-0 rounded-2xl bg-gradient-to-br ${card.accentFrom} ${card.accentTo} opacity-0 transition-opacity duration-300 group-hover:opacity-[0.12]`}
        aria-hidden
      />
      <div
        className={`relative z-[1] mb-4 inline-flex items-center justify-center rounded-xl bg-gradient-to-br ${card.accentFrom} ${card.accentTo} p-3 text-white shadow-md`}
      >
        {card.icon}
      </div>
      <h3 className="relative z-[1] text-lg font-bold text-white sm:text-xl">{card.label}</h3>
      <p className="relative z-[1] mt-2 text-sm text-slate-300/90">{card.subtitle}</p>
      <p className="relative z-[1] mt-2 text-[11px] text-slate-400">{card.detail}</p>
      <div
        className={`relative z-[1] mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-lg transition-all ${card.ctaClass}`}
      >
        Continue
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </div>
    </motion.button>
  );
}

export function ProposalPresetPicker({ onSelectResidential, onSelectCommercial, onSkip }: Props) {
  const defaultResidentialLabel = labelForResidentialTemplate(readDefaultResidentialPreset());
  const defaultCommercialLabel = labelForCommercialTemplate(readDefaultCommercialPreset());

  const cards: CategoryCard[] = [
    {
      id: "residential",
      icon: <Home className="h-7 w-7" />,
      label: "Residential",
      subtitle: "Homes and apartments up to ~10 kW.",
      detail: `Template: ${defaultResidentialLabel} · More → Proposal templates`,
      accentFrom: "from-amber-500",
      accentTo: "to-orange-600",
      ctaClass:
        "bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700",
      onSelect: onSelectResidential,
    },
    {
      id: "commercial",
      icon: <Building2 className="h-7 w-7" />,
      label: "Commercial",
      subtitle: "Businesses and industrial sites.",
      detail: `Template: ${defaultCommercialLabel} · More → Proposal templates`,
      accentFrom: "from-slate-600",
      accentTo: "to-slate-800",
      ctaClass:
        "bg-gradient-to-r from-slate-600 to-slate-800 text-white hover:from-slate-700 hover:to-slate-900",
      onSelect: onSelectCommercial,
    },
  ];

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
          className="proposal-os-glass-sheet flex max-h-[min(96dvh,100%)] w-full max-w-2xl flex-col rounded-t-3xl sm:max-h-[min(92vh,720px)] sm:rounded-3xl"
        >
          <div className="proposal-os-glass-sheet-inner flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-6 sm:pb-6">
            <div className="mb-6 text-center">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-xs font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] backdrop-blur-md">
                <Sparkles className="h-3 w-3 text-amber-400" />
                SOL.52 Proposal OS
              </div>
              <h2
                id="preset-picker-title"
                className="text-2xl font-bold tracking-tight text-white sm:text-3xl"
              >
                New proposal
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Choose residential or commercial. Your residential template is saved in More.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {cards.map((card, i) => (
                <CategoryCardButton key={card.id} card={card} delay={i * 0.08 + 0.08} />
              ))}
            </div>

            <div className="mt-6 space-y-3 text-center">
              <Link
                href="/more#more-section-proposal-templates"
                className="inline-flex text-xs font-semibold text-teal-300/90 underline-offset-2 transition-colors hover:text-teal-200 hover:underline"
              >
                Manage residential templates in More →
              </Link>
              <div>
                <button
                  type="button"
                  onClick={onSkip}
                  className="text-xs text-slate-500/90 underline-offset-2 transition-colors hover:text-white hover:underline"
                >
                  Skip — use residential ({defaultResidentialLabel})
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
