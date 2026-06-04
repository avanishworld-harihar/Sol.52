import type { ProposalLang } from "@/lib/proposal-i18n";
import { defaultCompanyProfile, type CompanyProfile } from "@/lib/proposal-deck-helpers";
import { hasDevanagari } from "@/lib/roman-name-to-devanagari";

/**
 * When the UI is Hindi but stored `companyProfile` still has English
 * (merged from CRM defaults), fall back to Hindi marketing copy so the
 * customer sees one coherent language.
 */
export function adaptCompanyProfileForInstaller(
  profile: CompanyProfile,
  installerName: string,
  gstNumber?: string
): CompanyProfile {
  const label = installerName.trim();
  const gst = gstNumber?.trim() ?? profile.gstNumber?.trim() ?? "";
  const stripHarihar = (text: string) =>
    text
      .replace(/\bHarihar Solar\b/gi, label || "Our team")
      .replace(/हरिहर सोलर/g, label || "हमारी टीम");
  return {
    ...profile,
    gstNumber: gst,
    aboutUsParagraphs: profile.aboutUsParagraphs.map(stripHarihar),
  };
}

export function resolvedCompanyProfileForLang(profile: CompanyProfile, lang: ProposalLang): CompanyProfile {
  if (lang !== "hi") return profile;
  const def = defaultCompanyProfile("hi");
  const about0 = profile.aboutUsParagraphs?.[0]?.trim() ?? "";
  const aboutOk = about0.length > 0 && hasDevanagari(about0);
  const bullets0 = profile.bullets?.[0]?.trim() ?? "";
  const bulletsOk = bullets0.length > 0 && hasDevanagari(bullets0);
  return {
    ...profile,
    aboutUsParagraphs: aboutOk
      ? profile.aboutUsParagraphs
      : [def.aboutUsParagraphs[0], ...(profile.aboutUsParagraphs?.slice(1) ?? [])].filter(Boolean),
    bullets: bulletsOk ? profile.bullets : def.bullets
  };
}
