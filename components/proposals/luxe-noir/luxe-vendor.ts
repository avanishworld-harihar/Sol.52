"use client";

/**
 * Resolve Premium Luxe vendor / brand name + company contact.
 * Prefer More → Brand settings, then proposal snapshot / ppt_input.
 */

import { useEffect, useState } from "react";
import type { ProposalData } from "@/lib/proposal-data";
import type { PremiumProposalPptInput } from "@/lib/proposal-ppt";
import {
  DEFAULT_INSTALLER_EMAIL,
  DEFAULT_INSTALLER_PHONE,
  PROPOSAL_BRANDING_UPDATED_EVENT,
  formatInstallerContactLine,
  readProposalBrandingSettings,
  resolveCompanyGstNumber,
  resolveInstallerDisplayName,
  type ProposalBrandingSettings,
} from "@/lib/proposal-branding-settings";
import { useProposalBrandingSettings } from "@/lib/use-proposal-branding-settings";

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

/** Built-in Sol.52 demo contact — never show as the installer's own details. */
function isSamplePhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  const sample = DEFAULT_INSTALLER_PHONE.replace(/\D/g, "");
  return Boolean(digits) && digits === sample;
}

function isSampleEmail(value: string): boolean {
  return value.trim().toLowerCase() === DEFAULT_INSTALLER_EMAIL.toLowerCase();
}

function cleanPhone(value: string | undefined | null): string {
  const v = cleanField(value);
  return v && !isSamplePhone(v) ? v : "";
}

function cleanEmail(value: string | undefined | null): string {
  const v = cleanField(value);
  return v && !isSampleEmail(v) ? v : "";
}

function splitContactLine(line: string): { phone: string; email: string } {
  const parts = line.split("·").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return { phone: "", email: "" };
  if (parts.length === 1) {
    const only = parts[0]!;
    if (only.includes("@")) return { phone: "", email: cleanEmail(only) };
    return { phone: cleanPhone(only), email: "" };
  }
  return {
    phone: cleanPhone(parts[0]),
    email: cleanEmail(parts.slice(1).join(" · ")),
  };
}

function firstPhone(...candidates: Array<string | undefined | null>): string {
  for (const c of candidates) {
    const v = cleanPhone(c);
    if (v) return v;
  }
  return "";
}

function firstEmail(...candidates: Array<string | undefined | null>): string {
  for (const c of candidates) {
    const v = cleanEmail(c);
    if (v) return v;
  }
  return "";
}

function firstField(...candidates: Array<string | undefined | null>): string {
  for (const c of candidates) {
    const v = cleanField(c);
    if (v) return v;
  }
  return "";
}

export type LuxeCompanyContact = {
  phone: string;
  email: string;
  /** phone · email (or whichever is set) — never sample defaults */
  line: string;
  address: string;
  website: string;
  gstNumber: string;
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
  const pptSplit = splitContactLine(cleanField(pptInput?.installerContact) || "");
  const closingSplit = splitContactLine(cleanField(data.closing?.contactLine) || "");

  // Prefer More → Company Profile, then frozen ppt snapshot, then proposal data.
  // Sample Sol.52 demo phone/email are treated as empty.
  const phone = firstPhone(
    s?.installerContact,
    pptSplit.phone,
    pptInput?.installerContact?.split("·")[0],
    closingSplit.phone
  );
  const email = firstEmail(
    s?.installerEmail,
    pptSplit.email,
    pptInput?.installerContact?.split("·")[1],
    closingSplit.email
  );
  const line =
    formatInstallerContactLine(phone, email) ||
    firstField(
      phone && email ? `${phone} · ${email}` : "",
      phone,
      email
    );

  return {
    phone,
    email,
    line,
    address: firstField(
      s?.companyProfile?.address,
      pptCp?.address,
      data.closing?.address,
      data.meta?.brandAddress
    ),
    website: firstField(s?.companyProfile?.website, pptCp?.website),
    gstNumber: firstField(
      s ? resolveCompanyGstNumber(s) : "",
      pptCp?.gstNumber,
      data.closing?.gstNumber,
      data.meta?.brandGst
    ),
    contactPerson: firstField(
      s?.companyProfile?.contactPerson,
      pptCp?.contactPerson,
      data.closing?.contactPerson
    ),
    contactPersonDesignation: firstField(
      s?.companyProfile?.contactPersonDesignation,
      pptCp?.contactPersonDesignation,
      data.closing?.contactPersonDesignation
    ),
  };
}

/** Live company contact — More → Company Profile via branding store. */
export function useLuxeCompanyContact(
  data: ProposalData,
  pptInput?: PremiumProposalPptInput | null
): LuxeCompanyContact {
  const settings = useProposalBrandingSettings();
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
