"use client";

import { BookOpen, Cpu, GraduationCap, LineChart, Radio } from "lucide-react";
import type { CommercialCtx } from "@/components/proposal/commercial-proposal-view";
import { CommercialSectionHeader, GlassPanel, SectionReveal } from "./commercial-shared";

type Props = { ctx: CommercialCtx };

export function BlockSchoolLearningAsset({ ctx }: Props) {
  const { summary, lang } = ctx;
  const isHi = lang === "hi";

  const learningPoints = [
    {
      icon: Radio,
      title: isHi ? "रीयल-टाइम जनरेशन मॉनिटरिंग" : "Real-Time Generation Monitoring",
      body: isHi
        ? "लाइव डैशबोर्ड पर दैनिक, साप्ताहिक और मासिक उत्पादन देखें — कक्षाओं में ऊर्जा डेटा पर चर्चा के लिए तैयार।"
        : "View daily, weekly, and monthly production on a live dashboard — ready for classroom discussions on energy data.",
    },
    {
      icon: BookOpen,
      title: isHi ? "विज्ञान और STEM सीख" : "Science & STEM Learning",
      body: isHi
        ? "फोटो-voltaic प्रभाव, DC/AC रूपांतरण, और ऊर्जा संरक्षण — NCERT/CBSE विज्ञान पाठ्यक्रम से जुड़े व्यावहारिक उदाहरण।"
        : "Photovoltaic effect, DC/AC conversion, and energy conservation — practical examples aligned with school science curricula.",
    },
    {
      icon: GraduationCap,
      title: isHi ? "नवीकरणीय ऊर्जा जागरूकता" : "Renewable Energy Awareness",
      body: isHi
        ? "Eco-clubs, assembly talks, और sustainability weeks के लिए वास्तविक कैंपस डेटा — छात्र नेतृत्व कार्यक्रमों को सशक्त बनाएँ।"
        : "Real campus data for eco-clubs, assembly talks, and sustainability weeks — empowering student-led green initiatives.",
    },
    {
      icon: LineChart,
      title: isHi ? "छात्र स्थिरता परियोजनाएँ" : "Student Sustainability Projects",
      body: isHi
        ? "Carbon footprint calculators, science fair models, और inter-house green competitions — सभी के लिए live solar metrics उपलब्ध।"
        : "Carbon footprint calculators, science fair models, and inter-house green competitions — live solar metrics available for all.",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 md:px-12 md:py-24">
      <CommercialSectionHeader
        num="S2"
        label={isHi ? "शिक्षा मूल्य" : "Educational Value"}
        title={isHi ? "सीखने की संपत्ति के रूप में सौर" : "Solar as a Learning Asset"}
        subtitle={
          isHi
            ? "सौर प्लांट एक वास्तविक प्रयोगशाला बन जाता है जहाँ छात्र ऊर्जा, स्थिरता और प्रदर्शन को प्रत्यक्ष देख सकते हैं"
            : "The solar plant becomes a real-world learning laboratory for energy, sustainability, and performance"
        }
      />

      <SectionReveal>
        <GlassPanel className="mb-6 border-sky-200/70 bg-gradient-to-br from-sky-50/70 to-white p-6">
          <p className="text-sm leading-relaxed text-slate-700">
            {isHi
              ? "सौर प्लांट एक वास्तविक शिक्षण प्रयोगशाला बन जाता है जहाँ छात्र ऊर्जा उत्पादन, स्थिरता मेट्रिक्स और नवीकरणीय प्रदर्शन का अवलोकन कर सकते हैं।"
              : "The solar plant becomes a real-world learning laboratory where students can observe energy generation, sustainability metrics, and renewable energy performance."}
          </p>
        </GlassPanel>
      </SectionReveal>

      <div className="grid gap-4 sm:grid-cols-2">
        {learningPoints.map((item, i) => {
          const Icon = item.icon;
          return (
            <SectionReveal key={item.title} delay={i * 0.05}>
              <GlassPanel className="h-full p-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-sm font-bold text-slate-900">{item.title}</p>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">{item.body}</p>
              </GlassPanel>
            </SectionReveal>
          );
        })}
      </div>

      <SectionReveal className="mt-6" delay={0.12}>
        <GlassPanel className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
            <Cpu className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-violet-600">
              {isHi ? "मॉनिटरिंग प्लेटफ़ॉर्म" : "Monitoring Platform"}
            </p>
            <p className="mt-1 text-sm text-slate-700">
              {isHi
                ? `प्रस्तावित ${summary.systemKw} kW सिस्टम से अनुमानित ${(summary.annualGen / 1000).toFixed(1)} MWh/वर्ष उत्पादन — IoT डेटा लॉगर और OEM क्लाउड पोर्टल के माध्यम से live डेटा स्कूल स्टाफ और छात्रों के लिए उपलब्ध।`
                : `Estimated ${(summary.annualGen / 1000).toFixed(1)} MWh/yr from the proposed ${summary.systemKw} kW system — live data available to school staff and students via IoT data logger and OEM cloud portal.`}
            </p>
          </div>
        </GlassPanel>
      </SectionReveal>
    </div>
  );
}
