"use client";

/**
 * BrandComparisonCard — Smart catalog pricing for two panel brands.
 * Block ID: brand_comparison_card
 */

import type { BlockRenderContext } from "@/lib/proposal-block-context";
import {
  normalizeBrandCompareSelection,
  normalizeBrandCompareTrack,
  resolveBrandCompareSnapshot,
  type BrandCompareProposalTrack,
} from "@/lib/brand-compare-helpers";
import type { ResidentialBrandCatalog } from "@/lib/residential-brand-catalog";
import {
  BlockPanel,
  BlockSectionTitle,
} from "@/components/proposal/blocks/proposal-block-utils";
import { ProposalJourneySection } from "@/components/proposal/proposal-journey";
import { cn } from "@/lib/utils";
import { GitCompare } from "lucide-react";

type Props = Pick<BlockRenderContext, "summary" | "lang" | "darkMode"> & {
  catalog?: ResidentialBrandCatalog | null;
  brandIdA?: string;
  brandIdB?: string;
  enabled?: boolean;
  /** Commercial — DCR plant gross only (rate card). */
  dcrOnly?: boolean;
  /** Which track row to show on the proposal. */
  proposalTrack?: BrandCompareProposalTrack;
};

const inr = (v: number) => `₹${Math.max(0, Math.round(v)).toLocaleString("en-IN")}`;

export function BrandComparisonCard({
  summary,
  lang,
  darkMode,
  catalog,
  brandIdA,
  brandIdB,
  enabled = true,
  dcrOnly = false,
  proposalTrack,
}: Props) {
  const isHi = lang === "hi";
  const dark = darkMode;

  if (!enabled) return null;

  const selection = normalizeBrandCompareSelection(
    { enabled: true, brandIdA, brandIdB, proposalTrack },
    catalog
  );
  const track: BrandCompareProposalTrack = dcrOnly
    ? "dcr"
    : normalizeBrandCompareTrack(selection.proposalTrack);
  const snapshot = resolveBrandCompareSnapshot(
    catalog,
    selection.brandIdA,
    selection.brandIdB,
    summary.systemKw
  );

  if (!snapshot) return null;

  const showNonDcr = track === "non_dcr";
  const kicker = isHi ? "ब्रांड तुलना" : "Brand comparison";
  const title = isHi
    ? `${snapshot.brandA.brandLabel} बनाम ${snapshot.brandB.brandLabel}`
    : `${snapshot.brandA.brandLabel} vs ${snapshot.brandB.brandLabel}`;
  const subtitle = isHi
    ? showNonDcr
      ? `${snapshot.kw} kW — Smart catalog से Non-DCR plant gross (₹)`
      : `${snapshot.kw} kW — ${dcrOnly ? "Rate card" : "Smart catalog"} से DCR plant gross (₹)`
    : showNonDcr
      ? `${snapshot.kw} kW — Non-DCR plant gross (₹) from Smart catalog`
      : `${snapshot.kw} kW — DCR plant gross (₹) from ${dcrOnly ? "Rate card" : "Smart catalog"}`;

  return (
    <ProposalJourneySection id="brand-comparison">
      <BlockSectionTitle kicker={kicker} title={title} subtitle={subtitle} dark={dark} lang={lang} />

      <BlockPanel dark={dark} className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[320px] border-collapse text-sm">
            <thead>
              <tr
                className={cn(
                  "text-left text-[10px] font-bold uppercase tracking-wider",
                  dark ? "bg-white/5 text-slate-400" : "bg-slate-50 text-slate-500"
                )}
              >
                <th className="px-4 py-3">{isHi ? "ट्रैक" : "Track"}</th>
                <th className="px-4 py-3">{snapshot.brandA.brandLabel}</th>
                <th className="px-4 py-3">{snapshot.brandB.brandLabel}</th>
              </tr>
            </thead>
            <tbody>
              {showNonDcr ? (
                <tr className={cn("border-t tabular-nums", dark ? "border-white/10" : "border-slate-100")}>
                  <td className="px-4 py-3 font-semibold">Non-DCR</td>
                  <td className={cn("px-4 py-3 font-medium", dark ? "text-emerald-300" : "text-emerald-800")}>
                    {snapshot.brandA.nonDcrOk ? inr(snapshot.brandA.nonDcrGrossInr) : "—"}
                  </td>
                  <td className={cn("px-4 py-3 font-medium", dark ? "text-emerald-300" : "text-emerald-800")}>
                    {snapshot.brandB.nonDcrOk ? inr(snapshot.brandB.nonDcrGrossInr) : "—"}
                  </td>
                </tr>
              ) : (
                <tr className={cn("border-t tabular-nums", dark ? "border-white/10" : "border-slate-100")}>
                  <td className="px-4 py-3 font-semibold">DCR</td>
                  <td className={cn("px-4 py-3 font-medium", dark ? "text-slate-200" : "text-slate-800")}>
                    {snapshot.brandA.dcrOk ? inr(snapshot.brandA.dcrGrossInr) : "—"}
                  </td>
                  <td className={cn("px-4 py-3 font-medium", dark ? "text-slate-200" : "text-slate-800")}>
                    {snapshot.brandB.dcrOk ? inr(snapshot.brandB.dcrGrossInr) : "—"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </BlockPanel>

      <BlockPanel dark={dark} className="mt-4">
        <div className="flex items-start gap-2">
          <GitCompare className={cn("mt-0.5 h-5 w-5 shrink-0", dark ? "text-indigo-400" : "text-indigo-600")} />
          <p className={`text-xs leading-relaxed ${dark ? "text-slate-400" : "text-slate-600"}`}>
            {isHi
              ? "प्रत्येक ब्रांड की अपनी Smart catalog pricing table है — Adani और Waaree की दरें अलग-अलग save होती हैं।"
              : "Each brand has its own Smart catalog table — Adani and Waaree rates are stored and compared independently."}
          </p>
        </div>
      </BlockPanel>
    </ProposalJourneySection>
  );
}
