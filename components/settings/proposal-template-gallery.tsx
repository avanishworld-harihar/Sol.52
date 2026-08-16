"use client";

import { ProposalTemplateThumbnail } from "@/components/settings/proposal-template-thumbnail";
import { cn } from "@/lib/utils";
import {
  PROPOSAL_DEFAULT_PRESET_UPDATED_EVENT,
  readDefaultCommercialPreset,
  readDefaultResidentialPreset,
  writeDefaultCommercialPreset,
  writeDefaultResidentialPreset,
  type CommercialTemplatePresetId,
  type ResidentialTemplatePresetId,
} from "@/lib/proposal-default-preset-storage";
import {
  PROPOSAL_TEMPLATE_CATEGORIES,
  galleryForCategory,
  galleryThemeNames,
  type ProposalTemplateCategory,
  type ProposalTemplateGalleryItem,
  type ProposalTemplateGalleryKey,
} from "@/lib/proposal-template-gallery";
import {
  PROPOSAL_TEMPLATE_GALLERY_KEY_UPDATED_EVENT,
  resolveActiveTemplateGalleryKey,
  writeDefaultGalleryKey,
} from "@/lib/proposal-template-gallery-storage";
import {
  readDefaultSalesPremiumStyle,
  SALES_PREMIUM_STYLE_UPDATED_EVENT,
  writeDefaultSalesPremiumStyle,
} from "@/lib/sales-premium-styles";
import { Check } from "lucide-react";
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
    resolveActiveTemplateGalleryKey(readDefaultResidentialPreset(), readDefaultSalesPremiumStyle())
  );
  const [activeCommercialPreset, setActiveCommercialPreset] = useState<CommercialTemplatePresetId>(
    () => readDefaultCommercialPreset()
  );

  const items = galleryForCategory(category);
  const residentialCount = galleryForCategory("residential").length;
  const commercialCount = galleryForCategory("commercial").length;

  const sync = useCallback(() => {
    setActiveKey(
      resolveActiveTemplateGalleryKey(readDefaultResidentialPreset(), readDefaultSalesPremiumStyle())
    );
    setActiveCommercialPreset(readDefaultCommercialPreset());
  }, []);

  useEffect(() => {
    setCategory(readInitialTab());
    sync();
    window.addEventListener(PROPOSAL_DEFAULT_PRESET_UPDATED_EVENT, sync);
    window.addEventListener(SALES_PREMIUM_STYLE_UPDATED_EVENT, sync);
    window.addEventListener(PROPOSAL_TEMPLATE_GALLERY_KEY_UPDATED_EVENT, sync);
    return () => {
      window.removeEventListener(PROPOSAL_DEFAULT_PRESET_UPDATED_EVENT, sync);
      window.removeEventListener(SALES_PREMIUM_STYLE_UPDATED_EVENT, sync);
      window.removeEventListener(PROPOSAL_TEMPLATE_GALLERY_KEY_UPDATED_EVENT, sync);
    };
  }, [sync]);

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
      const presetId = item.presetId as CommercialTemplatePresetId;
      writeDefaultCommercialPreset(presetId);
      setActiveCommercialPreset(presetId);
      markSaved(`Default commercial theme set to ${item.name}. New commercial proposals will use this format.`);
      return;
    }
    const presetId = item.presetId as ResidentialTemplatePresetId;
    writeDefaultResidentialPreset(presetId);
    if (item.salesPremiumStyle) {
      writeDefaultSalesPremiumStyle(item.salesPremiumStyle);
    }
    writeDefaultGalleryKey(item.key);
    setActiveKey(item.key);
    markSaved(`Default residential theme set to ${item.name}. New proposals will use this format.`);
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
            {residentialCount} themes — {galleryThemeNames("residential")}. Tap a card to set your default.
          </span>
        ) : (
          <span className="block mt-1 text-slate-500">
            {commercialCount} theme{commercialCount === 1 ? "" : "s"} — {galleryThemeNames("commercial")}.
          </span>
        )}
      </p>

      <div
        className={cn(
          "grid grid-cols-2 gap-2.5",
          category === "residential"
            ? "sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
            : "sm:grid-cols-3 lg:max-w-xl"
        )}
      >
        {items.map((item) => {
          const active =
            item.category === "commercial"
              ? item.presetId === activeCommercialPreset
              : activeKey === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => choose(item)}
              className={cn(
                "flex flex-col overflow-hidden rounded-lg border bg-white/80 text-left transition touch-manipulation dark:bg-white/[0.04]",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                active
                  ? "border-blue-500 ring-2 ring-blue-500/30 dark:border-blue-400"
                  : "border-slate-200 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20"
              )}
              aria-pressed={active}
              aria-label={`Select ${item.name} as default theme`}
            >
              <div className="relative">
                <ProposalTemplateThumbnail variant={item.thumbnailVariant} />
                {active ? (
                  <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white shadow-md">
                    <Check className="h-3 w-3 stroke-[3]" aria-hidden />
                  </span>
                ) : null}
              </div>

              <div className="flex flex-1 flex-col px-2 py-1.5">
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-[11px] font-extrabold text-slate-900 dark:text-slate-100">{item.name}</span>
                  {item.recommended ? (
                    <span className="rounded-full bg-amber-100 px-1.5 py-px text-[8px] font-bold uppercase tracking-wide text-amber-800 dark:bg-amber-500/20 dark:text-amber-200">
                      {category === "commercial" ? "Default" : "Recommended"}
                    </span>
                  ) : null}
                </div>
                <span className="mt-0.5 line-clamp-2 text-[10px] font-medium leading-snug text-slate-600 dark:text-slate-400">
                  {item.description}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}
