"use client";

/**
 * Canvas — full 12-page Investment Blueprint.
 * Every data section uses EvidenceCard for density.
 * Pages 05 (Generation) + 06 (Hardware) include Expert Insights.
 * Hardware images: /assets/hardware/* (public/assets/).
 */

import { useEffect, useRef, useState } from "react";
import type { ProposalBomItem, ProposalData } from "@/lib/proposal-data";
import {
  formatInr,
  formatInrCompact,
  formatLifetimeBenefitInr,
} from "@/components/proposals/_shared/formatters";
import {
  PROPOSAL_BRANDING_UPDATED_EVENT,
  readProposalBrandingSettings,
  resolveProposalBrandConfig,
  resolveProposalBrandPresentation,
} from "@/lib/proposal-branding-settings";
import { getCanvasCopy, type CanvasLang } from "./canvas-copy";
import {
  buildAtelierProposalPdf,
  downloadPdfFile,
  isAppleTouchDevice,
} from "@/components/proposals/_shared/residential-pdf-export";
import {
  EvidenceCard,
  EvidenceGrid,
  ExpertInsights,
  EngineeringBlueprint,
  InvestmentPlan,
  FinancialStory,
  EcologicalImpact,
  GenerationForecast,
  buildGenerationForecastMonths,
  CanvasBillAudit,
  PaymentRoadmap,
  CoverPage,
  ClosingPage,
  HardwareTrustGrid,
  resolveHardwareTrustProducts,
  PageBody,
  PageHeader,
  PageShell,
  WealthJourneyBars,
  buildWealthJourneyBars,
} from "./components";
import styles from "./canvas.module.css";

export type CanvasProposalRendererProps = {
  data: ProposalData;
  installerLogoUrl?: string;
};

function metricValue(data: ProposalData, re: RegExp, fallback: string): string {
  const hit = data.engineering.metrics.find((m) => re.test(m.label));
  return hit?.value || fallback;
}

const FALLBACK_BOM: ProposalBomItem[] = [
  {
    name: "Solar Modules",
    brand: "Waaree TOPCon",
    spec: "DCR Tier-1 · Bifacial-ready",
    warranty: "25 Year Performance",
    technicalPoints: ["IEC certified", "High summer yield"],
  },
  {
    name: "String Inverter",
    brand: "Havells",
    spec: "Dual MPPT · Grid-Tie · Wi-Fi",
    warranty: "10 Year",
    technicalPoints: ["Remote diagnostics"],
  },
  {
    name: "Mounting Structure",
    brand: "JSW Galvanized",
    spec: "Site-designed tilt MMS",
    warranty: "10 Year",
  },
  {
    name: "DC / AC Cable",
    brand: "Polycab UV-rated",
    spec: "Copper · IS / IEC",
    warranty: "As installed",
  },
  {
    name: "ACDB / DCDB Protection",
    brand: "Havells / Phoenix",
    spec: "DCDB: fuse + Type II SPD · ACDB: MCB/MCCB + Type II SPD",
    warranty: "5 Year",
    technicalPoints: ["Copper earthing ≤1Ω (IS 3043)", "Lightning protection"],
  },
];

