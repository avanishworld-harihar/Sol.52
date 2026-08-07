"use client";

/**
 * Atelier — Investment Blueprint (High-Conversion Sales Journey)
 * Flow: [Cover] → [Bill Audit?] → [Wealth Projection] → [25-Year Savings]
 *       → [Roof] → [Generation] → [Monthly Forecast] → [Hardware] → [Why Us]
 *       → [Impact] → [Roadmap/Payment] → [Compliance] → [Closing]
 *
 * ProposalData-native · Print A4 · 13 pages (14 with bill audit)
 * break-after: page (print only)
 */

import { useEffect, useRef, useState } from "react";
import type { ProposalData } from "@/lib/proposal-data";
import type { PremiumProposalPptInput } from "@/lib/proposal-ppt";
import { formatInr, formatInrCompact } from "@/components/proposals/_shared/formatters";
import {
  normalizeBrandCompareSelection,
  resolveBrandCompareSnapshot,
} from "@/lib/brand-compare-helpers";
import {
  PROPOSAL_BRANDING_UPDATED_EVENT,
  readProposalBrandingSettings,
  resolveProposalBrandConfig,
  resolveProposalBrandPresentation,
  resolveInstallerDisplayName,
  resolveProposalBankDetails,
} from "@/lib/proposal-branding-settings";
import {
  getAtelierCopy,
  type AtelierLang,
} from "./atelier-copy";
import { isDarkLogoUrl } from "./atelier-dark-logo";
import { AtelierBillAudit } from "./atelier-bill-audit";
import { AtelierBrandCompare } from "./atelier-brand-compare";
import { AtelierBlueprintArray } from "./atelier-blueprint-array";
import { buildAtelierForecastMonths } from "./atelier-generation-forecast";
import { HwCardIcon, HwIconEarth, type HwIconKey } from "./atelier-hw-icons";
import { TrustCardIcon } from "./atelier-trust-icons";
import {
  ImpactIconCar,
  ImpactIconLeaf,
  ImpactIconRoof,
  ImpactIconTrees,
} from "./atelier-impact-icons";
import {
  WealthIconGrow,
  WealthIconPaid,
  WealthIconPay,
} from "./atelier-wealth-icons";
import {
  buildAtelierProposalPdf,
  isAppleTouchDevice,
  sharePdfFile,
  type AtelierPdfFile,
} from "./atelier-proposal-pdf";
import styles from "./atelier.module.css";

