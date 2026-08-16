"use client";

import { useEffect, useState } from "react";
import type { ProposalData } from "@/lib/proposal-data";
import {
  PROPOSAL_BRANDING_UPDATED_EVENT,
  readProposalBrandingSettings,
} from "@/lib/proposal-branding-settings";

export type LuminaContactDetails = {
  phone: string;
  email: string;
  website: string;
};

function splitContactLine(line: string): { phone: string; email: string } {
  const parts = line
    .split(/[·|/,;]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  let phone = "";
  let email = "";
  for (const part of parts) {
    if (/@/.test(part)) email = email || part;
    else if (/[\d+]/.test(part)) phone = phone || part;
  }
  if (!phone && !email && line.trim()) {
    if (/@/.test(line)) email = line.trim();
    else phone = line.trim();
  }
  return { phone, email };
}

function cleanWebsite(raw: string): string {
  return raw.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
}

function hasLiveContactSettings(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const s = readProposalBrandingSettings();
    return Boolean(
      s.installerContact?.trim() ||
        s.installerEmail?.trim() ||
        s.companyProfile?.website?.trim()
    );
  } catch {
    return false;
  }
}

/** More → Company Profile first on live preview; frozen snapshot on shared links. */
export function resolveLuminaContactDetails(
  data: ProposalData,
  pptWebsite?: string
): LuminaContactDetails {
  const fromLine = splitContactLine(data.closing.contactLine ?? "");
  const settings =
    typeof window !== "undefined" ? readProposalBrandingSettings() : null;
  const fromSettings = {
    phone: settings?.installerContact?.trim() ?? "",
    email: settings?.installerEmail?.trim() ?? "",
    website: settings?.companyProfile?.website?.trim() ?? "",
  };
  const snapshotWebsite = pptWebsite?.trim() ?? "";
  const preferSettings = hasLiveContactSettings();

  const pick = (snapshot: string, live: string) =>
    preferSettings ? live || snapshot : snapshot || live;

  const websiteRaw = pick(snapshotWebsite, fromSettings.website);

  return {
    phone: pick(fromLine.phone, fromSettings.phone),
    email: pick(fromLine.email, fromSettings.email),
    website: websiteRaw ? cleanWebsite(websiteRaw) : "",
  };
}

export function useLuminaContactDetails(
  data: ProposalData,
  pptWebsite?: string
): LuminaContactDetails {
  const [contact, setContact] = useState(() =>
    resolveLuminaContactDetails(data, pptWebsite)
  );

  useEffect(() => {
    const sync = () => setContact(resolveLuminaContactDetails(data, pptWebsite));
    sync();
    window.addEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [data, pptWebsite]);

  return contact;
}

export function formatLuminaContactFooter(parts: string[]): string {
  return parts.filter(Boolean).join(" · ");
}
