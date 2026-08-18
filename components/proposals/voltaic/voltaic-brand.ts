"use client";

/**
 * Voltaic branding — More → Company profile first on live preview,
 * then the frozen proposal snapshot. Never invent a company name or logo.
 */

import { useEffect, useState } from "react";
import type { ProposalData } from "@/lib/proposal-data";
import type { PremiumProposalPptInput } from "@/lib/proposal-ppt";
import {
  PROPOSAL_BRANDING_UPDATED_EVENT,
  installerLogoAlt,
  parseProposalAmcYears,
  readProposalBrandingSettings,
  resolveCompanyGstNumber,
  resolveInstallerDisplayName,
  resolveProposalBankDetails,
  resolveProposalBrandConfig,
  resolveProposalBrandPresentation,
  type ProposalAmcYears,
  type ProposalBrandPresentation,
  type ProposalBrandSurface,
  type ProposalBrandingSettings,
  type ResolvedProposalBankDetails,
} from "@/lib/proposal-branding-settings";

const PLACEHOLDER =
  /^(solar\s*partner|सोलर\s*पार्टनर|vendor|installer|your\s*solar\s*partner|sol\.?52|—|-|n\/a|na)$/i;

function clean(value: string | undefined | null): string {
  const v = (value ?? "").trim();
  if (!v || PLACEHOLDER.test(v)) return "";
  return v;
}

function liveSettings(): ProposalBrandingSettings | null {
  if (typeof window === "undefined") return null;
  try {
    return readProposalBrandingSettings();
  } catch {
    return null;
  }
}

function hasLiveBrand(settings: ProposalBrandingSettings | null): boolean {
  return Boolean(
    settings &&
      (clean(settings.installerLogoUrl) ||
        clean(settings.installerName) ||
        clean(settings.companyProfile?.legalName))
  );
}

function hasLiveBank(settings: ProposalBrandingSettings | null): boolean {
  return Boolean(
    settings &&
      (clean(settings.bankAccountName) ||
        clean(settings.bankAccountNumber) ||
        clean(settings.bankIfsc) ||
        clean(settings.bankUpiId) ||
        clean(settings.bankBranch) ||
        clean(settings.paymentQrCodeUrl))
  );
}

export function resolveVoltaicBrandName(data: ProposalData): string {
  const settings = liveSettings();
  if (hasLiveBrand(settings) && settings) {
    const fromMore =
      clean(resolveInstallerDisplayName(settings)) ||
      clean(settings.companyProfile?.legalName);
    if (fromMore) return fromMore;
  }

  for (const raw of [
    data.closing?.installerName,
    data.meta?.brandName,
    data.execution?.bank?.company,
  ]) {
    const v = clean(raw);
    if (v) return v;
  }

  if (settings) {
    return (
      clean(resolveInstallerDisplayName(settings)) ||
      clean(settings.companyProfile?.legalName)
    );
  }
  return "";
}

export function resolveVoltaicLogoUrl(
  data: ProposalData,
  installerLogoUrl?: string
): string {
  const settings = liveSettings();
  const fromSettings = clean(settings?.installerLogoUrl);
  const fromData = clean(data.meta?.brandLogoUrl);
  const fromProp = clean(installerLogoUrl);

  if (hasLiveBrand(settings) && fromSettings) return fromSettings;
  return fromData || fromProp || fromSettings;
}

export function resolveVoltaicBankDetails(
  data: ProposalData,
  pptInput?: PremiumProposalPptInput | null
): ResolvedProposalBankDetails {
  const settings = liveSettings();
  const ppt = pptInput?.bankDetails;
  const fromData = data.execution.bank;

  return resolveProposalBankDetails({
    pptBank: {
      accountName:
        clean(ppt?.accountName) || clean(fromData.company) || undefined,
      accountNumber:
        clean(ppt?.accountNumber) || clean(fromData.accountNumber) || undefined,
      ifsc: clean(ppt?.ifsc) || clean(fromData.ifsc) || undefined,
      branch: clean(ppt?.branch) || undefined,
      upiId: clean(ppt?.upiId) || clean(fromData.upiId) || undefined,
      paymentQrCodeUrl:
        clean(ppt?.paymentQrCodeUrl) ||
        clean(data.closing.qrUrl) ||
        undefined,
    },
    settings,
    preferSettings: hasLiveBank(settings),
  });
}

export function resolveVoltaicAmcYears(
  pptInput?: PremiumProposalPptInput | null,
  summaryAmc?: number | null
): ProposalAmcYears {
  const settings = liveSettings();
  if (hasLiveBrand(settings) && settings?.amcSelectedYears) {
    return parseProposalAmcYears(settings.amcSelectedYears);
  }
  return parseProposalAmcYears(
    pptInput?.amcSelectedYears ?? summaryAmc ?? settings?.amcSelectedYears ?? 1
  );
}

