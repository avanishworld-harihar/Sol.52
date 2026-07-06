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
  const installerLabel = summary.installer?.trim() || "Harihar Solar";
  const lifetime = fmtInrL(summary.solarVsGrid?.netSaving ?? summary.lifetime25Profit);

  const footerItems = [
    { label: isHi ? "ग्राहक" : "Client", value: name },
    {
      label: isHi ? "सिस्टम साइज़" : "System size",
      value: isHi ? `${summary.systemKw} kW प्रीमियम` : `${summary.systemKw} kW Premium`,
    },
    { label: isHi ? "वैधता" : "Validity", value: isHi ? "14 दिन" : "14 Days" },
  ];

  return (
    <AuroraPageShell tone="pearl" className="aurora-cover aurora-cover--zenith">
      <div className="aurora-cover-inner">
        <div className="aurora-cover-top">
          <p className="aurora-cover-brand">{installerLabel}</p>
          <h1 className="aurora-cover-headline">
            {isHi
              ? "आपका घर अपनी बिजली खुद बनाएगा।"
              : "Your home will generate its own electricity."}
          </h1>
          <p className="aurora-cover-sub">
            {isHi
              ? `अगले 25 साल तक। इस साल से ${lifetime} की बचत शुरू।`
              : `For the next 25 years. Saving you over ${lifetime}, starting this year.`}
          </p>
        </div>

        <div className="aurora-cover-footer aurora-cover-footer--grid">
          {footerItems.map((item) => (
            <div key={item.label} className="aurora-cover-foot-col">
              <p className="aurora-cover-foot-label">{item.label}</p>
              <p className="aurora-cover-foot-value">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </AuroraPageShell>
  );
}
