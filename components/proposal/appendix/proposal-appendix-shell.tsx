"use client";

import { ChevronDown } from "lucide-react";
import type { ProposalLang } from "@/lib/proposal-i18n";

type Props = {
  lang: ProposalLang;
  children: React.ReactNode;
};

export function ProposalAppendixShell({ lang, children }: Props) {
  const isHi = lang === "hi";
  const title = isHi ? "संदर्भ सामग्री" : "Reference materials";
  const hint = isHi
    ? "निर्णय के बाद की जानकारी — मुख्य प्रस्ताव पढ़ने के बाद देखें"
    : "Post-decision information — review after the main proposal";

  return (
    <details className="proposal-appendix-shell group mt-10 print:mt-8 print:block print:open">
      <summary className="proposal-appendix-shell-summary flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 print:hidden">
        <div>
          <p className="text-sm font-bold text-slate-900">{title}</p>
          <p className="text-xs text-slate-500">{hint}</p>
        </div>
        <ChevronDown className="h-5 w-5 shrink-0 text-slate-500 transition-transform group-open:rotate-180" />
      </summary>
      <div className="proposal-appendix-shell-body mt-4 space-y-8 print:mt-0 print:space-y-6">
        <p className="hidden text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-400 print:block">
          {title}
        </p>
        {children}
      </div>
    </details>
  );
}
