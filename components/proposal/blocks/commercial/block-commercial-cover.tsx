"use client";

/**
 * BlockCommercialCover — executive cover for commercial proposals.
 * Light, print-friendly canvas: white background, dark text.
 */

import { motion } from "framer-motion";
import { Building2, CalendarDays, FileText, MapPin, Zap } from "lucide-react";
import type { CommercialCtx } from "@/components/proposal/commercial-proposal-view";
import { CountUp } from "./commercial-shared";

const fmtInrL = (v: number) => {
  if (v >= 10_000_000) return { int: (v / 10_000_000).toFixed(1), unit: "Cr" };
  if (v >= 100_000) return { int: (v / 100_000).toFixed(1), unit: "L" };
  if (v >= 1_000) return { int: (v / 1_000).toFixed(0), unit: "k" };
  return { int: Math.round(v).toLocaleString("en-IN"), unit: "" };
};

type Props = { ctx: CommercialCtx };

export function BlockCommercialCover({ ctx }: Props) {
  const {
    summary,
    installer,
    installerLogoUrl,
    customerName,
    generatedAt,
    roiPct,
    profit25,
    lang,
  } = ctx;

  const isHi = lang === "hi";

  const dateStr = generatedAt
    ? new Date(generatedAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const savingFmt = fmtInrL(summary.annualSaving);
  const costFmt = fmtInrL(summary.netCost);
  const profitFmt = fmtInrL(profit25);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="commercial-cover flex flex-col bg-white text-slate-900 print:bg-white print:text-slate-900"
    >
      {/* Header bar */}
      <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4 md:px-12 md:py-5">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-3"
        >
          {installerLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={installerLogoUrl}
              alt={installer.name}
              className="h-8 w-auto object-contain"
            />
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-sky-200 bg-sky-50"
            >
              <Zap className="h-4.5 w-4.5 text-sky-600" />
            </motion.div>
          )}
          <div>
            <p className="text-sm font-bold text-slate-900">{installer.name}</p>
            {installer.tagline ? (
              <p className="text-[10px] text-slate-500">{installer.tagline}</p>
            ) : null}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="flex items-center gap-4"
        >
          <div className="hidden items-center gap-1.5 sm:flex">
            <CalendarDays className="h-3 w-3 text-slate-400" />
            <span className="text-[11px] font-medium text-slate-600">{dateStr}</span>
          </div>
          <span className="rounded border border-slate-300 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.22em] text-slate-500">
            Confidential
          </span>
        </motion.div>
      </header>

      {/* Main content */}
      <main className="flex flex-1 flex-col justify-center px-6 py-10 md:px-12 md:py-14 print:py-8">
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="mb-6 flex items-center gap-3"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-md border border-sky-200 bg-sky-50">
            <FileText className="h-3 w-3 text-sky-600" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-700">
            {isHi ? "व्यावसायिक सौर प्रस्ताव" : "Commercial Solar Intelligence Report"}
          </span>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500"
        >
          {isHi ? "के लिए तैयार किया गया" : "Prepared For"}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="mb-5 max-w-4xl text-4xl font-black leading-[1.08] tracking-tight text-slate-900 sm:text-5xl md:text-6xl lg:text-[4.5rem]"
        >
          {customerName || summary.honoredName}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.28 }}
          className="mb-8 flex flex-wrap items-center gap-5 text-slate-600"
        >
          {ctx.pptInput.location ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.32 }}
              className="flex items-center gap-1.5"
            >
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-sm font-medium">{ctx.pptInput.location}</span>
            </motion.div>
          ) : null}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.36 }}
            className="flex items-center gap-1.5"
          >
            <Building2 className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-sm font-medium">
              {isHi ? "ऑन-ग्रिड वाणिज्यिक सौर" : "On-Grid Commercial Solar"}
            </span>
          </motion.div>
          <div className="h-3 w-px bg-slate-300" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            {isHi ? "गोपनीय" : "Strictly Confidential"}
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="inline-flex items-center gap-4 self-start rounded-xl border border-slate-200 bg-slate-50 px-5 py-4"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-200 bg-white">
            <Zap className="h-5 w-5 text-sky-600" />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.44 }}
          >
            <p className="text-2xl font-black tabular-nums text-slate-900">
              {summary.systemKw} kW
            </p>
            <p className="mt-0.5 text-[10px] font-medium text-slate-600">
              {summary.panels} {isHi ? "पैनल" : "panels"} ·{" "}
              {(summary.annualGen / 1000).toFixed(1)} MWh/yr ·{" "}
              {Math.round(summary.coverage)}%{isHi ? " लोड कवरेज" : " coverage"}
            </p>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.5 }}
          className="mt-10 flex items-center gap-4"
        >
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, delay: 0.52 }}
            className="h-px flex-1 origin-left bg-slate-200"
          />
          <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-slate-500">
            {isHi ? "मुख्य संकेतक" : "Key Performance Indicators"}
          </span>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, delay: 0.52 }}
            className="h-px flex-1 origin-right bg-slate-200"
          />
        </motion.div>
      </main>

      {/* KPI ribbon */}
      <footer className="border-t border-slate-200 bg-slate-50 print:bg-white">
        <div className="grid grid-cols-2 divide-x divide-slate-200 sm:grid-cols-3 lg:grid-cols-5">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="flex flex-col gap-1 px-5 py-5 md:py-6"
          >
            <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
              {isHi ? "वार्षिक बचत" : "Annual Saving"}
            </span>
            <span className="text-2xl font-black tabular-nums text-slate-900 md:text-3xl">
              ₹<CountUp target={parseFloat(savingFmt.int)} decimals={savingFmt.int.includes(".") ? 1 : 0} />
              <span className="ml-0.5 text-base font-bold text-slate-500">{savingFmt.unit}</span>
            </span>
            <span className="text-[10px] text-slate-500">{isHi ? "प्रति वर्ष" : "per year"}</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col gap-1 px-5 py-5 md:py-6"
          >
            <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
              {isHi ? "शुद्ध निवेश" : "Net Investment"}
            </span>
            <span className="text-2xl font-black tabular-nums text-slate-900 md:text-3xl">
              ₹<CountUp target={parseFloat(costFmt.int)} decimals={costFmt.int.includes(".") ? 1 : 0} />
              <span className="ml-0.5 text-base font-bold text-slate-500">{costFmt.unit}</span>
            </span>
            <span className="text-[10px] text-slate-500">{isHi ? "subsidy के बाद" : "post-subsidy"}</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="flex flex-col gap-1 px-5 py-5 md:py-6"
          >
            <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
              {isHi ? "पेबैक अवधि" : "Payback Period"}
            </span>
            <span className="text-2xl font-black tabular-nums text-slate-900 md:text-3xl">
              <CountUp target={summary.paybackYears} decimals={1} suffix=" yr" />
            </span>
            <span className="text-[10px] text-slate-500">{isHi ? "ब्रेक-ईवन" : "break-even"}</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col gap-1 px-5 py-5 md:py-6"
          >
            <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
              {isHi ? "25 वर्ष ROI" : "25-Year ROI"}
            </span>
            <span className="text-2xl font-black tabular-nums text-sky-700 md:text-3xl">
              <CountUp target={roiPct} decimals={1} suffix="%" />
            </span>
            <span className="text-[10px] text-slate-500">{isHi ? "वार्षिक" : "annualised"}</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75 }}
            className="flex flex-col gap-1 px-5 py-5 md:py-6"
          >
            <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
              {isHi ? "25 वर्ष लाभ" : "25-Year Profit"}
            </span>
            <span className="text-2xl font-black tabular-nums text-emerald-700 md:text-3xl">
              ₹<CountUp target={parseFloat(profitFmt.int)} decimals={profitFmt.int.includes(".") ? 1 : 0} />
              <span className="ml-0.5 text-base font-bold text-emerald-600">{profitFmt.unit}</span>
            </span>
            <span className="text-[10px] text-slate-500">{isHi ? "शुद्ध लाभ" : "net profit"}</span>
          </motion.div>
        </div>
      </footer>
    </motion.div>
  );
}
