"use client";

/**
 * BlockCommercialCover — page 1: confidential executive cover only.
 * Hotel / client name + plant size. Full KPIs live on BlockCommercialExecutiveSummary (page 2).
 */

import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { shouldShowInstallerName } from "@/lib/proposal-branding-settings";
import { ProposalBrandMark } from "@/components/proposal/proposal-brand-mark";
import type { CommercialCtx } from "@/components/proposal/commercial-proposal-view";

type Props = { ctx: CommercialCtx };

export function BlockCommercialCover({ ctx }: Props) {
  const { summary, installer, installerLogoUrl, brandConfig, customerName, generatedAt, lang } = ctx;
  const isHi = lang === "hi";

  const dateStr = generatedAt
    ? new Date(generatedAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const displayName = customerName || summary.honoredName;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="commercial-cover commercial-cover--confidential flex min-h-[min(100dvh,297mm)] flex-col bg-white text-slate-900 print:min-h-[277mm]"
    >
      <header className="commercial-cover-confidential-header flex items-center justify-between border-b border-slate-200 px-6 py-4 md:px-10">
        <ProposalBrandMark
          surface="cover"
          brandConfig={brandConfig}
          installerName={installer.name}
          logoUrl={installerLogoUrl}
          fallbackIcon={
            <div className="flex h-9 w-9 items-center justify-center border border-neutral-300 bg-neutral-50">
              <Zap className="h-4 w-4 text-neutral-600" strokeWidth={1.5} />
            </div>
          }
        />
        <span className="shrink-0 rounded border border-slate-300 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600">
          {isHi ? "गोपनीय" : "Confidential"}
        </span>
      </header>

      <main className="commercial-cover-confidential-main flex flex-1 flex-col items-center justify-center px-6 py-10 text-center md:px-12">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-500">
          {isHi ? "कड़ाई से गोपनीय" : "Strictly Confidential"}
        </p>

        <p className="mt-10 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          {isHi ? "के लिए तैयार" : "Prepared For"}
        </p>

        <h1 className="mt-3 max-w-4xl text-balance text-4xl font-black leading-[1.08] tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
          {displayName}
        </h1>

        <div className="commercial-cover-plant-badge mt-10 inline-flex flex-col items-center border border-neutral-900 bg-white px-10 py-6">
          <p className="text-4xl font-semibold tabular-nums text-neutral-900 sm:text-5xl">{summary.systemKw} kW</p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
            {isHi ? "वाणिज्यिक सौर प्लांट" : "Commercial Solar Plant"}
          </p>
        </div>
      </main>

      <footer className="commercial-cover-confidential-footer border-t border-slate-200 px-6 py-3 text-center text-[10px] text-slate-500">
        {shouldShowInstallerName(brandConfig, "footer") && installer.name ? (
          <>
            {installer.name}
            <span className="mx-2 text-slate-300">·</span>
          </>
        ) : null}
        {dateStr}
      </footer>
    </motion.div>
  );
}
