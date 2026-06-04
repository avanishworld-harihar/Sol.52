"use client";

import { Award, Leaf, Sparkles, TreePine, Zap } from "lucide-react";
import type { CommercialCtx } from "@/components/proposal/commercial-proposal-view";
import {
  CommercialSectionHeader,
  CountUp,
  GlassPanel,
  KpiCard,
  SectionReveal,
} from "./commercial-shared";
import { buildSchoolImpactMetrics } from "@/lib/school-proposal-metrics";
import { BlockSchoolLoadAdvantage } from "./block-school-load-advantage";

type Props = { ctx: CommercialCtx };

export function BlockSchoolGreenCampus({ ctx }: Props) {
  const { summary, lang } = ctx;
  const isHi = lang === "hi";
  const impact = buildSchoolImpactMetrics(summary);

  const kpis = [
    {
      icon: <Leaf className="h-4 w-4" />,
      label: isHi ? "वार्षिक CO₂ कमी" : "Annual CO₂ Reduction",
      rawValue: Math.round(impact.annualCo2Kg / 100) / 10,
      suffix: " t",
      decimals: 1,
      sub: isHi ? "ग्रिड बिजली की तुलना में" : "vs grid electricity",
      accent: "emerald" as const,
    },
    {
      icon: <TreePine className="h-4 w-4" />,
      label: isHi ? "पेड़ समकक्ष (25 वर्ष)" : "Tree Equivalent (25 yr)",
      rawValue: impact.treeEquivalent,
      suffix: "",
      decimals: 0,
      sub: isHi ? "CO₂ अवशोषण प्रभाव" : "CO₂ absorption impact",
      accent: "sky" as const,
    },
    {
      icon: <Zap className="h-4 w-4" />,
      label: isHi ? "स्वच्छ ऊर्जा" : "Clean Energy Generated",
      rawValue: Math.round(impact.annualGenKwh / 1000 * 10) / 10,
      suffix: " MWh/yr",
      decimals: 1,
      sub: isHi ? "ऑन-साइट सौर उत्पादन" : "on-site solar output",
      accent: "violet" as const,
    },
    {
      icon: <Sparkles className="h-4 w-4" />,
      label: isHi ? "प्रभाव स्कोर" : "Environmental Impact Score",
      rawValue: impact.impactScore,
      suffix: "/100",
      decimals: 0,
      sub: isHi ? "कैंपस स्थिरता सूचक" : "campus sustainability index",
      accent: "amber" as const,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 md:px-12 md:py-24">
      <CommercialSectionHeader
        num="S1"
        label={isHi ? "स्कूल प्रभाव" : "School Impact"}
        title={
          isHi
            ? "ग्रीन कैंपस एवं स्थिरता प्रभाव"
            : "Green Campus & Sustainability Impact"
        }
        subtitle={
          isHi
            ? "सौर न केवल लागत बचाता है — यह आपकी संस्था की छवि, CSR और भविष्य-तैयार कैंपस की पहचान बनाता है"
            : "Solar is not only a cost-saving investment — it is a branding, CSR, and future-ready campus asset"
        }
      />

      <SectionReveal>
        <GlassPanel className="mb-6 border-emerald-200/70 bg-gradient-to-br from-emerald-50/80 to-white p-6">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md">
              <Award className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                {isHi ? "ग्रीन कैंपस मान्यता" : "Green Campus Recognition"}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-700">
                {isHi
                  ? "अपनी संस्था को भविष्य-तैयार ग्रीन कैंपस के रूप में स्थापित करें और छात्रों, अभिभावकों तथा समुदाय के सामने पर्यावरण नेतृत्व दिखाएँ।"
                  : "Position your institution as a future-ready Green Campus and demonstrate environmental leadership to students, parents, and the community."}
              </p>
              <span className="mt-3 inline-flex rounded-full border border-emerald-200 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                {isHi ? "स्थिरता बैज" : "Sustainability Badge"} · {impact.sustainabilityBadge}
              </span>
            </div>
          </div>
        </GlassPanel>
      </SectionReveal>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, i) => (
          <SectionReveal key={kpi.label} delay={i * 0.05}>
            <KpiCard
              icon={kpi.icon}
              label={kpi.label}
              value={
                <CountUp
                  target={kpi.rawValue}
                  suffix={kpi.suffix}
                  decimals={kpi.decimals}
                />
              }
              sub={kpi.sub}
              accent={kpi.accent}
            />
          </SectionReveal>
        ))}
      </div>

      <SectionReveal delay={0.1}>
        <GlassPanel className="p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
            {isHi ? "25-वर्षीय पर्यावरणीय प्रभाव" : "25-Year Environmental Impact"}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-center">
              <p className="text-2xl font-black text-emerald-700">{impact.lifetimeCo2Tons} t</p>
              <p className="mt-1 text-[11px] text-slate-500">
                {isHi ? "CO₂ उत्सर्जन से बचत" : "CO₂ emissions avoided"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-center">
              <p className="text-2xl font-black text-sky-700">{impact.lifetimeGenMwh} MWh</p>
              <p className="mt-1 text-[11px] text-slate-500">
                {isHi ? "स्वच्छ ऊर्जा उत्पादन" : "clean energy produced"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-center">
              <p className="text-2xl font-black text-violet-700">
                {impact.treeEquivalent.toLocaleString("en-IN")}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                {isHi ? "पेड़-वर्ष समकक्ष" : "tree-years equivalent"}
              </p>
            </div>
          </div>
        </GlassPanel>
      </SectionReveal>

      <BlockSchoolLoadAdvantage ctx={ctx} embedded />
    </div>
  );
}
