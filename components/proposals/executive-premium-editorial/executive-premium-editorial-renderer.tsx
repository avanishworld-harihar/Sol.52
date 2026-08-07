"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PremiumProposalPptInput, ProposalDeckSummary } from "@/lib/proposal-ppt";
import type { ProposalLang } from "@/lib/proposal-i18n";
import { epGoldenCopy } from "@/lib/executive-premium-editorial/ep-golden-i18n";
import { transformToEditorialModel } from "@/lib/executive-premium-editorial/transform-to-editorial-model";
import {
  PROPOSAL_BRANDING_UPDATED_EVENT,
  readProposalBrandingSettings,
  resolveProposalBankDetails,
  resolveProposalBrandConfig,
  resolveProposalBrandPresentation,
} from "@/lib/proposal-branding-settings";
import { EpGoldenLangProvider } from "@/components/proposals/executive-premium-editorial/ep-golden-lang-context";
import { EpProposalShell } from "@/components/proposals/executive-premium-editorial/primitives/ep-proposal-shell";
import { EpCoverPage } from "@/components/proposals/executive-premium-editorial/pages/ep-cover-page";
import { EpBillPage } from "@/components/proposals/executive-premium-editorial/pages/ep-bill-page";
import { EpRequirementPage } from "@/components/proposals/executive-premium-editorial/pages/ep-requirement-page";
import { EpEconomicsPage } from "@/components/proposals/executive-premium-editorial/pages/ep-economics-page";
import { EpGenerationForecastPage } from "@/components/proposals/executive-premium-editorial/pages/ep-generation-forecast-page";
import { EpImpactPage } from "@/components/proposals/executive-premium-editorial/pages/ep-impact-page";
import { EpBomPage } from "@/components/proposals/executive-premium-editorial/pages/ep-bom-page";
import { EpEngineeringPage } from "@/components/proposals/executive-premium-editorial/pages/ep-engineering-page";
import { EpExecutionPage } from "@/components/proposals/executive-premium-editorial/pages/ep-execution-page";
import { EpTermsPages } from "@/components/proposals/executive-premium-editorial/pages/ep-terms-pages";
import { EpWarrantyPage } from "@/components/proposals/executive-premium-editorial/pages/ep-warranty-page";
import { EpClosingPage } from "@/components/proposals/executive-premium-editorial/pages/ep-closing-page";
import "@/components/proposals/executive-premium-editorial/ep-golden.css";
import { isProposalBillAuditBacked } from "@/lib/proposal-bill-audit-eligibility";
import {
  buildAtelierProposalPdf,
  downloadPdfFile,
  isAppleTouchDevice,
} from "@/components/proposals/_shared/residential-pdf-export";

export type ExecutivePremiumEditorialRendererProps = {
  pptInput: PremiumProposalPptInput;
  summary: ProposalDeckSummary;
};

/**
 * Executive Premium — Golden / Elite Luxury (engineering + warranty + terms).
 */
