"use client";

/**
 * Resolve Premium Luxe vendor / brand name + company contact.
 * Prefer More → Brand settings, then proposal snapshot / ppt_input.
 */

import { useEffect, useState } from "react";
import type { ProposalData } from "@/lib/proposal-data";
import type { PremiumProposalPptInput } from "@/lib/proposal-ppt";
import {
  PROPOSAL_BRANDING_UPDATED_EVENT,
  formatInstallerContactLine,
  readProposalBrandingSettings,
  resolveInstallerDisplayName,
  type ProposalBrandingSettings,
} from "@/lib/proposal-branding-settings";

const PLACEHOLDER =
  /^(solar\s*partner|सोलर\s*पार्टनर|vendor|installer|your\s*solar\s*partner|—|-|n\/a|na)$/i;

function cleanBrand(value: string | undefined | null): string {
  const v = (value ?? "").trim();
  if (!v || PLACEHOLDER.test(v)) return "";
  return v;
}

function cleanField(value: string | undefined | null): string {
  const v = (value ?? "").trim();
  if (!v || v === "—" || v === "-" || /^n\/?a$/i.test(v)) return "";
  return v;
}

export type LuxeCompanyContact = {
  phone: string;
  email: string;
  /** phone · email (or whichever is set) */
  line: string;
  address: string;
  website: string;
  contactPerson: string;
  contactPersonDesignation: string;
};

export function resolveLuxeCompanyContact(
  data: ProposalData,
  pptInput?: PremiumProposalPptInput | null,
  settings?: ProposalBrandingSettings | null
): LuxeCompanyContact {
  const s = settings ?? null;
  const pptCp = pptInput?.companyProfile;
  const phone =
    cleanField(s?.installerContact) ||
    cleanField(pptInput?.installerContact?.split("·")[0]) ||
    "";
  const email =
    cleanField(s?.installerEmail) ||
    cleanField(pptInput?.installerContact?.split("·")[1]) ||
    "";
  const fromSettingsLine = s
    ? formatInstallerContactLine(s.installerContact, s.installerEmail)
    : "";
  const line =
    cleanField(fromSettingsLine) ||
    cleanField(pptInput?.installerContact) ||
    cleanField(data.closing?.contactLine) ||
    "";

  return {
    phone,
    email,
    line,
    address:
      cleanField(s?.companyProfile?.address) ||
      cleanField(pptCp?.address) ||
      cleanField(data.closing?.address) ||
      cleanField(data.meta?.brandAddress) ||
      "",
    website:
      cleanField(s?.companyProfile?.website) ||
      cleanField(pptCp?.website) ||
      "",
    contactPerson:
      cleanField(s?.companyProfile?.contactPerson) ||
      cleanField(pptCp?.contactPerson) ||
      cleanField(data.closing?.contactPerson) ||
      "",
    contactPersonDesignation:
      cleanField(s?.companyProfile?.contactPersonDesignation) ||
      cleanField(pptCp?.contactPersonDesignation) ||
      cleanField(data.closing?.contactPersonDesignation) ||
      "",
  };
}

/** Live company contact — re-reads More → Brand after mount / updates. */
export function useLuxeCompanyContact(
  data: ProposalData,
  pptInput?: PremiumProposalPptInput | null
): LuxeCompanyContact {
  const [settings, setSettings] = useState<ProposalBrandingSettings | null>(null);

  useEffect(() => {
    const sync = () => setSettings(readProposalBrandingSettings());
    sync();
    window.addEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, sync);
    return () => window.removeEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, sync);
  }, []);

  return resolveLuxeCompanyContact(data, pptInput, settings);
}

/**
 * Sync resolve — safe on server (skips localStorage) and client.
 * Order: More branding → proposal installer / brand → bank company.
 */
export function resolveLuxeVendorName(data: ProposalData): string {
  if (typeof window !== "undefined") {
    try {
      const settings = readProposalBrandingSettings();
      const fromMore =
        cleanBrand(resolveInstallerDisplayName(settings)) ||
        cleanBrand(settings.companyProfile?.legalName);
      if (fromMore) return fromMore;
    } catch {
      /* ignore */
    }
  }

  const fromProposal = [
    data.closing?.installerName,
    data.meta?.brandName,
    data.execution?.bank?.company,
  ];
  for (const raw of fromProposal) {
    const v = cleanBrand(raw);
    if (v) return v;
  }
  return "";
}

/**
 * Live brand name — re-reads More → Brand when settings update.
 * Falls back to empty string (callers may show a soft placeholder only if needed).
 */
export function useLuxeVendorName(data: ProposalData): string {
  const [name, setName] = useState(() => resolveLuxeVendorName(data));

  useEffect(() => {
    const refresh = () => setName(resolveLuxeVendorName(data));
    refresh();
    window.addEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, refresh);
  }, [data]);

  return name;
}

/** Soft display fallback when More branding is empty — avoid “Solar Partner”. */
export function luxeVendorOrFallback(name: string, isHi: boolean): string {
  const v = cleanBrand(name);
  if (v) return v;
  return isHi ? "विक्रेता" : "Vendor";
}

/** Split for monument cover typography (first word / rest). */
export function splitLuxeVendorName(name: string): {
  primary: string;
  secondary: string;
} {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { primary: "VENDOR", secondary: "" };
  if (parts.length === 1) return { primary: parts[0]!, secondary: "" };
  return {
    primary: parts[0]!,
    secondary: parts.slice(1).join(" "),
  };
}
