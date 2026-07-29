"use client";

/**
 * Premium Luxe (noir) — A4 multi-page residential proposal.
 * Preset id: residential_luxe_noir · Canvas-style pagination · daylight porcelain + ink + champagne gold.
 * Atelier (residential_premium_luxe) stays separate.
 */

import { useState, type ReactNode } from "react";
import type { ProposalData } from "@/lib/proposal-data";
import { formatInr } from "@/components/proposals/_shared/formatters";
import { ObsidianCover } from "./ObsidianCover";
import { EngineeringBlueprint } from "./EngineeringBlueprint";
import { TitaniumLedger } from "./TitaniumLedger";
import { WealthTerminal } from "./WealthTerminal";
import { ImpactPage } from "./ImpactPage";
import { PaymentMilestonesPage } from "./PaymentMilestonesPage";
import { ClosingPage } from "./ClosingPage";
import { ExpertVerdict } from "./ExpertVerdict";
import {
  TermsCompliancePage1,
  TermsCompliancePage2,
} from "./TermsCompliance";
import { LuxeLangProvider, useLuxeLang } from "./luxe-lang-context";
import type { LuxeLang } from "./luxe-copy";
import { luxeDisplayFont } from "./luxe-fonts";
import { useLuxeVendorName, luxeVendorOrFallback } from "./luxe-vendor";
import styles from "./luxe-noir-shell.module.css";

export type LuxeNoirRendererProps = {
  data: ProposalData;
};

const DEFAULT_PAYMENT_PCTS = [25, 50, 20, 5] as const;

function A4Page({
  pageLabel,
  brand,
  children,
  contentClassName,
}: {
  pageLabel: string;
  brand: string;
  children: ReactNode;
  contentClassName?: string;
}) {
  return (
    <section className={styles.a4Page}>
      <div className={`${styles.pageInner} ${contentClassName ?? ""}`.trim()}>
        {children}
      </div>
      <footer className={styles.pageFooter}>
        <span className={styles.pageFooterGold}>{brand.toUpperCase()}</span>
        <span>{pageLabel}</span>
      </footer>
    </section>
  );
}

