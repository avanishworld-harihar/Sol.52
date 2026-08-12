/**
 * Zenith closing — structured vendor contact from proposal + branding settings.
 */

import type { ProposalData } from "@/lib/proposal-data";
import {
  formatInstallerContactLine,
  readProposalBrandingSettings,
  type ProposalBrandingSettings,
} from "@/lib/proposal-branding-settings";

export type ZenithContactRow = {
  label: string;
  value: string;
  href?: string;
};

export type ZenithClosingContact = {
  brandName: string;
  tagline?: string;
  rows: ZenithContactRow[];
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

export function buildZenithClosingContact(
  data: ProposalData,
  opts?: { branding?: ProposalBrandingSettings; labels?: Record<string, string> }
): ZenithClosingContact {
  const closing = data.closing;
  const branding = opts?.branding ?? readProposalBrandingSettings();
  const L = opts?.labels ?? {};

  const fromLine = splitContactLine(closing.contactLine ?? "");
  const settingsLine = formatInstallerContactLine(
    branding.installerContact,
    branding.installerEmail
  );
  const fromSettings = splitContactLine(settingsLine);

  const phone = pick(fromLine.phone, fromSettings.phone);
  const email = pick(fromLine.email, fromSettings.email);
  const address = pick(closing.address, data.meta.brandAddress ?? branding.companyProfile.address);
  const gst = pick(closing.gstNumber, data.meta.brandGst ?? branding.companyProfile.gstNumber);
  const website = branding.companyProfile.website?.trim() ?? "";
  const contactPerson = pick(
    closing.contactPerson,
    branding.companyProfile.contactPerson
  );
  const designation = pick(
    closing.contactPersonDesignation,
    branding.companyProfile.contactPersonDesignation
  );
  const tagline = pick(closing.brandTagline, data.meta.brandTagline ?? branding.companyProfile.tagline);
  const brandName = closing.installerName?.trim() || data.meta.brandName?.trim() || branding.installerName.trim() || "Solar Partner";

  const rows: ZenithContactRow[] = [];

  if (phone) {
    rows.push({
      label: L.phone ?? "Phone / WhatsApp",
      value: phone,
      href: phoneHref(phone),
    });
  }
  if (email) {
    rows.push({
      label: L.email ?? "Email",
      value: email,
      href: emailHref(email),
    });
  }
  if (website) {
    rows.push({
      label: L.website ?? "Website",
      value: website.replace(/^https?:\/\//i, ""),
      href: websiteHref(website),
    });
  }
  if (address) {
    rows.push({ label: L.address ?? "Office address", value: address });
  }
  if (gst) {
    rows.push({ label: L.gst ?? "GSTIN", value: gst });
  }
  if (contactPerson) {
    const personLine = designation ? `${contactPerson} · ${designation}` : contactPerson;
    rows.push({ label: L.person ?? "Your contact", value: personLine });
  }

  return { brandName, tagline: tagline || undefined, rows };
}
