"use client";

import type { ProposalDeckSummary } from "@/lib/proposal-ppt";
import type { ProposalBrandConfig } from "@/lib/proposal-branding-settings";
import type { ProposalLang } from "@/lib/proposal-i18n";
import { hindiHonoredDisplayName } from "@/lib/roman-name-to-devanagari";
import { AuroraPageShell, fmtInrL } from "./aurora-primitives";

type Props = {
  summary: ProposalDeckSummary;
  lang: ProposalLang;
  installerLogoUrl?: string;
  brandConfig: ProposalBrandConfig;
  location?: string;
};

export function AuroraCover({ summary, lang, location }: Props) {
  const isHi = lang === "hi";
  const name = isHi ? hindiHonoredDisplayName(summary.honoredName) : summary.honoredName;
  const place = location?.trim() ?? "";
  const lifetime = fmtInrL(summary.solarVsGrid?.netSaving ?? summary.lifetime25Profit);
  const installerLabel = summary.installer?.trim() || "Harihar Solar";

  const footerItems = [
    {
      label: isHi ? "तैयार किया गया" : "Prepared for",
      value: name,
    },
    {
      label: isHi ? "स्थान" : "Location",
      value: place || (isHi ? "मध्य प्रदेश" : "Madhya Pradesh"),
    },
    {
      label: isHi ? "सिस्टम" : "System",
      value: `${summary.systemKw} kW`,
    },
  ];

  return (
    <AuroraPageShell tone="pearl" className="aurora-cover aurora-cover--premium">
      <div className="aurora-cover-inner">
        <p className="aurora-cover-brand">{installerLabel}</p>

        <div className="aurora-cover-main">
          <h1 className="aurora-cover-headline">
            {isHi ? "आपका घर, ऊर्जा स्वतंत्र।" : "Your home, energy independent."}
          </h1>
          <p className="aurora-cover-sub">
            {isHi
              ? `25 साल तक अपनी बिजली — आज से ${lifetime} की बचत शुरू।`
              : `Generating your own power for 25 years. Saving you ${lifetime} starting today.`}
          </p>
        </div>

        <div className="aurora-cover-footer">
          {footerItems.map((item) => (
            <div key={item.label} className="aurora-cover-foot-item">
              <p className="aurora-cover-foot-label">{item.label}</p>
              <p className="aurora-cover-foot-value">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </AuroraPageShell>
  );
}