function LuxeNoirDocument({ data }: { data: ProposalData }) {
  const { lang, setLang, copy, isHi } = useLuxeLang();
  const brand = luxeVendorOrFallback(useLuxeVendorName(data), isHi);
  const systemKw = Number(data.meta.systemKw) || 0;
  const eco = data.economics;
  const bill = data.bill;
  const execution = data.execution;
  const terms = data.terms;
  const closing = data.closing;

  const net = eco.netInr;
  const gross = eco.grossInr;

  const yearlyUnits =
    bill.totals.units > 0
      ? bill.totals.units
      : bill.months.reduce((s, m) => s + (m.units || 0), 0);
  const monthlyUnitsAvg =
    bill.months.length > 0
      ? Math.round(yearlyUnits / Math.max(bill.months.length, 1))
      : yearlyUnits > 0
        ? Math.round(yearlyUnits / 12)
        : 0;
  const monthlyBillApprox =
    bill.yearlyBillInr > 0 ? Math.round(bill.yearlyBillInr / 12) : 0;
  const generationUnits =
    closing.annualUnits > 0
      ? closing.annualUnits
      : systemKw > 0
        ? Math.round(systemKw * 1450)
        : 0;

  const paymentTitles = copy.pay.defaultTitles;
  const paymentBaseInr = gross > 0 ? gross : net;
  const paymentMilestones =
    execution.payments.length > 0
      ? execution.payments.slice(0, 4).map((p, i) => {
          const pctMatch = p.pctLabel.match(/(\d+)\s*%/);
          const pct = Number(
            pctMatch?.[1] ??
              DEFAULT_PAYMENT_PCTS[i] ??
              Math.round(100 / Math.max(execution.payments.length, 1))
          );
          const amountInr =
            paymentBaseInr > 0
              ? Math.round((paymentBaseInr * pct) / 100)
              : p.amountInr > 0
                ? p.amountInr
                : 0;
          return {
            step: String(i + 1).padStart(2, "0"),
            title: p.label.replace(/^\d+\.\s*/, "") || paymentTitles[i]!,
            amountLabel: amountInr > 0 ? formatInr(amountInr) : "—",
            percent: `${pct}%`,
            amountInr,
          };
        })
      : DEFAULT_PAYMENT_PCTS.map((pct, i) => {
          const amountInr =
            paymentBaseInr > 0 ? Math.round((paymentBaseInr * pct) / 100) : 0;
          return {
            step: String(i + 1).padStart(2, "0"),
            title: paymentTitles[i]!,
            amountLabel: amountInr > 0 ? formatInr(amountInr) : "—",
            percent: `${pct}%`,
            amountInr,
          };
        });

  const emiRows = (eco.emiRows ?? []).slice(0, 4);
  const interestRatePct =
    typeof eco.interestRatePct === "number" && Number.isFinite(eco.interestRatePct)
      ? eco.interestRatePct
      : 7;
  const ratePctLabel = Number.isInteger(interestRatePct)
    ? String(interestRatePct)
    : interestRatePct.toFixed(1).replace(/\.0$/, "");
  const paymentTerms =
    terms.conditions.length > 0
      ? terms.conditions.slice(0, 4)
      : isHi
        ? [
            "प्रस्ताव जारी तिथि से 15 दिनों तक मान्य।",
            "सब्सिडी MNRE / DISCOM मंज़ूरी समय पर निर्भर।",
            "साइट तैयारियाँ और स्ट्रक्चरल क्लियरेंस ग्राहक की ज़िम्मेदारी।",
            "कमीशनिंग DISCOM नेट-मीटरिंग मंज़ूरी के बाद।",
          ]
        : [
            "Prices valid for 15 days from proposal date.",
            "Subsidy subject to MNRE / DISCOM approval timelines.",
            "Site readiness and structural clearance are client responsibilities.",
            "Commissioning follows net-metering approval by the DISCOM.",
          ];

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  const genLabel =
    generationUnits > 0
      ? `${generationUnits.toLocaleString("en-IN")} ${isHi ? "यूनिट" : "unit"}`
      : isHi
        ? "वार्षिक"
        : "annual";

  return (
    <div className={`${styles.root} ${luxeDisplayFont.variable}`}>
      <div className={styles.printBar}>
        <div className={styles.printBarInner}>
          <span className={styles.printBarBrand}>{copy.print.brand}</span>
          <div className={styles.printBarActions}>
            <div className={styles.langToggle} role="group" aria-label="Language">
              <button
                type="button"
                className={`${styles.langBtn}${lang === "en" ? ` ${styles.langBtnActive}` : ""}`}
                onClick={() => setLang("en")}
                aria-pressed={lang === "en"}
              >
                {copy.print.langEn}
              </button>
              <button
                type="button"
                className={`${styles.langBtn}${lang === "hi" ? ` ${styles.langBtnActive}` : ""}`}
                onClick={() => setLang("hi")}
                aria-pressed={lang === "hi"}
              >
                {copy.print.langHi}
              </button>
            </div>
            <button type="button" className={styles.printBarBtn} onClick={handlePrint}>
              {copy.print.downloadPdf}
            </button>
          </div>
        </div>
      </div>

      <ObsidianCover data={data} />

      <A4Page pageLabel="02 / 11" brand={brand}>
        <p className={styles.eyebrow}>{copy.load.eyebrow}</p>
        <h2 className={styles.title} style={{ fontSize: "28pt" }}>
          {copy.load.title}
        </h2>
        <div className={styles.goldRule} />
        <p className={styles.lead}>{copy.load.lead}</p>

        <div className={styles.cardGrid3} style={{ marginTop: 20 }}>
          <div className={`${styles.card} ${styles.cardAccent}`}>
            <span className={styles.cardLabel}>{copy.load.avgUnits}</span>
            <span className={styles.cardValue}>
              {monthlyUnitsAvg > 0 ? monthlyUnitsAvg.toLocaleString("en-IN") : "—"}
            </span>
            <span className={styles.cardHint}>{copy.load.fromBill}</span>
          </div>
          <div className={`${styles.card} ${styles.cardAccent}`}>
            <span className={styles.cardLabel}>{copy.load.estBill}</span>
            <span className={styles.cardValue}>
              {monthlyBillApprox > 0 ? formatInr(monthlyBillApprox) : "—"}
            </span>
            <span className={styles.cardHint}>{copy.load.billHint}</span>
          </div>
          <div className={`${styles.card} ${styles.cardAccent}`}>
            <span className={styles.cardLabel}>{copy.load.capacity}</span>
            <span className={styles.cardValue}>
              {systemKw > 0 ? `${systemKw} kW` : "—"}
            </span>
            <span className={styles.cardHint}>{copy.load.acRating}</span>
          </div>
        </div>

        <div className={styles.stack} style={{ marginTop: 18 }}>
          <div className={styles.card}>
            <span className={styles.cardLabel}>{copy.load.annualGen}</span>
            <span className={styles.cardValue} style={{ fontSize: "22pt" }}>
              {generationUnits > 0
                ? `${generationUnits.toLocaleString("en-IN")} ${
                    isHi ? "यूनिट" : "units"
                  }`
                : "—"}
            </span>
            <span className={styles.cardHint}>{copy.load.yieldHint}</span>
          </div>
          {bill.hasData && bill.months.length > 0 ? (
            <div className={styles.card}>
              <span className={styles.cardLabel}>{copy.load.recentMonths}</span>
              <div className={styles.stack} style={{ marginTop: 8, gap: 0 }}>
                {bill.months.slice(0, 6).map((m) => (
                  <div key={m.label} className={styles.listRow}>
                    <span>
                      {m.label}
                      {m.isSummerPeak ? ` · ${copy.load.peak}` : ""}
                    </span>
                    <strong>
                      {m.units.toLocaleString("en-IN")} {copy.common.unit} ·{" "}
                      {formatInr(m.netInr)}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.card}>
              <span className={styles.cardLabel}>{copy.load.coverage}</span>
              <p className={styles.cardHint} style={{ marginTop: 8, fontSize: "10pt" }}>
                {copy.load.coverageBody}
              </p>
            </div>
          )}
        </div>

        <ExpertVerdict label={copy.load.verdictLabel}>
          {monthlyUnitsAvg > 0 && systemKw > 0
            ? copy.load.verdictWithData(
                monthlyUnitsAvg.toLocaleString("en-IN"),
                String(systemKw),
                genLabel
              )
            : copy.load.verdictFallback}
        </ExpertVerdict>
      </A4Page>

      <WealthTerminal data={data} />

      <A4Page pageLabel="04 / 11" brand={brand}>
        <p className={styles.eyebrow}>{copy.emi.eyebrow}</p>
        <h2 className={styles.title} style={{ fontSize: "28pt" }}>
          {copy.emi.title}
        </h2>
        <div className={styles.goldRule} />
        <p className={styles.lead}>{copy.emi.lead}</p>
        <p className={styles.cardHint} style={{ marginTop: 8, fontSize: "9.5pt" }}>
          {copy.emi.rateLabel}:{" "}
          <strong style={{ color: "#141820" }}>{copy.emi.rateValue(ratePctLabel)}</strong>
        </p>

        <div className={styles.card} style={{ marginTop: 16 }}>
          {emiRows.length > 0 ? (
            <table className={styles.emiTable}>
              <thead>
                <tr>
                  <th>{copy.emi.tenure}</th>
                  <th>{copy.emi.interestAt(ratePctLabel)}</th>
                  <th>{copy.emi.monthlyEmi}</th>
                </tr>
              </thead>
              <tbody>
                {emiRows.map((row) => (
                  <tr key={row.tenureLabel}>
                    <td>{row.tenureLabel}</td>
                    <td>
                      {row.interestPaidInr > 0 ? formatInr(row.interestPaidInr) : "—"}
                    </td>
                    <td>
                      <strong>
                        {row.monthlyEmiInr > 0 ? formatInr(row.monthlyEmiInr) : "—"}
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className={styles.cardHint} style={{ fontSize: "10pt" }}>
              {copy.emi.emiEmpty}
            </p>
          )}
        </div>

        <div className={styles.cardGrid2} style={{ marginTop: 14 }}>
          <div className={`${styles.card} ${styles.cardAccent}`}>
            <span className={styles.cardLabel}>{copy.emi.refNet}</span>
            <span className={styles.cardValue} style={{ fontSize: "18pt" }}>
              {net > 0 ? formatInr(net) : "—"}
            </span>
          </div>
          <div className={`${styles.card} ${styles.cardAccent}`}>
            <span className={styles.cardLabel}>{copy.emi.vsBill}</span>
            <span className={styles.cardValue} style={{ fontSize: "18pt" }}>
              {monthlyBillApprox > 0 ? formatInr(monthlyBillApprox) : "—"}
            </span>
            <span className={styles.cardHint}>{copy.emi.gridSpend}</span>
          </div>
        </div>

        <div className={styles.termsBox}>{copy.emi.disclaimer(ratePctLabel)}</div>

        <ExpertVerdict label={copy.emi.verdictLabel}>
          {copy.emi.verdict}
        </ExpertVerdict>
      </A4Page>

      <EngineeringBlueprint data={data} />
      <TitaniumLedger data={data} />
      <ImpactPage data={data} generationUnits={generationUnits} brand={brand} />
      <PaymentMilestonesPage
        data={data}
        milestones={paymentMilestones}
        paymentTerms={paymentTerms}
        brand={brand}
      />
      <TermsCompliancePage1 data={data} />
      <TermsCompliancePage2 data={data} />
      <ClosingPage data={data} />
    </div>
  );
}

export function LuxeNoirRenderer({ data }: LuxeNoirRendererProps) {
  const [lang, setLang] = useState<LuxeLang>("en");

  if (!data) {
    return <div className={styles.loading}>Loading Premium Luxe…</div>;
  }

  return (
    <LuxeLangProvider lang={lang} setLang={setLang}>
      <LuxeNoirDocument data={data} />
    </LuxeLangProvider>
  );
}

export default LuxeNoirRenderer;
