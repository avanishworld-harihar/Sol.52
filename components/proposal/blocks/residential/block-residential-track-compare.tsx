"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Scale } from "lucide-react";
import type { BlockRenderContext } from "@/lib/proposal-block-context";
import { normalizeResidentialTrackCompare } from "@/lib/residential-track-compare";
import type { ResidentialTrackCompare, ResidentialTrackCompareTier } from "@/lib/residential-requirements-schema";
import { BlockPanel, BlockSectionTitle } from "@/components/proposal/blocks/proposal-block-utils";
import { ProposalJourneySection } from "@/components/proposal/proposal-journey";
import type { ProposalLang } from "@/lib/proposal-i18n";
import { cn } from "@/lib/utils";

type Props = Pick<BlockRenderContext, "lang" | "darkMode"> & {
  trackCompare?: ResidentialTrackCompare | null;
  highlightPlantKw?: number;
};

const inr = (v: number) => `₹${Math.max(0, Math.round(v)).toLocaleString("en-IN")}`;

function deltaAtTier(t: ResidentialTrackCompareTier) {
  return Math.max(0, t.dcrGrossInr - t.nonDcrGrossInr);
}

export function ResidentialTrackCompareSection({
  lang,
  darkMode,
  trackCompare: raw,
  highlightPlantKw,
}: Props) {
  const compare = normalizeResidentialTrackCompare(raw ?? undefined);
  const tiers = compare.tiers.filter((t) => t.visible !== false);
  if (!compare.enabled || tiers.length === 0) return null;

  const isHi = lang === "hi";
  const dark = darkMode;
  const sortedTiers = [...tiers].sort((a, b) => a.kw - b.kw);
  const maxDelta = Math.max(...sortedTiers.map(deltaAtTier), 0);

  return (
    <ProposalJourneySection id="dcr-comparison">
      <BlockSectionTitle
        kicker={isHi ? "ट्रैक तुलना" : "Module track"}
        title={
          isHi
            ? "Non-DCR बनाम DCR — सिस्टम लागत (₹)"
            : "Non-DCR vs DCR — system cost (₹)"
        }
        subtitle={
          isHi
            ? "एक ही kW पर दोनों ट्रैक — ग्राहक के लिए स्पष्ट तुलना"
            : "Same kW sizes on both tracks — apples-to-apples for your customer"
        }
        dark={dark}
        lang={lang}
      />

      {compare.showPolicyNote ? (
        <BlockPanel dark={dark} className="mb-4 border-amber-200/60 dark:border-amber-500/30">
          <div className="flex gap-3">
            <AlertTriangle
              className={cn("mt-0.5 h-5 w-5 shrink-0", dark ? "text-amber-400" : "text-amber-600")}
              aria-hidden
            />
            <div>
              <p className={`text-sm font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
                {isHi ? "सरकारी अपडेट" : "Government update"}
              </p>
              <p className={`mt-1 text-xs leading-relaxed ${dark ? "text-slate-400" : "text-slate-600"}`}>
                {isHi ? (
                  <>
                    31 मई 2026 के बाद Non-DCR (ALMM के बाहर) मॉड्यूल नए इंस्टॉलेशन में अनुमत नहीं होंगे।
                    Non-DCR अक्सर सस्ता और कुशल होता है; DCR (ALMM) की दर थोड़ी अधिक होती है लेकिन सब्सिडी
                    पथ के लिए ज़रूरी है।
                  </>
                ) : (
                  <>
                    After <strong>31 May 2026</strong>, Non-DCR modules (outside ALMM) will not be permitted
                    on new installations. Non-DCR is often lower cost and efficient; DCR (ALMM-listed) costs
                    more but aligns with subsidy eligibility.
                  </>
                )}
              </p>
            </div>
          </div>
        </BlockPanel>
      ) : null}

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
                <th className="px-4 py-3">{isHi ? "प्लांट" : "Plant"}</th>
                <th className="px-4 py-3">{isHi ? "Non-DCR (₹)" : "Non-DCR (₹)"}</th>
                <th className="px-4 py-3">{isHi ? "DCR (₹)" : "DCR (₹)"}</th>
                <th className="px-4 py-3 hidden sm:table-cell">
                  {isHi ? "अंतर" : "Difference"}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedTiers.map((t, rowIdx) => {
                const delta = deltaAtTier(t);
                const highlight =
                  highlightPlantKw != null &&
                  Math.round(highlightPlantKw * 10) / 10 === Math.round(t.kw * 10) / 10;
                return (
                  <tr
                    key={`${t.kw}-${rowIdx}`}
                    className={cn(
                      "border-t tabular-nums",
                      dark ? "border-white/10" : "border-slate-100",
                      highlight &&
                        (dark
                          ? "bg-indigo-500/10 ring-1 ring-inset ring-indigo-400/40"
                          : "bg-indigo-50/80 ring-1 ring-inset ring-indigo-200")
                    )}
                  >
                    <td className="px-4 py-3 font-semibold">
                      {t.kw} kW
                      {highlight ? (
                        <span
                          className={cn(
                            "ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                            dark ? "bg-indigo-500/30 text-indigo-200" : "bg-indigo-100 text-indigo-800"
                          )}
                        >
                          {isHi ? "आपका साइज़" : "Your size"}
                        </span>
                      ) : null}
                    </td>
                    <td className={cn("px-4 py-3 font-medium", dark ? "text-slate-200" : "text-slate-800")}>
                      {inr(t.nonDcrGrossInr)}
                    </td>
                    <td className={cn("px-4 py-3 font-medium", dark ? "text-emerald-300" : "text-emerald-800")}>
                      {inr(t.dcrGrossInr)}
                    </td>
                    <td
                      className={cn(
                        "hidden px-4 py-3 text-xs font-medium sm:table-cell",
                        dark ? "text-amber-300/90" : "text-amber-800"
                      )}
                    >
                      +{inr(delta)}
                      {maxDelta > 0 && delta === maxDelta ? (
                        <span className="ml-1 opacity-70">({isHi ? "ज़्यादा" : "max"})</span>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </BlockPanel>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-4"
      >
        <BlockPanel dark={dark}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Scale className={cn("h-5 w-5", dark ? "text-amber-400" : "text-amber-600")} />
              <p className={`text-sm font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
                {isHi ? "ट्रैक चुनने का असर" : "Why compare both tracks?"}
              </p>
            </div>
            <p className={`max-w-lg text-xs leading-relaxed ${dark ? "text-slate-400" : "text-slate-600"}`}>
              {isHi
                ? "ग्राहक Non-DCR पर कम ग्रॉस देख सकते हैं, लेकिन 31 मई 2026 के बाद नए प्रोजेक्ट में DCR/ALMM पथ सुरक्षित रहता है।"
                : "Customers see lower gross on Non-DCR today; after 31 May 2026, new projects should plan on the DCR/ALMM path for compliance and subsidy."}
            </p>
          </div>
        </BlockPanel>
      </motion.div>
    </ProposalJourneySection>
  );
}
