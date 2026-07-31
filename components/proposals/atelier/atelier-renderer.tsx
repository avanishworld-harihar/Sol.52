"use client";

/**
 * Atelier — Investment Blueprint (High-Conversion Sales Journey)
 * Flow: [Cover] → [Impact] → [Financial Story] → [Wealth Proof]
 *       → [Generation] → [Hardware] → [Why Us] → [Roof] → [Roadmap]
 *       → [Compliance] → [Closing]
 *
 * ProposalData-native · Print A4 · 12 pages · break-after: page (print only)
 */

import { useEffect, useState } from "react";
import type { ProposalData } from "@/lib/proposal-data";
import type { PremiumProposalPptInput } from "@/lib/proposal-ppt";
import { formatInr, formatInrCompact } from "@/components/proposals/_shared/formatters";
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
import { AtelierRoofPlan } from "./atelier-roof-plan";
import styles from "./atelier.module.css";

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
  const lifetimeWealth = data.closing.lifetimeWealthInr;
  const tilt = data.engineering.tiltDeg ?? 20;
  const cityLabel = data.engineering.cityLabel || city;
  const contact = data.closing.contactLine?.trim() || "";
  const brandAddress = data.closing.address || data.meta.brandAddress;
  const brandGst = data.closing.gstNumber || data.meta.brandGst;
  const contactPerson = data.closing.contactPerson;

  // ── New financial calculations ────────────────────────────────
  const monthlyBill =
    data.bill.yearlyBillInr > 0
      ? Math.round(data.bill.yearlyBillInr / 12)
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
  const docs = c.docs;
  const amcObjective = c.amcObjective;
  const amcScope = c.amcScope;
  const clientScope = c.clientScope;

  const invoiceRef =
    grossInr > 0 ? formatInr(grossInr) : netInr > 0 ? formatInr(netInr) : "₹3,00,000";
  const amcCostParagraph = c.amcCostParagraph(invoiceRef);
  const amcTerms = c.amcTerms;

  // Vendor bank — More → Brand settings (+ proposal bank fields)
  void brandConfig;
  const vendorBank = resolveProposalBankDetails({
    pptBank: {
      accountName: data.execution.bank.company || undefined,
      accountNumber: data.execution.bank.accountNumber || undefined,
      ifsc: data.execution.bank.ifsc || undefined,
      upiId: data.execution.bank.upiId || undefined,
    },
    settings:
      typeof window !== "undefined" ? readProposalBrandingSettings() : null,
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

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  // ── JSX ──────────────────────────────────────────────────────
  return (
    <div className={`${styles.wrapper}${isHi ? ` ${styles.langHi}` : ""}`}>
      <style>{`
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Lato:wght@300;400;700&display=swap');
@media print {
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    overflow: hidden !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  /* Named pages only — never bare @page (bleeds into other presets) */
  @page atelier-sheet { size: A4; margin: 18mm 20mm; }
  @page atelier-cover { size: A4; margin: 0; }
  @page atelier-closing { size: A4; margin: 0; }
}
`}</style>

      {/* Sticky print bar */}
      <div className={styles.printBar}>
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
            <button type="button" onClick={handlePrint} className={styles.printBarBtn}>
              {c.print.downloadPdf}
            </button>
          </div>
        </div>
      </div>

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

          <div className={styles.coverHero}>
            <p className={styles.coverFor}>{c.cover.preparedFor}</p>
            <h1 className={styles.coverName}>{clientName}</h1>
            <p className={styles.coverLoc}>{location}</p>
          </div>

          <div className={styles.coverWealthRow}>
            <div className={styles.coverWealthCard}>
              <span className={styles.coverWealthTag}>{c.cover.wealthTag}</span>
              <div className={styles.coverWealthAmt}>
                {totalWealth > 0 ? formatInrCompact(totalWealth) : "—"}
              </div>
              <span className={styles.coverWealthSub}>{c.cover.wealthSub}</span>
            </div>
            <div className={styles.coverWealthDivider} />
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
        <span className={styles.pageNum}>01 / 12</span>
      </section>

      {/* ══ P2: IMPACT MOMENT — environmental only (no financials) ══ */}
      <section className={`${styles.page} ${styles.impactPage}`}>
        <header className={styles.pageHead}>
          <span className={styles.pageTag}>{c.impact.tag}</span>
          <h2 className={styles.pageTitle}>{c.impact.title}</h2>
          <p className={styles.pageLead}>{c.impact.lead}</p>
        </header>

        <div className={styles.impactGrid}>
          <div className={styles.impactCard}>
            <div className={styles.impactBig}>{co2 > 0 ? co2 : "—"}</div>
            <div className={styles.impactUnit}>{c.impact.tons}</div>
            <div className={styles.impactLabel}>{c.impact.co2Label}</div>
            <p className={styles.impactSub}>
              {c.impact.co2Sub(co2 > 0 ? Math.round(co2 / 2) : "—")}
            </p>
          </div>
          <div className={styles.impactCard}>
            <div className={styles.impactBig}>
              {trees > 0 ? trees.toLocaleString("en-IN") : "—"}
            </div>
            <div className={styles.impactUnit}>{c.impact.trees}</div>
            <div className={styles.impactLabel}>{c.impact.ecoLabel}</div>
            <p className={styles.impactSub}>{c.impact.ecoSub}</p>
          </div>
        </div>

        <div className={styles.carbonMilestones}>
          {[1, 10, 25].map((yr) => {
            const tons = co2 > 0 ? Math.round((co2 / 25) * yr) : 0;
            return (
              <div key={yr} className={styles.carbonMilestone}>
                <div className={styles.cmBar}>
                  <div
                    className={styles.cmBarFill}
                    style={{ height: `${(yr / 25) * 100}%` }}
                  />
                </div>
                <div className={styles.cmYear}>{c.impact.yearN(yr)}</div>
                <div className={styles.cmTons}>
                  {tons > 0 ? c.impact.tonsCo2(tons) : "—"}
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.impactTagline}>{c.impact.tagline}</div>
        <span className={styles.pageNum}>02 / 12</span>
      </section>

      {/* ══ P3: FINANCIAL STORY — immediate monthly economics only ══ */}
      <section className={`${styles.page} ${styles.financePage}`}>
        <header className={styles.pageHead}>
          <span className={styles.pageTag}>{c.finance.tag}</span>
          <h2 className={styles.pageTitle}>{c.finance.title}</h2>
          <p className={styles.pageLead}>{c.finance.lead}</p>
        </header>

        <div className={styles.billComparison}>
          <div className={styles.billCard}>
            <span className={styles.billCardTag}>{c.finance.todayTag}</span>
            <div className={styles.billCardAmt} style={{ color: "#DC2626" }}>
              {monthlyBill > 0 ? formatInr(monthlyBill) : "₹5,200"}
            </div>
            <div className={styles.billCardLabel}>{c.finance.todayLabel}</div>
            <p className={styles.billCardNote}>{c.finance.todayNote}</p>
          </div>

          <div className={styles.billArrow}>→</div>

          <div className={`${styles.billCard} ${styles.billCardSolar}`}>
            <span className={styles.billCardTag}>{c.finance.tomorrowTag}</span>
            <div className={styles.billCardAmt} style={{ color: "#059669" }}>
              {monthlyEmi > 0 ? formatInr(monthlyEmi) : "₹4,100"}
            </div>
            <div className={styles.billCardLabel}>{c.finance.tomorrowLabel}</div>
            <p className={styles.billCardNote}>{c.finance.tomorrowNote}</p>
          </div>

          <div className={styles.billArrow}>=</div>

          <div className={`${styles.billCard} ${styles.billCardProfit}`}>
            <span className={styles.billCardTag}>{c.finance.profitTag}</span>
            <div className={styles.billCardAmt}>
              {monthlyProfit > 0
                ? `+${formatInr(monthlyProfit)}`
                : formatInr(monthlyInr > 0 ? monthlyInr : 900)}
            </div>
            <div className={styles.billCardLabel}>{c.finance.profitLabel}</div>
            <p className={styles.billCardNote}>{c.finance.profitNote}</p>
          </div>
        </div>

        {(() => {
          const years = [1, 2, 3, 4, 5, 7, 10];
          const baseAnnualBill = (monthlyBill > 0 ? monthlyBill : 5200) * 12;
          const flatSolarAnnual = (monthlyEmi > 0 ? monthlyEmi : 4100) * 12;
          const loanEndYr = 5;
          const amcAnnual = netInr > 0 ? netInr * 0.02 : flatSolarAnnual * 0.15;
          const withoutPts = years.map((y) => baseAnnualBill * Math.pow(1.06, y - 1));
          const withPts = years.map((y) => (y <= loanEndYr ? flatSolarAnnual : amcAnnual));
          const maxVal = Math.max(...withoutPts) * 1.08;
          const W = 600;
          const H = 190;
          const padL = 8;
          const padR = 8;
          const padT = 10;
          const padB = 24;
          const xFor = (i: number) => padL + (i / (years.length - 1)) * (W - padL - padR);
          const yFor = (v: number) => padT + (1 - v / maxVal) * (H - padT - padB);
          const withoutPath = withoutPts.map((v, i) => `${xFor(i)},${yFor(v)}`).join(" ");
          const withPath = withPts.map((v, i) => `${xFor(i)},${yFor(v)}`).join(" ");
          const areaPath =
            `M${xFor(0)},${yFor(withoutPts[0])} ` +
            withoutPts.map((v, i) => `L${xFor(i)},${yFor(v)}`).join(" ") +
            ` L${xFor(years.length - 1)},${yFor(withPts[withPts.length - 1])} ` +
            withPts.slice().reverse().map((v, i) => `L${xFor(years.length - 1 - i)},${yFor(v)}`).join(" ") +
            " Z";
          return (
            <div className={styles.trajectoryChart}>
              <span className={styles.genCardTag}>{c.finance.trajectoryTag}</span>
              <svg viewBox={`0 0 ${W} ${H}`} className={styles.trajectorySvg}>
                <path d={areaPath} className={styles.trajectoryGap} />
                <polyline points={withoutPath} className={styles.trajectoryLineRed} />
                <polyline points={withPath} className={styles.trajectoryLineGreen} />
                {years.map((y, i) => (
                  <text key={y} x={xFor(i)} y={H - 6} className={styles.trajectoryXLabel} textAnchor="middle">
                    {c.finance.yr(y)}
                  </text>
                ))}
              </svg>
              <div className={styles.trajectoryLegend}>
                <span className={styles.trajLegendItem}>
                  <span className={styles.trajDotRed} /> {c.finance.legendWithout}
                </span>
                <span className={styles.trajLegendItem}>
                  <span className={styles.trajDotGreen} /> {c.finance.legendWith}
                </span>
                <span className={styles.trajLegendItem}>
                  <span className={styles.trajDotGap} /> {c.finance.legendGap}
                </span>
              </div>
            </div>
          );
        })()}

        <div className={styles.investBreakdown}>
          <div className={styles.investItem}>
            <span className={styles.investTag}>{c.finance.grossCost}</span>
            <span className={styles.investVal}>
              {grossInr > 0 ? formatInr(grossInr) : "—"}
            </span>
          </div>
          <div className={styles.investMinus}>−</div>
          <div className={styles.investItem}>
            <span className={styles.investTag}>{c.finance.subsidy}</span>
            <span className={styles.investVal} style={{ color: "#059669" }}>
              {subsidyInr > 0 ? formatInr(subsidyInr) : "—"}
            </span>
          </div>
          <div className={styles.investMinus}>=</div>
          <div className={`${styles.investItem} ${styles.investItemFinal}`}>
            <span className={styles.investTag}>{c.finance.netInvestment}</span>
            <span className={styles.investVal}>
              {netInr > 0 ? formatInr(netInr) : "—"}
            </span>
          </div>
        </div>

        <span className={styles.pageNum}>03 / 12</span>
      </section>

      {/* ══ P4: WEALTH PROJECTION — owns the full 25-year story ═══ */}
      <section className={`${styles.page} ${styles.wealthPage}`}>
        <header className={styles.pageHead}>
          <span className={styles.pageTag}>{c.wealth.tag}</span>
          <h2 className={styles.pageTitle}>{c.wealth.title}</h2>
          <p className={styles.pageLead}>{c.wealth.lead}</p>
        </header>

        <div className={styles.wealthJourney}>
          <div className={styles.wjPhase}>
            <div className={styles.wjDot} style={{ background: "#DC2626" }} />
            <div className={styles.wjLabel}>{c.wealth.phase1}</div>
            <div className={styles.wjTitle}>{c.wealth.investment}</div>
            <div className={styles.wjSpan}>
              {c.wealth.year0To(paybackYears > 0 ? Math.ceil(paybackYears) : 5)}
            </div>
            <div className={styles.wjNote}>{c.wealth.phase1Note}</div>
          </div>
          <div className={styles.wjArrow}>→</div>
          <div className={`${styles.wjPhase} ${styles.wjPhaseActive}`}>
            <div className={styles.wjDot} style={{ background: "#F97316" }} />
            <div className={styles.wjLabel}>{c.wealth.milestone}</div>
            <div className={styles.wjTitle}>{c.wealth.payback}</div>
            <div className={styles.wjSpan}>
              {c.wealth.yearAt(
                paybackYears > 0 ? paybackYears.toFixed(1) : "4–5"
              )}
            </div>
            <div className={styles.wjNote}>{c.wealth.paybackNote}</div>
          </div>
          <div className={styles.wjArrow}>→</div>
          <div className={styles.wjPhase}>
            <div className={styles.wjDot} style={{ background: "#059669" }} />
            <div className={styles.wjLabel}>{c.wealth.phase2}</div>
            <div className={styles.wjTitle}>{c.wealth.passiveIncome}</div>
            <div className={styles.wjSpan}>
              {c.wealth.yearRange(
                paybackYears > 0 ? Math.ceil(paybackYears) + 1 : 6
              )}
            </div>
            <div className={styles.wjNote}>
              {totalWealth > 0 && paybackYears > 0
                ? c.wealth.passiveWealth(
                    formatInrCompact(
                      totalWealth - annualSavings * Math.ceil(paybackYears)
                    )
                  )
                : c.wealth.pureWealth}{" "}
              {c.wealth.zeroEnergy}
            </div>
          </div>
        </div>

        <div className={styles.wealthLayout}>
          <div className={styles.wealthChartBox}>
            <div className={styles.wealthChart}>
              {wealthMilestones.map((m) => (
                <div key={m.year} className={styles.wealthMilestone}>
                  <div className={styles.wealthBarWrap}>
                    <div
                      className={styles.wealthBarFill}
                      style={{ width: `${m.pct}%` }}
                    />
                  </div>
                  <div className={styles.wealthMeta}>
                    <span className={styles.wealthYr}>{c.wealth.yrShort(m.year)}</span>
                    <span className={styles.wealthAmt}>
                      {m.savings > 0 ? formatInrCompact(m.savings) : "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.wealthChartNote}>{c.wealth.chartNote}</div>
            <div className={styles.wealthContrast}>
              <span className={styles.wealthContrastLabel}>
                {c.wealth.withoutSolar}
              </span>
              <span className={styles.wealthContrastVal}>
                {monthlyBill > 0
                  ? formatInrCompact(monthlyBill * 12 * 22)
                  : "—"}{" "}
                {c.wealth.paidToGrid}
              </span>
            </div>
          </div>

          <div className={styles.investScoreBox}>
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
                    {annualSavings > 0
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

            <div className={styles.paybackCard}>
              <span className={styles.investScoreTag}>{c.wealth.totalWealthTag}</span>
              <div className={styles.paybackAmt}>
                {totalWealth > 0 ? formatInrCompact(totalWealth) : "—"}
              </div>
              <p className={styles.paybackNote}>
                {c.wealth.returnsNote(
                  netInr > 0 ? formatInrCompact(netInr) : "—",
                  totalWealth > 0 && netInr > 0
                    ? `${(totalWealth / netInr).toFixed(1)}×`
                    : "—"
                )}
              </p>
            </div>
          </div>
        </div>

        <span className={styles.pageNum}>04 / 12</span>
      </section>

      {/* ══ P5: GENERATION PROOF ═════════════════════════════════ */}
      <section className={`${styles.page} ${styles.genPage}`}>
        <header className={styles.pageHead}>
          <span className={styles.pageTag}>{c.gen.tag}</span>
          <h2 className={styles.pageTitle}>
            {c.gen.title(
              annualGen > 0 ? annualGen.toLocaleString("en-IN") : "7,200"
            )}
          </h2>
        </header>

        <div className={styles.genProofGrid}>
          <div className={styles.genCard}>
            <span className={styles.genCardTag}>{c.gen.pvgis}</span>
            <div className={styles.genFormula}>
              <div className={styles.genFormulaStep}>
                <span className={styles.genFormulaVal}>
                  {systemKw > 0 ? `${systemKw} kW` : "5 kW"}
                </span>
                <span className={styles.genFormulaLabel}>{c.gen.systemCapacity}</span>
              </div>
              <span className={styles.genFormulaOp}>×</span>
              <div className={styles.genFormulaStep}>
                <span className={styles.genFormulaVal}>5.0</span>
                <span className={styles.genFormulaLabel}>{c.gen.sunHours}</span>
              </div>
              <span className={styles.genFormulaOp}>×</span>
              <div className={styles.genFormulaStep}>
                <span className={styles.genFormulaVal}>75%</span>
                <span className={styles.genFormulaLabel}>{c.gen.perfRatio}</span>
              </div>
              <span className={styles.genFormulaOp}>×</span>
              <div className={styles.genFormulaStep}>
                <span className={styles.genFormulaVal}>365</span>
                <span className={styles.genFormulaLabel}>{c.gen.daysYear}</span>
              </div>
              <span className={styles.genFormulaOp}>=</span>
              <div className={`${styles.genFormulaStep} ${styles.genFormulaResult}`}>
                <span className={styles.genFormulaVal}>
                  {annualGen > 0 ? annualGen.toLocaleString("en-IN") : "6,844"}
                </span>
                <span className={styles.genFormulaLabel}>{c.gen.unitsYear}</span>
              </div>
            </div>
          </div>

          <div className={styles.genCard}>
            <span className={styles.genCardTag}>
              {c.gen.solarResource(cityLabel)}
            </span>
            <div className={styles.genIrradGrid}>
              {[
                [c.gen.globalHoriz, "~1,850 kWh/m²/yr"],
                [c.gen.optimalIncl, `~1,950 kWh/m²/yr`],
                [c.gen.annualIrrad, c.gen.tiltLabel(tilt)],
                [c.gen.dataSource, "PVGIS / NREL Atlas"],
              ].map(([k, v]) => (
                <div key={k} className={styles.genIrradRow}>
                  <span className={styles.genIrradKey}>{k}</span>
                  <span className={styles.genIrradVal}>{v}</span>
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
          const bars = [
            {
              label: c.gen.ourEstimate,
              val: est,
              pct: 90,
              color: "var(--or)",
            },
            {
              label: c.gen.gridAvg(cityLabel),
              val: Math.round(est * 0.75),
              pct: 68,
              color: "var(--gray2)",
            },
            {
              label: c.gen.theoreticalMax,
              val: Math.round(est * 1.13),
              pct: 100,
              color: "#059669",
            },
          ];
          return (
            <div className={styles.genBarChart}>
              <span className={styles.genCardTag}>{c.gen.barTag(cityLabel)}</span>
              {bars.map((b) => (
                <div key={b.label} className={styles.genBarRow}>
                  <span className={styles.genBarLabel}>{b.label}</span>
                  <div className={styles.genBarTrack}>
                    <div
                      className={styles.genBarFill}
                      style={{ width: `${b.pct}%`, background: b.color }}
                    />
                  </div>
                  <span className={styles.genBarVal}>
                    {b.val.toLocaleString("en-IN")} {c.gen.units}
                  </span>
                </div>
              ))}
            </div>
          );
        })()}

        <div className={styles.expertInsight}>
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

        <div className={styles.genSpecGrid}>
          {engMetrics.map(([label, value]) => (
            <div key={label} className={styles.genSpecCard}>
              <div className={styles.genSpecVal}>{value}</div>
              <div className={styles.genSpecLabel}>{label}</div>
            </div>
          ))}
        </div>

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

        <span className={styles.pageNum}>05 / 12</span>
      </section>

      {/* ══ P6: HARDWARE — 4-CARD TRUST GRID ═════════════════════ */}
      <section className={`${styles.page} ${styles.hwPage}`}>
        <header className={styles.pageHead}>
          <span className={styles.pageTag}>{c.hw.tag}</span>
          <h2 className={styles.pageTitle}>{c.hw.title}</h2>
        </header>

        <div className={styles.hwCard4Grid}>
          {[
            {
              key: "panel",
              tag: c.hw.panels,
              title: panelItem
                ? panelItem.brand || "Waaree"
                : "Waaree Energies",
              spec: bomLine(panelItem, "580 Wp DCR TOPCon N-Type"),
              warranty: panelItem?.warranty || c.hw.warrantyPanel,
              mark: "P",
              why: c.hw.whyPanel(cityLabel),
            },
            {
              key: "inverter",
              tag: c.hw.inverter,
              title: inverterItem
                ? inverterItem.brand || "Havells / Polycab"
                : "Havells / Polycab",
              spec: bomLine(
                inverterItem,
                `${systemKw} kW Dual MPPT String Inverter`
              ),
              warranty: inverterItem?.warranty || c.hw.warrantyInverter,
              mark: "I",
              why: c.hw.whyInverter,
            },
            {
              key: "structure",
              tag: c.hw.structure,
              title: structureItem ? structureItem.brand || "JSW" : "JSW",
              spec: bomLine(structureItem, "Hot-Dip Galvanized GI Structure"),
              warranty: structureItem?.warranty || c.hw.warrantyStructure,
              mark: "M",
              why: c.hw.whyStructure,
            },
            {
              key: "protection",
              tag: c.hw.protection,
              title: protectionItem
                ? protectionItem.brand || "Havells / Phoenix"
                : "Havells / Phoenix",
              spec: bomLine(protectionItem, "DCDB + ACDB with SPD"),
              warranty: protectionItem?.warranty || c.hw.warrantyProtection,
              mark: "S",
              why: c.hw.whyProtection,
            },
          ].map((hw) => (
            <div key={hw.key} className={styles.hwCardV2}>
              <div className={styles.hwCardTop}>
                <div className={styles.hwCardIcon} aria-hidden="true">
                  {hw.mark}
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

        <span className={styles.pageNum}>06 / 12</span>
      </section>

      {/* ══ P7: WHY HARIHAR SOLAR — CREDIBILITY ══════════════════ */}
      <section className={`${styles.page} ${styles.trustPage}`}>
        <header className={styles.pageHead}>
          <span className={styles.pageTag}>
            {c.trust.tag(brand.toUpperCase())}
          </span>
          <h2 className={styles.pageTitle}>{c.trust.title}</h2>
        </header>

        <div className={styles.trustGrid}>
          {c.trust.cards.map((t) => (
            <div key={t.label} className={styles.trustCard}>
              <div className={styles.trustNum}>{t.num}</div>
              <div className={styles.trustLabel}>{t.label}</div>
              <div className={styles.trustNote}>{t.note}</div>
            </div>
          ))}
        </div>

        <div className={styles.trustQuoteBox}>
          <p className={styles.trustQuote}>{c.trust.quote}</p>
          <span className={styles.trustQuoteAttr}>
            {c.trust.quoteAttr(brand)}
          </span>
        </div>

        <span className={styles.pageNum}>07 / 12</span>
      </section>

      {/* ══ P8: ROOF INTELLIGENCE — Yield Story ═══════════════════ */}
      <section className={`${styles.page} ${styles.roofPage}`}>
        <header className={styles.pageHead}>
          <span className={styles.pageTag}>{c.roof.tag}</span>
          <h2 className={styles.pageTitle}>{c.roof.title}</h2>
        </header>

        <div className={styles.roofMainRow}>
          <div className={styles.roofArrayStage}>
            <div className={styles.roofStageHead}>
              <span className={styles.roofTerraceLabel}>{c.roof.terraceLabel}</span>
              <span className={styles.roofStageTitle}>
                {c.roof.panelLayout(panelCount)}
              </span>
            </div>
            <div className={styles.roofPlanFrame}>
              <AtelierRoofPlan
                modules={panelCount}
                southLabel={c.roof.southEdge}
                className={styles.roofPlanSvg}
              />
            </div>
            <p className={styles.roofPlanCaption}>
              {c.roof.planCaption(panelCount, panelWp, tilt)}
              {panelCount > 18
                ? ` · ${c.roof.moreModules(panelCount - 18)}`
                : null}
            </p>
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
              val: `~${Math.ceil(panelCount * 2)} m²`,
              note: c.roof.areaNote,
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
              val: `~${Math.min(95, Math.ceil((panelCount * 2 * 100) / Math.ceil(panelCount * 2.2)))}%`,
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

        <span className={styles.pageNum}>08 / 12</span>
      </section>

      {/* ══ P9: EXECUTION ROADMAP + PAYMENT + BANK ═══════════════ */}
      <section className={`${styles.page} ${styles.roadmapPage}`}>
        <header className={styles.pageHead}>
          <span className={styles.pageTag}>{c.roadmap.tag}</span>
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

        <span className={styles.pageNum}>09 / 12</span>
      </section>

      {/* ══ P10: TERMS & COMPLIANCE ══════════════════════════════ */}
      <section className={`${styles.page} ${styles.termsPage}`}>
        <header className={styles.pageHead}>
          <span className={styles.pageTag}>{c.terms.tag10}</span>
          <h2 className={styles.pageTitle}>{c.terms.title}</h2>
        </header>

        <div className={styles.termsGrid}>
          <div>
            <div className={styles.termsSubhead}>{c.terms.general}</div>
            <ul className={styles.termsList}>
              {generalTerms.map((t) => (
                <li key={t.slice(0, 48)}>{t}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className={styles.termsSubhead}>{c.terms.documents}</div>
            <ul className={styles.docsList}>
              {docs.map((d) => (
                <li key={d.slice(0, 48)}>{d}</li>
              ))}
            </ul>
            <div className={styles.termsSubhead} style={{ marginTop: "1.5rem" }}>
              {c.terms.amcScope}
            </div>
            <p className={styles.amcObjective}>{amcObjective}</p>
            <ul className={styles.termsList}>
              {amcScope.map((s) => (
                <li key={s.slice(0, 48)}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
        <span className={styles.pageNum}>10 / 12</span>
      </section>

      {/* ══ P11: TERMS & COMPLIANCE (CONTD.) ══════════════════════ */}
      <section className={`${styles.page} ${styles.termsPage}`}>
        <header className={styles.pageHead}>
          <span className={styles.pageTag}>{c.terms.tag11}</span>
          <h2 className={styles.pageTitle}>{c.terms.title}</h2>
        </header>

        <div className={styles.termsGrid}>
          <div>
            <div className={styles.termsSubhead}>{c.terms.clientScope}</div>
            <ul className={styles.termsList}>
              {clientScope.map((s) => (
                <li key={s.slice(0, 48)}>{s}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className={styles.termsSubhead}>{c.terms.costMaint}</div>
            <p className={styles.amcCostPara}>{amcCostParagraph}</p>
            <ul className={styles.termsList}>
              {amcTerms.map((t) => (
                <li key={t.slice(0, 48)}>{t}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className={styles.termsSignoff}>
          <span className={styles.termsRegards}>{c.terms.regards}</span>
          <span className={styles.termsBrand}>
            {footerBrand.showName ? footerBrand.installerName || brand : ""}
          </span>
        </div>
        <span className={styles.pageNum}>11 / 12</span>
      </section>

      {/* ══ P12: EMOTIONAL CLOSING — COMPANY BRANDING ══════════════ */}
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
          </div>

          <div className={styles.closingSplit}>
            <div className={styles.closingLeft}>
              <span className={styles.closingTag}>{c.closing.tag}</span>
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
                  onClick={handlePrint}
                  className={`${styles.closingBtn} print:hidden`}
                >
                  {c.closing.ctaBtn}
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
          12 / 12
        </span>
      </section>
    </div>
  );
}

export default AtelierRenderer;
