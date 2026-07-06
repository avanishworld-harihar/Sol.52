"use client";

import type { ProposalDeckSummary } from "@/lib/proposal-ppt";
import type { ProposalBrandConfig } from "@/lib/proposal-branding-settings";
import type { ProposalLang } from "@/lib/proposal-i18n";
import { hindiHonoredDisplayName } from "@/lib/roman-name-to-devanagari";
import { ProposalBrandMark } from "@/components/proposal/proposal-brand-mark";
import { AuroraPageShell, fmtInrL } from "./aurora-primitives";

type Props = {
  summary: ProposalDeckSummary;
  lang: ProposalLang;
  installerLogoUrl?: string;
  brandConfig: ProposalBrandConfig;
  location?: string;
};

export function AuroraCover({ summary, lang, installerLogoUrl, brandConfig, location }: Props) {
  const isHi = lang === "hi";
  const name = isHi ? hindiHonoredDisplayName(summary.honoredName) : summary.honoredName;
  const place = location?.trim() ?? "";
  const lifetime = fmtInrL(summary.solarVsGrid?.netSaving ?? summary.lifetime25Profit);

  return (
    <AuroraPageShell tone="indigo" className="aurora-cover p-0">
      <div className="aurora-cover-inner">
        <div className="aurora-cover-top">
          <ProposalBrandMark
            surface="cover"
            brandConfig={brandConfig}
            installerName={summary.installer}
            logoUrl={installerLogoUrl}
            tagline={summary.tagline}
            logoClassName="h-12 w-auto max-w-[220px] object-contain object-left brightness-0 invert sm:h-14"
            nameClassName="text-lg font-bold tracking-[0.12em] text-[#F5A524] sm:text-xl"
            taglineClassName="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-300"
            fallbackIcon={null}
          />
        </div>

        <div className="aurora-cover-main">
          <h1 className="aurora-cover-headline">
            {isHi
              ? "आपका घर अपनी बिजली खुद बनाएगा।"
              : "Your home will generate its own electricity."}
          </h1>
          <p className="aurora-cover-sub">
            {isHi
              ? `इस साल से बचत शुरू — 25 साल में ${lifetime} की कुल बचत।`
              : `Saving over ${lifetime}, starting this year.`}
          </p>
        </div>

        <div className="aurora-cover-footer">
          <div className="aurora-cover-foot-col">
            <p className="aurora-cover-foot-label">{isHi ? "तैयार किया गया" : "Prepared for"}</p>
            <p className="aurora-cover-foot-value">{name}</p>
            {place ? (
              <p className="aurora-cover-foot-sub">{place}</p>
            ) : null}
          </div>
          <div className="aurora-cover-foot-col">
            <p className="aurora-cover-foot-label">{isHi ? "सिस्टम साइज़" : "System size"}</p>
            <p className="aurora-cover-foot-value">{summary.systemKw} kW</p>
          </div>
          <div className="aurora-cover-foot-col">
            <p className="aurora-cover-foot-label">{isHi ? "वैधता" : "Validity"}</p>
            <p className="aurora-cover-foot-value">{isHi ? "14 दिन" : "14 days"}</p>
          </div>
        </div>
      </div>
    </AuroraPageShell>
  );
}
