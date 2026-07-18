"use client";

/**
 * HT-Commercial — dedicated preset for HT (High Tension) industrial clients.
 *
 * Pages:
 *   01 Cover — client, system, headline savings
 *   02 HT Bill Profile — CD / MD / PF / kVAh / voltage / demand utilization
 *   03 Space & Engineering — RCC vs shed area, structure, module count
 *   04 Power Factor & APFC — kWh billing note + APFC recommendation
 *   05 ToD Savings Window — TOD3 solar offset, night/peak remain
 *   06 Investment Summary — energy savings, fixed demand note, Section 32 AD
 *   07 Decision Analysis I — need decoded + MPERC rules in plain language
 *   08 Decision Analysis II — action plan for customer & vendor
 *
 * All finance math comes from lib/ht-solar-engine (computeHtSolarSavings).
 */

import { useState } from "react";
import type { ProposalData } from "@/lib/proposal-data";
import type { PremiumProposalPptInput } from "@/lib/proposal-ppt";
import { computeHtSolarSavings } from "@/lib/ht-solar-engine";
import { getHtCommercialCopy, type HtCommercialLang } from "./ht-commercial-copy";
import styles from "./ht-commercial.module.css";

export type HtCommercialRendererProps = {
  data: ProposalData;
  pptInput?: PremiumProposalPptInput;
  installerLogoUrl?: string;
};

function inr(v: number): string {
  return `₹${Math.round(v).toLocaleString("en-IN")}`;
}

