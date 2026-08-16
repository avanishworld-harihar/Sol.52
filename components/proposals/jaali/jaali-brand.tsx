"use client";

/**
 * Jaali branding — More → Brand & proposals, then proposal snapshot, then adapter prop.
 * Never invent a company name or logo.
 */

import { useEffect, useState, type ReactNode } from "react";
import type { ProposalData } from "@/lib/proposal-data";
import styles from "./Jaali.module.css";
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

export type JaaliBankDetails = {
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
export function resolveJaaliBankDetails(data: ProposalData): JaaliBankDetails {
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

  const accountName = clean(resolved.accountName) || resolveJaaliBrand(data);

  return {
    accountName,
    accountNumber: clean(resolved.accountNumber),
    ifsc: clean(resolved.ifsc).toUpperCase(),
    upiId: clean(resolved.upiId),
  };
}

export function useJaaliBankDetails(data: ProposalData): JaaliBankDetails {
  const [bank, setBank] = useState(() => resolveJaaliBankDetails(data));

  useEffect(() => {
    const sync = () => setBank(resolveJaaliBankDetails(data));
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

export function resolveJaaliBrand(data: ProposalData): string {
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

export function useJaaliBrand(data: ProposalData): string {
  const [name, setName] = useState(() => resolveJaaliBrand(data));

  useEffect(() => {
    const sync = () => setName(resolveJaaliBrand(data));
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
export function resolveJaaliLogoUrl(
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

export function useJaaliLogoUrl(
  data: ProposalData,
  installerLogoUrl?: string
): string {
  const [logoUrl, setLogoUrl] = useState(() =>
    resolveJaaliLogoUrl(data, installerLogoUrl)
  );

  useEffect(() => {
    const sync = () => setLogoUrl(resolveJaaliLogoUrl(data, installerLogoUrl));
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

export function useJaaliSurfaceBrand(
  data: ProposalData,
  surface: ProposalBrandSurface,
  installerLogoUrl?: string
): ProposalBrandPresentation {
  const installerName = useJaaliBrand(data);
  const logoUrl = useJaaliLogoUrl(data, installerLogoUrl);
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

export function splitJaaliWordmark(brandName: string): {
  head: string;
  tail: string;
} {
  const parts = brandName.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return { head: brandName.trim(), tail: "" };
  return { head: parts.slice(0, -1).join(" "), tail: parts[parts.length - 1] };
}

/** Inner-page mark: company name from More / snapshot, never “Jaali”. */
export function JaaliDocFooter({
  data,
  page,
}: {
  data: ProposalData;
  page: string;
}) {
  const brand = useJaaliBrand(data);
  return (
    <div className={styles.pageFooter}>
      {brand ? `${brand} · ${page}` : page}
    </div>
  );
}

/** Courtyard frame: brass jali lattice on top, sandstone wall, cream courtyard. */
export function JaaliSheet({
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
    <section className={`${styles.a4Jaali} ${styles.folio}`}>
      <header className={styles.dyeBand}>
        <span className={styles.dyeGutter} aria-hidden />
        <span className={styles.dyeChapter}>{chapter}</span>
        <span className={styles.dyePage}>{page}</span>
      </header>
      <div className={styles.folioMain}>
        {children}
        <JaaliDocFooter data={data} page={page} />
      </div>
    </section>
  );
}