export function voltaicLogoAlt(brandName: string): string {
  return installerLogoAlt(brandName);
}

export function resolveVoltaicGst(
  data: ProposalData,
  pptInput?: PremiumProposalPptInput | null
): string {
  const settings = liveSettings();
  const fromSettings = settings ? clean(resolveCompanyGstNumber(settings)) : "";
  const fromPpt = clean(pptInput?.companyProfile?.gstNumber);
  const fromData = clean(data.closing.gstNumber) || clean(data.meta.brandGst);
  if (hasLiveBrand(settings) && fromSettings) return fromSettings;
  return fromData || fromPpt || fromSettings;
}

export function resolveVoltaicAddress(
  data: ProposalData,
  pptInput?: PremiumProposalPptInput | null
): string {
  const settings = liveSettings();
  const fromSettings = clean(settings?.companyProfile?.address);
  const fromPpt = clean(pptInput?.companyProfile?.address);
  const fromData = clean(data.closing.address) || clean(data.meta.brandAddress);
  if (hasLiveBrand(settings) && fromSettings) return fromSettings;
  return fromData || fromPpt || fromSettings;
}

export function useVoltaicBrandName(data: ProposalData): string {
  const [name, setName] = useState(() => resolveVoltaicBrandName(data));

  useEffect(() => {
    const sync = () => setName(resolveVoltaicBrandName(data));
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

export function useVoltaicLogoUrl(
  data: ProposalData,
  installerLogoUrl?: string
): string {
  const [logoUrl, setLogoUrl] = useState(() =>
    resolveVoltaicLogoUrl(data, installerLogoUrl)
  );

  useEffect(() => {
    const sync = () => setLogoUrl(resolveVoltaicLogoUrl(data, installerLogoUrl));
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

export function useVoltaicSurfaceBrand(
  data: ProposalData,
  surface: ProposalBrandSurface,
  installerLogoUrl?: string
): ProposalBrandPresentation {
  const installerName = useVoltaicBrandName(data);
  const logoUrl = useVoltaicLogoUrl(data, installerLogoUrl);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const sync = () => setTick((n) => n + 1);
    window.addEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const settings = liveSettings();
  const config = resolveProposalBrandConfig({
    settings,
    pptInput: hasLiveBrand(settings)
      ? undefined
      : {
          brandDisplayMode: data.meta.brandDisplayMode,
          brandSectionConfig: data.meta.brandSectionConfig,
        },
  });
  void tick;

  return resolveProposalBrandPresentation(config, surface, {
    installerName,
    logoUrl,
    tagline: clean(data.meta.brandTagline) || clean(settings?.companyProfile?.tagline),
  });
}

export function useVoltaicBankDetails(
  data: ProposalData,
  pptInput?: PremiumProposalPptInput | null
): ResolvedProposalBankDetails {
  const [bank, setBank] = useState(() => resolveVoltaicBankDetails(data, pptInput));

  useEffect(() => {
    const sync = () => setBank(resolveVoltaicBankDetails(data, pptInput));
    sync();
    window.addEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [data, pptInput]);

  return bank;
}

export type VoltaicIdentity = {
  brandName: string;
  logoUrl: string;
  logoAlt: string;
  cover: ProposalBrandPresentation;
  header: ProposalBrandPresentation;
  closing: ProposalBrandPresentation;
  bank: ResolvedProposalBankDetails;
  amcYears: ProposalAmcYears;
};

export function useVoltaicIdentity(
  data: ProposalData,
  installerLogoUrl?: string,
  pptInput?: PremiumProposalPptInput | null,
  summaryAmc?: number | null
): VoltaicIdentity {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const sync = () => setTick((n) => n + 1);
    window.addEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  void tick;

  const brandName = resolveVoltaicBrandName(data);
  const logoUrl = resolveVoltaicLogoUrl(data, installerLogoUrl);
  const settings = liveSettings();
  const config = resolveProposalBrandConfig({
    settings,
    pptInput: hasLiveBrand(settings)
      ? undefined
      : {
          brandDisplayMode: data.meta.brandDisplayMode,
          brandSectionConfig: data.meta.brandSectionConfig,
        },
  });
  const identity = {
    installerName: brandName,
    logoUrl,
    tagline: clean(data.meta.brandTagline) || clean(settings?.companyProfile?.tagline),
  };

  return {
    brandName,
    logoUrl,
    logoAlt: voltaicLogoAlt(brandName),
    cover: resolveProposalBrandPresentation(config, "cover", identity),
    header: resolveProposalBrandPresentation(config, "header", identity),
    closing: resolveProposalBrandPresentation(config, "closing", identity),
    bank: resolveVoltaicBankDetails(data, pptInput),
    amcYears: resolveVoltaicAmcYears(pptInput, summaryAmc),
  };
}
