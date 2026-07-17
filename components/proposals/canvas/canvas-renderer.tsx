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
  BulletList,
  EvidenceCard,
  EvidenceGrid,
  ExpertInsights,
  HardwareTrustGrid,
  resolveHardwareTrustProducts,
  PageBody,
  PageHeader,
  PageShell,
  ProfitBadge,
  StepCard,
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

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  const foot = (n: string) => ({ pageNo: n, brand });

  return (
    <div className={`${styles.shell}${isHi ? ` ${styles.langHi}` : ""}`}>
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
        {/* Page 01: Cover */}
        <PageShell variant="cover" {...foot("01 / 12")}>
          <div className={styles.coverTop}>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={brand} className={styles.logo} />
            ) : (
              <div className={styles.brand}>{brand.toUpperCase()}</div>
            )}
            <span className={styles.coverBadge}>{c.cover.badge}</span>
          </div>
          <h1 className={styles.title}>{c.cover.title}</h1>
          <p className={styles.preparedFor}>
            {c.cover.preparedFor}
            <strong>{customer}</strong>
          </p>
          {location ? <p className={styles.coverClientLoc}>{location}</p> : null}
          <div className={styles.heroStats}>
            <h2>
              <span className={styles.accent}>{lifetime}</span> {c.pages.lifetimeWealth}
            </h2>
            <span className={styles.heroStatsMeta}>
              {c.cover.system}: {capacityKw}
            </span>
          </div>
        </PageShell>

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

        {/* Page 03: Investment plan */}
        <PageShell {...foot("03 / 12")}>
          <PageHeader title={c.pages.investment} lead={c.pages.investmentLead} />
          <PageBody>
            <EvidenceGrid>
              <EvidenceCard
                title={c.pages.gross}
                value={eco.grossInr > 0 ? formatInrCompact(eco.grossInr) : "—"}
                insight={
                  isHi
                    ? "हार्डवेयर + इंस्टॉल की सकल कीमत।"
                    : "Hardware + install before subsidy."
                }
              />
              <EvidenceCard
                title={c.pages.subsidy}
                value={eco.subsidyInr > 0 ? formatInrCompact(eco.subsidyInr) : "—"}
                insight={
                  isHi
                    ? "लागू सब्सिडी / छूट अनुमान।"
                    : "Applicable subsidy / rebate estimate."
                }
                tone="positive"
              />
              <EvidenceCard
                title={c.pages.youPay}
                value={eco.netInr > 0 ? formatInrCompact(eco.netInr) : "—"}
                insight={
                  isHi
                    ? "यही आंकड़ा पेबैक की आधार-रेखा है।"
                    : "This figure is the payback baseline."
                }
                accent
              />
              <EvidenceCard
                title={c.pages.payback}
                value={
                  eco.paybackYears > 0 ? `${eco.paybackYears.toFixed(1)} yr` : "—"
                }
                insight={
                  isHi
                    ? "नेट लागत ÷ वार्षिक बचत।"
                    : "Net cost ÷ annual savings."
                }
              />
              <EvidenceCard
                title={c.pages.lifetimeWealth}
                value={lifetime}
                insight={
                  isHi
                    ? "दीर्घकालिक धन निर्माण।"
                    : "Long-horizon wealth creation."
                }
              />
              <EvidenceCard
                title={c.pages.monthlyProfit}
                value={monthlySavings}
                insight={c.pages.netGainHint}
              />
            </EvidenceGrid>
            {eco.emiRows.length > 0 ? (
              <EvidenceGrid cols={3}>
                {eco.emiRows.slice(0, 3).map((row) => (
                  <EvidenceCard
                    key={row.tenureLabel}
                    title={row.tenureLabel}
                    value={formatInr(row.monthlyEmiInr)}
                    insight={
                      row.interestPaidInr > 0
                        ? `Interest ${formatInrCompact(row.interestPaidInr)}`
                        : undefined
                    }
                  />
                ))}
              </EvidenceGrid>
            ) : null}
            <ExpertInsights
              fill
              title={c.pages.investInsightTitle}
              body={c.pages.investInsightBody}
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

        {/* Page 05: Financial Story */}
        <PageShell {...foot("05 / 12")}>
          <PageHeader title={c.pages.financial} lead={c.pages.financialLead} />
          <PageBody>
            <EvidenceCard
              title={c.pages.immediateProfit}
              value={eco.monthlySavingsInr > 0 ? `+${monthlySavings}` : "—"}
              insight={c.pages.netGainHint}
              accent
            />
            <div className={styles.financialCompare}>
              <EvidenceCard
                title={c.pages.today}
                value={monthlyBillApprox > 0 ? formatInr(monthlyBillApprox) : "—"}
                insight={
                  isHi
                    ? "सोलर से पहले औसत मासिक बिल।"
                    : "Average monthly bill before solar."
                }
              />
              <ProfitBadge>
                {c.pages.monthlyProfit}: +{monthlySavings}
              </ProfitBadge>
              <EvidenceCard
                title={c.pages.afterSolar}
                value={
                  monthlyBillApprox > 0 && eco.monthlySavingsInr > 0
                    ? formatInr(Math.max(0, monthlyBillApprox - eco.monthlySavingsInr))
                    : "—"
                }
                insight={
                  isHi
                    ? "बचत घटने के बाद अनुमानित बिल।"
                    : "Estimated bill after solar offset."
                }
                tone="positive"
              />
            </div>
            <EvidenceGrid>
              <EvidenceCard
                title={c.labels.annualSavings}
                value={yearOneSavings > 0 ? formatInrCompact(yearOneSavings) : "—"}
                insight={
                  isHi
                    ? "पहले वर्ष की अनुमानित कुल बचत।"
                    : "Projected total savings in year one."
                }
                accent
              />
              <EvidenceCard
                title={c.pages.payback}
                value={
                  eco.paybackYears > 0 ? `${eco.paybackYears.toFixed(1)} yr` : "—"
                }
                insight={
                  isHi
                    ? "नेट निवेश वसूल होने तक का समय।"
                    : "Years until net investment is recovered."
                }
              />
              <EvidenceCard
                title={c.pages.lifetimeWealth}
                value={lifetime}
                insight={
                  isHi
                    ? "25 वर्षों में संचयी लाभ।"
                    : "Cumulative gain across 25 years."
                }
                tone="positive"
              />
              <EvidenceCard
                title={c.pages.youPay}
                value={eco.netInr > 0 ? formatInrCompact(eco.netInr) : "—"}
                insight={
                  isHi
                    ? "सब्सिडी के बाद आपकी वास्तविक लागत।"
                    : "Your true outlay after subsidy."
                }
              />
            </EvidenceGrid>
            <ExpertInsights
              fill
              title={c.pages.financeInsightTitle}
              body={c.pages.financeInsightBody}
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

        {/* Page 08: Impact */}
        <PageShell {...foot("08 / 12")}>
          <PageHeader title={c.pages.impact} lead={c.pages.impactLead} />
          <PageBody>
            <EvidenceGrid>
              <EvidenceCard
                title={c.pages.co2}
                value={impact.co2Tons > 0 ? `${impact.co2Tons.toFixed(1)} t` : "—"}
                tone="positive"
              />
              <EvidenceCard
                title={c.pages.trees}
                value={
                  impact.treesEquivalent > 0
                    ? impact.treesEquivalent.toLocaleString("en-IN")
                    : "—"
                }
                tone="positive"
              />
              <EvidenceCard title={c.labels.units} value={generation} />
              <EvidenceCard
                title={c.labels.annualSavings}
                value={
                  closing.annualSavingsInr > 0
                    ? formatInrCompact(closing.annualSavingsInr)
                    : yearOneSavings > 0
                      ? formatInrCompact(yearOneSavings)
                      : "—"
                }
                accent
              />
            </EvidenceGrid>
            <ExpertInsights
              fill
              title={c.pages.impactInsightTitle}
              body={c.pages.impactInsightBody}
            />
          </PageBody>
        </PageShell>

        {/* Page 09: Engineering */}
        <PageShell {...foot("09 / 12")}>
          <PageHeader title={c.pages.engineering} lead={c.pages.engineeringLead} />
          <PageBody>
            <EvidenceGrid>
              {(eng.metrics.length > 0
                ? eng.metrics.slice(0, 6)
                : [
                    { label: c.labels.capacity, value: capacityKw },
                    { label: c.labels.annualGen, value: generation },
                    { label: c.labels.coverage, value: coverage },
                    { label: c.labels.specificYield, value: specificYield },
                  ]
              ).map((m) => (
                <EvidenceCard key={m.label} title={m.label} value={m.value} />
              ))}
            </EvidenceGrid>
            {eng.standards.length > 0 ? (
              <EvidenceCard
                title={isHi ? "मानक" : "Standards"}
                value={eng.standards.slice(0, 3).join(" · ")}
                insight={
                  eng.standards.length > 3
                    ? `+${eng.standards.length - 3} more`
                    : undefined
                }
              />
            ) : null}
            <ExpertInsights
              fill
              title={c.pages.engInsightTitle}
              body={c.pages.engInsightBody}
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

        {/* Page 11: Execution + Payment + Terms */}
        <PageShell {...foot("11 / 12")}>
          <PageHeader title={c.pages.execution} lead={c.pages.executionLead} />
          <PageBody>
            {execution.steps.length > 0 ? (
              <ol className={styles.stepList}>
                {execution.steps.slice(0, 4).map((step) => (
                  <StepCard
                    key={step.num}
                    num={step.num}
                    title={step.title}
                    description={step.description}
                  />
                ))}
              </ol>
            ) : (
              <EvidenceGrid>
                <EvidenceCard title="01" value={isHi ? "सर्वे" : "Survey"} />
                <EvidenceCard title="02" value={isHi ? "डिज़ाइन" : "Design"} />
                <EvidenceCard title="03" value={isHi ? "स्थापना" : "Install"} />
                <EvidenceCard title="04" value={isHi ? "गो-लाइव" : "Go-live"} />
              </EvidenceGrid>
            )}
            <PageHeader title={c.pages.payment} lead={c.pages.paymentLead} />
            {execution.payments.length > 0 ? (
              <EvidenceGrid>
                {execution.payments.map((p) => (
                  <EvidenceCard
                    key={p.label}
                    title={p.label}
                    value={
                      p.amountInr > 0 ? formatInrCompact(p.amountInr) : p.pctLabel
                    }
                    insight={p.amountInr > 0 ? p.pctLabel : undefined}
                    accent
                  />
                ))}
              </EvidenceGrid>
            ) : (
              <EvidenceGrid>
                <EvidenceCard
                  title={c.pages.youPay}
                  value={eco.netInr > 0 ? formatInrCompact(eco.netInr) : "—"}
                  accent
                />
                <EvidenceCard title={c.pages.lifetimeWealth} value={lifetime} />
              </EvidenceGrid>
            )}
            {(execution.bank.company ||
              execution.bank.accountNumber ||
              execution.bank.upiId) && (
              <div className={styles.bankBlock}>
                {execution.bank.company ? <p>{execution.bank.company}</p> : null}
                {execution.bank.accountNumber ? (
                  <p>A/C {execution.bank.accountNumber}</p>
                ) : null}
                {execution.bank.ifsc ? <p>IFSC {execution.bank.ifsc}</p> : null}
                {execution.bank.upiId ? <p>UPI {execution.bank.upiId}</p> : null}
              </div>
            )}
            {(terms.conditions.length > 0 || terms.documents.length > 0) && (
              <>
                <p className={styles.cardLabel}>{c.pages.terms}</p>
                <BulletList
                  items={[...terms.conditions, ...terms.documents].slice(0, 4)}
                />
              </>
            )}
            <ExpertInsights
              fill
              title={c.pages.execInsightTitle}
              body={c.pages.execInsightBody}
            />
          </PageBody>
        </PageShell>

        {/* Page 12: Closing */}
        <PageShell variant="closing" {...foot("12 / 12")}>
          <div className={styles.closingHero}>
            <h2 className={styles.closingTitle}>{c.pages.closingTitle}</h2>
            <p className={styles.closingBody}>{c.pages.closingBody}</p>
            <button type="button" className={styles.closingCta} onClick={handlePrint}>
              {c.pages.closingCta}
            </button>
          </div>
          <div className={styles.closingContact}>
            <p className={styles.cardLabel}>{c.pages.contact}</p>
            <p className={styles.coverClientName}>{closing.installerName || brand}</p>
            {closing.contactLine ? (
              <p className={styles.coverClientLoc}>{closing.contactLine}</p>
            ) : null}
          </div>
        </PageShell>
      </div>
    </div>
  );
}
