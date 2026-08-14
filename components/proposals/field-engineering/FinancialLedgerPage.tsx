"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { DrawingSheet } from "./DrawingSheet";
import styles from "./Field.module.css";
import { fieldSheetMeta } from "./field-live";

export function FinancialLedgerPage({ data }: { data: ProposalData }) {
  const sheet = fieldSheetMeta(data);
  const gross = data.economics.grossInr;
  const subsidy = data.economics.subsidyInr;
  const net = data.economics.netInr;
  const showSubsidy = subsidy > 0;
  const payback = data.economics.paybackYears;
  const annualSavings = data.closing.annualSavingsInr || data.economics.monthlySavingsInr * 12;
  const lifetime =
    data.closing.lifetimeWealthInr > 0
      ? data.closing.lifetimeWealthInr
      : data.economics.lifetimeProfitInr;

  const rupee = (n: number) => (n > 0 ? `₹${Math.round(n).toLocaleString("en-IN")}` : "—");

  return (
    <DrawingSheet
      dwgNo="FE-06"
      sheetLabel="FINANCIAL ENGINEERING LEDGER"
      pageOf="06 / 09"
      familyName={sheet.familyName}
      scale="—"
      date={sheet.date}
      preparedBy={sheet.preparedBy}
    >
      <div className={styles.eyebrow}>Investment Calculation</div>
      <h2 className={styles.h2}>
        Net Investment{" "}
        <span className={styles.tag}>{showSubsidy ? "A − B = D" : "A = D"}</span>
      </h2>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Line Item</th>
            <th>Ref.</th>
            <th>Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>System Cost (Turnkey)</td>
            <td className={`${styles.mono} ${styles.note}`}>A</td>
            <td className={styles.mono}>{rupee(gross)}</td>
          </tr>
          {showSubsidy ? (
            <tr>
              <td>Subsidy (credited later)</td>
              <td className={`${styles.mono} ${styles.note}`}>B</td>
              <td className={styles.mono}>
                −₹{Math.round(subsidy).toLocaleString("en-IN")}
              </td>
            </tr>
          ) : null}
          <tr className={styles.totalRow}>
            <td>Net Investment</td>
            <td className={`${styles.mono} ${styles.note}`}>D</td>
            <td className={`${styles.mono} ${styles.signal}`}>
              {showSubsidy ? rupee(net) : rupee(gross)}
            </td>
          </tr>
        </tbody>
      </table>

      <h2 className={styles.h2} style={{ marginTop: "10mm" }}>
        Payback Calculation <span className={styles.tag}>D ÷ annual savings = years</span>
      </h2>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Est. Annual Bill Savings</td>
            <td className={styles.mono}>{rupee(annualSavings)}</td>
          </tr>
          <tr>
            <td>Simple Payback Period</td>
            <td className={`${styles.mono} ${styles.signal}`}>
              {payback > 0 ? `${payback} years` : "—"}
            </td>
          </tr>
          <tr>
            <td>25-Year Cumulative Savings (est.)</td>
            <td className={styles.mono}>{rupee(lifetime)}</td>
          </tr>
        </tbody>
      </table>

      <p className={styles.note} style={{ marginTop: "6mm" }}>
        Stage payments stay on gross (A). Subsidy, when present, is credited later
        and is not split into central vs state unless those amounts exist on this
        proposal. Tariff is not invented.
      </p>
    </DrawingSheet>
  );
}

export default FinancialLedgerPage;
