"use client";

import { Eye, ShieldCheck, Zap } from "lucide-react";
import type { CommercialCtx } from "@/components/proposal/commercial-proposal-view";
import { GlassPanel, SectionReveal } from "./commercial-shared";

type Props = { ctx: CommercialCtx };

export function BlockSchoolSafetyCard({ ctx }: Props) {
  const { lang } = ctx;
  const isHi = lang === "hi";

  const items = [
    isHi ? "बाल-सुरक्षित इंजीनियरिंग प्रथाएँ" : "Child-safe engineering practices",
    isHi ? "प्रमाणित BIS / IEC घटक" : "Certified BIS / IEC components",
    isHi ? "सर्ज प्रोटेक्शन (SPD Type 2)" : "Surge protection (SPD Type 2)",
    isHi ? "IS 3043 अनुसार उचित अर्थिंग" : "Proper earthing per IS 3043",
    isHi ? "रिमोट मॉनिटरिंग और अलर्ट" : "Remote monitoring & alerts",
    isHi ? "कम रखरखाव · सुरक्षित संचालन" : "Low-maintenance · safe operation",
  ];

  return (
    <SectionReveal className="mt-6">
      <GlassPanel className="border-emerald-200/60 bg-gradient-to-br from-emerald-50/50 to-white p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-700">
              {isHi ? "स्कूल सुरक्षा" : "School Safety"}
            </p>
            <h4 className="text-base font-bold text-slate-900">
              {isHi
                ? "सुरक्षित शैक्षणिक वातावरण के लिए डिज़ाइन"
                : "Designed for Safe Educational Environments"}
            </h4>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item} className="flex items-center gap-2 text-xs text-slate-700">
              <Zap className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
              {item}
            </div>
          ))}
        </div>
        <p className="mt-4 flex items-center gap-2 text-[11px] text-slate-500">
          <Eye className="h-3.5 w-3.5" />
          {isHi
            ? "सभी AC/DC पैनल लॉक किए गए · छत तक सीमित पहुँच · कमीशनिंग के बाद safety walkthrough"
            : "All AC/DC panels lockable · roof access restricted · post-commissioning safety walkthrough included"}
        </p>
      </GlassPanel>
    </SectionReveal>
  );
}