function folio(n: number, total: number): string {
  return `${String(n).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
}

/** Rewrite leading "NN — " page index in copy tags when bill audit shifts the deck. */
function withPageTag(tag: string, n: number): string {
  return tag.replace(/^\d+\s*—\s*/, `${String(n).padStart(2, "0")} — `);
}

function bomByHint(data: ProposalData, hints: RegExp[]) {
  return data.bom.find((b) =>
    hints.some((h) => h.test(`${b.name} ${b.spec} ${b.brand}`))
  );
}
function bomLine(
  item: ProposalData["bom"][number] | undefined,
  fallback: string
) {
  if (!item) return fallback;
  const p = [item.brand, item.spec].filter(Boolean);
  return p.length > 0 ? p.join(" — ") : item.name || fallback;
}

/** Sets customer expectations even when the ProposalData step has no
 * explicit duration — keyword-matched against English titles from data. */
function estimateDuration(
  title: string,
  durations: ReturnType<typeof getAtelierCopy>["durations"]
): string {
  const t = title.toLowerCase();
  // Match English titles from ProposalData and Hindi fallback titles
  if (/survey|सर्वे/.test(t)) return durations.survey;
  if (/design|sld|डिज़ाइन|एसएलडी/.test(t)) return durations.design;
  if (/approv|subsidy|meter|discom|अनुमोदन/.test(t)) return durations.approvals;
  if (/material|delivery|procurement|सामग्री|डिलीवरी/.test(t))
    return durations.material;
  if (/install|स्थापना/.test(t)) return durations.install;
  if (/test|commission|कमीशनिंग/.test(t)) return durations.commission;
  return durations.default;
}

export type AtelierRendererProps = {
  data: ProposalData;
  installerLogoUrl?: string;
  pptInput?: PremiumProposalPptInput | null;
};

export function AtelierRenderer({
  data,
  installerLogoUrl,
  pptInput,
}: AtelierRendererProps) {
  const [lang, setLang] = useState<AtelierLang>("en");
  const c = getAtelierCopy(lang);
  const isHi = lang === "hi";
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfProgress, setPdfProgress] = useState("");
  const [pdfReady, setPdfReady] = useState<AtelierPdfFile | null>(null);
  const [pdfSharing, setPdfSharing] = useState(false);

  const [logoUrl, setLogoUrl] = useState<string | undefined>(() => {
    return data?.meta.brandLogoUrl?.trim() || installerLogoUrl?.trim() || undefined;
  });
  const [brandConfig, setBrandConfig] = useState(() =>
    resolveProposalBrandConfig({
      pptInput,
      settings: typeof window !== "undefined" ? readProposalBrandingSettings() : null,
    })
  );
  const [logoNeedsPlate, setLogoNeedsPlate] = useState(false);

  useEffect(() => {
    const sync = () => {
      const settings = readProposalBrandingSettings();
      const fromData = data?.meta.brandLogoUrl?.trim() ?? "";
      const fromProp = installerLogoUrl?.trim() ?? "";
      const fromLocal = settings.installerLogoUrl?.trim() ?? "";
      setLogoUrl(fromData || fromProp || fromLocal || undefined);
      setBrandConfig(resolveProposalBrandConfig({ pptInput, settings }));
    };
    sync();
    window.addEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, sync);
    return () => window.removeEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, sync);
  }, [data?.meta.brandLogoUrl, installerLogoUrl, pptInput]);

  useEffect(() => {
    let cancelled = false;
    setLogoNeedsPlate(false);
    const url = logoUrl?.trim();
    if (!url) return;
    void isDarkLogoUrl(url).then((dark) => {
      if (!cancelled) setLogoNeedsPlate(dark);
    });
    return () => {
      cancelled = true;
    };
  }, [logoUrl]);

  // ── Core derivations ─────────────────────────────────────────
  // Prefer real company name; treat generic "Solar Partner" as unset
  const settingsName =
    typeof window !== "undefined"
      ? resolveInstallerDisplayName(readProposalBrandingSettings())
      : "";
  const rawBrand =
    data.meta.brandName?.trim() ||
    data.closing.installerName?.trim() ||
    settingsName ||
    "";
  const brand =
    !rawBrand || /^solar\s*partner$/i.test(rawBrand)
      ? rawBrand || "Solar Partner"
      : rawBrand;

  const coverBrand = resolveProposalBrandPresentation(brandConfig, "cover", {
    installerName: brand,
    logoUrl,
    tagline: data.meta.brandTagline,
  });
  const closingBrand = resolveProposalBrandPresentation(brandConfig, "closing", {
    installerName: brand,
    logoUrl,
    tagline: data.meta.brandTagline || data.closing.brandTagline,
  });
  const footerBrand = resolveProposalBrandPresentation(brandConfig, "footer", {
    installerName: brand,
    logoUrl,
  });
  const clientName =
    data.meta.customerName?.trim() || c.fallbacks.valuedCustomer;
  const location =
    data.meta.locationLine && data.meta.locationLine !== "—"
      ? data.meta.locationLine
      : "Madhya Pradesh";
  const city = location.split(",")[0]?.trim() || location;
  const systemKw = data.meta.systemKw;
  const systemSize = systemKw > 0 ? `${systemKw} kW` : "—";
  const brandCatalog =
    pptInput?.residentialConfig?.brandCatalog ??
    pptInput?.sharedPlantCatalog ??
    null;
  const brandCompareSelection = normalizeBrandCompareSelection(
    pptInput?.residentialConfig?.brandCompare,
    brandCatalog
  );
  const brandCompareSnapshot =
    brandCompareSelection.enabled && systemKw > 0
      ? resolveBrandCompareSnapshot(
          brandCatalog,
          brandCompareSelection.brandIdA,
          brandCompareSelection.brandIdB,
          systemKw
        )
      : null;
  const annualGen =
    data.closing.annualUnits > 0 ? data.closing.annualUnits : 0;
  const grossInr = data.economics.grossInr;
  const subsidyInr = data.economics.subsidyInr;
  const netInr = data.economics.netInr;
  const paybackYears = data.economics.paybackYears;
  const monthlyInr = data.economics.monthlySavingsInr;
  const co2 = Math.round(data.impact.co2Tons || 0);
  const trees = data.impact.treesEquivalent || 0;
  const annualSavings =
    data.closing.annualSavingsInr > 0
      ? data.closing.annualSavingsInr
      : monthlyInr * 12;
  const yearOneSavings =
    monthlyInr > 0 ? monthlyInr * 12 : annualSavings;
  const bill = data.bill;
  const forecastAnnualUnits =
    annualGen > 0
      ? annualGen
      : systemKw > 0
        ? Math.round(systemKw * 5 * 0.75 * 365)
        : 0;
  const showForecastBillBars =
    bill.hasData && bill.months.some((m) => (m.units || 0) > 0);
  const forecastMonths = buildAtelierForecastMonths(
    forecastAnnualUnits,
    yearOneSavings,
    {
      billMonths: bill.months,
      includeBillSeries: showForecastBillBars,
    }
  );
  const effectiveSavingPerUnit =
    forecastAnnualUnits > 0 && yearOneSavings > 0
      ? yearOneSavings / forecastAnnualUnits
      : 0;
  const lifetimeWealth = data.closing.lifetimeWealthInr;
  const tilt = data.engineering.tiltDeg ?? 20;
  const cityLabel = data.engineering.cityLabel || city;
  const contact = data.closing.contactLine?.trim() || "";
  const brandAddress = data.closing.address || data.meta.brandAddress;
  const brandGst = data.closing.gstNumber || data.meta.brandGst;
  const contactPerson = data.closing.contactPerson;

  // ── Bill audit (bill-based proposals only) ────────────────────
  const showBillAudit = bill.hasData && bill.months.length > 0;
  const totalPages = showBillAudit ? 14 : 13;
  const off = showBillAudit ? 1 : 0;
  const pn = {
    cover: 1,
    bill: 2,
    finance: 2 + off,
    wealth: 3 + off,
    roof: 4 + off,
    gen: 5 + off,
    forecast: 6 + off,
    hw: 7 + off,
    trust: 8 + off,
    impact: 9 + off,
    roadmap: 10 + off,
    terms1: 11 + off,
    terms2: 12 + off,
    closing: 13 + off,
  };

  // ── New financial calculations ────────────────────────────────
  const monthlyBill =
    bill.yearlyBillInr > 0
      ? Math.round(bill.yearlyBillInr / 12)
      : annualSavings > 0
        ? Math.round(annualSavings / 12 / 0.8)
        : 5200;
  // Simple 5-yr EMI at ~9%
  const r = 0.09 / 12;
  const monthlyEmi =
    netInr > 0 ? Math.round((netInr * r) / (1 - Math.pow(1 + r, -60))) : 0;
  const monthlyProfit = monthlyBill - monthlyEmi;

  // Investment grade
  const investScore =
    paybackYears <= 3.5
      ? "AAA"
      : paybackYears <= 5
        ? "AA+"
        : paybackYears <= 6.5
          ? "AA"
          : "A+";
  const investGrade =
    paybackYears <= 3.5
      ? c.investGrade.exceptional
      : paybackYears <= 5
        ? c.investGrade.veryHigh
        : paybackYears <= 6.5
          ? c.investGrade.high
          : c.investGrade.aboveAvg;

  // Wealth milestones (25-yr projection)
  const totalWealth =
    lifetimeWealth > 0 ? lifetimeWealth : annualSavings * 25;
  const wealthMilestones = [5, 10, 15, 20, 25].map((yr) => ({
    year: yr,
    savings: Math.round(annualSavings * yr),
    pct:
      totalWealth > 0
        ? Math.min(100, Math.round((annualSavings * yr * 100) / totalWealth))
        : yr * 4,
  }));

  // Panel count
  const panelWp = (() => {
    if (!data.bom[0]?.spec) return 580;
    const m = data.bom[0].spec.match(/(\d{3,4})\s*[Ww]/);
    return m ? parseInt(m[1]) : 580;
  })();
  const panelCount = systemKw > 0 ? Math.ceil((systemKw * 1000) / panelWp) : 9;
  /** India rooftop rule-of-thumb incl. walkways: ~100 sq ft per kWp, scaled to panel Wp. */
  const roofSqftPerKwp = 100;
  const dcKwp = (panelCount * panelWp) / 1000;
  const roofAreaSqft = Math.max(
    1,
    Math.ceil(dcKwp * roofSqftPerKwp)
  );
  const sqftPerPanel = Math.max(
    1,
    Math.round(roofAreaSqft / Math.max(1, panelCount))
  );

  // BOM
  const panelItem =
    bomByHint(data, [/panel/i, /module/i, /waaree/i]) || data.bom[0];
  const inverterItem =
    bomByHint(data, [/inverter/i, /havells/i, /polycab/i]) || data.bom[1];
  const structureItem =
    bomByHint(data, [/mount/i, /structure/i, /jsw/i]) || data.bom[2];
  const protectionItem =
    bomByHint(data, [/protect/i, /acdb/i, /dcdb/i, /safety/i]) || data.bom[3];

  // Engineering metrics
  const engMetrics =
    data.engineering.metrics.length > 0
      ? data.engineering.metrics
          .slice(0, 6)
          .map((m) => [m.label, m.value] as [string, string])
      : ([
          [
            c.engMetricLabels.dcCapacity,
            systemKw > 0 ? `${(systemKw * 1.04).toFixed(2)} kWp` : "—",
          ],
          [c.engMetricLabels.acCapacity, systemSize],
          [c.engMetricLabels.performanceRatio, "75%"],
          [c.engMetricLabels.specificYield, "1440 kWh/kWp/yr"],
          [c.engMetricLabels.peakSunHours, c.engMetricLabels.peakSunValue],
          [c.engMetricLabels.panelTilt(cityLabel), `${tilt}°`],
        ] as [string, string][]);

  const standards =
    data.engineering.standards.length > 0
      ? data.engineering.standards
      : [
          "IEC 61215 / IEC 61730",
          "BIS IS 14286",
          "MNRE ALMM",
          "IEC 62109",
          "IS 3043 (Earthing)",
          "IS/IEC 62446",
        ];

  // Warranty
  const warrantyCards =
    data.warranty.highlights.length > 0
      ? data.warranty.highlights.slice(0, 4).map((h) => ({
          years: h.value,
          label: h.label,
          sub: h.unit,
        }))
      : c.warrantyFallback;

  // Journey
  const journey =
    data.execution.steps.length > 0
      ? data.execution.steps
          .slice(0, 6)
          .map((s) => ({ num: s.num, title: s.title, desc: s.description }))
      : c.journeyFallback;

  // Payments
  const payments =
    data.execution.payments.length > 0
      ? data.execution.payments
      : c.paymentsFallback.map((p) => ({
          label: p.label,
          pctLabel: p.pctLabel,
          amountInr:
            p.pctLabel === "25%"
              ? Math.round(netInr * 0.25)
              : p.pctLabel === "50%"
                ? Math.round(netInr * 0.5)
                : p.pctLabel === "20%"
                  ? Math.round(netInr * 0.2)
                  : Math.round(netInr * 0.05),
        }));

  const generalTerms = c.generalTerms;
  const docs =
    data.terms.documents.length > 0
      ? data.terms.documents.slice(0, 6)
      : c.docs;
  const safetyNotes = c.safetyNotes;
  const clientScope = c.clientScope;
  const amcObjective = data.terms.amcObjective?.trim() || c.amcObjective;

  const isAmcPlanLabel = (s: string) =>
    /\d+\s*-?\s*year\s*amc|amc\s*option/i.test(s);
  const isExclusionNote = (s: string) =>
    /exclud|does not include|not covered|physical damage|third-party|misuse|theft|vandal|glass replacement/i.test(
      s
    );
  const isCommercialNote = (s: string) =>
    /payable|charges|duration|force majeure|half-yearly|escalat|contract|extend/i.test(
      s
    );

  const scopeRaw =
    data.terms.amcScope.length > 0 ? data.terms.amcScope : c.amcIncludes;
  const planOptions = scopeRaw.filter(isAmcPlanLabel).slice(0, 3);
  const includeItems = scopeRaw.filter(
    (s) =>
      !isAmcPlanLabel(s) &&
      !/^annual maintenance contract/i.test(s) &&
      !/^amc includes/i.test(s)
  );
  const amcIncludes = (
    includeItems.length > 0 ? includeItems : c.amcIncludes
  ).slice(0, 4);

  const notesRaw =
    data.terms.amcTerms.length > 0
      ? data.terms.amcTerms
      : [...c.amcExcludes, ...c.amcCommercial];
  const amcExcludes = (
    notesRaw.filter(isExclusionNote).length > 0
      ? notesRaw.filter(isExclusionNote)
      : c.amcExcludes
  ).slice(0, 3);
  const amcCommercial = (
    notesRaw.filter((s) => !isExclusionNote(s) && isCommercialNote(s)).length >
    0
      ? notesRaw.filter((s) => !isExclusionNote(s) && isCommercialNote(s))
      : c.amcCommercial
  ).slice(0, 2);

  const invoiceBase =
    grossInr > 0 ? grossInr : netInr > 0 ? netInr : 0;
  const invoiceRef = invoiceBase > 0 ? formatInr(invoiceBase) : "";

  // Vendor bank — More → Banking first, then frozen ppt / deck
  void brandConfig;
  const pptBank = pptInput?.bankDetails;
  const vendorBank = resolveProposalBankDetails({
    pptBank: {
      accountName:
        pptBank?.accountName || data.execution.bank.company || undefined,
      accountNumber:
        pptBank?.accountNumber ||
        data.execution.bank.accountNumber ||
        undefined,
      ifsc: pptBank?.ifsc || data.execution.bank.ifsc || undefined,
      branch: pptBank?.branch || undefined,
      upiId: pptBank?.upiId || data.execution.bank.upiId || undefined,
      paymentQrCodeUrl: pptBank?.paymentQrCodeUrl || undefined,
    },
    settings:
      typeof window !== "undefined" ? readProposalBrandingSettings() : null,
    preferSettings: true,
  });
  const bankName = vendorBank.accountName.trim() || brand;
  const hasVendorBank = Boolean(
    vendorBank.accountNumber || vendorBank.ifsc || vendorBank.upiId
  );
  const formatAc = (raw: string) => {
    const digits = raw.replace(/\s+/g, "");
    if (!/^\d{9,18}$/.test(digits)) return raw;
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
  };

  useEffect(() => {
    if (typeof document === "undefined") return;
    const STYLE_ID = "atelier-print-page-box";
    const IOS_CLASS = "atelier-print-ios";

    const isAppleTouchPrint = () => {
      const nav = window.navigator;
      const ua = nav.userAgent || "";
      // iPadOS 13+ reports as MacIntel with touch
      const iPadDesktopUa =
        nav.platform === "MacIntel" && (nav.maxTouchPoints || 0) > 1;
      return /iPad|iPhone|iPod/i.test(ua) || iPadDesktopUa;
    };

    const ensurePrintPageBox = () => {
      const ios = isAppleTouchPrint();
      document.documentElement.classList.toggle(IOS_CLASS, ios);

      let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
      if (!el) {
        el = document.createElement("style");
        el.id = STYLE_ID;
      }
      // Re-append so this sheet wins cascade over globals.css / CSS modules.
      document.head.appendChild(el);

      /*
       * iPad / iOS Safari:
       * 1) Often ignores @page { margin: 0 } → keeps ~8–10mm → 210×297mm sheets shrink
       *    (white bands + wrong pagination, as in print preview).
       * 2) break-after: page inserts a blank sheet after every section (~2× page count).
       * Fit sheets inside a 10mm page margin and paginate with break-before only.
       */
      el.textContent = ios
        ? `
@media print {
  @page { size: A4; margin: 10mm; }
  html, body, #proposal-route-root {
    margin: 0 !important;
    padding: 0 !important;
    width: auto !important;
    max-width: none !important;
    height: auto !important;
    min-height: 0 !important;
    overflow: visible !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  [data-atelier-root] {
    width: 190mm !important;
    max-width: 190mm !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: visible !important;
    background: #fff !important;
  }
  [data-atelier-root] > section {
    width: 190mm !important;
    max-width: 190mm !important;
    height: 277mm !important;
    min-height: 277mm !important;
    max-height: 277mm !important;
    margin: 0 !important;
    padding: 10mm 11mm 11mm !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
    page-break-after: auto !important;
    break-after: auto !important;
    page-break-before: auto !important;
    break-before: auto !important;
    page-break-inside: auto !important;
    break-inside: auto !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  [data-atelier-root] > section + section {
    page-break-before: always !important;
    break-before: page !important;
  }
}
`
        : `
@media print {
  @page { size: A4; margin: 0; }
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    height: auto !important;
    overflow: visible !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}`;
    };

    ensurePrintPageBox();
    const onBeforePrint = () => {
      ensurePrintPageBox();
      window.scrollTo(0, 0);
    };
    window.addEventListener("beforeprint", onBeforePrint);
    return () => {
      window.removeEventListener("beforeprint", onBeforePrint);
      document.documentElement.classList.remove(IOS_CLASS);
      document.getElementById(STYLE_ID)?.remove();
    };
  }, []);

  const handleDownloadPdf = async () => {
    if (typeof window === "undefined" || pdfBusy) return;

    /*
     * Desktop: window.print() → Save as PDF (native engine, best colors).
     * iPad/iOS: page-capture PDF + Share sheet. Safari window.print() shrinks,
     * clips footers, and drops colors; blob: URLs break the proposal tab.
     * Capture runs in #atelier-pdf-capture-host only — live layout unchanged.
     */
    if (!isAppleTouchDevice()) {
      window.scrollTo(0, 0);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => window.print());
      });
      return;
    }

    const root = rootRef.current;
    if (!root) return;

    setPdfBusy(true);
    setPdfProgress(c.print.preparingPdf);
    setPdfReady(null);
    try {
      window.scrollTo(0, 0);
      const file = await buildAtelierProposalPdf({
        root,
        customerName: data.meta.customerName?.trim() || clientName,
        onProgress: ({ current, total }) => {
          setPdfProgress(`${c.print.preparingPdf} ${current}/${total}`);
        },
      });
      setPdfReady(file);
    } catch (err) {
      console.error("[atelier-pdf]", err);
      window.alert(c.print.pdfFailed);
    } finally {
      setPdfBusy(false);
      setPdfProgress("");
    }
  };

  const handleSharePdf = async () => {
    if (!pdfReady || pdfSharing) return;
    setPdfSharing(true);
    try {
      await sharePdfFile(pdfReady);
    } catch (err) {
      console.error("[atelier-pdf-share]", err);
      window.alert(c.print.pdfShareFailed);
    } finally {
      setPdfSharing(false);
    }
  };

  // ── JSX ──────────────────────────────────────────────────────
  return (
    <div
      ref={rootRef}
      data-atelier-root
      className={`${styles.wrapper}${isHi ? ` ${styles.langHi}` : ""}`}
    >
      <style>{`
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Lato:wght@300;400;700&display=swap');
@media print {
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    height: auto !important;
    overflow: visible !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  /*
   * Desktop Chromium: full-bleed A4 via margin:0 + named pages.
   * iPad overrides are injected into #atelier-print-page-box (see useEffect).
   */
  @page { size: A4; margin: 0; }
  @page atelier-sheet { size: A4; margin: 0; }
  @page atelier-cover { size: A4; margin: 0; }
  @page atelier-closing { size: A4; margin: 0; }
}
`}</style>

      {/* Sticky print bar */}
      <div className={styles.printBar} data-atelier-print-bar>
        <div className={styles.printBarInner}>
          <span className={styles.printBarBrand}>{brand}</span>
          <div className={styles.printBarActions}>
            <div className={styles.langToggle} role="group" aria-label="Language">
              <button
                type="button"
                className={`${styles.langBtn}${lang === "en" ? ` ${styles.langBtnActive}` : ""}`}
                onClick={() => setLang("en")}
                aria-pressed={lang === "en"}
              >
                {c.print.langEn}
              </button>
              <button
                type="button"
                className={`${styles.langBtn}${lang === "hi" ? ` ${styles.langBtnActive}` : ""}`}
                onClick={() => setLang("hi")}
                aria-pressed={lang === "hi"}
              >
                {c.print.langHi}
              </button>
            </div>
            <button
              type="button"
              onClick={() => void handleDownloadPdf()}
              className={styles.printBarBtn}
              disabled={pdfBusy}
              aria-busy={pdfBusy}
            >
              {pdfBusy ? pdfProgress || c.print.preparingPdf : c.print.downloadPdf}
            </button>
          </div>
        </div>
      </div>

      {pdfReady ? (
        <div
          className={styles.pdfReadyOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="atelier-pdf-ready-title"
        >
          <div className={styles.pdfReadyCard}>
            <h3 id="atelier-pdf-ready-title" className={styles.pdfReadyTitle}>
              {c.print.pdfReadyTitle}
            </h3>
            <p className={styles.pdfReadyBody}>{c.print.pdfReadyBody}</p>
            <p className={styles.pdfReadyFile}>{pdfReady.fileName}</p>
            <div className={styles.pdfReadyActions}>
              <button
                type="button"
                className={styles.pdfReadyShare}
                disabled={pdfSharing}
                onClick={() => void handleSharePdf()}
              >
                {pdfSharing ? c.print.preparingPdf : c.print.pdfShare}
              </button>
              <button
                type="button"
                className={styles.pdfReadyClose}
                onClick={() => setPdfReady(null)}
              >
                {c.print.pdfClose}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ══ P1: CINEMATIC COVER ══════════════════════════════════ */}
      <section className={`${styles.page} ${styles.coverPage}`}>
        <div className={styles.coverInner}>
          <div className={styles.coverTop}>
            <div className={styles.coverBrandRow}>
              {coverBrand.showLogo ? (
                <span
                  className={
                    logoNeedsPlate ? styles.logoPlate : styles.logoBare
                  }
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverBrand.logoUrl}
                    alt={coverBrand.installerName || brand}
                    className={styles.coverLogo}
                  />
                </span>
              ) : null}
              {coverBrand.showName || !coverBrand.showLogo ? (
                <span className={styles.coverBrandText}>
                  {(coverBrand.installerName || brand).toUpperCase()}
                </span>
              ) : null}
            </div>
            {coverBrand.showTagline && data.meta.brandTagline ? (
              <p className={styles.coverLoc}>{data.meta.brandTagline}</p>
            ) : null}
            <span className={styles.coverDocType}>{c.cover.docType}</span>
          </div>

          <figure className={styles.coverPhotoPlate}>
            <div className={styles.coverPhotoFrame}>
              {/* eslint-disable-next-line @next/next/no-img-element -- print A4 static asset */}
              <img
                className={styles.coverPhotoImg}
                src="/assets/proposals/atelier-cover-terrace-garden.jpg"
                alt=""
                width={1600}
                height={900}
              />
              <div className={styles.coverPhotoVignette} aria-hidden />
              <div className={styles.coverPhotoEdge} aria-hidden />
            </div>
            <figcaption className={styles.coverPhotoCaption}>
              <span className={styles.coverPhotoTitle}>{c.cover.photoTitle}</span>
              <span className={styles.coverPhotoSub}>{c.cover.photoSub}</span>
            </figcaption>
          </figure>

          <div className={styles.coverHero}>
            <p className={styles.coverFor}>{c.cover.preparedFor}</p>
            <h1 className={styles.coverName}>{clientName}</h1>
            <p className={styles.coverLoc}>{location}</p>
          </div>

          <div className={styles.coverWealthRow}>
            <div className={styles.coverSmallStats}>
              <div className={styles.coverSmallStat}>
                <span className={styles.coverSmallNum}>
                  {monthlyInr > 0 ? formatInr(monthlyInr) : "—"}
                </span>
                <span className={styles.coverSmallLabel}>{c.cover.savingsMonth}</span>
              </div>
              <div className={styles.coverSmallStat}>
                <span className={styles.coverSmallNum}>
                  {paybackYears > 0
                    ? `${paybackYears.toFixed(1)} ${c.cover.yrs}`
                    : "—"}
                </span>
                <span className={styles.coverSmallLabel}>{c.cover.fullPayback}</span>
              </div>
              <div className={styles.coverSmallStat}>
                <span className={styles.coverSmallNum}>{systemSize}</span>
                <span className={styles.coverSmallLabel}>{c.cover.systemSize}</span>
              </div>
            </div>
          </div>
        </div>
        <span className={`${styles.pageNum} ${styles.pageNumLight}`}>
          {folio(pn.cover, totalPages)}
        </span>
      </section>

      {/* ══ P2: BILL AUDIT — 12-month breakdown (bill-based only) ══ */}
      {showBillAudit ? (
        <section className={`${styles.page} ${styles.billAuditPage}`}>
          <header className={styles.pageHead}>
            <span className={styles.pageTag}>
              {withPageTag(c.billAudit.tag, pn.bill)}
            </span>
            <h2 className={styles.pageTitle}>{c.billAudit.title}</h2>
            <p className={styles.pageLead}>{c.billAudit.lead}</p>
          </header>
          <AtelierBillAudit
            months={bill.months}
            totals={bill.totals}
            summerTrapPct={bill.summerTrapPct}
            fixedChargesDisplay={bill.fixedChargesDisplay}
            solarSavingsPct={bill.solarSavingsPct}
            labels={{
              summerIncrease: c.billAudit.summerIncrease,
              summerHint: c.billAudit.summerHint,
              fixedLiability: c.billAudit.fixedLiability,
              fixedHint: c.billAudit.fixedHint,
              solarSavings: c.billAudit.solarSavings,
              solarHint: c.billAudit.solarHint,
              month: c.billAudit.month,
              units: c.billAudit.units,
              energy: c.billAudit.energy,
              fixed: c.billAudit.fixed,
              duty: c.billAudit.duty,
              netBill: c.billAudit.netBill,
              total: c.billAudit.total,
              footnote: c.billAudit.footnote,
              chartLabel: c.billAudit.chartLabel,
            }}
          />
          <span className={styles.pageNum}>{folio(pn.bill, totalPages)}</span>
        </section>
      ) : null}

      {/* ══ WEALTH PROJECTION — net cost, pocket, score, expert ══ */}
      <section
        className={`${styles.page} ${styles.financePage}${
          brandCompareSnapshot ? ` ${styles.financePageWithBrand}` : ""
        }`}
      >
        <header className={styles.pageHead}>
          <span className={styles.pageTag}>
            {withPageTag(c.finance.tag, pn.finance)}
          </span>
          <h2 className={styles.pageTitle}>{c.finance.title}</h2>
          <p className={styles.pageLead}>{c.finance.lead}</p>
        </header>

        <div className={styles.investBreakdown}>
          <div className={styles.investItem}>
            <span className={styles.investTag}>{c.finance.grossCost}</span>
            <span className={styles.investVal}>
              {grossInr > 0 ? formatInr(grossInr) : "—"}
            </span>
          </div>
          <div className={styles.investOp} aria-hidden>
            −
          </div>
          <div className={`${styles.investItem} ${styles.investItemSubsidy}`}>
            <span className={styles.investTag}>{c.finance.subsidy}</span>
            <span className={`${styles.investVal} ${styles.investValSubsidy}`}>
              {subsidyInr > 0 ? formatInr(subsidyInr) : "—"}
            </span>
          </div>
          <div className={styles.investOp} aria-hidden>
            =
          </div>
          <div className={`${styles.investItem} ${styles.investItemFinal}`}>
            <span className={styles.investTag}>{c.finance.netInvestment}</span>
            <span className={`${styles.investVal} ${styles.investValNet}`}>
              {netInr > 0 ? formatInr(netInr) : "—"}
            </span>
            <span className={styles.investCue}>{c.finance.netCue}</span>
          </div>
        </div>

        <div className={styles.financeFlow}>
          <div className={`${styles.financeStep} ${styles.financeStepToday}`}>
            <span className={styles.financeStepIcon} aria-hidden>
              <svg viewBox="0 0 24 24" className={styles.financeIconSvg}>
                <path
                  d="M4 8h16v10H4zM7 8V6.5A2.5 2.5 0 0 1 9.5 4h5A2.5 2.5 0 0 1 17 6.5V8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 13h4M8 16h6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className={styles.billCardTag}>{c.finance.todayTag}</span>
            <strong className={`${styles.billCardAmt} ${styles.financeAmtToday}`}>
              {monthlyBill > 0 ? formatInr(monthlyBill) : "₹5,200"}
            </strong>
            <span className={styles.billCardLabel}>{c.finance.todayLabel}</span>
            <p className={styles.billCardNote}>{c.finance.todayNote}</p>
          </div>

          <div className={styles.financeFlowArrow} aria-hidden>
            <span>−</span>
          </div>

          <div className={`${styles.financeStep} ${styles.financeStepSolar}`}>
            <span className={styles.financeStepIcon} aria-hidden>
              <svg viewBox="0 0 24 24" className={styles.financeIconSvg}>
                <circle cx="12" cy="9" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
                <path
                  d="M12 3.5v1.4M12 13.4v1.4M6.8 9H5.4M18.6 9h-1.4M8.2 5.2l-1-1M16.8 5.2l1-1M8.2 12.8l-1 1M16.8 12.8l1 1"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M5 18h14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className={styles.billCardTag}>{c.finance.tomorrowTag}</span>
            <strong className={`${styles.billCardAmt} ${styles.financeAmtSolar}`}>
              {monthlyEmi > 0 ? formatInr(monthlyEmi) : "₹4,100"}
            </strong>
            <span className={styles.billCardLabel}>{c.finance.tomorrowLabel}</span>
            <p className={styles.billCardNote}>{c.finance.tomorrowNote}</p>
          </div>

          <div className={styles.financeFlowArrow} aria-hidden>
            <span>=</span>
          </div>

          <div className={`${styles.financeStep} ${styles.financeStepGain}`}>
            <span className={`${styles.financeStepIcon} ${styles.financeStepIconGain}`} aria-hidden>
              <svg viewBox="0 0 24 24" className={styles.financeIconSvg}>
                <path
                  d="M5 18.5V11l3.5 2.5L12 8l3.5 4L19 9.5V18.5H5z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className={styles.billCardTag}>{c.finance.profitTag}</span>
            <strong className={`${styles.billCardAmt} ${styles.financeAmtGain}`}>
              {monthlyProfit > 0
                ? `+${formatInr(monthlyProfit)}`
                : `+${formatInr(monthlyInr > 0 ? monthlyInr : 900)}`}
            </strong>
            <span className={styles.billCardLabel}>{c.finance.profitLabel}</span>
            <p className={styles.billCardNote}>{c.finance.profitNote}</p>
          </div>
        </div>

        {(() => {
          const years = [1, 5, 10, 15, 20, 25];
          const baseAnnualBill = (monthlyBill > 0 ? monthlyBill : 5200) * 12;
          const flatSolarAnnual = (monthlyEmi > 0 ? monthlyEmi : 4100) * 12;
          const loanEndYr = 5;
          const amcAnnual = netInr > 0 ? netInr * 0.02 : flatSolarAnnual * 0.15;
          const withoutPts = years.map(
            (y) => baseAnnualBill * Math.pow(1.06, y - 1)
          );
          const withPts = years.map((y) =>
            y <= loanEndYr ? flatSolarAnnual : amcAnnual
          );
          const maxVal = Math.max(...withoutPts) * 1.1;
          const W = 640;
          const H = 220;
          const padL = 14;
          const padR = 14;
          const padT = 18;
          const padB = 28;
          const xFor = (i: number) =>
            padL + (i / (years.length - 1)) * (W - padL - padR);
          const yFor = (v: number) =>
            padT + (1 - v / maxVal) * (H - padT - padB);
          const withoutPath = withoutPts
            .map((v, i) => `${xFor(i)},${yFor(v)}`)
            .join(" ");
          const withPath = withPts
            .map((v, i) => `${xFor(i)},${yFor(v)}`)
            .join(" ");
          const areaPath =
            `M${xFor(0)},${yFor(withoutPts[0])} ` +
            withoutPts.map((v, i) => `L${xFor(i)},${yFor(v)}`).join(" ") +
            ` L${xFor(years.length - 1)},${yFor(withPts[withPts.length - 1])} ` +
            withPts
              .slice()
              .reverse()
              .map((v, i) => `L${xFor(years.length - 1 - i)},${yFor(v)}`)
              .join(" ") +
            " Z";
          const loanIdx = years.indexOf(loanEndYr);
          return (
            <div className={styles.trajectoryChart}>
              <div className={styles.trajectoryHead}>
                <span className={styles.trajectoryTitle}>
                  {c.finance.trajectoryTag}
                </span>
                <span className={styles.trajectoryHint}>
                  {c.finance.trajectoryHint}
                </span>
              </div>
              <svg
                viewBox={`0 0 ${W} ${H}`}
                className={styles.trajectorySvg}
                aria-hidden
              >
                <defs>
                  <linearGradient id="alFinGap" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(249,115,22,0.28)" />
                    <stop offset="100%" stopColor="rgba(249,115,22,0.05)" />
                  </linearGradient>
                </defs>
                {[0.25, 0.5, 0.75].map((t) => (
                  <line
                    key={t}
                    x1={padL}
                    x2={W - padR}
                    y1={padT + t * (H - padT - padB)}
                    y2={padT + t * (H - padT - padB)}
                    className={styles.trajectoryGrid}
                  />
                ))}
                <path d={areaPath} fill="url(#alFinGap)" />
                <polyline
                  points={withoutPath}
                  className={styles.trajectoryLineRed}
                />
                <polyline
                  points={withPath}
                  className={styles.trajectoryLineSolar}
                />
                {withoutPts.map((v, i) => (
                  <circle
                    key={`w-${years[i]}`}
                    cx={xFor(i)}
                    cy={yFor(v)}
                    r="3.2"
                    className={styles.trajectoryDotRed}
                  />
                ))}
                {withPts.map((v, i) => (
                  <circle
                    key={`s-${years[i]}`}
                    cx={xFor(i)}
                    cy={yFor(v)}
                    r="3.2"
                    className={styles.trajectoryDotSolar}
                  />
                ))}
                {loanIdx >= 0 ? (
                  <>
                    <line
                      x1={xFor(loanIdx)}
                      x2={xFor(loanIdx)}
                      y1={padT}
                      y2={H - padB + 4}
                      className={styles.trajectoryLoanLine}
                    />
                    <text
                      x={xFor(loanIdx) + 6}
                      y={padT + 12}
                      className={styles.trajectoryLoanLabel}
                    >
                      {c.finance.loanEndCue}
                    </text>
                  </>
                ) : null}
                {years.map((y, i) => (
                  <text
                    key={y}
                    x={xFor(i)}
                    y={H - 6}
                    className={styles.trajectoryXLabel}
                    textAnchor="middle"
                  >
                    {c.finance.yr(y)}
                  </text>
                ))}
              </svg>
              <div className={styles.trajectoryLegend}>
                <span className={styles.trajLegendItem}>
                  <span className={styles.trajDotRed} /> {c.finance.legendWithout}
                </span>
                <span className={styles.trajLegendItem}>
                  <span className={styles.trajDotSolar} /> {c.finance.legendWith}
                </span>
                <span className={styles.trajLegendItem}>
                  <span className={styles.trajDotGap} /> {c.finance.legendGap}
                </span>
              </div>
            </div>
          );
        })()}

        <div className={styles.financeScoreRow}>
          <div className={styles.investScoreCard}>
            <span className={styles.investScoreTag}>{c.wealth.scoreTag}</span>
            <div className={styles.investScoreGrade}>{investScore}</div>
            <div className={styles.investScoreLabel}>{investGrade}</div>
            <div className={styles.investScoreDivider} />
            <div className={styles.investScoreStats}>
              <div className={styles.investScoreStat}>
                <span className={styles.investScoreStatVal}>
                  {paybackYears > 0
                    ? `${paybackYears.toFixed(1)} ${c.wealth.yrsShort}`
                    : "—"}
                </span>
                <span className={styles.investScoreStatLabel}>
                  {c.wealth.paybackLabel}
                </span>
              </div>
              <div className={styles.investScoreStat}>
                <span className={styles.investScoreStatVal}>
                  {annualSavings > 0 && netInr > 0
                    ? `${Math.round((annualSavings / netInr) * 100)}%`
                    : "—"}
                </span>
                <span className={styles.investScoreStatLabel}>
                  {c.wealth.annualRoi}
                </span>
              </div>
            </div>
            <p className={styles.investScoreBasis}>
              <strong>{c.wealth.basis}</strong>{" "}
              {c.wealth.basisText(
                paybackYears > 0 ? paybackYears.toFixed(1) : "4–5"
              )}
            </p>
          </div>
        </div>

        <aside className={styles.wealthExpert}>
          <div className={styles.wealthExpertTop}>
            <span className={styles.wealthExpertTag}>{c.wealth.expertTag}</span>
            <span className={styles.wealthExpertAttr}>
              {c.wealth.expertAttr(brand)}
            </span>
          </div>
          <p className={styles.wealthExpertBody}>
            {c.wealth.expertBody(cityLabel)}
          </p>
        </aside>

        {/* Bottom reserved for brand comparison when enabled */}
        {brandCompareSnapshot ? (
          <AtelierBrandCompare
            snapshot={brandCompareSnapshot}
            proposalTrack={brandCompareSelection.proposalTrack}
            labels={{
              kicker: c.finance.brandCompareKicker,
              track: c.finance.brandCompareTrack,
              dcr: c.finance.brandCompareDcr,
              nonDcr: c.finance.brandCompareNonDcr,
              subtitle: c.finance.brandCompareSub,
            }}
          />
        ) : null}

        <span className={styles.pageNum}>{folio(pn.finance, totalPages)}</span>
      </section>

      {/* ══ 25-YEAR SAVINGS — path + year chart (after wealth projection) ══ */}
      <section className={`${styles.page} ${styles.wealthPage}`}>
        <header className={styles.pageHead}>
          <span className={styles.pageTag}>
            {withPageTag(c.wealth.tag, pn.wealth)}
          </span>
          <h2 className={styles.pageTitle}>{c.wealth.title}</h2>
          <p className={styles.pageLead}>{c.wealth.lead}</p>
        </header>

        {/* Instant story: invest → payback → keep */}
        <div className={styles.wealthPath} aria-label={c.wealth.lead}>
          <div className={styles.wealthPathCard}>
            <span className={styles.wealthPathIcon} aria-hidden>
              <WealthIconPay className={styles.wjIconSvg} />
            </span>
            <span className={styles.wealthPathLabel}>
              {c.wealth.step1Num} · {c.wealth.pathInvest}
            </span>
            <strong className={styles.wealthPathAmt}>
              {netInr > 0 ? formatInrCompact(netInr) : "—"}
            </strong>
            <span className={styles.wealthPathSub}>
              {c.wealth.year0To(paybackYears > 0 ? Math.ceil(paybackYears) : 5)}
            </span>
            <span className={styles.wealthPathNote}>{c.wealth.phase1Note}</span>
          </div>
          <div className={styles.wealthPathArrow} aria-hidden>
            <span>→</span>
          </div>
          <div className={`${styles.wealthPathCard} ${styles.wealthPathMid}`}>
            <span className={`${styles.wealthPathIcon} ${styles.wealthPathIconOn}`} aria-hidden>
              <WealthIconPaid className={styles.wjIconSvg} />
            </span>
            <span className={styles.wealthPathLabel}>
              {c.wealth.step2Num} · {c.wealth.pathPayback}
            </span>
            <strong className={styles.wealthPathAmt}>
              {paybackYears > 0
                ? `${paybackYears.toFixed(1)} ${c.wealth.yrsShort}`
                : "—"}
            </strong>
            <span className={styles.wealthPathSub}>{c.wealth.pathPayoff}</span>
            <span className={styles.wealthPathNote}>{c.wealth.paybackNote}</span>
          </div>
          <div className={styles.wealthPathArrow} aria-hidden>
            <span>→</span>
          </div>
          <div className={`${styles.wealthPathCard} ${styles.wealthPathEnd}`}>
            <span className={styles.wealthPathIcon} aria-hidden>
              <WealthIconGrow className={styles.wjIconSvg} />
            </span>
            <span className={styles.wealthPathLabel}>
              {c.wealth.step3Num} · {c.wealth.pathKeep}
            </span>
            <strong className={styles.wealthPathAmt}>
              {totalWealth > 0 ? formatInrCompact(totalWealth) : "—"}
            </strong>
            <span className={styles.wealthPathSub}>
              {c.wealth.yearRange(
                paybackYears > 0 ? Math.ceil(paybackYears) + 1 : 6
              )}
            </span>
            <span className={styles.wealthPathNote}>{c.wealth.zeroEnergy}</span>
          </div>
        </div>

        <div className={`${styles.wealthLayout} ${styles.wealthLayoutSolo}`}>
          <div className={styles.wealthChartBox}>
            <div className={styles.wealthChartHead}>
              <span className={styles.wealthChartTitle}>{c.wealth.chartTitle}</span>
              <span className={styles.wealthChartHint}>{c.wealth.chartHint}</span>
            </div>
            <div className={styles.wealthChart}>
              {wealthMilestones.map((m) => (
                <div key={m.year} className={styles.wealthMilestone}>
                  <span className={styles.wealthYr}>{c.wealth.yrShort(m.year)}</span>
                  <div className={styles.wealthBarWrap}>
                    <div
                      className={styles.wealthBarFill}
                      style={{ width: `${Math.max(m.pct, 8)}%` }}
                    />
                  </div>
                  <span className={styles.wealthAmt}>
                    {m.savings > 0 ? formatInrCompact(m.savings) : "—"}
                  </span>
                </div>
              ))}
            </div>
            <div className={styles.wealthVs}>
              <div className={styles.wealthVsKeep}>
                <span className={styles.wealthVsLabel}>{c.wealth.withSolar}</span>
                <strong className={styles.wealthVsAmt}>
                  {totalWealth > 0 ? formatInrCompact(totalWealth) : "—"}
                </strong>
              </div>
              <div className={styles.wealthVsGrid}>
                <span className={styles.wealthVsLabel}>{c.wealth.withoutSolar}</span>
                <strong className={styles.wealthVsAmt}>
                  {monthlyBill > 0
                    ? formatInrCompact(monthlyBill * 12 * 22)
                    : "—"}
                </strong>
                <span className={styles.wealthVsHint}>{c.wealth.paidToGrid}</span>
              </div>
            </div>
            <p className={styles.wealthChartNote}>{c.wealth.chartNote}</p>
          </div>
        </div>

        <p className={styles.wealthTakeaway}>
          {c.wealth.takeaway(
            paybackYears > 0 ? paybackYears.toFixed(1) : "4–5",
            paybackYears > 0
              ? String(Math.max(1, 25 - Math.ceil(paybackYears)))
              : "20"
          )}
        </p>

        <span className={styles.pageNum}>{folio(pn.wealth, totalPages)}</span>
      </section>

      {/* ══ ROOF INTELLIGENCE — after 25-year savings ═══════════ */}
      <section className={`${styles.page} ${styles.roofPage}`}>
        <header className={styles.pageHead}>
          <span className={styles.pageTag}>
            {withPageTag(c.roof.tag, pn.roof)}
          </span>
          <h2 className={styles.pageTitle}>{c.roof.title}</h2>
        </header>

        <div className={styles.roofMainRow}>
          <div className={styles.roofArrayStage}>
            <AtelierBlueprintArray
              panelCount={panelCount}
              tiltDeg={tilt}
              title={c.roof.blueprintTitle}
              arrayLabel={c.roof.blueprintArray}
              tiltAzimuthLine={c.roof.blueprintTiltLine}
              showingNote={c.roof.blueprintShowing}
            />
          </div>

          <aside className={styles.roofSunTeach}>
            <span className={styles.roofSunPathLabel}>{c.roof.sunPathLabel}</span>
            <h3 className={styles.roofSunTeachTitle}>{c.roof.sunTeachTitle}</h3>
            <div className={styles.roofSunDiagram} aria-hidden>
              <svg
                className={styles.roofSunArcSvg}
                viewBox="0 0 240 110"
                preserveAspectRatio="xMidYMid meet"
              >
                <text x="12" y="18" fill="#94A3B8" fontSize="9" fontWeight="700">
                  {c.roof.northShort}
                </text>
                <text
                  x="228"
                  y="102"
                  textAnchor="end"
                  fill="#F97316"
                  fontSize="9"
                  fontWeight="800"
                >
                  {c.roof.southShort}
                </text>
                <path
                  d="M18 78 Q120 8 222 78"
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth="2.2"
                />
                <path
                  d="M40 70 Q120 18 200 70"
                  fill="none"
                  stroke="#F97316"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  opacity="0.9"
                />
                <circle cx="40" cy="70" r="4" fill="#FDBA74" />
                <circle cx="120" cy="22" r="6" fill="#F97316" />
                <circle cx="200" cy="70" r="4" fill="#FDBA74" />
                <text
                  x="40"
                  y="96"
                  textAnchor="middle"
                  fill="#64748B"
                  fontSize="7.5"
                  fontWeight="600"
                >
                  {c.roof.sunrise}
                </text>
                <text
                  x="120"
                  y="12"
                  textAnchor="middle"
                  fill="#F97316"
                  fontSize="7.5"
                  fontWeight="700"
                >
                  {c.roof.noon}
                </text>
                <text
                  x="200"
                  y="96"
                  textAnchor="middle"
                  fill="#64748B"
                  fontSize="7.5"
                  fontWeight="600"
                >
                  {c.roof.sunset}
                </text>
                {/* South-facing array icon under noon */}
                <rect
                  x="102"
                  y="78"
                  width="36"
                  height="14"
                  rx="1.5"
                  fill="#0B2740"
                  stroke="#F97316"
                  strokeWidth="1.2"
                />
                <line
                  x1="108"
                  y1="82"
                  x2="108"
                  y2="88"
                  stroke="rgba(186,210,230,0.5)"
                  strokeWidth="0.8"
                />
                <line
                  x1="120"
                  y1="82"
                  x2="120"
                  y2="88"
                  stroke="rgba(186,210,230,0.5)"
                  strokeWidth="0.8"
                />
                <line
                  x1="132"
                  y1="82"
                  x2="132"
                  y2="88"
                  stroke="rgba(186,210,230,0.5)"
                  strokeWidth="0.8"
                />
              </svg>
            </div>
            <p className={styles.roofSunTeachLead}>
              {c.roof.sunTeachLead(cityLabel)}
            </p>
            <ul className={styles.roofSunBenefits}>
              {c.roof.sunBenefits.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <em className={styles.roofSouthCue}>{c.roof.southCue}</em>
            <p className={styles.roofSunNote}>
              {c.roof.compassNote(cityLabel)}
            </p>
          </aside>
        </div>

        <div className={styles.roofEngStrip}>
          {[
            {
              tag: c.roof.engString,
              val: c.roof.engStringVal(panelCount),
            },
            {
              tag: c.roof.engDc,
              val: c.roof.engDcVal(
                ((panelCount * panelWp) / 1000).toFixed(2)
              ),
            },
            {
              tag: c.roof.engYield,
              val: c.roof.engYieldVal,
            },
            {
              tag: c.roof.engWind,
              val: c.roof.engWindVal,
            },
          ].map((chip) => (
            <div key={chip.tag} className={styles.roofEngChip}>
              <span className={styles.roofEngTag}>{chip.tag}</span>
              <strong className={styles.roofEngVal}>{chip.val}</strong>
            </div>
          ))}
        </div>

        <div className={styles.roofMetricGrid}>
          {[
            {
              tag: c.roof.modulesTag,
              val: c.roof.panelsVal(panelCount),
              note: c.roof.wpEach(panelWp),
            },
            {
              tag: c.roof.areaTag,
              val: c.roof.areaVal(roofAreaSqft),
              note: c.roof.areaNote(panelWp, sqftPerPanel),
            },
            {
              tag: c.roof.tiltTag,
              val: `${tilt}°`,
              note: c.roof.tiltNote(cityLabel),
            },
            {
              tag: c.roof.irradTag,
              val: "~1,950 kWh/m²",
              note: c.roof.irradNote(cityLabel),
            },
            {
              tag: c.roof.shadowTag,
              val: data.bill.hasData
                ? c.roof.siteVerified
                : c.roof.methodApplied,
              note: c.roof.shadowNote,
            },
            {
              tag: c.roof.utilTag,
              val: `~${Math.min(
                95,
                Math.ceil(
                  (roofAreaSqft * 100) /
                    Math.ceil(roofAreaSqft * 1.1)
                )
              )}%`,
              note: c.roof.utilNote,
            },
          ].map((m) => (
            <div key={m.tag} className={styles.roofMetricCard}>
              <span className={styles.roofYieldTag}>{m.tag}</span>
              <strong className={styles.roofYieldVal}>{m.val}</strong>
              <span className={styles.roofYieldNote}>{m.note}</span>
            </div>
          ))}
        </div>

        <span className={styles.pageNum}>{folio(pn.roof, totalPages)}</span>
      </section>

      {/* ══ P5: GENERATION PROOF ═════════════════════════════════ */}
      <section className={`${styles.page} ${styles.genPage}`}>
        <header className={styles.pageHead}>
          <span className={styles.pageTag}>
            {withPageTag(c.gen.tag, pn.gen)}
          </span>
          <h2 className={styles.pageTitle}>
            {c.gen.title(
              annualGen > 0 ? annualGen.toLocaleString("en-IN") : "7,200"
            )}
          </h2>
        </header>

        <div className={styles.genProofGrid}>
          <div className={styles.genCard}>
            <span className={styles.genCardTag}>{c.gen.pvgis}</span>
            <div className={styles.genFormulaGrid}>
              <div className={styles.genFormulaStep}>
                <span className={styles.genFormulaVal}>
                  {systemKw > 0 ? `${systemKw} kW` : "5 kW"}
                </span>
                <span className={styles.genFormulaLabel}>{c.gen.systemCapacity}</span>
              </div>
              <div className={styles.genFormulaStep}>
                <span className={styles.genFormulaVal}>5.0</span>
                <span className={styles.genFormulaLabel}>{c.gen.sunHours}</span>
              </div>
              <div className={styles.genFormulaStep}>
                <span className={styles.genFormulaVal}>75%</span>
                <span className={styles.genFormulaLabel}>{c.gen.perfRatio}</span>
              </div>
              <div className={styles.genFormulaStep}>
                <span className={styles.genFormulaVal}>365</span>
                <span className={styles.genFormulaLabel}>{c.gen.daysYear}</span>
              </div>
            </div>
            <div className={styles.genFormulaEquals}>
              <span className={styles.genFormulaEqMark}>=</span>
              <div className={styles.genFormulaResult}>
                <span className={styles.genFormulaResultVal}>
                  {annualGen > 0 ? annualGen.toLocaleString("en-IN") : "6,844"}
                </span>
                <span className={styles.genFormulaResultLabel}>
                  {c.gen.unitsYear}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.genCard}>
            <span className={styles.genCardTag}>
              {c.gen.solarResource(cityLabel)}
            </span>
            <div className={styles.genIrradTiles}>
              {[
                [c.gen.globalHoriz, "~1,850", "kWh/m²/yr"],
                [c.gen.optimalIncl, "~1,950", "kWh/m²/yr"],
                [c.gen.annualIrrad, `${tilt}°`, c.gen.tiltUnit],
                [c.gen.dataSource, "PVGIS", "NREL Atlas"],
              ].map(([k, v, u]) => (
                <div key={k} className={styles.genIrradTile}>
                  <span className={styles.genIrradKey}>{k}</span>
                  <strong className={styles.genIrradVal}>{v}</strong>
                  <span className={styles.genIrradUnit}>{u}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {(() => {
          const est =
            annualGen > 0
              ? annualGen
              : Math.round(systemKw * 5 * 0.75 * 365);
          const max = Math.round(est * 1.13);
          const bars = [
            {
              label: c.gen.ourEstimate,
              val: est,
              pct: Math.round((est / max) * 100),
              tone: "hero" as const,
            },
            {
              label: c.gen.gridAvg(cityLabel),
              val: Math.round(est * 0.75),
              pct: Math.round((est * 0.75) / max * 100),
              tone: "muted" as const,
            },
            {
              label: c.gen.theoreticalMax,
              val: max,
              pct: 100,
              tone: "soft" as const,
            },
          ];
          return (
            <div className={styles.genCompare}>
              <span className={styles.genCardTag}>{c.gen.barTag(cityLabel)}</span>
              <div className={styles.genCompareList}>
                {bars.map((b) => (
                  <div
                    key={b.label}
                    className={`${styles.genCompareRow} ${
                      b.tone === "hero"
                        ? styles.genCompareHero
                        : b.tone === "muted"
                          ? styles.genCompareMuted
                          : styles.genCompareSoft
                    }`}
                  >
                    <div className={styles.genCompareMeta}>
                      <span className={styles.genBarLabel}>{b.label}</span>
                      <span className={styles.genBarVal}>
                        {b.val.toLocaleString("en-IN")} {c.gen.units}
                      </span>
                    </div>
                    <div className={styles.genBarTrack}>
                      <div
                        className={styles.genBarFill}
                        style={{ width: `${Math.max(b.pct, 12)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        <div className={styles.genSpecGrid}>
          {engMetrics.map(([label, value]) => (
            <div key={label} className={styles.genSpecCard}>
              <div className={styles.genSpecVal}>{value}</div>
              <div className={styles.genSpecLabel}>{label}</div>
            </div>
          ))}
        </div>

        <div className={styles.genFoot}>
          <div className={styles.genStdRow}>
            <span className={styles.genStdLabel}>{c.gen.compliance}</span>
            {standards.map((s) => (
              <span key={s} className={styles.stdBadge}>
                {s}
              </span>
            ))}
          </div>
          <p className={styles.genDisclaimer}>
            <strong>{c.gen.noteLabel}</strong> {c.gen.noteBody}
          </p>
        </div>

        <div className={`${styles.expertInsight} ${styles.genExpert}`}>
          <span className={styles.expertTag}>{c.gen.expertTag}</span>
          <p>
            {c.gen.expertBody(
              systemSize,
              monthlyBill > 0 ? formatInr(monthlyBill) : "₹5,200",
              Math.round(
                ((monthlyBill > 0 ? monthlyBill : 5200) * 12) / 8
              ).toLocaleString("en-IN"),
              (
                annualGen > 0
                  ? annualGen
                  : Math.round(systemKw * 5 * 0.75 * 365)
              ).toLocaleString("en-IN"),
              cityLabel
            )}
          </p>
        </div>

        <span className={styles.pageNum}>{folio(pn.gen, totalPages)}</span>
      </section>

      {/* ══ P6: MONTHLY GENERATION FORECAST ══════════════════════ */}
      <section className={`${styles.page} ${styles.forecastPage}`}>
        <header className={styles.pageHead}>
          <span className={styles.pageTag}>
            {withPageTag(c.genForecast.tag, pn.forecast)}
          </span>
          <h2 className={styles.pageTitle}>{c.genForecast.title}</h2>
          <p className={styles.pageLead}>
            {showForecastBillBars
              ? c.genForecast.leadBill
              : c.genForecast.lead}
          </p>
        </header>

        <div className={styles.forecastStats}>
          <div className={styles.forecastStatCard}>
            <span className={styles.forecastStatTag}>
              {c.genForecast.annualGen}
            </span>
            <strong className={styles.forecastStatVal}>
              {forecastAnnualUnits > 0
                ? `${forecastAnnualUnits.toLocaleString("en-IN")} ${c.gen.units}`
                : "—"}
            </strong>
            <span className={styles.forecastStatHint}>
              {c.genForecast.annualGenHint}
            </span>
          </div>
          <div
            className={`${styles.forecastStatCard} ${styles.forecastStatCardAccent}`}
          >
            <span className={styles.forecastStatTag}>
              {c.genForecast.annualSavings}
            </span>
            <strong className={styles.forecastStatVal}>
              {yearOneSavings > 0 ? formatInrCompact(yearOneSavings) : "—"}
            </strong>
            <span className={styles.forecastStatHint}>
              {c.genForecast.annualSavingsHint}
            </span>
          </div>
        </div>

        <div className={styles.forecastChart}>
          {showForecastBillBars ? (
            <div className={styles.forecastChartHead}>
              <div className={styles.forecastSeriesLegend}>
                <span className={styles.forecastLegendGen}>
                  <i aria-hidden /> {c.genForecast.legendGen}
                </span>
                <span className={styles.forecastLegendBill}>
                  <i aria-hidden /> {c.genForecast.legendBill}
                </span>
              </div>
            </div>
          ) : null}
          <div
            className={`${styles.forecastBars}${
              showForecastBillBars ? ` ${styles.forecastBarsDual}` : ""
            }`}
            role="img"
            aria-label={
              showForecastBillBars
                ? c.genForecast.chartAriaDual
                : c.genForecast.title
            }
          >
            {forecastMonths.map((m) => (
              <div
                key={m.label}
                className={`${styles.forecastCol}${
                  m.isPeak ? ` ${styles.forecastColPeak}` : ""
                }`}
              >
                <span className={styles.forecastUnits}>
                  {m.units > 0 ? m.units.toLocaleString("en-IN") : "—"}
                </span>
                {showForecastBillBars ? (
                  <span className={styles.forecastBillUnits}>
                    {m.billUnits != null && m.billUnits > 0
                      ? m.billUnits.toLocaleString("en-IN")
                      : "·"}
                  </span>
                ) : null}
                <div
                  className={`${styles.forecastTrack}${
                    showForecastBillBars ? ` ${styles.forecastTrackDual}` : ""
                  }`}
                >
                  <div
                    className={styles.forecastFill}
                    style={{ height: `${m.barPct}%` }}
                    title={`${c.genForecast.legendGen}: ${m.units}`}
                  />
                  {showForecastBillBars ? (
                    <div
                      className={styles.forecastFillBill}
                      style={{
                        height:
                          m.billBarPct > 0 ? `${m.billBarPct}%` : "4px",
                        opacity: m.billBarPct > 0 ? 1 : 0.28,
                      }}
                      title={
                        m.billUnits != null && m.billUnits > 0
                          ? `${c.genForecast.legendBill}: ${m.billUnits}`
                          : c.genForecast.noBillMonth
                      }
                    />
                  ) : null}
                </div>
                <span className={styles.forecastMonth}>{m.label}</span>
                <span className={styles.forecastSave}>
                  {m.savingsInr > 0
                    ? `₹${Math.round(m.savingsInr / 1000)}k`
                    : "—"}
                </span>
              </div>
            ))}
          </div>
          <div className={styles.forecastLegend}>
            <span>{c.genForecast.unitsLabel}</span>
            <span className={styles.forecastPeakCue}>
              {c.genForecast.peakNote}
            </span>
            <span>{c.genForecast.savingsLabel}</span>
          </div>
          {effectiveSavingPerUnit > 0 ? (
            <p className={styles.forecastBasis}>
              {c.genForecast.savingsBasis(effectiveSavingPerUnit.toFixed(2))}
            </p>
          ) : null}
          {showForecastBillBars ? (
            <p className={styles.forecastBillNote}>{c.genForecast.billNote}</p>
          ) : null}
        </div>

        <div className={`${styles.expertInsight} ${styles.forecastExpert}`}>
          <span className={styles.expertTag}>{c.genForecast.expertTag}</span>
          <p>{c.genForecast.expertBody}</p>
        </div>

        <span className={styles.pageNum}>{folio(pn.forecast, totalPages)}</span>
      </section>

      {/* ══ P7: HARDWARE TRUST — icons + earthing strip ══════════ */}
      <section className={`${styles.page} ${styles.hwPage}`}>
        <header className={styles.pageHead}>
          <span className={styles.pageTag}>
            {withPageTag(c.hw.tag, pn.hw)}
          </span>
          <h2 className={styles.pageTitle}>{c.hw.title}</h2>
          <p className={styles.pageLead}>{c.hw.lead}</p>
        </header>

        <div className={styles.hwCard4Grid}>
          {(
            [
              {
                key: "panel" as HwIconKey,
                tag: c.hw.panels,
                title: panelItem
                  ? panelItem.brand || "Waaree"
                  : "Waaree Energies",
                spec: bomLine(panelItem, "580 Wp DCR TOPCon N-Type"),
                warranty: panelItem?.warranty || c.hw.warrantyPanel,
                why: c.hw.whyPanel(cityLabel),
              },
              {
                key: "inverter" as HwIconKey,
                tag: c.hw.inverter,
                title: inverterItem
                  ? inverterItem.brand || "Havells / Polycab"
                  : "Havells / Polycab",
                spec: bomLine(
                  inverterItem,
                  `${systemKw} kW Dual MPPT String Inverter`
                ),
                warranty: inverterItem?.warranty || c.hw.warrantyInverter,
                why: c.hw.whyInverter,
              },
              {
                key: "structure" as HwIconKey,
                tag: c.hw.structure,
                title: structureItem ? structureItem.brand || "JSW" : "JSW",
                spec: bomLine(structureItem, "Hot-Dip Galvanized GI Structure"),
                warranty: structureItem?.warranty || c.hw.warrantyStructure,
                why: c.hw.whyStructure,
              },
              {
                key: "protection" as HwIconKey,
                tag: c.hw.protection,
                title: protectionItem
                  ? protectionItem.brand || "Havells / Phoenix"
                  : "Havells / Phoenix",
                spec: bomLine(protectionItem, "DCDB + ACDB with SPD"),
                warranty: protectionItem?.warranty || c.hw.warrantyProtection,
                why: c.hw.whyProtection,
              },
            ] as const
          ).map((hw) => (
            <div key={hw.key} className={styles.hwCardV2}>
              <div className={styles.hwCardTop}>
                <div className={styles.hwCardIcon} aria-hidden="true">
                  <HwCardIcon name={hw.key} className={styles.hwCardIconSvg} />
                </div>
                <span className={styles.hwCardTag}>{hw.tag}</span>
              </div>
              <div className={styles.hwCardBody}>
                <div className={styles.hwCardTitle}>{hw.title}</div>
                <p className={styles.hwCardSpec}>{hw.spec}</p>
                <p className={styles.hwCardWhy}>{hw.why}</p>
                <div className={styles.hwCardFooter}>
                  <span className={styles.hwCardWarranty}>{hw.warranty}</span>
                  <a href="#" className={styles.hwCardDatasheet}>
                    {c.hw.viewDatasheet}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className={styles.hwEarthStrip}>
          <div className={styles.hwEarthHead}>
            <span className={styles.hwEarthIconWrap} aria-hidden>
              <HwIconEarth className={styles.hwEarthIconSvg} />
            </span>
            <div>
              <span className={styles.hwEarthTag}>{c.hw.earthTag}</span>
              <p className={styles.hwEarthLead}>{c.hw.earthLead}</p>
            </div>
          </div>
          <div className={styles.hwEarthChips}>
            {[
              {
                val: c.hw.earthKitsVal,
                label: c.hw.earthKitsLabel,
              },
              {
                val: c.hw.earthCableVal,
                label: c.hw.earthCableLabel,
              },
              {
                val: c.hw.earthLaVal,
                label: c.hw.earthLaLabel,
              },
            ].map((chip) => (
              <div key={chip.label} className={styles.hwEarthChip}>
                <strong className={styles.hwEarthChipVal}>{chip.val}</strong>
                <span className={styles.hwEarthChipLabel}>{chip.label}</span>
              </div>
            ))}
          </div>
          <p className={styles.hwEarthWhy}>{c.hw.earthWhy}</p>
        </aside>

        <div className={styles.warrantyGridCompact}>
          {warrantyCards.map((w, i) => (
            <div
              key={w.label}
              className={`${styles.warrantyBadge} ${i === 0 ? styles.warrantyAccent : ""}`}
            >
              <div className={styles.warrantyCircle}>
                <div className={styles.warrantyYears}>{w.years}</div>
                <div className={styles.warrantyYrsText}>{c.hw.yrs}</div>
              </div>
              <div className={styles.warrantyLabel}>{w.label}</div>
              {w.sub && <div className={styles.warrantySub}>{w.sub}</div>}
            </div>
          ))}
        </div>

        <span className={styles.pageNum}>{folio(pn.hw, totalPages)}</span>
      </section>

      {/* ══ P8: WHY PARTNER — trust cards + 1 proof photo ═══════ */}
      <section className={`${styles.page} ${styles.trustPage}`}>
        <header className={styles.pageHead}>
          <span className={styles.pageTag}>
            {withPageTag(c.trust.tag(brand.toUpperCase()), pn.trust)}
          </span>
          <h2 className={styles.pageTitle}>{c.trust.title}</h2>
        </header>

        <div className={styles.trustGrid}>
          {c.trust.cards.map((t) => (
            <div key={t.label} className={styles.trustCard}>
              <div className={styles.trustCardTop}>
                <span className={styles.trustIconTile} aria-hidden>
                  <TrustCardIcon
                    name={t.icon}
                    className={styles.trustIconSvg}
                  />
                </span>
                <div className={styles.trustNum}>{t.num}</div>
              </div>
              <div className={styles.trustLabel}>{t.label}</div>
              <div className={styles.trustNote}>{t.note}</div>
            </div>
          ))}
        </div>

        <div className={styles.trustShowcase}>
          <figure className={styles.trustPhotoFrame}>
            {/* eslint-disable-next-line @next/next/no-img-element -- print A4 static asset */}
            <img
              className={styles.trustPhoto}
              src="/assets/proposals/quantum-cover-estate.jpg"
              alt={c.trust.photoTitle}
            />
            <figcaption className={styles.trustPhotoCap}>
              <strong>{c.trust.photoTitle}</strong>
              <span>{c.trust.photoSub}</span>
            </figcaption>
          </figure>
          <div className={styles.trustQuoteBox}>
            <span className={styles.trustQuoteMark} aria-hidden>
              “
            </span>
            <p className={styles.trustQuote}>{c.trust.quote}</p>
            <span className={styles.trustQuoteAttr}>
              {c.trust.quoteAttr(brand)}
            </span>
          </div>
        </div>

        <aside className={`${styles.wealthExpert} ${styles.trustExpert}`}>
          <div className={styles.wealthExpertTop}>
            <span className={styles.wealthExpertTag}>{c.trust.expertTag}</span>
            <span className={styles.wealthExpertAttr}>
              {c.trust.expertAttr(brand)}
            </span>
          </div>
          <p className={styles.wealthExpertBody}>
            {c.trust.expertBody(cityLabel, brand)}
          </p>
        </aside>

        <span className={styles.pageNum}>{folio(pn.trust, totalPages)}</span>
      </section>

      {/* ══ IMPACT — before payment / roadmap ═══════════════════ */}
      <section className={`${styles.page} ${styles.impactPage}`}>
        <header className={styles.pageHead}>
          <span className={styles.pageTag}>
            {withPageTag(c.impact.tag, pn.impact)}
          </span>
          <h2 className={styles.pageTitle}>{c.impact.title}</h2>
          <p className={styles.pageLead}>{c.impact.lead}</p>
        </header>

        <div className={styles.impactGrid}>
          <div className={`${styles.impactCard} ${styles.impactCardAccent}`}>
            <div className={styles.impactCardHead}>
              <ImpactIconLeaf className={styles.impactCardIcon} />
              <div>
                <div className={styles.impactBig}>{co2 > 0 ? co2 : "—"}</div>
                <div className={styles.impactUnit}>{c.impact.tons}</div>
              </div>
            </div>
            <div className={styles.impactLabel}>{c.impact.co2Label}</div>
            <p className={styles.impactSub}>
              {c.impact.co2Sub(co2 > 0 ? Math.round(co2 / 2) : "—")}
            </p>
          </div>
          <div className={styles.impactCard}>
            <div className={styles.impactCardHead}>
              <ImpactIconTrees className={styles.impactCardIcon} />
              <div>
                <div className={styles.impactBig}>
                  {trees > 0 ? trees.toLocaleString("en-IN") : "—"}
                </div>
                <div className={styles.impactUnit}>{c.impact.trees}</div>
              </div>
            </div>
            <div className={styles.impactLabel}>{c.impact.ecoLabel}</div>
            <p className={styles.impactSub}>{c.impact.ecoSub}</p>
          </div>
        </div>

        <div className={styles.carbonPanel}>
          <div className={styles.carbonPanelHead}>
            <span className={styles.carbonPanelTitle}>{c.impact.chartTitle}</span>
            <span className={styles.carbonPanelHint}>{c.impact.chartHint}</span>
          </div>
          <div className={styles.carbonMilestones}>
            {[1, 10, 25].map((yr) => {
              const tons = co2 > 0 ? Math.round((co2 / 25) * yr) : 0;
              return (
                <div key={yr} className={styles.carbonMilestone}>
                  <div className={styles.cmTons}>
                    {tons > 0 ? c.impact.tonsCo2(tons) : "—"}
                  </div>
                  <div className={styles.cmBar}>
                    <div
                      className={styles.cmBarFill}
                      style={{ height: `${Math.max(8, (yr / 25) * 100)}%` }}
                    />
                  </div>
                  <div className={styles.cmYear}>{c.impact.yearN(yr)}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.impactMeaning}>
          <span className={styles.impactMeaningTitle}>
            {c.impact.meaningTitle}
          </span>
          <div className={styles.impactMeaningGrid}>
            <div className={styles.impactMeaningCard}>
              <ImpactIconCar className={styles.impactMeaningIcon} />
              <strong>{c.impact.meaningCarTitle}</strong>
              <p>
                {c.impact.meaningCarBody(
                  co2 > 0 ? Math.round(co2 / 2) : "—"
                )}
              </p>
            </div>
            <div className={styles.impactMeaningCard}>
              <ImpactIconTrees className={styles.impactMeaningIcon} />
              <strong>{c.impact.meaningTreeTitle}</strong>
              <p>
                {c.impact.meaningTreeBody(
                  trees > 0 ? trees.toLocaleString("en-IN") : "—"
                )}
              </p>
            </div>
            <div className={styles.impactMeaningCard}>
              <ImpactIconRoof className={styles.impactMeaningIcon} />
              <strong>{c.impact.meaningRoofTitle}</strong>
              <p>{c.impact.meaningRoofBody}</p>
            </div>
          </div>
        </div>

        <div className={styles.impactTagline}>{c.impact.tagline}</div>
        <span className={styles.pageNum}>{folio(pn.impact, totalPages)}</span>
      </section>

      {/* ══ EXECUTION ROADMAP + PAYMENT + BANK (after impact) ══ */}
      <section className={`${styles.page} ${styles.roadmapPage}`}>
        <header className={styles.pageHead}>
          <span className={styles.pageTag}>
            {withPageTag(c.roadmap.tag, pn.roadmap)}
          </span>
          <h2 className={styles.pageTitle}>{c.roadmap.title}</h2>
        </header>

        <div className={styles.journeyBlock}>
          <div className={styles.journeyHead}>
            <span className={styles.journeyLabel}>{c.roadmap.journeyLabel}</span>
            <p className={styles.roadmapNote}>
              {c.roadmap.timelineBefore}
              <strong>{c.roadmap.timelineStrong}</strong>
              {c.roadmap.timelineAfter}
            </p>
          </div>
          <div className={styles.journeyGrid}>
            {journey.map((step) => (
              <div key={step.num} className={styles.journeyCard}>
                <span className={styles.journeyNum}>{step.num}</span>
                <div className={styles.journeyBody}>
                  <strong className={styles.journeyTitle}>{step.title}</strong>
                  <em className={styles.journeyDuration}>
                    {estimateDuration(step.title, c.durations)}
                  </em>
                  <p className={styles.journeyDesc}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.payBankSplit}>
          <div className={styles.invoice}>
            <div className={styles.invoiceHead}>
              <div>
                <span className={styles.invoiceSectionTag}>
                  {c.roadmap.payLabel}
                </span>
                <div className={styles.invoiceFrom}>{brand}</div>
                <div className={styles.invoiceTo}>
                  {c.roadmap.preparedFor(clientName)}
                </div>
              </div>
              <div className={styles.invoiceTotalBox}>
                <div className={styles.invoiceTotalAmt}>
                  {netInr > 0 ? formatInr(netInr) : "—"}
                </div>
                <div className={styles.invoiceTotalLabel}>
                  {c.roadmap.netPayable}
                </div>
              </div>
            </div>
            <div className={styles.invoiceBody}>
              <div className={styles.invoiceRow} data-header="true">
                <span>{c.roadmap.milestone}</span>
                <span>{c.roadmap.share}</span>
                <span>{c.roadmap.amount}</span>
              </div>
              {payments.map((p) => (
                <div key={p.label} className={styles.invoiceRow}>
                  <span>{p.label}</span>
                  <span className={styles.invoicePct}>{p.pctLabel}</span>
                  <span className={styles.invoiceAmt}>
                    {formatInr(p.amountInr)}
                  </span>
                </div>
              ))}
            </div>
            <div className={styles.invoiceFooter}>
              {c.roadmap.subsidyFooter(
                subsidyInr > 0 ? formatInr(subsidyInr) : "—"
              )}
            </div>
          </div>

          <aside className={styles.vendorBankCard}>
            <div className={styles.vendorBankHead}>
              <span className={styles.vendorBankTag}>{c.roadmap.bankLabel}</span>
              <p className={styles.vendorBankNote}>{c.roadmap.bankNote}</p>
            </div>
            {hasVendorBank ? (
              <div className={styles.vendorBankFields}>
                <div className={styles.vendorBankField}>
                  <span>{c.roadmap.accountName}</span>
                  <strong>{bankName || "—"}</strong>
                </div>
                <div
                  className={`${styles.vendorBankField} ${styles.vendorBankHero}`}
                >
                  <span>{c.roadmap.accountNumber}</span>
                  <strong className={styles.vendorBankMono}>
                    {vendorBank.accountNumber
                      ? formatAc(vendorBank.accountNumber)
                      : "—"}
                  </strong>
                </div>
                <div className={styles.vendorBankPair}>
                  <div className={styles.vendorBankField}>
                    <span>{c.roadmap.ifsc}</span>
                    <strong className={styles.vendorBankMono}>
                      {(vendorBank.ifsc || "—").toUpperCase()}
                    </strong>
                  </div>
                  <div className={styles.vendorBankField}>
                    <span>{c.roadmap.upi}</span>
                    <strong className={styles.vendorBankMono}>
                      {vendorBank.upiId || "—"}
                    </strong>
                  </div>
                </div>
                {vendorBank.branch ? (
                  <div className={styles.vendorBankField}>
                    <span>{c.roadmap.branch}</span>
                    <strong>{vendorBank.branch}</strong>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className={styles.vendorBankEmpty}>
                {c.roadmap.bankEmpty}
              </div>
            )}
          </aside>
        </div>

        <span className={styles.pageNum}>{folio(pn.roadmap, totalPages)}</span>
      </section>

      {/* ══ P11: TERMS & COMPLIANCE (Luxe content · Atelier style) ══ */}
      <section className={`${styles.page} ${styles.termsPage}`}>
        <header className={styles.pageHead}>
          <span className={styles.pageTag}>
            {withPageTag(c.terms.tag10, pn.terms1)}
          </span>
          <h2 className={styles.pageTitle}>{c.terms.title}</h2>
          <p className={styles.pageLead}>{c.terms.intro1}</p>
        </header>

        <div className={styles.termsStack}>
          <section className={styles.termsSection}>
            <div className={styles.termsSubhead}>{c.terms.general}</div>
            <ol className={styles.termsArticleList}>
              {generalTerms.map((t, i) => (
                <li key={t.label} className={styles.termsArticle}>
                  <span className={styles.termsArticleNum}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <strong className={styles.termsArticleLabel}>{t.label}</strong>
                    <p className={styles.termsArticleBody}>{t.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className={styles.termsSection}>
            <div className={styles.termsSubhead}>{c.terms.documents}</div>
            <ol className={styles.termsNumberedList}>
              {docs.map((d, i) => (
                <li key={d.slice(0, 48)}>
                  <span className={styles.termsListNum}>{i + 1}</span>
                  <span>{d}</span>
                </li>
              ))}
            </ol>
          </section>

          <aside className={styles.termsNote}>
            <span className={styles.termsNoteTag}>{c.terms.counselLabel}</span>
            <p>{c.terms.counsel}</p>
          </aside>
        </div>

        <span className={styles.pageNum}>{folio(pn.terms1, totalPages)}</span>
      </section>

      {/* ══ P12: TERMS & COMPLIANCE (CONTD.) ═════════════════════ */}
      <section className={`${styles.page} ${styles.termsPage} ${styles.termsPageDense}`}>
        <header className={styles.pageHead}>
          <span className={styles.pageTag}>
            {withPageTag(c.terms.tag11, pn.terms2)}
          </span>
          <h2 className={styles.pageTitle}>{c.terms.title}</h2>
          <p className={styles.pageLead}>{c.terms.intro2}</p>
        </header>

        <div className={styles.termsStack}>
          <section className={styles.termsSection}>
            <div className={styles.termsSubhead}>{c.terms.safety}</div>
            <ul className={styles.termsSafetyList}>
              {safetyNotes.map((s) => (
                <li key={s.slice(0, 40)}>{s}</li>
              ))}
            </ul>
          </section>

          <section className={styles.termsSection}>
            <div className={styles.termsSubhead}>{c.terms.clientScope}</div>
            <ol className={styles.termsNumberedList}>
              {clientScope.map((s, i) => (
                <li key={s.slice(0, 48)}>
                  <span className={styles.termsListNum}>{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className={styles.termsSection}>
            <div className={styles.termsSubhead}>{c.terms.amcScope}</div>
            <p className={styles.termsPara}>{amcObjective}</p>

            {planOptions.length > 0 ? (
              <>
                <p className={styles.termsAmcLabel}>{c.terms.availablePlans}</p>
                <ol className={styles.termsNumberedList}>
                  {planOptions.map((s, i) => (
                    <li key={`plan-${s.slice(0, 32)}`}>
                      <span className={styles.termsListNum}>{i + 1}</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
              </>
            ) : null}

            <p className={styles.termsAmcLabel}>{c.terms.amcIncludes}</p>
            <ol className={styles.termsNumberedList}>
              {amcIncludes.map((s, i) => (
                <li key={`inc-${s.slice(0, 32)}`}>
                  <span className={styles.termsListNum}>{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>

            <p className={styles.termsAmcLabel}>{c.terms.amcExcludes}</p>
            <ol className={styles.termsNumberedList}>
              {amcExcludes.map((s, i) => (
                <li key={`exc-${s.slice(0, 32)}`}>
                  <span className={styles.termsListNum}>{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className={styles.termsSection}>
            <div className={styles.termsSubhead}>{c.terms.costMaint}</div>
            <div className={styles.termsCostBox}>
              <p>{c.terms.year1Included}</p>
              <p>
                {c.terms.year2Onwards}
                {invoiceRef ? (
                  <>
                    {" "}
                    (<strong>({invoiceRef})</strong>
                  </>
                ) : null}
              </p>
            </div>
            {amcCommercial.length > 0 ? (
              <>
                <p className={styles.termsAmcLabel}>{c.terms.paymentNotes}</p>
                <ol className={styles.termsNumberedList}>
                  {amcCommercial.map((t, i) => (
                    <li key={`com-${t.slice(0, 32)}`}>
                      <span className={styles.termsListNum}>{i + 1}</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ol>
              </>
            ) : null}
          </section>

          <div className={styles.termsSignoff}>
            <span className={styles.termsRegards}>{c.terms.regards}</span>
            <span className={styles.termsBrand}>
              {footerBrand.showName ? footerBrand.installerName || brand : brand}
            </span>
            <span className={styles.termsVendorTag}>{c.terms.vendorTag}</span>
          </div>

          <aside className={styles.termsNote}>
            <span className={styles.termsNoteTag}>{c.terms.omLabel}</span>
            <p>{c.terms.om}</p>
          </aside>
        </div>

        <span className={styles.pageNum}>{folio(pn.terms2, totalPages)}</span>
      </section>

      {/* ══ P12: EMOTIONAL CLOSING — RCC rooftop + CTA ═══════════ */}
      <section className={`${styles.page} ${styles.closingPage}`}>
        <div className={styles.closingInner}>
          <div className={styles.closingBrandTop}>
            {closingBrand.showLogo ? (
              <span
                className={
                  logoNeedsPlate ? styles.logoPlate : styles.logoBare
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={closingBrand.logoUrl}
                  alt={closingBrand.installerName || brand}
                  className={styles.closingLogo}
                />
              </span>
            ) : null}
            {closingBrand.showName || !closingBrand.showLogo ? (
              <span className={styles.closingBrandName}>
                {(closingBrand.installerName || brand).toUpperCase()}
              </span>
            ) : null}
            <span className={styles.closingTagInline}>
              {withPageTag(c.closing.tag, pn.closing)}
            </span>
          </div>

          <figure className={styles.closingPhotoPlate}>
            <div className={styles.closingPhotoFrame}>
              {/* eslint-disable-next-line @next/next/no-img-element -- print A4 static asset */}
              <img
                className={styles.closingPhotoImg}
                src="/assets/proposals/atelier-closing-rcc-rooftop.jpg"
                alt=""
                width={1600}
                height={900}
              />
              <div className={styles.closingPhotoVignette} aria-hidden />
              <div className={styles.closingPhotoEdge} aria-hidden />
            </div>
            <figcaption className={styles.closingPhotoCaption}>
              <span className={styles.closingPhotoTitle}>
                {c.closing.photoTitle}
              </span>
              <span className={styles.closingPhotoSub}>
                {c.closing.photoSub}
              </span>
            </figcaption>
          </figure>

          <div className={styles.closingSplit}>
            <div className={styles.closingLeft}>
              <h2 className={styles.closingTitle}>{c.closing.congrats}</h2>
              <p className={styles.closingStatement}>
                {c.closing.statement1}
                <br />
                <strong>{c.closing.statement2}</strong>
              </p>
              <p className={styles.closingSub}>{c.closing.sub}</p>
              <div className={styles.closingStats}>
                <div>
                  <div className={styles.closingStatBig}>
                    {annualGen > 0 ? annualGen.toLocaleString("en-IN") : "—"}
                  </div>
                  <div className={styles.closingStatLabel}>
                    {c.closing.unitsYear}
                  </div>
                </div>
                <div className={styles.closingStatDiv} />
                <div>
                  <div className={styles.closingStatBig}>
                    {annualSavings > 0 ? formatInr(annualSavings) : "—"}
                  </div>
                  <div className={styles.closingStatLabel}>
                    {c.closing.savedYear}
                  </div>
                </div>
                <div className={styles.closingStatDiv} />
                <div>
                  <div className={styles.closingStatBig}>
                    {totalWealth > 0 ? formatInrCompact(totalWealth) : "—"}
                  </div>
                  <div className={styles.closingStatLabel}>
                    {c.closing.wealth25}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.closingRight}>
              <div className={styles.closingCTABox}>
                <div className={styles.ctaTitle}>{c.closing.ctaTitle}</div>
                <p className={styles.ctaDesc}>{c.closing.ctaDesc}</p>
                <button
                  type="button"
                  onClick={() => void handleDownloadPdf()}
                  className={`${styles.closingBtn} print:hidden`}
                  disabled={pdfBusy}
                  aria-busy={pdfBusy}
                >
                  {pdfBusy ? pdfProgress || c.print.preparingPdf : c.closing.ctaBtn}
                </button>
                <div className={styles.ctaDivider} />
                <div className={styles.ctaContact}>
                  {closingBrand.showName ? (
                    <div className={styles.ctaBrand}>
                      {closingBrand.installerName || brand}
                    </div>
                  ) : null}
                  {closingBrand.showTagline &&
                  (data.closing.brandTagline || data.meta.brandTagline) ? (
                    <div className={styles.ctaInfo}>
                      {data.closing.brandTagline || data.meta.brandTagline}
                    </div>
                  ) : null}
                  {contact ? <div className={styles.ctaInfo}>{contact}</div> : null}
                  {brandAddress ? (
                    <div className={styles.ctaInfo}>{brandAddress}</div>
                  ) : null}
                  {brandGst ? (
                    <div className={styles.ctaInfo}>GSTIN {brandGst}</div>
                  ) : null}
                  {contactPerson ? (
                    <div className={styles.ctaInfo}>{contactPerson}</div>
                  ) : null}
                  <div className={styles.closingValidity}>
                    {c.closing.validity}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <span className={`${styles.pageNum} ${styles.pageNumLight}`}>
          {folio(pn.closing, totalPages)}
        </span>
      </section>
    </div>
  );
}

export default AtelierRenderer;