export function ExecutivePremiumEditorialRenderer({
  pptInput,
  summary,
}: ExecutivePremiumEditorialRendererProps) {
  const [lang, setLang] = useState<ProposalLang>(summary.lang ?? "en");
  const copy = epGoldenCopy(lang);
  const [brandingTick, setBrandingTick] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  useEffect(() => {
    const bump = () => setBrandingTick((n) => n + 1);
    window.addEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, bump);
    return () => window.removeEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, bump);
  }, []);

  const pptForModel = useMemo(() => {
    const settings =
      typeof window !== "undefined" ? readProposalBrandingSettings() : null;
    const bank = resolveProposalBankDetails({
      pptBank: pptInput.bankDetails,
      settings,
    });
    const hasBank =
      bank.accountName ||
      bank.accountNumber ||
      bank.ifsc ||
      bank.upiId ||
      bank.paymentQrCodeUrl;
    if (!hasBank && !settings?.installerLogoUrl?.trim() && !settings?.installerName?.trim()) {
      return pptInput;
    }
    return {
      ...pptInput,
      installerName: pptInput.installerName?.trim() || settings?.installerName?.trim() || undefined,
      installerLogoUrl:
        pptInput.installerLogoUrl?.trim() || settings?.installerLogoUrl?.trim() || undefined,
      installerTagline:
        pptInput.installerTagline?.trim() || settings?.companyProfile.tagline?.trim() || undefined,
      installerContact:
        pptInput.installerContact?.trim() ||
        (settings
          ? [settings.installerContact, settings.installerEmail]
              .map((s) => s.trim())
              .filter(Boolean)
              .join(" · ")
          : "") ||
        undefined,
      bankDetails: hasBank
        ? {
            accountName: bank.accountName || undefined,
            accountNumber: bank.accountNumber || undefined,
            ifsc: bank.ifsc || undefined,
            branch: bank.branch || undefined,
            upiId: bank.upiId || undefined,
            paymentQrCodeUrl: bank.paymentQrCodeUrl || undefined,
          }
        : pptInput.bankDetails,
    };
  }, [pptInput, brandingTick]);

  const model = useMemo(
    () => transformToEditorialModel(pptForModel, summary, lang),
    [pptForModel, summary, lang]
  );

  const brandConfig = useMemo(
    () => resolveProposalBrandConfig({ pptInput: pptForModel }),
    [pptForModel]
  );

  const [coverLogoUrl, setCoverLogoUrl] = useState<string | undefined>(() => {
    return model.brand_logo_url?.trim() || pptInput.installerLogoUrl?.trim() || undefined;
  });

  useEffect(() => {
    const sync = () => {
      const fromPpt = pptForModel.installerLogoUrl?.trim() ?? "";
      const fromLocal = readProposalBrandingSettings().installerLogoUrl?.trim() ?? "";
      setCoverLogoUrl(model.brand_logo_url?.trim() || fromPpt || fromLocal || undefined);
    };
    sync();
    window.addEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, sync);
    return () => window.removeEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, sync);
  }, [model.brand_logo_url, pptForModel.installerLogoUrl]);

  const identity = {
    installerName: model.brand_display,
    logoUrl: coverLogoUrl,
    tagline: model.brand_tagline,
  };
  const coverBrand = resolveProposalBrandPresentation(brandConfig, "cover", identity);
  const footerBrand = resolveProposalBrandPresentation(brandConfig, "footer", identity);
  const closingBrand = resolveProposalBrandPresentation(brandConfig, "closing", identity);

  const billAuditBacked = isProposalBillAuditBacked(pptInput);
  const handlePrint = async () => {
    if (typeof window === "undefined" || pdfBusy) return;
    if (isAppleTouchDevice() && rootRef.current) {
      setPdfBusy(true);
      try {
        downloadPdfFile(await buildAtelierProposalPdf({
          root: rootRef.current,
          customerName: model.customer_name,
          presetId: "residential_executive",
          pageSelector: ":scope > .ep-gl-toolbar + .ep-gl-doc-canvas > section, :scope > .ep-gl-doc-canvas > section",
        }));
      } finally {
        setPdfBusy(false);
      }
      return;
    }
    window.print();
  };

  return (
    <EpGoldenLangProvider
      lang={lang}
      footerBrand={footerBrand.showName ? footerBrand.installerName : undefined}
    >
      <div ref={rootRef} data-proposal-preset="residential_executive" className={`ep-golden-root w-full${lang === "hi" ? " lang-hi" : ""}`}>
        <EpProposalShell
          lang={lang}
          onLangToggle={() => setLang((l) => (l === "en" ? "hi" : "en"))}
          langToggleLabel={copy.toolbar.langToggle}
          printLabel={copy.toolbar.printPdf}
          presetLabel={copy.toolbar.preset}
          onPrint={handlePrint}
        >
          <div className="ep-gl-doc-canvas">
            <EpCoverPage
              data={{
                brand_display: model.brand_display,
                brand_logo_url: coverLogoUrl,
                brand_tagline: model.brand_tagline,
                customer_name: model.customer_name,
                location_line: model.location_line,
                asset_profile_line: model.asset_profile_line,
              }}
              showLogo={coverBrand.showLogo}
              showName={coverBrand.showName}
              showTagline={coverBrand.showTagline}
            />
            {billAuditBacked ? (
              <EpBillPage data={model.bill} />
            ) : (
              <EpRequirementPage
                systemKw={summary.systemKw}
                coveragePct={summary.coverage}
                assetProfileLine={model.asset_profile_line}
                annualGenKwh={summary.annualGen}
              />
            )}
            <EpEconomicsPage data={model.economics} />
            <EpGenerationForecastPage data={model.generation} />
            <EpImpactPage data={model.impact} />
            <EpEngineeringPage data={model.engineering} />
            <EpBomPage bomRows={model.architecture.bom_rows} />
            <EpWarrantyPage data={model.warranty} />
            <EpExecutionPage data={model.execution} />
            <EpTermsPages data={model.terms} />
            <EpClosingPage
              data={model.closing}
              showLogo={closingBrand.showLogo}
              showName={closingBrand.showName}
              logoUrl={coverLogoUrl}
            />
          </div>
        </EpProposalShell>
      </div>
    </EpGoldenLangProvider>
  );
}
