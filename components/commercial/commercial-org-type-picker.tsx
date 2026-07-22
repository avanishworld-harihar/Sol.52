"use client";

/**
 * Commercial org-type picker — shown after tapping Commercial in the preset picker.
 * Hotel / Hospital / Factory / Industry / School / … → seeds commercial_executive.
 */

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Cog,
  Factory,
  Heart,
  Milk,
  School,
  ShoppingBag,
  Sparkles,
  Warehouse,
} from "lucide-react";
import { listOrgTypes, type OrgType, type OrgTypeSpec } from "@/lib/org-type-defaults";
import { cn } from "@/lib/utils";

const MODAL_Z = "z-[10050]";

const ICON_MAP: Record<string, React.ElementType> = {
  hotel: Building2,
  hospital: Heart,
  factory: Factory,
  warehouse: Warehouse,
  dairy: Milk,
  school: School,
  mall: ShoppingBag,
  office: Briefcase,
  industry: Cog,
  generic: Building2,
};

type Props = {
  open: boolean;
  onSelect: (orgType: OrgType, defaultKw: number) => void;
  onBack: () => void;
  /** Click outside / Esc — leave builder and return to Proposal OS. */
  onDismiss?: () => void;
};

function OrgTile({
  spec,
  delay,
  onSelect,
}: {
  spec: OrgTypeSpec;
  delay: number;
  onSelect: () => void;
}) {
  const Icon = ICON_MAP[spec.iconName] ?? Building2;
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.22 }}
      onClick={onSelect}
      className={cn(
        "group relative flex flex-col items-start gap-2 rounded-2xl border border-white/20 bg-white/10 p-3.5 text-left",
        "transition hover:border-sky-300/50 hover:bg-white/15",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60"
      )}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-md">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <p className="text-[13px] font-bold leading-tight text-white">{spec.labelEn}</p>
      <p className="line-clamp-2 text-[11px] leading-snug text-slate-400">{spec.descriptionEn}</p>
      <span className="mt-auto rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-sky-200">
        ~{spec.defaultKw} kW typical
      </span>
    </motion.button>
  );
}

export function CommercialOrgTypePicker({ open, onSelect, onBack, onDismiss }: Props) {
  if (!open) return null;
  const specs = listOrgTypes();

  return (
    <AnimatePresence>
      <motion.div
        key="commercial-org-picker-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="commercial-org-picker-title"
        className={`proposal-os-glass-backdrop fixed inset-0 ${MODAL_Z} flex items-end justify-center p-0 sm:items-center sm:p-4`}
        onClick={onDismiss}
        onKeyDown={(e) => {
          if (e.key === "Escape") onDismiss?.();
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="proposal-os-glass-sheet flex max-h-[min(96dvh,100%)] w-full max-w-2xl flex-col rounded-t-3xl sm:max-h-[min(92vh,720px)] sm:rounded-3xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="proposal-os-glass-sheet-inner flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-6 sm:pb-6">
            <div className="mb-5 flex items-start gap-3">
              <button
                type="button"
                onClick={onBack}
                className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/15"
                aria-label="Back"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="min-w-0 flex-1 text-left">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-xs font-semibold text-white">
                  <Sparkles className="h-3 w-3 text-sky-300" />
                  Commercial Executive
                </div>
                <h2
                  id="commercial-org-picker-title"
                  className="text-xl font-bold tracking-tight text-white sm:text-2xl"
                >
                  Business category
                </h2>
                <p className="mt-1.5 text-sm text-slate-400">
                  Hotel, hospital, factory, mill / industry — proposal narrative adapts to your segment.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {specs.map((spec, i) => (
                <OrgTile
                  key={spec.id}
                  spec={spec}
                  delay={i * 0.03}
                  onSelect={() => onSelect(spec.id, spec.defaultKw)}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
