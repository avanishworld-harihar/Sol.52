"use client";

import { CheckCircle2 } from "lucide-react";
import type { ProposalDeckSummary } from "@/lib/proposal-ppt";
import type { ProposalLang } from "@/lib/proposal-i18n";
import { resolvedCompanyProfileForLang } from "@/lib/proposal-company-resolve";
import { AuroraEyebrow, AuroraLead, AuroraPageShell, AuroraTitle } from "./aurora-primitives";

type Props = {
  summary: ProposalDeckSummary;
  lang: ProposalLang;
};

export function AuroraAbout({ summary, lang }: Props) {
  const isHi = lang === "hi";
  const cp = resolvedCompanyProfileForLang(summary.companyProfile, lang);
  const about = cp.aboutUsParagraphs?.[0] ?? "";

  const stats = [
    { label: isHi ? "स्थापना" : "Founded", value: cp.founded || "—" },
    { label: isHi ? "इंस्टॉलेशन" : "Installations", value: cp.installationsDone || "—" },
    { label: isHi ? "सेवा क्षेत्र" : "Service areas", value: cp.locations || "—" },
  ];

  const bullets = isHi
    ? [
        "100% स्थानीय टीम — Satna से Madhya Pradesh भर",
        "नेट-मीटर आवेदन हमारी ओर से",
        "सब्सिडी कागज़ी कार्रवाई मुफ्त",
        "1 साल मुफ्त AMC शामिल",
      ]
    : [
        "100% local team — on-ground support",
        "Net-meter application filed by us",
        "FREE subsidy paperwork",
        "1-year free AMC included",
      ];

  return (
    <AuroraPageShell tone="pearl">
      <AuroraEyebrow>{isHi ? "हमारे बारे में" : "About us"}</AuroraEyebrow>
      <AuroraTitle>{summary.installer}</AuroraTitle>
      {about ? <AuroraLead>{about}</AuroraLead> : null}

      <div className="aurora-about-stats">
        {stats.map((s) => (
          <div key={s.label} className="aurora-about-stat">
            <p className="aurora-stat-label">{s.label}</p>
            <p className="aurora-stat-value">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="aurora-about-bullets">
        {bullets.map((b) => (
          <div key={b} className="aurora-about-bullet">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#10B981]" aria-hidden />
            <span>{b}</span>
          </div>
        ))}
      </div>
    </AuroraPageShell>
  );
}
