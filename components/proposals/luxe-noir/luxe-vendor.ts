"use client";

/**
 * Resolve Premium Luxe vendor / brand name.
 * Prefer More → Brand settings (installerName), then proposal snapshot fields.
 */

import { useEffect, useState } from "react";
import type { ProposalData } from "@/lib/proposal-data";
import {
  PROPOSAL_BRANDING_UPDATED_EVENT,
  readProposalBrandingSettings,
  resolveInstallerDisplayName,
} from "@/lib/proposal-branding-settings";

const PLACEHOLDER =
  /^(solar\s*partner|सोलर\s*पार्टनर|vendor|installer|your\s*solar\s*partner|—|-|n\/a|na)$/i;

function cleanBrand(value: string | undefined | null): string {
  const v = (value ?? "").trim();
  if (!v || PLACEHOLDER.test(v)) return "";
  return v;
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