function inrCompact(v: number): string {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)} Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)} L`;
  return inr(v);
}

/**
 * MPPKVVCL HV ToD zones (MPERC + bill evidence):
 * TOD3 = sole solar window (−20%). TOD1 = night rebate. TOD2/TOD4 = peak (+20%).
 */
const TOD_ZONES = [
  { key: "tod1" as const, zone: "TOD 1", tag: "night" as const, solar: false },
  { key: "tod2" as const, zone: "TOD 2", tag: "peak" as const, solar: false },
  { key: "tod3" as const, zone: "TOD 3", tag: "solar" as const, solar: true },
  { key: "tod4" as const, zone: "TOD 4", tag: "peak" as const, solar: false },
];

export function HtCommercialProposalRenderer({
  data,
  pptInput,
}: HtCommercialRendererProps) {
  const [lang, setLang] = useState<HtCommercialLang>("en");
  const c = getHtCommercialCopy(lang);
  const isHi = lang === "hi";

  if (!data) {
    return <div className={styles.loading}>Loading Proposal…</div>;
  }

  const ht = pptInput?.htBillInputs ?? {};
  const eco = data.economics;
  const systemKw = data.meta.systemKw > 0 ? data.meta.systemKw : 0;
  const annualUnits = data.closing.annualUnits > 0 ? data.closing.annualUnits : undefined;

  const result = computeHtSolarSavings({
    bill: {
      contractDemandKva: ht.contractDemandKva,
      billingDemandKva: ht.billingDemandKva,
      maxDemandKva: ht.maxDemandKva,
      avgPowerFactor: ht.avgPowerFactor,
      kvahUnits: ht.kvahUnits,
      kwhUnits: ht.kwhUnits,
      todUnits: ht.todUnits,
      energyChargesInr: ht.energyChargesInr,
      demandChargesInr: ht.demandChargesInr,
      electricityDutyInr: ht.electricityDutyInr,
      fppasInr: ht.fppasInr,
      pfSurchargeInr: ht.pfSurchargeInr,
      billMonth: ht.billMonth,
    },
    systemKw,
    annualSolarKwh: annualUnits,
    grossCostInr: eco.grossInr,
  });

  const customer = data.meta.customerName?.trim() || "Valued Client";
  const brand = data.meta.brandName?.trim() || "Solar Partner";
  const todTotal = TOD_ZONES.reduce(
    (sum, z) => sum + Math.max(0, Number(ht.todUnits?.[z.key]) || 0),
    0
  );

  // Space & engineering (pre-survey estimates, ~580 Wp modules)
  const panelCount = systemKw > 0 ? Math.ceil((systemKw * 1000) / 580) : 0;
  const rccAreaM2 = systemKw > 0 ? Math.round(systemKw * 10) : 0;
  const shedAreaM2 = systemKw > 0 ? Math.round(systemKw * 6) : 0;
  const toSqft = (m2: number) => Math.round(m2 * 10.764).toLocaleString("en-IN");

  // Sizing verdict from daytime (TOD3) load: ideal kW at ~1450 kWh/kWp-year
  const tod3MonthlyUnits = Math.max(0, Number(ht.todUnits?.tod3) || 0);
  const idealKwFromDayLoad =
    tod3MonthlyUnits > 0 ? Math.round((tod3MonthlyUnits * 12) / 1450) : 0;
  const sizingVerdict: "right" | "over" | "under" =
    idealKwFromDayLoad <= 0 || systemKw <= 0
      ? "right"
      : systemKw > idealKwFromDayLoad * 1.2
        ? "over"
        : systemKw < idealKwFromDayLoad * 0.8
          ? "under"
          : "right";

  const billingDemandLabel =
    result.billingDemandKva != null ? `${result.billingDemandKva} kVA` : isHi ? "90% CD" : "90% of CD";
  const nightPctLabel = "7.5%–10%";
  const mpercRules = c.analysis.mpercRules({
    billingDemand: billingDemandLabel,
    nightPct: nightPctLabel,
  });

  const foot = (pageNo: string) => (
    <footer className={styles.pageFooter}>
      <span>{brand}</span>
      <span>{pageNo}</span>
    </footer>
  );

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <button
          type="button"
          className={`${styles.toolbarBtn}${!isHi ? ` ${styles.toolbarBtnActive}` : ""}`}
          onClick={() => setLang("en")}
        >
          {c.print.langEn}
        </button>
        <button
          type="button"
          className={`${styles.toolbarBtn}${isHi ? ` ${styles.toolbarBtnActive}` : ""}`}
          onClick={() => setLang("hi")}
        >
          {c.print.langHi}
        </button>
        <button type="button" className={styles.toolbarBtn} onClick={() => window.print()}>
          {c.print.downloadPdf}
        </button>
      </div>

      {/* Page 01 — Cover */}
      <section className={styles.page}>
        <span className={styles.coverBadge}>{c.cover.badge}</span>
        <h1 className={styles.coverTitle}>{c.cover.title}</h1>
        <p className={styles.coverSub}>{c.cover.sub}</p>
        <p className={styles.lead}>
          {c.cover.preparedFor}: <strong>{customer}</strong>
        </p>
        <div className={styles.coverMetaGrid}>
          <div className={styles.coverMetaBox}>
            <span>{c.cover.systemLabel}</span>
            <strong>{systemKw > 0 ? `${systemKw} kW` : "—"}</strong>
          </div>
          <div className={styles.coverMetaBox}>
            <span>{c.cover.savingsLabel}</span>
            <strong>
              {result.annualEnergySavingsInr > 0
                ? inrCompact(result.annualEnergySavingsInr)
                : "—"}
            </strong>
          </div>
          <div className={styles.coverMetaBox}>
            <span>{c.ad.taxBenefit}</span>
            <strong>
              {result.adTaxBenefitY1Inr > 0 ? inrCompact(result.adTaxBenefitY1Inr) : "—"}
            </strong>
          </div>
        </div>
        {foot("01 / 08")}
      </section>

      {/* Page 02 — HT Bill Profile */}
      <section className={styles.page}>
        <p className={styles.sectionTag}>{c.audit.title}</p>
        <h2 className={styles.h1}>{c.audit.title}</h2>
        <p className={styles.lead}>{c.audit.lead}</p>
        <div className={styles.metricGrid}>
          <div className={styles.metricBox}>
            <strong>{ht.contractDemandKva ? `${ht.contractDemandKva} kVA` : "—"}</strong>
            <span>{c.audit.contractDemand}</span>
          </div>
          <div className={styles.metricBox}>
            <strong>{ht.maxDemandKva ? `${ht.maxDemandKva} kVA` : "—"}</strong>
            <span>{c.audit.maxDemand}</span>
            <small>
              {result.billingDemandKva != null
                ? isHi
                  ? `बिलिंग डिमांड ${result.billingDemandKva} kVA (90% CD फ्लोर)`
                  : `Billing demand ${result.billingDemandKva} kVA (90% CD floor)`
                : ""}
            </small>
          </div>
          <div
            className={`${styles.metricBox}${
              result.powerFactor < 0.9 ? ` ${styles.metricWarn}` : ` ${styles.metricPositive}`
            }`}
          >
            <strong>{result.powerFactor.toFixed(2)}</strong>
            <span>{c.audit.powerFactor}</span>
          </div>
          <div className={styles.metricBox}>
            <strong>{ht.kvahUnits ? ht.kvahUnits.toLocaleString("en-IN") : "—"}</strong>
            <span>{c.audit.kvahBilled}</span>
          </div>
          <div className={styles.metricBox}>
            <strong>{ht.supplyVoltage || "—"}</strong>
            <span>{c.audit.supplyVoltage}</span>
          </div>
          <div className={`${styles.metricBox} ${styles.metricAccent}`}>
            <strong>
              {result.demandUtilization != null
                ? `${Math.round(result.demandUtilization * 100)}%`
                : "—"}
            </strong>
            <span>{c.audit.demandUtil}</span>
          </div>
        </div>
        <aside className={styles.insight}>
          <span className={styles.insightLabel}>Expert Insight</span>
          <h3 className={styles.insightTitle}>{c.pf.billedOn}</h3>
          <p>
            {c.pf.billedOnValue}
            {" — "}
            {isHi
              ? `बेस/स्लैब दर ≈ ₹${result.baseRatePerUnit}/kWh; राइडर्स सहित ≈ ₹${result.effectiveRatePerUnit}/kWh।`
              : `base/slab rate ≈ ₹${result.baseRatePerUnit}/kWh; ≈ ₹${result.effectiveRatePerUnit}/kWh with duty + FPPAS riders.`}
          </p>
        </aside>
        {foot("02 / 08")}
      </section>

      {/* Page 03 — Space Requirement & Engineering */}
      <section className={styles.page}>
        <p className={styles.sectionTag}>{c.space.title}</p>
        <h2 className={styles.h1}>{c.space.title}</h2>
        <p className={styles.lead}>{c.space.lead}</p>
        <div className={styles.roofGrid}>
          <div className={styles.roofCard}>
            <h3 className={styles.roofTitle}>{c.space.rccTitle}</h3>
            <div className={styles.roofIllustration}>
              {[0, 1, 2].map((row) => (
                <div key={row} className={styles.roofRowRcc}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <i key={i} className={styles.panelTilted} />
                  ))}
                </div>
              ))}
            </div>
            <div className={styles.roofStats}>
              <div>
                <span>{c.space.areaLabel}</span>
                <strong>
                  {rccAreaM2 > 0 ? `${rccAreaM2.toLocaleString("en-IN")} m² (~${toSqft(rccAreaM2)} sq.ft)` : "—"}
                </strong>
                <small>{c.space.perKwRcc}</small>
              </div>
              <div>
                <span>{c.space.structureLabel}</span>
                <small>{c.space.rccStructure}</small>
              </div>
            </div>
          </div>
          <div className={styles.roofCard}>
            <h3 className={styles.roofTitle}>{c.space.shedTitle}</h3>
            <div className={styles.roofIllustration}>
              {[0, 1, 2, 3].map((row) => (
                <div key={row} className={styles.roofRowShed}>
                  {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                    <i key={i} className={styles.panelFlush} />
                  ))}
                </div>
              ))}
            </div>
            <div className={styles.roofStats}>
              <div>
                <span>{c.space.areaLabel}</span>
                <strong>
                  {shedAreaM2 > 0 ? `${shedAreaM2.toLocaleString("en-IN")} m² (~${toSqft(shedAreaM2)} sq.ft)` : "—"}
                </strong>
                <small>{c.space.perKwShed}</small>
              </div>
              <div>
                <span>{c.space.structureLabel}</span>
                <small>{c.space.shedStructure}</small>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.metricGrid}>
          <div className={styles.metricBox}>
            <strong>{systemKw > 0 ? `${systemKw} kWp` : "—"}</strong>
            <span>{c.summary.systemSize}</span>
          </div>
          <div className={`${styles.metricBox} ${styles.metricAccent}`}>
            <strong>{panelCount > 0 ? panelCount.toLocaleString("en-IN") : "—"}</strong>
            <span>{c.space.panelsLabel}</span>
            <small>~580 Wp</small>
          </div>
          <div className={styles.metricBox}>
            <strong>{isHi ? "GI हॉट-डिप" : "GI hot-dip"}</strong>
            <span>{c.space.structureLabel}</span>
          </div>
        </div>
        <aside className={styles.insight}>
          <span className={styles.insightLabel}>Expert Insight</span>
          <h3 className={styles.insightTitle}>{c.space.whichBetter}</h3>
          <p>{c.space.whichBetterBody}</p>
        </aside>
        {foot("03 / 08")}
      </section>

      {/* Page 04 — Power Factor Analysis */}
      <section className={styles.page}>
        <p className={styles.sectionTag}>{c.pf.title}</p>
        <h2 className={styles.h1}>{c.pf.title}</h2>
        <p className={styles.lead}>{c.pf.lead}</p>
        <div className={styles.formulaBand}>
          <span>{c.pf.formulaLabel}</span>
          <strong>{c.pf.formula}</strong>
        </div>
        <div className={styles.metricGrid}>
          <div className={styles.metricBox}>
            <strong>{result.annualSolarKwh.toLocaleString("en-IN")}</strong>
            <span>{isHi ? "वार्षिक सोलर kWh" : "Annual solar kWh"}</span>
          </div>
          <div className={`${styles.metricBox} ${styles.metricAccent}`}>
            <strong>TOD3</strong>
            <span>{isHi ? "सोलर-आवर ऑफसेट विंडो (−20%)" : "Solar-hour offset window (−20%)"}</span>
          </div>
          <div className={`${styles.metricBox} ${styles.metricPositive}`}>
            <strong>{result.annualUnitsSaved.toLocaleString("en-IN")}</strong>
            <span>{c.pf.kvahSaved}</span>
          </div>
        </div>
        <div className={styles.metricGrid}>
          <div className={styles.metricBox}>
            <strong>₹{result.effectiveRatePerUnit}</strong>
            <span>{c.pf.effectiveRate}</span>
            <small>/kWh</small>
          </div>
          <div className={`${styles.metricBox} ${styles.metricPositive}`}>
            <strong>{inrCompact(result.annualEnergySavingsInr)}</strong>
            <span>{c.summary.energySavings}</span>
          </div>
          <div className={styles.metricBox}>
            <strong>{Math.round(result.daytimeOffsetShare * 100)}%</strong>
            <span>{c.tod.daytimeShare}</span>
          </div>
        </div>
        {result.annualPfSurchargeInr > 0 ? (
          <div className={styles.metricGrid}>
            <div className={`${styles.metricBox} ${styles.metricWarn}`}>
              <strong>{inrCompact(result.annualPfSurchargeInr)}</strong>
              <span>{isHi ? "वार्षिक PF सरचार्ज (बिल से)" : "Annual PF surcharge (from bill)"}</span>
              <small>
                {isHi
                  ? "APFC पैनल से बचाव — सोलर इन्वर्टर से नहीं"
                  : "Avoidable via APFC panel — not via solar inverter"}
              </small>
            </div>
          </div>
        ) : null}
        <aside className={styles.insight}>
          <span className={styles.insightLabel}>Expert Insight</span>
          <h3 className={styles.insightTitle}>{c.pf.insightTitle}</h3>
          <p>{c.pf.insightBody}</p>
        </aside>
        {foot("04 / 08")}
      </section>

      {/* Page 05 — ToD Savings Window */}
      <section className={styles.page}>
        <p className={styles.sectionTag}>{c.tod.title}</p>
        <h2 className={styles.h1}>{c.tod.title}</h2>
        <p className={styles.lead}>{c.tod.lead}</p>
        <div className={styles.todChart}>
          {TOD_ZONES.map((zone) => {
            const units = Math.max(0, Number(ht.todUnits?.[zone.key]) || 0);
            const pct = todTotal > 0 ? Math.max(6, Math.round((units / todTotal) * 100)) : 6;
            return (
              <div key={zone.key} className={styles.todCol}>
                <span className={styles.todUnits}>
                  {units > 0 ? units.toLocaleString("en-IN") : "—"}
                </span>
                <div className={styles.todBarTrack}>
                  <div
                    className={`${styles.todBar}${zone.solar ? ` ${styles.todBarSolar}` : ""}`}
                    style={{ height: `${pct}%` }}
                  />
                </div>
                <span className={styles.todZone}>{zone.zone}</span>
                <span className={styles.todWindow}>
                  {zone.tag === "solar"
                    ? isHi
                      ? "सोलर आवर्स (−20%)"
                      : "Solar hours (−20%)"
                    : zone.tag === "night"
                      ? isHi
                        ? "रात रिबेट (−7.5%/−10%)"
                        : "Night rebate (−7.5%/−10%)"
                      : isHi
                        ? "पीक सरचार्ज (+20%)"
                        : "Peak surcharge (+20%)"}
                  {" · "}
                  {zone.solar ? c.tod.solarWindow : c.tod.nonSolarWindow}
                </span>
              </div>
            );
          })}
        </div>
        <div className={styles.todLegend}>
          <span>
            <i style={{ background: "#0f766e" }} /> {c.tod.solarWindow}
          </span>
          <span>
            <i style={{ background: "#94a3b8" }} /> {c.tod.nonSolarWindow}
          </span>
        </div>
        {result.daytimeCapped ? <p className={styles.note}>{c.tod.cappedNote}</p> : null}
        {result.todOffset ? (
          <div className={styles.metricGrid}>
            <div className={`${styles.metricBox} ${styles.metricPositive}`}>
              <strong>{result.annualUnitsSaved.toLocaleString("en-IN")}</strong>
              <span>{isHi ? "वार्षिक डे-टाइम ऑफसेट यूनिट" : "Annual daytime units offset"}</span>
            </div>
            <div className={styles.metricBox}>
              <strong>{result.annualExportedUnits.toLocaleString("en-IN")}</strong>
              <span>{isHi ? "ग्रिड को निर्यात (बेस-रेट क्रेडिट)" : "Exported to grid (base-rate credit)"}</span>
            </div>
            <div className={`${styles.metricBox} ${styles.metricAccent}`}>
              <strong>{inrCompact(result.annualEnergySavingsInr)}</strong>
              <span>{isHi ? "वार्षिक ToD-समायोजित बचत" : "Annual ToD-adjusted savings"}</span>
            </div>
          </div>
        ) : null}
        <aside className={styles.insight}>
          <span className={styles.insightLabel}>
            {isHi ? "ToD इंटेलिजेंस" : "Time-of-Day Intelligence"}
          </span>
          <h3 className={styles.insightTitle}>{c.tod.insightTitle}</h3>
          <p>
            {c.tod.insightBody}{" "}
            {isHi
              ? "शाम के पीक स्लॉट (सरचार्ज ज़ोन) में सोलर उत्पादन नहीं होता — वह सरचार्ज बना रहेगा। बाद में BESS (बैटरी स्टोरेज) जोड़कर यह पीक पेनल्टी भी हटाई जा सकती है।"
              : "Solar does not generate in the evening peak slots (surcharge zones) — that surcharge remains. Adding a BESS (battery energy storage system) later can eliminate this peak penalty."}
          </p>
        </aside>
        {foot("05 / 08")}
      </section>

      {/* Page 06 — Investment Summary + Demand + Section 32 AD */}
      <section className={styles.page}>
        <p className={styles.sectionTag}>{c.summary.title}</p>
        <h2 className={styles.h1}>{c.ad.title}</h2>
        <p className={styles.lead}>{c.ad.lead}</p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <tbody>
              <tr>
                <td>{c.summary.systemSize}</td>
                <td>{systemKw > 0 ? `${systemKw} kW` : "—"}</td>
              </tr>
              <tr>
                <td>{c.summary.annualGen}</td>
                <td>{result.annualSolarKwh.toLocaleString("en-IN")} kWh</td>
              </tr>
              <tr>
                <td>{c.summary.energySavings}</td>
                <td>{inr(result.annualEnergySavingsInr)}</td>
              </tr>
              <tr>
                <td>{c.demand.annualLabel}</td>
                <td>
                  {result.annualDemandChargesInr > 0
                    ? inr(result.annualDemandChargesInr)
                    : "—"}
                </td>
              </tr>
              {result.annualPfSurchargeInr > 0 ? (
                <tr>
                  <td>
                    {isHi
                      ? "PF सरचार्ज (APFC पैनल से बचाव योग्य)"
                      : "PF surcharge (avoidable via APFC panel)"}
                  </td>
                  <td>{inr(result.annualPfSurchargeInr)}</td>
                </tr>
              ) : null}
              <tr>
                <td>{c.ad.plantCost}</td>
                <td>{eco.grossInr > 0 ? inr(eco.grossInr) : "—"}</td>
              </tr>
              <tr>
                <td>{c.ad.depreciationY1}</td>
                <td>{result.adDepreciationY1Inr > 0 ? inr(result.adDepreciationY1Inr) : "—"}</td>
              </tr>
              <tr>
                <td>{c.ad.taxRate}</td>
                <td>25.17%</td>
              </tr>
              <tr className={styles.tableTotal}>
                <td>{c.ad.taxBenefit}</td>
                <td>{result.adTaxBenefitY1Inr > 0 ? inr(result.adTaxBenefitY1Inr) : "—"}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className={styles.note}>{c.ad.note}</p>
        <p className={styles.note}>{c.demand.body}</p>
        <aside className={styles.insight}>
          <span className={styles.insightLabel}>Expert Insight</span>
          <h3 className={styles.insightTitle}>{c.summary.title}</h3>
          <p>
            {c.summary.paybackNote} {c.footer.disclaimer}
          </p>
        </aside>
        {foot("06 / 08")}
      </section>

      {/* Page 07 — Decision Analysis I: need decoded + MPERC rules */}
      <section className={styles.page}>
        <p className={styles.sectionTag}>{c.analysis.pageTitle1}</p>
        <h2 className={styles.h1}>{c.analysis.pageTitle1}</h2>
        <p className={styles.lead}>{c.analysis.lead1}</p>
        <div className={styles.metricGrid}>
          <div className={styles.metricBox}>
            <strong>
              {tod3MonthlyUnits > 0 ? `${tod3MonthlyUnits.toLocaleString("en-IN")} kWh` : "—"}
            </strong>
            <span>{c.analysis.needDayLoad}</span>
          </div>
          <div className={`${styles.metricBox} ${styles.metricAccent}`}>
            <strong>{idealKwFromDayLoad > 0 ? `~${idealKwFromDayLoad} kW` : "—"}</strong>
            <span>{c.analysis.needIdealSize}</span>
          </div>
          <div
            className={`${styles.metricBox}${
              sizingVerdict === "right" ? ` ${styles.metricPositive}` : ` ${styles.metricWarn}`
            }`}
          >
            <strong>{systemKw > 0 ? `${systemKw} kW` : "—"}</strong>
            <span>{c.analysis.needProposed}</span>
          </div>
        </div>
        <div className={styles.verdictBox}>
          <span className={styles.insightLabel}>{c.analysis.needTitle}</span>
          <p>
            {sizingVerdict === "over"
              ? c.analysis.verdictOver
              : sizingVerdict === "under"
                ? c.analysis.verdictUnder
                : c.analysis.verdictRight}
          </p>
        </div>
        <h3 className={styles.insightTitle}>{c.analysis.mpercTitle}</h3>
        <ol className={styles.ruleList}>
          {mpercRules.map((rule, i) => (
            <li key={i}>{rule}</li>
          ))}
        </ol>
        {foot("07 / 08")}
      </section>

      {/* Page 08 — Decision Analysis II: action plan */}
      <section className={styles.page}>
        <p className={styles.sectionTag}>{c.analysis.pageTitle2}</p>
        <h2 className={styles.h1}>{c.analysis.pageTitle2}</h2>
        <p className={styles.lead}>{c.analysis.lead2}</p>
        <div className={styles.actionGrid}>
          <div className={styles.actionCard}>
            <h3 className={styles.roofTitle}>{c.analysis.customerTitle}</h3>
            <ol className={styles.stepList}>
              {c.analysis.customerSteps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
          <div className={styles.actionCard}>
            <h3 className={styles.roofTitle}>{c.analysis.vendorTitle}</h3>
            <ol className={styles.stepList}>
              {c.analysis.vendorSteps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
        <div className={styles.verdictBox}>
          <span className={styles.insightLabel}>{c.analysis.wayTitle}</span>
          <p>
            {c.analysis.wayBody({
              sizeKw: systemKw > 0 ? `${systemKw} kW` : "— kW",
              savings:
                result.annualEnergySavingsInr > 0
                  ? inrCompact(result.annualEnergySavingsInr)
                  : "—",
              tax: result.adTaxBenefitY1Inr > 0 ? inrCompact(result.adTaxBenefitY1Inr) : "—",
            })}
          </p>
        </div>
        <p className={styles.note}>{c.footer.disclaimer}</p>
        {foot("08 / 08")}
      </section>
    </div>
  );
}
