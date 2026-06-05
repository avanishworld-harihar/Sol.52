"use client";

import { Clock, Sun, TrendingUp } from "lucide-react";
import type { CommercialCtx } from "@/components/proposal/commercial-proposal-view";
import { GlassPanel, SectionReveal } from "./commercial-shared";
import {
  SCHOOL_LOAD_HOUR_PROFILE,
  SOLAR_PRODUCTION_HOUR_PROFILE,
} from "@/lib/school-proposal-metrics";

type Props = { ctx: CommercialCtx; embedded?: boolean };

const HOUR_CHART_PX = 64; // inner height of h-20 container after padding

function HourCurve({
  profile,
  colorClass,
  label,
}: {
  profile: readonly number[];
  colorClass: string;
  label: string;
}) {
  const peak = Math.max(...profile, 0.01);
  return (
    <div className="commercial-print-keep-together print:break-inside-avoid">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <div className="commercial-hour-chart commercial-print-keep-together flex h-20 items-end gap-[2px] rounded-lg border border-slate-100 bg-slate-50/80 px-2 py-2 print:break-inside-avoid">
        {profile.map((v, hour) => {
          const barPx = Math.max(4, (v / peak) * HOUR_CHART_PX);
          const dimmed = hour < 8 || hour > 16;
          return (
            <div
              key={hour}
              className={`commercial-print-chart-bar flex-1 shrink-0 rounded-sm ${colorClass} ${dimmed ? "opacity-35 print:opacity-60" : ""}`}
              style={{ height: `${barPx}px` }}
              title={`${hour}:00 — ${Math.round(v * 100)}%`}
            />
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-[9px] text-slate-400">
        <span>6 AM</span>
        <span className="font-semibold text-sky-700">8 AM – 4 PM</span>
        <span>6 PM</span>
      </div>
    </div>
  );
}

export function BlockSchoolLoadAdvantage({ ctx, embedded = false }: Props) {
  const { summary, lang } = ctx;
  const isHi = lang === "hi";

  const bullets = [
    {
      icon: Clock,
      text: isHi
        ? "स्कूल के संचालन समय (8 AM – 4 PM) सौर उत्पादन के चरम घंटों से मेल खाते हैं"
        : "School operating hours (8 AM – 4 PM) overlap with peak solar generation hours",
    },
    {
      icon: Sun,
      text: isHi
        ? "दिन के दौरान अधिकतम बिजली खपत — सौर से सीधे offset"
        : "Maximum daytime consumption — directly offset by on-site solar",
    },
    {
      icon: TrendingUp,
      text: isHi
        ? "ग्रिड निर्भरता कम · तेज़ ROI · स्थिर ऊर्जा लागत"
        : "Reduced grid dependence · faster ROI · predictable energy costs",
    },
  ];

  const content = (
    <>
      {!embedded ? (
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-sky-600">
            {isHi ? "स्कूल लोड लाभ" : "School Load Advantage"}
          </p>
          <h3 className="mt-1 text-xl font-black text-slate-900">
            {isHi
              ? "स्कूल सौर उपयोग में उत्कृष्ट क्यों हैं"
              : "Why Schools Achieve Excellent Solar Utilization"}
          </h3>
        </div>
      ) : (
        <p className="mb-4 text-sm font-bold text-slate-900">
          {isHi
            ? "स्कूल सौर उपयोग में उत्कृष्ट क्यों हैं"
            : "Why Schools Achieve Excellent Solar Utilization"}
        </p>
      )}

      <div className="mb-4 grid gap-2 sm:grid-cols-3">
        {bullets.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-start gap-2 rounded-lg bg-white/80 p-3 text-xs text-slate-600">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
            <span>{text}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <HourCurve
          profile={SCHOOL_LOAD_HOUR_PROFILE}
          colorClass="bg-violet-500"
          label={isHi ? "8 AM → 4 PM स्कूल उपयोग" : "8 AM → 4 PM School Usage"}
        />
        <HourCurve
          profile={SOLAR_PRODUCTION_HOUR_PROFILE}
          colorClass="bg-amber-500"
          label={isHi ? "सौर उत्पादन वक्र" : "Solar Production Curve"}
        />
      </div>

      <p className="mt-3 text-[11px] text-slate-500">
        {isHi
          ? `${summary.systemKw} kW प्रस्तावित सिस्टम · ~${Math.round(summary.coverage)}% दिन-समय लोड कवरेज`
          : `${summary.systemKw} kW proposed system · ~${Math.round(summary.coverage)}% daytime load coverage`}
      </p>
    </>
  );

  if (embedded) {
    return (
      <SectionReveal className="commercial-school-load-block mt-6 print:break-before-page" delay={0.14}>
        <GlassPanel className="p-5 print:break-inside-avoid">{content}</GlassPanel>
      </SectionReveal>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <GlassPanel className="p-5">{content}</GlassPanel>
    </div>
  );
}
