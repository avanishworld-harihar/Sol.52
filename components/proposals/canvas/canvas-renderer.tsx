"use client";

/**
 * Canvas — full 12-page Investment Blueprint.
 * Every data section uses EvidenceCard for density.
 * Pages 05 (Generation) + 06 (Hardware) include Expert Insights.
 * Hardware images: /assets/hardware/* (public/assets/).
 */

import { useEffect, useState } from "react";
import type { ProposalBomItem, ProposalData } from "@/lib/proposal-data";
import {
  formatInr,
  formatInrCompact,
  formatLifetimeBenefitInr,
} from "@/components/proposals/_shared/formatters";
import {
  PROPOSAL_BRANDING_UPDATED_EVENT,
  readProposalBrandingSettings,
} from "@/lib/proposal-branding-settings";
import { getCanvasCopy, type CanvasLang } from "./canvas-copy";
import {
  EvidenceCard,
  EvidenceGrid,
  ExpertInsights,
  EngineeringBlueprint,
  InvestmentPlan,
  FinancialStory,
  EcologicalImpact,
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

  const tiltMetric =
    eng.metrics.find((m) => /tilt/i.test(m.label))?.value?.trim() || "20°";
  const tiltDisplay = /°/.test(tiltMetric) ? tiltMetric : `${tiltMetric}°`;

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

  const paymentBaseInr = eco.netInr > 0 ? eco.netInr : eco.grossInr;
  const paymentMilestones =
    execution.payments.length > 0
      ? execution.payments.slice(0, 4).map((p, i) => {
          const pctMatch = p.pctLabel.match(/(\d+)\s*%/);
          const pct =
            pctMatch?.[1] ??
            String(DEFAULT_PAYMENT_PCTS[i] ?? Math.round(100 / Math.max(execution.payments.length, 1)));
          const amountInr =
            p.amountInr > 0
              ? p.amountInr
              : paymentBaseInr > 0
                ? Math.round((paymentBaseInr * Number(pct)) / 100)
                : 0;
          return {
            step: String(i + 1),
            title: p.label.replace(/^\d+\.\s*/, "") || DEFAULT_PAYMENT_TITLES[i]!,
            amountLabel: amountInr > 0 ? formatInrCompact(amountInr) : "—",
            percent: `${pct}%`,
          };
        })
      : DEFAULT_PAYMENT_PCTS.map((pct, i) => {
          const amountInr =
            paymentBaseInr > 0 ? Math.round((paymentBaseInr * pct) / 100) : 0;
          return {
            step: String(i + 1),
            title: DEFAULT_PAYMENT_TITLES[i]!,
            amountLabel: amountInr > 0 ? formatInrCompact(amountInr) : "—",
            percent: `${pct}%`,
          };
        });

  const bankDetails = {
    company: execution.bank.company?.trim() || brand,
    accountNumber:
      execution.bank.accountNumber?.trim() && execution.bank.accountNumber !== "—"
        ? execution.bank.accountNumber
        : isHi
          ? "[खाता संख्या]"
          : "[Your A/C Number]",
    ifsc:
      execution.bank.ifsc?.trim() && execution.bank.ifsc !== "—"
        ? execution.bank.ifsc
        : isHi
          ? "[IFSC]"
          : "[Your IFSC]",
    upiId:
      execution.bank.upiId?.trim() && execution.bank.upiId !== "—"
        ? execution.bank.upiId
        : "hariharsolar@upi",
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

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  const foot = (n: string) => ({ pageNo: n, brand });

  return (
    <div className={`${styles.shell} ${styles.canvasTheme}${isHi ? ` ${styles.langHi}` : ""}`}>
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

      <div className={styles.canvasContainer}>
        {/* Page 01: Architectural cover — no cost / wealth figures */}
        <CoverPage
          brandName={brand}
          logoUrl={logoUrl}
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
          impactValue={isHi ? "शून्य कार्बन" : "Zero Carbon"}
          pageNo="01 / 12"
          footerBrand={brand}
        />

        {/* Page 02: Bill / Requirement */}
        <PageShell {...foot("02 / 12")}>
          {showBill ? (
            <>
              <PageHeader title={c.pages.bill} lead={c.pages.billLead} />
              <PageBody>
                <EvidenceGrid>
                  <EvidenceCard
                    title={c.labels.yearlyBill}
                    value={formatInrCompact(bill.yearlyBillInr)}
                    insight={`${bill.totals.units.toLocaleString("en-IN")} ${c.labels.units}`}
                    accent
                  />
                  <EvidenceCard
                    title={c.pages.today}
                    value={monthlyBillApprox > 0 ? formatInr(monthlyBillApprox) : "—"}
                    insight={
                      bill.summerTrapPct > 0
                        ? `${c.labels.summerTrap}: +${Math.round(bill.summerTrapPct)}%`
                        : undefined
                    }
                    tone="warn"
                  />
                  <EvidenceCard
                    title={c.labels.solarShare}
                    value={
                      bill.solarSavingsPct > 0
                        ? `${Math.round(bill.solarSavingsPct)}%`
                        : "—"
                    }
                    tone="positive"
                  />
                  <EvidenceCard
                    title={c.labels.summerTrap}
                    value={
                      bill.summerTrapPct > 0
                        ? `+${Math.round(bill.summerTrapPct)}%`
                        : "—"
                    }
                    tone="warn"
                  />
                </EvidenceGrid>
                {bill.months.length > 0 ? (
                  <div className={styles.monthStrip}>
                    {bill.months.slice(0, 12).map((m) => (
                      <div
                        key={m.label}
                        className={`${styles.monthCell}${m.isSummerPeak ? ` ${styles.monthPeak}` : ""}`}
                      >
                        <span>{m.label}</span>
                        <strong>{formatInrCompact(m.netInr)}</strong>
                      </div>
                    ))}
                  </div>
                ) : null}
                <ExpertInsights
                  fill
                  title={c.pages.billInsightTitle}
                  body={c.pages.billInsightBody}
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
                  <EvidenceCard title={c.labels.annualGen} value={generation} />
                  <EvidenceCard title={c.labels.coverage} value={coverage} />
                  <EvidenceCard
                    title={c.labels.specificYield}
                    value={specificYield}
                    tone="positive"
                  />
                </EvidenceGrid>
                <ExpertInsights
                  fill
                  title={c.pages.genInsightTitle}
                  body={c.pages.genInsightBody}
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
                      ? `ब्याज ${formatInrCompact(row.interestPaidInr)}`
                      : `Interest ${formatInrCompact(row.interestPaidInr)}`
                    : undefined,
              }))}
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
              value={c.pages.investScoreValue}
              insight={c.pages.investScoreInsight(netLakh, returnMultiple)}
              accent
            />
            <EvidenceGrid>
              <EvidenceCard
                title={c.pages.lifetimeWealth}
                value={lifetime}
                insight={
                  isHi
                    ? "25 वर्षों में संचयी चक्रवृद्धि लाभ।"
                    : "Compounded cumulative gain across 25 years."
                }
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

        {/* Page 07: Generation */}
        <PageShell {...foot("07 / 12")}>
          <PageHeader title={c.pages.generation} lead={c.pages.generationLead} />
          <PageBody>
            <EvidenceGrid>
              <EvidenceCard
                title={c.labels.capacity}
                value={capacityKw}
                insight={
                  isHi
                    ? "प्रस्तावित सिस्टम क्षमता।"
                    : "Proposed system capacity for this roof."
                }
                accent
              />
              <EvidenceCard
                title={c.labels.annualGen}
                value={generation}
                insight={
                  isHi
                    ? "वार्षिक अनुमानित यूनिट उत्पादन।"
                    : "Estimated annual generation in units."
                }
                tone="positive"
              />
              <EvidenceCard
                title={c.labels.dailyGen}
                value={dailyGen}
                insight={
                  isHi
                    ? "औसत दैनिक उत्पादन।"
                    : "Average daily generation estimate."
                }
              />
              <EvidenceCard
                title={c.labels.specificYield}
                value={specificYield}
                insight={
                  isHi
                    ? "प्रति kW वार्षिक उपज।"
                    : "Annual yield per kW installed."
                }
              />
              <EvidenceCard
                title={c.labels.coverage}
                value={coverage}
                insight={
                  isHi
                    ? "लोड कवरेज अनुमान।"
                    : "Estimated household load coverage."
                }
              />
              <EvidenceCard
                title={c.labels.annualSavings}
                value={yearOneSavings > 0 ? formatInrCompact(yearOneSavings) : "—"}
                insight={c.pages.cumulative}
              />
            </EvidenceGrid>
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
                  ? "भुगतान अनुसूची (Investment Milestones)"
                  : "Investment Milestones"
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
              insightBody={c.pages.execInsightBody}
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
          companyName={closing.installerName || brand}
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
