"use client";

import { ProposalTemplateThumbnail } from "@/components/settings/proposal-template-thumbnail";
import { cn } from "@/lib/utils";
import {
  PROPOSAL_DEFAULT_PRESET_UPDATED_EVENT,
  readDefaultResidentialPreset,
  writeDefaultResidentialPreset,
  type ResidentialTemplatePresetId,
} from "@/lib/proposal-default-preset-storage";
import {
  PROPOSAL_TEMPLATE_CATEGORIES,
  galleryForCategory,
  resolveActiveGalleryKey,
  type ProposalTemplateCategory,
  type ProposalTemplateGalleryItem,
  type ProposalTemplateGalleryKey,
} from "@/lib/proposal-template-gallery";
import {
  readDefaultSalesPremiumStyle,
  SALES_PREMIUM_STYLE_UPDATED_EVENT,
  writeDefaultSalesPremiumStyle,
} from "@/lib/sales-premium-styles";
import { Check, Eye, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Props = {
  markSaved: (message: string) => void;
};

const TAB_STORAGE_KEY = "ss_proposal_template_tab_v1";

function readInitialTab(): ProposalTemplateCategory {
  if (typeof window === "undefined") return "residential";
  try {
    const raw = sessionStorage.getItem(TAB_STORAGE_KEY);
    if (raw === "commercial" || raw === "residential") return raw;
  } catch {
    /* ignore */
  }
  return "residential";
}

export function ProposalTemplateGallery({ markSaved }: Props) {
  const [category, setCategory] = useState<ProposalTemplateCategory>("residential");
  const [activeKey, setActiveKey] = useState<ProposalTemplateGalleryKey>(() =>
    resolveActiveGalleryKey(readDefaultResidentialPreset(), readDefaultSalesPremiumStyle())
  );
  const [previewItem, setPreviewItem] = useState<ProposalTemplateGalleryItem | null>(null);

  const items = galleryForCategory(category);
  const residentialCount = galleryForCategory("residential").length;
  const commercialCount = galleryForCategory("commercial").length;

  const sync = useCallback(() => {
    setActiveKey(
      resolveActiveGalleryKey(readDefaultResidentialPreset(), readDefaultSalesPremiumStyle())
    );
  }, []);

  useEffect(() => {
    setCategory(readInitialTab());
    sync();
    window.addEventListener(PROPOSAL_DEFAULT_PRESET_UPDATED_EVENT, sync);
    window.addEventListener(SALES_PREMIUM_STYLE_UPDATED_EVENT, sync);
    return () => {
      window.removeEventListener(PROPOSAL_DEFAULT_PRESET_UPDATED_EVENT, sync);
      window.removeEventListener(SALES_PREMIUM_STYLE_UPDATED_EVENT, sync);
    };
  }, [sync]);

  useEffect(() => {
    if (!previewItem) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPreviewItem(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewItem]);

  function switchCategory(next: ProposalTemplateCategory) {
    setCategory(next);
    try {
      sessionStorage.setItem(TAB_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }

  function choose(item: ProposalTemplateGalleryItem) {
    if (item.category === "commercial") {
      markSaved("Commercial proposals use the Commercial Executive deck — no change needed.");
      return;
    }
    const presetId = item.presetId as ResidentialTemplatePresetId;
    writeDefaultResidentialPreset(presetId);
    if (item.salesPremiumStyle) {
      writeDefaultSalesPremiumStyle(item.salesPremiumStyle);
    }
    setActiveKey(item.key);
    markSaved(`Default residential theme set to ${item.name}. New proposals will use this format.`);
  }

  function selectFromPreview() {
    if (!previewItem) return;
    choose(previewItem);
    setPreviewItem(null);
  }

  const activeCategoryMeta = PROPOSAL_TEMPLATE_CATEGORIES.find((c) => c.id === category)!;

  return (
    <>
      <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-50/80 p-1 dark:border-white/10 dark:bg-white/[0.04]">
        {PROPOSAL_TEMPLATE_CATEGORIES.map((cat) => {
          const active = category === cat.id;
          const count = cat.id === "residential" ? residentialCount : commercialCount;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => switchCategory(cat.id)}
              className={cn(
                "rounded-lg px-4 py-2 text-xs font-bold transition",
                active
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              )}
            >
              {cat.label}
              <span className="ml-1.5 font-semibold text-slate-400">({count})</span>
            </button>
          );
        })}
      </div>

      <p className="text-[11px] leading-snug text-slate-600 dark:text-slate-400">
        {activeCategoryMeta.description}
        {category === "residential" ? (
          <span className="block mt-1 text-slate-500">
            Showing {residentialCount} themes — Golden, Apple Pro, Horizon, Ember, plus Ledger & Classic.
          </span>
        ) : null}
      </p>

      <div
        className={cn(
          "grid grid-cols-1 gap-4",
          category === "residential" ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2 lg:max-w-sm lg:grid-cols-1"
        )}
      >
        {items.map((item) => {
          const active = item.category === "commercial" ? true : activeKey === item.key;
          return (
            <article
              key={item.key}
              className={cn(
                "flex flex-col overflow-hidden rounded-xl border bg-white/80 transition dark:bg-white/[0.04]",
                active
                  ? "border-blue-500 ring-2 ring-blue-500/30 dark:border-blue-400"
                  : "border-slate-200 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20"
              )}
            >
              <div className="relative p-2 pb-0">
                <button
                  type="button"
                  onClick={() => setPreviewItem(item)}
                  className="group/thumb relative block w-full overflow-hidden rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  aria-label={`Preview ${item.name}`}
                >
                  <ProposalTemplateThumbnail variant={item.thumbnailVariant} />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover/thumb:bg-black/20 group-hover/thumb:opacity-100">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-slate-800 shadow">
                      <Eye className="h-3 w-3" aria-hidden />
                      Preview
                    </span>
                  </span>
                </button>
                {active ? (
                  <span className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white shadow-md">
                    <Check className="h-3.5 w-3.5 stroke-[3]" aria-hidden />
                  </span>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => choose(item)}
                className="flex flex-1 flex-col p-3 pt-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100">{item.name}</span>
                  {item.recommended ? (
                    <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-800 dark:bg-amber-500/20 dark:text-amber-200">
                      {category === "commercial" ? "Default" : "Recommended"}
                    </span>
                  ) : null}
                </div>
                <span className="mt-1 text-[11px] font-medium leading-snug text-slate-600 dark:text-slate-400">
                  {item.description}
                </span>
              </button>
            </article>
          );
        })}
      </div>

      {previewItem ? (
        <div
          className="fixed inset-0 z-[10060] flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="template-preview-title"
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-white/10">
              <h3 id="template-preview-title" className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {previewItem.name}
              </h3>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
                aria-label="Close preview"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4">
              <ProposalTemplateThumbnail variant={previewItem.thumbnailVariant} size="preview" />
              <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                {previewItem.description}
              </p>
              <button
                type="button"
                onClick={selectFromPreview}
                className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                {previewItem.category === "commercial" ? "Got it" : "Use this theme"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
