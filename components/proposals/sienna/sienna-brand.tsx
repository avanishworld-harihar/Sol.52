"use client";

/**
 * Sienna branding — More → Brand & proposals, then proposal snapshot, then adapter prop.
 * Never invent a company name or logo.
 */

import { useEffect, useState, type ReactNode } from "react";
import type { ProposalData } from "@/lib/proposal-data";
import styles from "./Sienna.module.css";
import {
  PROPOSAL_BRANDING_UPDATED_EVENT,
  readProposalBrandingSettings,
  resolveInstallerDisplayName,
  resolveProposalBankDetails,
  resolveProposalBrandConfig,
  resolveProposalBrandPresentation,
  type ProposalBrandPresentation,
  type ProposalBrandSurface,
} from "@/lib/proposal-branding-settings";

const PLACEHOLDER =
  /^(solar\s*partner|सोलर\s*पार्टनर|vendor|installer|your\s*solar\s*partner|sol\.?52|—|-|n\/a|na)$/i;

function clean(value: string | undefined | null): string {
  const v = (value ?? "").trim();
  if (!v || PLACEHOLDER.test(v)) return "";
  return v;
}

export type SiennaBankDetails = {
  accountName: string;
  accountNumber: string;
  ifsc: string;
  upiId: string;
};

function hasLiveBankSettings(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const s = readProposalBrandingSettings();
    return Boolean(
      s.bankAccountName?.trim() ||
        s.bankAccountNumber?.trim() ||
        s.bankIfsc?.trim() ||
        s.bankUpiId?.trim()
    );
  } catch {
    return false;
  }
}

/** More → Banking first on live preview; frozen snapshot on shared links. */
export function resolveSiennaBankDetails(data: ProposalData): SiennaBankDetails {
  const fromData = data.execution.bank;
  const settings =
    typeof window !== "undefined" ? readProposalBrandingSettings() : null;
  const resolved = resolveProposalBankDetails({
    pptBank: {
      accountName: clean(fromData.company) || undefined,
      accountNumber: clean(fromData.accountNumber) || undefined,
      ifsc: clean(fromData.ifsc) || undefined,
      upiId: clean(fromData.upiId) || undefined,
    },
    settings,
    preferSettings: hasLiveBankSettings(),
  });

  const accountName = clean(resolved.accountName) || resolveSiennaBrand(data);

  return {
    accountName,
    accountNumber: clean(resolved.accountNumber),
    ifsc: clean(resolved.ifsc).toUpperCase(),
    upiId: clean(resolved.upiId),
  };
}

export function useSiennaBankDetails(data: ProposalData): SiennaBankDetails {
  const [bank, setBank] = useState(() => resolveSiennaBankDetails(data));

  useEffect(() => {
    const sync = () => setBank(resolveSiennaBankDetails(data));
    sync();
    window.addEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [data]);

  return bank;
}

export function resolveSiennaBrand(data: ProposalData): string {
  if (typeof window !== "undefined") {
    try {
      const settings = readProposalBrandingSettings();
      const fromMore =
        clean(resolveInstallerDisplayName(settings)) ||
        clean(settings.companyProfile?.legalName);
      if (fromMore) return fromMore;
    } catch {
      /* ignore */
    }
  }

  for (const raw of [
    data.closing?.installerName,
    data.meta?.brandName,
    data.execution?.bank?.company,
  ]) {
    const v = clean(raw);
    if (v) return v;
  }
  return "";
}

export function useSiennaBrand(data: ProposalData): string {
  const [name, setName] = useState(() => resolveSiennaBrand(data));

  useEffect(() => {
    const sync = () => setName(resolveSiennaBrand(data));
    sync();
    window.addEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [data]);

  return name;
}

/** Logo from proposal snapshot → adapter prop → More → Brand & proposals. */
export function resolveSiennaLogoUrl(
  data: ProposalData,
  installerLogoUrl?: string
): string {
  const fromData = data.meta?.brandLogoUrl?.trim() ?? "";
  const fromProp = installerLogoUrl?.trim() ?? "";
  if (fromData) return fromData;
  if (fromProp) return fromProp;
  if (typeof window !== "undefined") {
    try {
      const fromLocal =
        readProposalBrandingSettings().installerLogoUrl?.trim() ?? "";
      if (fromLocal) return fromLocal;
    } catch {
      /* ignore */
    }
  }
  return "";
}

export function useSiennaLogoUrl(
  data: ProposalData,
  installerLogoUrl?: string
): string {
  const [logoUrl, setLogoUrl] = useState(() =>
    resolveSiennaLogoUrl(data, installerLogoUrl)
  );

  useEffect(() => {
    const sync = () => setLogoUrl(resolveSiennaLogoUrl(data, installerLogoUrl));
    sync();
    window.addEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [data, installerLogoUrl]);

  return logoUrl;
}

export function useSiennaSurfaceBrand(
  data: ProposalData,
  surface: ProposalBrandSurface,
  installerLogoUrl?: string
): ProposalBrandPresentation {
  const installerName = useSiennaBrand(data);
  const logoUrl = useSiennaLogoUrl(data, installerLogoUrl);
  const [brandTick, setBrandTick] = useState(0);

  useEffect(() => {
    const sync = () => setBrandTick((n) => n + 1);
    window.addEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const liveSettings =
    typeof window !== "undefined" ? readProposalBrandingSettings() : null;
  // More-tab save should update this browser's preview immediately.
  // Shared links (empty local settings) still use the frozen snapshot.
  const hasLiveBrand = Boolean(
    liveSettings &&
      (liveSettings.installerLogoUrl?.trim() || liveSettings.installerName?.trim())
  );
  const config = resolveProposalBrandConfig({
    settings: liveSettings,
    pptInput: hasLiveBrand
      ? undefined
      : {
          brandDisplayMode: data.meta.brandDisplayMode,
          brandSectionConfig: data.meta.brandSectionConfig,
        },
  });
  void brandTick;

  return resolveProposalBrandPresentation(config, surface, {
    installerName,
    logoUrl,
    tagline: data.meta.brandTagline,
  });
}

export function splitSiennaWordmark(brandName: string): {
  head: string;
  tail: string;
} {
  const parts = brandName.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return { head: brandName.trim(), tail: "" };
  return { head: parts.slice(0, -1).join(" "), tail: parts[parts.length - 1] };
}

/** Inner-page mark: company name from More / snapshot, never “Sienna”. */
export function SiennaDocFooter({
  data,
  page,
}: {
  data: ProposalData;
  page: string;
}) {
  const brand = useSiennaBrand(data);
  return (
    <div className={styles.pageFooter}>
      {brand ? `${brand} · ${page}` : page}
    </div>
  );
}

/** Bound folio frame: laterite spine + body. Cover and close stay bleed. */
export function SiennaSheet({
  data,
  page,
  chapter,
  children,
}: {
  data: ProposalData;
  page: string;
  chapter: string;
  children: ReactNode;
}) {
  return (
    <section className={`${styles.a4Sienna} ${styles.folio}`}>
      <aside className={styles.spine} aria-hidden>
        <span className={styles.spineChapter}>{chapter}</span>
        <span className={styles.spinePage}>{page}</span>
      </aside>
      <div className={styles.folioMain}>
        {children}
        <SiennaDocFooter data={data} page={page} />
      </div>
    </section>
  );
}