export function CanvasProposalRenderer({
  data,
  installerLogoUrl,
}: CanvasProposalRendererProps) {
  const [lang, setLang] = useState<CanvasLang>("en");
  const c = getCanvasCopy(lang);
  const isHi = lang === "hi";

  const [logoUrl, setLogoUrl] = useState<string | undefined>(() => {
    return data?.meta.brandLogoUrl?.trim() || installerLogoUrl?.trim() || undefined;
  });
  const rootRef = useRef<HTMLDivElement>(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  useEffect(() => {
    const sync = () => {
      const fromData = data?.meta.brandLogoUrl?.trim() ?? "";
      const fromProp = installerLogoUrl?.trim() ?? "";
      const fromLocal = readProposalBrandingSettings().installerLogoUrl?.trim() ?? "";
      setLogoUrl(fromData || fromProp || fromLocal || undefined);
    };
    sync();
    window.addEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, sync);
    return () => window.removeEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, sync);
  }, [data?.meta.brandLogoUrl, installerLogoUrl]);

  if (!data) {
    return <div className={styles.loading}>Loading Proposal...</div>;
  }

  const brand = data.meta.brandName?.trim() || c.cover.brandFallback;
  const brandConfig = resolveProposalBrandConfig({
    pptInput: {
      brandDisplayMode: data.meta.brandDisplayMode,
      brandSectionConfig: data.meta.brandSectionConfig,
    },
  });
  const brandIdentity = {
    installerName: brand,
    logoUrl,
    tagline: data.meta.brandTagline,
  };
  const coverBrand = resolveProposalBrandPresentation(brandConfig, "cover", brandIdentity);
  const footerBrandPres = resolveProposalBrandPresentation(brandConfig, "footer", brandIdentity);
  const closingBrand = resolveProposalBrandPresentation(brandConfig, "closing", brandIdentity);
  const customer = data.meta.customerName?.trim() || "Valued Customer";
  const location =
    data.meta.locationLine && data.meta.locationLine !== "—"
      ? data.meta.locationLine
      : "";
  const eco = data.economics;
  const bill = data.bill;
  const bom = Array.isArray(data.bom) && data.bom.length > 0 ? data.bom : FALLBACK_BOM;
  const eng = data.engineering;
  const warranty = data.warranty;
  const execution = data.execution;
  const terms = data.terms;
  const impact = data.impact;
  const closing = data.closing;

  const capacityKw =
    data.meta.systemKw > 0
      ? `${data.meta.systemKw} kW`
      : metricValue(data, /system\s*size|capacity/i, "—");
  const systemKwNum = data.meta.systemKw > 0 ? data.meta.systemKw : 0;
  const generationUnits =
    closing.annualUnits > 0
      ? closing.annualUnits
      : systemKwNum > 0
        ? Math.round(systemKwNum * 1450)
        : 0;
  const generation =
    generationUnits > 0
      ? `${generationUnits.toLocaleString("en-IN")} units`
      : metricValue(data, /annual|generation|units/i, "—");
  const coverage = metricValue(data, /load|coverage/i, "—");
  const showBill = bill.hasData && bill.months.length > 0;
  const lifetimeWealth = closing.lifetimeWealthInr || eco.lifetimeProfitInr;
  const lifetime =
    lifetimeWealth > 0 ? formatLifetimeBenefitInr(lifetimeWealth) : "—";
  const monthlySavings =
    eco.monthlySavingsInr > 0 ? formatInr(eco.monthlySavingsInr) : "—";
  const monthlyBillApprox =
    bill.yearlyBillInr > 0 ? Math.round(bill.yearlyBillInr / 12) : 0;
  const yearOneSavings =
    eco.monthlySavingsInr > 0 ? eco.monthlySavingsInr * 12 : closing.annualSavingsInr;
  const cumulative25Savings =
    yearOneSavings > 0 ? yearOneSavings * 25 : lifetimeWealth + (eco.netInr || 0);
  const cumulative25Label =
    cumulative25Savings > 0
      ? formatLifetimeBenefitInr(cumulative25Savings)
      : "—";
  const genForecastMonths = buildGenerationForecastMonths(
    generationUnits,
    yearOneSavings
  );
  const proposalDateLabel = data.meta.generatedAt
    ? new Date(data.meta.generatedAt).toLocaleDateString(isHi ? "hi-IN" : "en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : new Date().toLocaleDateString(isHi ? "hi-IN" : "en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
  const wealthJourney =
    Array.isArray(eco.wealthJourney) && eco.wealthJourney.length > 0
      ? eco.wealthJourney
      : undefined;
  const wealthBars = buildWealthJourneyBars(
    wealthJourney,
    lifetimeWealth,
    eco.paybackYears
  );
  const netLakh =
    eco.netInr > 0 ? (Math.round((eco.netInr / 100000) * 10) / 10).toFixed(1) : "—";
  const returnMultiple =
    eco.netInr > 0 && lifetimeWealth > 0
      ? (Math.round((lifetimeWealth / eco.netInr) * 10) / 10).toFixed(1)
      : "—";
  const dailyGen =
    generationUnits > 0
      ? `${Math.round(generationUnits / 365).toLocaleString("en-IN")} units/day`
      : "—";
  const specificYield =
    systemKwNum > 0 && generationUnits > 0
      ? `${Math.round(generationUnits / systemKwNum)} kWh/kW`
      : "—";
  const panelItem = bom.find((b) => /module|panel|solar/i.test(`${b.name} ${b.brand}`));
  const panelDetailText = [
    panelItem?.spec,
    ...(panelItem?.technicalPoints ?? []),
  ].join(" ");
  const panelConfigMatch = panelDetailText.match(
    /(\d+)\s*(?:×|x)\s*(\d{3,4})\s*Wp/i
  );
  const panelWatt = panelConfigMatch ? Number(panelConfigMatch[2]) : 580;
  const panelCount = panelConfigMatch
    ? Number(panelConfigMatch[1])
    : systemKwNum > 0
      ? Math.ceil((systemKwNum * 1000) / panelWatt)
      : 0;
  const dcArrayKwp =
    panelCount > 0 ? (panelCount * panelWatt) / 1000 : 0;
  const requiredRoofAreaM2 = panelCount > 0 ? Math.round(panelCount * 2.2) : 0;
  const effectiveSavingPerUnit =
    generationUnits > 0 && yearOneSavings > 0
      ? yearOneSavings / generationUnits
      : 0;

  const tiltMetric =
    eng.metrics.find((m) => /tilt/i.test(m.label))?.value?.trim() || "20°";
  const tiltDisplay = /°/.test(tiltMetric) ? tiltMetric : `${tiltMetric}°`;

  const protectionItem = bom.find((b) =>
    /acdb|dcdb|protection|safety/i.test(`${b.name} ${b.spec}`)
  );
  const protectionBrand =
    protectionItem?.brand?.trim() || "Havells / Phoenix";
  const protectionWarranty =
    protectionItem?.warranty?.trim() || (isHi ? "5 वर्ष" : "5 yr");

  const DEFAULT_PAYMENT_PCTS = [25, 50, 20, 5] as const;
  const DEFAULT_PAYMENT_TITLES = isHi
    ? [
        "Advance (बुकिंग)",
        "Material Delivery (सामग्री वितरण)",
        "Installation (स्थापना)",
        "Commissioning (कमीशनिंग)",
      ]
    : [
        "Advance (Booking)",
        "Material Delivery",
        "Installation",
        "Commissioning",
      ];

  const paymentBaseInr = eco.grossInr > 0 ? eco.grossInr : eco.netInr;
  const paymentMilestones =
    execution.payments.length > 0
      ? execution.payments.slice(0, 4).map((p, i) => {
          const pctMatch = p.pctLabel.match(/(\d+)\s*%/);
          const pct = Number(
            pctMatch?.[1] ??
              DEFAULT_PAYMENT_PCTS[i] ??
              Math.round(100 / Math.max(execution.payments.length, 1))
          );
          // Always derive from gross cost × % — never trust stale upstream totals.
          const amountInr =
            paymentBaseInr > 0
              ? Math.round((paymentBaseInr * pct) / 100)
              : p.amountInr > 0
                ? p.amountInr
                : 0;
          return {
            step: String(i + 1),
            title: p.label.replace(/^\d+\.\s*/, "") || DEFAULT_PAYMENT_TITLES[i]!,
            amountLabel: amountInr > 0 ? formatInr(amountInr) : "—",
            percent: `${pct}%`,
          };
        })
      : DEFAULT_PAYMENT_PCTS.map((pct, i) => {
          const amountInr =
            paymentBaseInr > 0 ? Math.round((paymentBaseInr * pct) / 100) : 0;
          return {
            step: String(i + 1),
            title: DEFAULT_PAYMENT_TITLES[i]!,
            amountLabel: amountInr > 0 ? formatInr(amountInr) : "—",
            percent: `${pct}%`,
          };
        });

  const bankDetails = {
    company: execution.bank.company?.trim() || brand,
    accountNumber:
      execution.bank.accountNumber?.trim() && execution.bank.accountNumber !== "—"
        ? execution.bank.accountNumber
        : isHi
          ? "समझौते पर पुष्टि"
          : "Confirmed on agreement",
    ifsc:
      execution.bank.ifsc?.trim() && execution.bank.ifsc !== "—"
        ? execution.bank.ifsc
        : isHi
          ? "समझौते पर पुष्टि"
          : "Confirmed on agreement",
    upiId:
      execution.bank.upiId?.trim() && execution.bank.upiId !== "—"
        ? execution.bank.upiId
        : isHi
          ? "समझौते पर पुष्टि"
          : "Confirmed on agreement",
  };

  const paymentTerms =
    terms.conditions.length > 0
      ? terms.conditions.slice(0, 4)
      : isHi
        ? [
            "यह प्रस्ताव जारी होने की तिथि से 30 दिनों तक मान्य है।",
            "अंतिम मूल्य साइट सर्वे और DISCOM अनुमोदन के बाद बदल सकता है।",
            "सब्सिडी राशि PM सूर्य घर पात्रता और पोर्टल मंजूरी पर निर्भर है।",
            "नेट मीटरिंग समय-सारिणी स्थानीय DISCOM प्रक्रिया पर निर्भर करती है।",
          ]
        : [
            "This proposal is valid for 30 days from the date of issue.",
            "Final pricing may adjust after site survey and DISCOM approval.",
            "Subsidy amount is subject to PM Surya Ghar eligibility and portal sanction.",
            "Net metering timelines depend on local DISCOM processing.",
          ];

  const handlePrint = async () => {
    if (typeof window === "undefined" || pdfBusy) return;
    if (isAppleTouchDevice()) {
      const root = rootRef.current;
      if (!root) return;
      setPdfBusy(true);
      try {
        downloadPdfFile(
          await buildAtelierProposalPdf({
            root,
            customerName: customer,
            presetId: "residential_blueprint",
            pageSelector: ":scope > .canvasContainer > section",
          })
        );
      } finally {
        setPdfBusy(false);
      }
      return;
    }
    window.print();
  };

  const foot = (n: string) => ({
    pageNo: n,
    brand: footerBrandPres.showName ? footerBrandPres.installerName : undefined,
  });

  return (
    <div
      ref={rootRef}
      data-proposal-preset="residential_blueprint"
      className={`${styles.shell} ${styles.canvasTheme}${isHi ? ` ${styles.langHi}` : ""}`}
    >
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
            <button type="button" onClick={handlePrint} className={styles.printBarBtn} disabled={pdfBusy}>
              {pdfBusy ? "Preparing PDF…" : c.print.downloadPdf}
            </button>
          </div>
        </div>
      </div>

      <div className={styles.canvasContainer}>
        {/* Page 01: Architectural cover — no cost / wealth figures */}
        <CoverPage
          brandName={brand}
          logoUrl={coverBrand.showLogo ? logoUrl : undefined}
          showName={coverBrand.showName}
          tagline={coverBrand.showTagline ? data.meta.brandTagline : undefined}
          customerName={customer}
          locationLine={location || undefined}
          documentTitle={
            isHi ? "आर्किटेक्चरल एनर्जी ब्लूप्रिंट" : "Architectural Energy Blueprint"
          }
          preparedForLabel={
            isHi ? "विशेष रूप से तैयार" : "Prepared exclusively for"
          }
          systemKw={capacityKw}
          annualYield={
            generationUnits > 0
              ? `${generationUnits.toLocaleString("en-IN")} Units`
              : generation !== "—"
                ? generation
                : "—"
          }
          impactLabel={isHi ? "स्वच्छ ऊर्जा प्रभाव" : "Clean Energy Impact"}
          impactValue={
            impact.co2Tons > 0
              ? isHi
                ? `~${impact.co2Tons.toFixed(0)} टन CO₂`
                : `~${impact.co2Tons.toFixed(0)} t CO₂`
              : isHi
                ? "CO₂ कटौती"
                : "CO₂ avoided"
          }
          proposalDate={
            isHi ? `प्रस्ताव तिथि · ${proposalDateLabel}` : `Proposal date · ${proposalDateLabel}`
          }
          pageNo="01 / 12"
          footerBrand={footerBrandPres.showName ? footerBrandPres.installerName : undefined}
        />

        {/* Page 02: Bill / Requirement */}
        <PageShell {...foot("02 / 12")}>
          {showBill ? (
            <>
              <PageHeader title={c.pages.bill} lead={c.pages.billLead} />
              <PageBody>
                <CanvasBillAudit
                  months={bill.months}
                  totals={bill.totals}
                  summerTrapPct={bill.summerTrapPct}
                  fixedChargesDisplay={bill.fixedChargesDisplay}
                  solarSavingsPct={bill.solarSavingsPct}
                  isHi={isHi}
                />
              </PageBody>
            </>
          ) : (
            <>
              <PageHeader title={c.pages.requirement} lead={c.pages.requirementLead} />
              <PageBody>
                <EvidenceGrid>
                  <EvidenceCard
                    title={c.labels.capacity}
                    value={capacityKw}
                    accent
                  />
                  <EvidenceCard
                    title={isHi ? "DC ऐरे और मॉड्यूल" : "DC Array & Modules"}
                    value={
                      dcArrayKwp > 0
                        ? `${dcArrayKwp.toFixed(2)} kWp · ${panelCount} ${isHi ? "मॉड्यूल" : "modules"}`
                        : "—"
                    }
                  />
                  <EvidenceCard title={c.labels.coverage} value={coverage} />
                  <EvidenceCard
                    title={isHi ? "अनुमानित छत क्षेत्र" : "Estimated Roof Area"}
                    value={
                      requiredRoofAreaM2 > 0 ? `~${requiredRoofAreaM2} m²` : "—"
                    }
                    tone="positive"
                  />
                </EvidenceGrid>
                <ExpertInsights
                  fill
                  title={c.pages.requirementInsightTitle}
                  body={c.pages.requirementInsightBody}
                />
              </PageBody>
            </>
          )}
        </PageShell>

        {/* Page 03: Investment plan — equation + returns + EMI */}
        <PageShell {...foot("03 / 12")}>
          <PageHeader title={c.pages.investment} lead={c.pages.investmentLead} />
          <PageBody>
            <InvestmentPlan
              costSectionLabel={c.pages.costSection}
              grossLabel={c.pages.gross}
              grossValue={
                eco.grossInr > 0 ? formatInrCompact(eco.grossInr) : "—"
              }
              subsidyLabel={c.pages.subsidy}
              subsidyValue={
                eco.subsidyInr > 0 ? formatInrCompact(eco.subsidyInr) : "—"
              }
              youPayLabel={c.pages.youPay}
              youPayValue={
                eco.netInr > 0 ? formatInrCompact(eco.netInr) : "—"
              }
              equationHint={c.pages.equationHint}
              returnsSectionLabel={c.pages.returnsSection}
              paybackLabel={c.pages.payback}
              paybackValue={
                eco.paybackYears > 0
                  ? `${eco.paybackYears.toFixed(1)} yr`
                  : "—"
              }
              lifetimeLabel={c.pages.lifetimeWealth}
              lifetimeValue={lifetime}
              monthlyLabel={c.pages.monthlyProfit}
              monthlyValue={monthlySavings}
              financeSectionLabel={c.pages.financeSection}
              financeSectionLead={c.pages.financeSectionLead}
              emiUnitLabel={c.pages.emiUnit}
              emiOptions={eco.emiRows.slice(0, 3).map((row) => ({
                tenureLabel: row.tenureLabel,
                monthlyEmi: formatInr(row.monthlyEmiInr),
                interestNote:
                  row.interestPaidInr > 0
                    ? isHi
                      ? `कुल ब्याज ~${formatInrCompact(row.interestPaidInr)} (~7% p.a.)`
                      : `Total interest ~${formatInrCompact(row.interestPaidInr)} (~7% p.a.)`
                    : isHi
                      ? "मानक ~7% p.a."
                      : "Assumed ~7% p.a.",
              }))}
              assumptionsSectionLabel={c.pages.assumptionsSection}
              assumptions={[
                {
                  label: isHi ? "टैरिफ वृद्धि" : "Tariff escalation",
                  value: "~6% / yr",
                },
                {
                  label: isHi ? "मॉड्यूल डिग्रेडेशन" : "Module degradation",
                  value: "≤0.55% / yr",
                },
                {
                  label: isHi ? "उत्पादन आधार" : "Generation basis",
                  value:
                    systemKwNum > 0
                      ? `~${Math.round(generationUnits / systemKwNum)} kWh/kW·yr`
                      : specificYield,
                },
                {
                  label: isHi ? "सब्सिडी" : "Subsidy",
                  value:
                    eco.subsidyInr > 0
                      ? formatInrCompact(eco.subsidyInr)
                      : isHi
                        ? "पात्रता पर"
                        : "As eligible",
                },
                {
                  label: isHi ? "EMI ब्याज" : "EMI interest",
                  value: "~7% p.a.",
                },
                {
                  label: isHi ? "नेट भुगतान आधार" : "Net payable basis",
                  value:
                    eco.netInr > 0 ? formatInr(eco.netInr) : "—",
                },
              ]}
              insightTitle={c.pages.investInsightTitle}
              insightBody={c.pages.investInsightBody}
            />
          </PageBody>
        </PageShell>

        {/* Page 04: Wealth Journey — visual growth card */}
        <PageShell {...foot("04 / 12")}>
          <PageHeader title={c.pages.wealth} lead={c.pages.wealthLead} />
          <PageBody>
            <WealthJourneyBars
              bars={wealthBars}
              caption={c.pages.cumulative}
            />
            <EvidenceCard
              title={c.pages.investScore}
              value={c.pages.investScoreValue(returnMultiple)}
              insight={c.pages.investScoreInsight(netLakh, returnMultiple)}
              accent
            />
            <EvidenceGrid>
              <EvidenceCard
                title={c.pages.cumulativeSavingsLabel}
                value={cumulative25Label}
                insight={c.pages.cumulativeSavingsHint}
              />
              <EvidenceCard
                title={c.pages.netBenefitLabel}
                value={lifetime}
                insight={c.pages.netBenefitHint}
                tone="positive"
              />
              <EvidenceCard
                title={c.pages.payback}
                value={
                  eco.paybackYears > 0 ? `${eco.paybackYears.toFixed(1)} yr` : "—"
                }
                insight={
                  isHi
                    ? "नेट निवेश वसूल होने का वर्ष।"
                    : "Year when net investment is recovered."
                }
              />
              <EvidenceCard
                title={c.pages.youPay}
                value={eco.netInr > 0 ? formatInrCompact(eco.netInr) : "—"}
                insight={
                  isHi
                    ? "सब्सिडी के बाद नेट भुगतान।"
                    : "Net payable after subsidy."
                }
              />
            </EvidenceGrid>
            <ExpertInsights
              fill
              title={c.pages.wealthInsightTitle}
              body={c.pages.wealthInsightBody}
            />
          </PageBody>
        </PageShell>

        {/* Page 05: Financial Story — bill drop → time → outcome */}
        <PageShell {...foot("05 / 12")}>
          <PageHeader title={c.pages.financial} lead={c.pages.financialLead} />
          <PageBody>
            <FinancialStory
              billSectionLabel={c.pages.billSection}
              todayLabel={c.pages.today}
              todayValue={
                monthlyBillApprox > 0 ? formatInr(monthlyBillApprox) : "—"
              }
              afterLabel={c.pages.afterSolar}
              afterValue={
                monthlyBillApprox > 0 && eco.monthlySavingsInr > 0
                  ? formatInr(
                      Math.max(0, monthlyBillApprox - eco.monthlySavingsInr)
                    )
                  : "—"
              }
              profitLabel={c.pages.monthlyProfit}
              profitValue={
                eco.monthlySavingsInr > 0 ? `+${monthlySavings}` : "—"
              }
              billHint={c.pages.billHint}
              timeSectionLabel={c.pages.timeSection}
              annualLabel={c.labels.annualSavings}
              annualValue={
                yearOneSavings > 0 ? formatInrCompact(yearOneSavings) : "—"
              }
              paybackLabel={c.pages.payback}
              paybackValue={
                eco.paybackYears > 0
                  ? `${eco.paybackYears.toFixed(1)} yr`
                  : "—"
              }
              outcomeSectionLabel={c.pages.outcomeSection}
              youPayLabel={c.pages.youPay}
              youPayValue={
                eco.netInr > 0 ? formatInrCompact(eco.netInr) : "—"
              }
              lifetimeLabel={c.pages.lifetimeWealth}
              lifetimeValue={lifetime}
              outcomeHint={c.pages.outcomeHint}
              insightTitle={c.pages.financeInsightTitle}
              insightBody={c.pages.financeInsightBody}
            />
          </PageBody>
        </PageShell>

        {/* Page 06: Hardware Trust — visual product cards */}
        <PageShell {...foot("06 / 12")}>
          <PageHeader title={c.pages.hardware} lead={c.pages.hardwareLead} />
          <PageBody>
            <HardwareTrustGrid products={resolveHardwareTrustProducts(bom)} />
            <div className={styles.evidenceGrid}>
              <div className={styles.techItem}>
                <span>{isHi ? "DCDB · DC डिस्ट्रीब्यूशन बॉक्स" : "DCDB · DC Distribution Box"}</span>
                <strong>{isHi ? "फ्यूज़ + Type II SPD" : "Fuse + Type II SPD"}</strong>
                <small>
                  {isHi
                    ? `पैनल से इन्वर्टर तक DC साइड को सर्ज व ओवर-करंट से बचाता है। ${protectionBrand} · ${protectionWarranty}`
                    : `Protects the DC side (panels → inverter) from surges & over-current. ${protectionBrand} · ${protectionWarranty}`}
                </small>
              </div>
              <div className={styles.techItem}>
                <span>{isHi ? "ACDB · AC डिस्ट्रीब्यूशन बॉक्स" : "ACDB · AC Distribution Box"}</span>
                <strong>{isHi ? "MCB/MCCB + Type II SPD" : "MCB/MCCB + Type II SPD"}</strong>
                <small>
                  {isHi
                    ? "इन्वर्टर से ग्रिड तक AC साइड की सुरक्षा — आइसोलेशन, अर्थिंग (≤1Ω, IS 3043) और लाइटनिंग प्रोटेक्शन सहित।"
                    : "Protects the AC side (inverter → grid) with isolation, copper earthing (≤1Ω, IS 3043) & lightning protection."}
                </small>
              </div>
            </div>
            <EvidenceGrid>
              <EvidenceCard
                title={isHi ? "मॉड्यूल वारंटी" : "Module warranty"}
                value="30 yr"
                insight={
                  isHi
                    ? "प्रदर्शन वारंटी उपज गिरावट को सीमित रखती है।"
                    : "Performance warranty caps long-term yield fade."
                }
                accent
              />
              <EvidenceCard
                title={isHi ? "इन्वर्टर वारंटी" : "Inverter warranty"}
                value="10 yr"
                insight={
                  isHi
                    ? "डुअल MPPT छाया में भी ट्रैकिंग बनाए रखता है।"
                    : "Dual MPPT keeps tracking strong under partial shade."
                }
                tone="positive"
              />
            </EvidenceGrid>
            <ExpertInsights
              fill
              title={c.pages.hwInsightTitle}
              body={c.pages.hwInsightBody}
            />
          </PageBody>
        </PageShell>

        {/* Page 07: Monthly generation & savings forecast */}
        <PageShell {...foot("07 / 12")}>
          <PageHeader title={c.pages.generation} lead={c.pages.generationLead} />
          <PageBody>
            <EvidenceGrid>
              <EvidenceCard
                title={c.labels.annualGen}
                value={generation}
                insight={
                  isHi
                    ? "वर्ष भर का अनुमानित योग।"
                    : "Estimated total across the year."
                }
                tone="positive"
              />
              <EvidenceCard
                title={c.labels.annualSavings}
                value={
                  yearOneSavings > 0 ? formatInrCompact(yearOneSavings) : "—"
                }
                insight={
                  isHi
                    ? "वर्ष-1 अनुमानित बिल बचत।"
                    : "Year-1 estimated bill savings."
                }
                accent
              />
            </EvidenceGrid>
            <GenerationForecast
              months={genForecastMonths}
              unitsLabel={c.pages.genUnitsLabel}
              savingsLabel={c.pages.genSavingsLabel}
              savingsBasis={
                effectiveSavingPerUnit > 0
                  ? isHi
                    ? `अनुमानित बचत = मासिक यूनिट × ₹${effectiveSavingPerUnit.toFixed(2)}/यूनिट प्रभावी बचत दर। फिक्स्ड चार्ज शामिल नहीं हैं।`
                    : `Estimated savings = monthly units × ₹${effectiveSavingPerUnit.toFixed(2)}/unit effective saving rate. Fixed charges excluded.`
                  : undefined
              }
            />
            <ExpertInsights
              fill
              title={c.pages.genInsightTitle}
              body={c.pages.genInsightBody}
            />
          </PageBody>
        </PageShell>

        {/* Page 08: Ecological Impact — cinematic editorial */}
        <PageShell {...foot("08 / 12")} className={styles.canvasTheme}>
          <PageBody>
            <EcologicalImpact
              eyebrow={c.pages.impactEyebrow}
              title={c.pages.impactTitle}
              subtitle={c.pages.impactSubtitle}
              co2Value={
                impact.co2Tons > 0 ? impact.co2Tons.toFixed(1) : "—"
              }
              co2Unit={c.pages.tonsUnit}
              co2Heading={c.pages.co2Heading}
              co2Body={c.pages.co2Body}
              treesValue={
                impact.treesEquivalent > 0
                  ? impact.treesEquivalent.toLocaleString("en-IN")
                  : "—"
              }
              treesUnit={c.pages.treesUnit}
              treesHeading={c.pages.treesHeading}
              treesBody={c.pages.treesBody}
              unitsLabel={c.pages.cleanEnergyLabel}
              unitsValue={
                generationUnits > 0
                  ? `${generationUnits.toLocaleString("en-IN")} ${isHi ? "यूनिट" : "Units"}`
                  : generation
              }
              savingsLabel={c.pages.firstYearSavingsLabel}
              savingsValue={
                closing.annualSavingsInr > 0
                  ? formatInrCompact(closing.annualSavingsInr)
                  : yearOneSavings > 0
                    ? formatInrCompact(yearOneSavings)
                    : "—"
              }
              insightTitle={c.pages.impactInsightTitle}
              insightBody={c.pages.impactInsightBody}
            />
          </PageBody>
        </PageShell>

        {/* Page 09: Advanced Engineering & Roof Intelligence */}
        <PageShell {...foot("09 / 12")} className={styles.canvasTheme}>
          <PageBody>
            <EngineeringBlueprint
              systemKw={systemKwNum > 0 ? systemKwNum : 5}
              tiltDeg={
                Number.parseFloat(String(tiltDisplay).replace(/[^\d.]/g, "")) || 20
              }
              locationHint={location || undefined}
              isHi={isHi}
              insightBody={c.pages.engInsightBody}
            />
          </PageBody>
        </PageShell>

        {/* Page 10: Warranty */}
        <PageShell {...foot("10 / 12")}>
          <PageHeader title={c.pages.warranty} lead={c.pages.warrantyLead} />
          <PageBody>
            {warranty.highlights.length > 0 ? (
              <EvidenceGrid cols={3}>
                {warranty.highlights.slice(0, 3).map((h) => (
                  <EvidenceCard
                    key={h.label}
                    title={h.label}
                    value={`${h.value}${h.unit ? ` ${h.unit}` : ""}`}
                    tone="positive"
                  />
                ))}
              </EvidenceGrid>
            ) : (
              <EvidenceGrid>
                <EvidenceCard
                  title={c.labels.warranty}
                  value="25 / 10 yr"
                  insight="Modules · Inverter"
                  tone="positive"
                />
                <EvidenceCard
                  title={isHi ? "कार्य निष्पादन" : "Workmanship"}
                  value="5 yr"
                  accent
                />
              </EvidenceGrid>
            )}
            {warranty.rows.length > 0 ? (
              <table className={styles.warrantyTable}>
                <thead>
                  <tr>
                    <th>{c.labels.brand}</th>
                    <th>{c.labels.coverage}</th>
                    <th>{c.labels.warranty}</th>
                  </tr>
                </thead>
                <tbody>
                  {warranty.rows.map((r) => (
                    <tr key={`${r.item}-${r.duration}`}>
                      <td>
                        <strong>{r.item}</strong>
                      </td>
                      <td>{r.coverage}</td>
                      <td>{r.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
            <ExpertInsights
              fill
              title={c.pages.warrantyInsightTitle}
              body={c.pages.warrantyInsightBody}
            />
          </PageBody>
        </PageShell>

        {/* Page 11: Payment roadmap + terms */}
        <PageShell {...foot("11 / 12")} className={styles.canvasTheme}>
          <PageBody>
            <PaymentRoadmap
              title={
                isHi
                  ? `भुगतान अनुसूची · सकल ${eco.grossInr > 0 ? formatInrCompact(eco.grossInr) : "—"} पर`
                  : `Investment Milestones · on gross ${eco.grossInr > 0 ? formatInrCompact(eco.grossInr) : "—"}`
              }
              milestones={paymentMilestones}
              bank={bankDetails}
              bankTitle={isHi ? "सुरक्षित भुगतान विवरण" : "Secure Payment Details"}
              termsTitle={
                isHi
                  ? "नियम एवं शर्तें (Terms & Compliance)"
                  : "Terms & Compliance"
              }
              terms={paymentTerms}
              insightBody={
                isHi
                  ? `सभी किस्तें सकल सिस्टम मूल्य (${eco.grossInr > 0 ? formatInr(eco.grossInr) : "—"}) पर प्रतिशत के आधार पर हैं। सब्सिडी पात्रता अनुसार अलग से समायोजित होती है। ${c.pages.execInsightBody}`
                  : `All instalments are a percentage of the gross system price (${eco.grossInr > 0 ? formatInr(eco.grossInr) : "—"}). Subsidy is adjusted separately as eligible. ${c.pages.execInsightBody}`
              }
            />
          </PageBody>
        </PageShell>

        {/* Page 12: Cinematic Closing */}
        <ClosingPage
          eyebrow={c.pages.closingEyebrow}
          titleLine1={c.pages.closingTitle}
          titleLine2={c.pages.closingTitleLock}
          subtitle={c.pages.closingSubtitle(
            eng.cityLabel?.trim() ||
              location.split(",")[0]?.trim() ||
              (isHi ? "आपके शहर" : "your city")
          )}
          lifetimeValue={lifetime}
          lifetimeLabel={c.pages.lifetimeWealth}
          monthlyValue={
            eco.monthlySavingsInr > 0 ? `+${monthlySavings}` : "—"
          }
          monthlyLabel={c.pages.monthlyProfit}
          systemValue={capacityKw}
          systemLabel={c.pages.closingSystemLabel}
          ctaTitle={c.pages.closingCtaTitle}
          ctaBody={c.pages.closingCtaBody}
          companyName={closingBrand.showName ? closing.installerName || brand : ""}
          logoUrl={closingBrand.showLogo ? logoUrl : undefined}
          tagline={
            closingBrand.showTagline
              ? closing.brandTagline || data.meta.brandTagline
              : undefined
          }
          address={closing.address || data.meta.brandAddress}
          gstNumber={closing.gstNumber || data.meta.brandGst}
          contactPerson={closing.contactPerson}
          phone={
            closing.contactLine
              ?.split(/[·•|]/)
              .map((p) => p.trim())
              .find((p) => p && !p.includes("@")) || undefined
          }
          email={
            closing.contactLine
              ?.split(/[·•|]/)
              .map((p) => p.trim())
              .find((p) => p.includes("@")) || undefined
          }
          contactLine={closing.contactLine || undefined}
          signatureLabel={c.pages.closingSignature}
          pageNo="12 / 12"
        />
      </div>
    </div>
  );
}
