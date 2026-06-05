"use client";

/**
 * BlockCommercialExecutiveSummary — page 2+: report context + KPI ribbon (moved off confidential cover).
 */

import { motion } from "framer-motion";
import { Building2, CalendarDays, FileText, MapPin } from "lucide-react";
import { ProposalBrandMark } from "@/components/proposal/proposal-brand-mark";
import type { CommercialCtx } from "@/components/proposal/commercial-proposal-view";
import { StaticInrKpi } from "./commercial-shared";

type Props = { ctx: CommercialCtx };

export function BlockCommercialExecutiveSummary({ ctx }: Props) {
  const {
    summary,
    installer,
    installerLogoUrl,
    brandConfig,
    customerName,
    generatedAt,
    roiPct,
    profit25,
    lang,
  } = ctx;

  const isHi = lang === "hi";
  const displayName = customerName || summary.honoredName;

  const dateStr = generatedAt
    ? new Date(generatedAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="commercial-executive-summary bg-white text-slate-900">
      <div className="border-b border-slate-200 px-6 py-5 md:px-10 md:py-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <ProposalBrandMark
            surface="header"
            brandConfig={brandConfig}
            installerName={installer.name}
            logoUrl={installerLogoUrl}
            tagline={installer.tagline}
            logoClassName="h-8 w-auto object-contain"
          />
          <div className="flex items-center gap-2 text-slate-600">
            <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-[11px] font-medium">{dateStr}</span>
          </div>
        </div>

        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md border border-sky-200 bg-sky-50">
            <FileText className="h-3 w-3 text-sky-600" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.28em] text-sky-700">
            {isHi ? "व्यावसायिक सौर प्रस्ताव" : "Commercial Solar Intelligence Report"}
          </span>
        </div>

        <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{displayName}</h2>

        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-600">
          {ctx.pptInput.location ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              {ctx.pptInput.location}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-slate-400" />
            {isHi ? "ऑन-ग्रिड वाणिज्यिक सौर" : "On-Grid Commercial Solar"}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            {summary.systemKw} kW · {summary.panels} {isHi ? "पैनल" : "panels"} ·{" "}
            {Math.round(summary.coverage)}% {isHi ? "कवरेज" : "load coverage"}
          </span>
        </div>
      </div>

      <div className="border-b border-slate-200 bg-slate-50">
        <p className="px-6 pt-4 text-[9px] font-bold uppercase tracking-[0.22em] text-slate-500 md:px-10">
          {isHi ? "मुख्य संकेतक" : "Key Performance Indicators"}
        </p>
        <div className="commercial-executive-kpi-grid grid grid-cols-2 divide-x divide-y divide-slate-200 sm:grid-cols-3 sm:divide-y-0 lg:grid-cols-5">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col gap-1 px-4 py-4 md:px-5 md:py-5"
          >
            <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
              {isHi ? "वार्षिक बचत" : "Annual Saving"}
            </span>
            <span className="text-xl font-black tabular-nums text-slate-900 md:text-2xl">
              <StaticInrKpi amount={summary.annualSaving} />
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.04 }}
            className="flex flex-col gap-1 px-4 py-4 md:px-5 md:py-5"
          >
            <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
              {isHi ? "शुद्ध निवेश" : "Net Investment"}
            </span>
            <span className="text-xl font-black tabular-nums text-slate-900 md:text-2xl">
              <StaticInrKpi amount={summary.netCost} />
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="flex flex-col gap-1 px-4 py-4 md:px-5 md:py-5"
          >
            <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
              {isHi ? "पेबैक" : "Payback"}
            </span>
            <span className="text-xl font-black tabular-nums text-slate-900 md:text-2xl">
              {summary.paybackYears >= 99
                ? "—"
                : `${summary.paybackYears.toFixed(1)} yr`}
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.12 }}
            className="flex flex-col gap-1 px-4 py-4 md:px-5 md:py-5"
          >
            <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
              {isHi ? "25 वर्ष ROI" : "25-Year ROI"}
            </span>
            <span className="text-xl font-black tabular-nums text-sky-700 md:text-2xl">
              {roiPct.toFixed(1)}%
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.16 }}
            className="col-span-2 flex flex-col gap-1 px-4 py-4 sm:col-span-1 md:px-5 md:py-5"
          >
            <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
              {isHi ? "25 वर्ष लाभ" : "25-Year Profit"}
            </span>
            <span className="text-xl font-black tabular-nums text-emerald-700 md:text-2xl">
              <StaticInrKpi amount={profit25} valueClassName="text-emerald-700" unitClassName="text-emerald-600" />
            </span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
