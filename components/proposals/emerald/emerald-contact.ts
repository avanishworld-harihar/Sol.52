"use client";

/**
 * Emerald back-cover contact — live installer identity from proposal + More settings.
 * Duplicated locally (not imported from other presets).
 */

import { useEffect, useState } from "react";
import type { ProposalData } from "@/lib/proposal-data";
import {
  PROPOSAL_BRANDING_UPDATED_EVENT,
  formatInstallerContactLine,
  readProposalBrandingSettings,
  type ProposalBrandingSettings,
} from "@/lib/proposal-branding-settings";
import { resolveEmeraldBrand } from "./emerald-brand";
import { useEmeraldLang } from "./emerald-lang-context";

export type EmeraldContactRow = {
  label: string;
  value: string;
  href?: string;
};

export type EmeraldContact = {
  brandName: string;
  tagline?: string;
  rows: EmeraldContactRow[];
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

function phoneHref(phone: string): string | undefined {
  const digits = phone.replace(/[^\d+]/g, "");
  return digits.length >= 10 ? `tel:${digits}` : undefined;
}

function emailHref(email: string): string | undefined {
  return email.includes("@") ? `mailto:${email}` : undefined;
}

function websiteHref(url: string): string | undefined {
  const t = url.trim();
  if (!t) return undefined;
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

function pick(
  primary: string | null | undefined,
  fallback: string | null | undefined
): string {
  const a = primary?.trim() ?? "";
  if (a) return a;
  return fallback?.trim() ?? "";
}

export type EmeraldContactLabels = {
  phone: string;
  email: string;
  website: string;
  office: string;
  person: string;
};

const DEFAULT_CONTACT_LABELS: EmeraldContactLabels = {
  phone: "Phone / WhatsApp",
  email: "Email",
  website: "Website",
  office: "Office",
  person: "Your contact",
};

export function buildEmeraldContact(
  data: ProposalData,
  branding?: ProposalBrandingSettings,
  labels: EmeraldContactLabels = DEFAULT_CONTACT_LABELS
): EmeraldContact {
  const closing = data.closing;
  const settings = branding ?? readProposalBrandingSettings();

  const fromLine = splitContactLine(closing.contactLine ?? "");
  const settingsLine = formatInstallerContactLine(
    settings.installerContact,
    settings.installerEmail
  );
  const fromSettings = splitContactLine(settingsLine);

  const phone = pick(fromLine.phone, fromSettings.phone);
  const email = pick(fromLine.email, fromSettings.email);
  const address = pick(
    closing.address,
    data.meta.brandAddress ?? settings.companyProfile.address
  );
  const website = settings.companyProfile.website?.trim() ?? "";
  const contactPerson = pick(
    closing.contactPerson,
    settings.companyProfile.contactPerson
  );
  const designation = pick(
    closing.contactPersonDesignation,
    settings.companyProfile.contactPersonDesignation
  );
  const tagline = pick(
    closing.brandTagline,
    data.meta.brandTagline ?? settings.companyProfile.tagline
  );
  const brandName =
    resolveEmeraldBrand(data) ||
    closing.installerName?.trim() ||
    "";

  const rows: EmeraldContactRow[] = [];

  if (phone) {
    rows.push({
      label: labels.phone,
      value: phone,
      href: phoneHref(phone),
    });
  }
  if (email) {
    rows.push({
      label: labels.email,
      value: email,
      href: emailHref(email),
    });
  }
  if (website) {
    rows.push({
      label: labels.website,
      value: website.replace(/^https?:\/\//i, ""),
      href: websiteHref(website),
    });
  }
  if (address) {
    rows.push({ label: labels.office, value: address });
  }
  if (contactPerson) {
    const personLine = designation
      ? `${contactPerson} · ${designation}`
      : contactPerson;
    rows.push({ label: labels.person, value: personLine });
  }

  return { brandName, tagline: tagline || undefined, rows };
}

export function useEmeraldContact(data: ProposalData): EmeraldContact {
  const { copy } = useEmeraldLang();
  const labels: EmeraldContactLabels = {
    phone: copy.back.phone,
    email: copy.back.email,
    website: copy.back.website,
    office: copy.back.office,
    person: copy.back.person,
  };
  const [contact, setContact] = useState(() =>
    buildEmeraldContact(data, undefined, labels)
  );

  useEffect(() => {
    const sync = () => setContact(buildEmeraldContact(data, undefined, labels));
    sync();
    window.addEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [
    data,
    labels.phone,
    labels.email,
    labels.website,
    labels.office,
    labels.person,
  ]);

  return contact;
}
