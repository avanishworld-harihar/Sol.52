"use client";

import { useEffect, useState } from "react";
import type { ProposalData } from "@/lib/proposal-data";
import {
  PROPOSAL_BRANDING_UPDATED_EVENT,
  formatInstallerContactLine,
  readProposalBrandingSettings,
} from "@/lib/proposal-branding-settings";

export type JaaliContactDetails = {
  phone: string;
  email: string;
  website: string;
};

/** Pulls `name@host` even when the line is space-separated (`phone email@x.com`). */
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;

function extractEmail(raw: string): string {
  const m = raw.match(EMAIL_RE);
  return m ? m[0] : "";
}

function extractPhone(raw: string, email: string): string {
  const stripped = (email ? raw.replace(email, " ") : raw)
    .replace(/[·•|,;/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!stripped) return "";
  if (EMAIL_RE.test(stripped)) return "";
  if (/@/.test(stripped)) return "";
  if (/[a-z]/i.test(stripped) && !/[\d+]/.test(stripped)) return "";
  return stripped;
}

function splitContactLine(line: string): { phone: string; email: string } {
  const email = extractEmail(line);
  const phone = extractPhone(line, email);
  return { phone, email };
}

function cleanWebsite(raw: string): string {
  const t = raw.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  if (!t || t.includes("@")) return "";
  if (/^www\./i.test(t)) return t;
  return `www.${t}`;
}

function firstFilled(...values: string[]): string {
  for (const v of values) {
    const t = v.trim();
    if (t) return t;
  }
  return "";
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
export function resolveJaaliContactDetails(
  data: ProposalData,
  pptWebsite?: string
): JaaliContactDetails {
  const fromLine = splitContactLine(data.closing.contactLine ?? "");
  const settings =
    typeof window !== "undefined" ? readProposalBrandingSettings() : null;
  const settingsEmail = (settings?.installerEmail ?? "").trim();
  const settingsPhoneRaw = (settings?.installerContact ?? "").trim();
  const fromSettingsLine = splitContactLine(
    formatInstallerContactLine(settingsPhoneRaw, settingsEmail)
  );
  const settingsWebsite = settings?.companyProfile?.website?.trim() ?? "";
  const snapshotWebsite = pptWebsite?.trim() ?? "";
  const preferSettings = hasLiveContactSettings();

  const phone = preferSettings
    ? firstFilled(
        fromSettingsLine.phone,
        extractPhone(settingsPhoneRaw, settingsEmail || extractEmail(settingsPhoneRaw)),
        fromLine.phone
      )
    : firstFilled(
        fromLine.phone,
        fromSettingsLine.phone,
        extractPhone(settingsPhoneRaw, settingsEmail || extractEmail(settingsPhoneRaw))
      );

  const email = preferSettings
    ? firstFilled(
        settingsEmail,
        fromSettingsLine.email,
        extractEmail(settingsPhoneRaw),
        extractEmail(settingsWebsite),
        fromLine.email
      )
    : firstFilled(
        fromLine.email,
        settingsEmail,
        fromSettingsLine.email,
        extractEmail(settingsPhoneRaw),
        extractEmail(settingsWebsite)
      );

  const websiteRaw = preferSettings
    ? firstFilled(settingsWebsite, snapshotWebsite)
    : firstFilled(snapshotWebsite, settingsWebsite);

  return {
    phone,
    email,
    website: websiteRaw ? cleanWebsite(websiteRaw) : "",
  };
}

export function useJaaliContactDetails(
  data: ProposalData,
  pptWebsite?: string
): JaaliContactDetails {
  const [contact, setContact] = useState(() =>
    resolveJaaliContactDetails(data, pptWebsite)
  );

  useEffect(() => {
    const sync = () => setContact(resolveJaaliContactDetails(data, pptWebsite));
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

export function formatJaaliContactFooter(parts: string[]): string {
  return parts.filter(Boolean).join(" · ");
}
