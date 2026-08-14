"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { formatInr } from "@/components/proposals/_shared/formatters";
import { DrawingSheet } from "./DrawingSheet";
import styles from "./Field.module.css";
import { fieldDrawnBy, fieldSheetDate } from "./field-live";

export function FinancialLedgerPage({ data }: { data: ProposalData }) {
  const gross = data.economics.grossInr;
  const subsidy = data.economics.subsidyInr;
  const net = data.economics.netInr;
  const showSubsidy = subsidy > 0;
  const payback = data.economics.paybackYears;
  const monthly = data.economics.monthlySavingsInr;
  const lifetime =
    data.closing.lifetimeWealthInr > 0
      ? data.closing.lifetimeWealthInr
      : data.economics.lifetimeProfitInr;
  const emi = data.economics.emiRows ?? [];

  const rows: { ref: string; item: string; formula: string; value: string; emph?: boolean }[] = [
    {
      ref: "A",
      item: "System cost (turnkey)",
      formula: "Quoted",
      value: gross > 0 ? formatInr(gross) : "—",
    },
  ];
  if (showSubsidy) {
    rows.push({
      ref: "B",
      item: "Subsidy (credited later)",
      formula: "Record",
      value: formatInr(subsidy),
    });
    rows.push({
      ref: "C",
      item: "After subsidy",
      formula: "A − B",
      value: net > 0 ? formatInr(net) : "—",
      emph: true,
    });
  } else {
    rows.push({
      ref: "C",
      item: "Amount on this quote",
      formula: "A",
      value: gross > 0 ? formatInr(gross) : "—",
      emph: true,
    });
  }

  return (
    <DrawingSheet
      dwgNo="FE-06"
      sheetLabel="FINANCIAL ENGINEERING LEDGER"
      drawnBy={fieldDrawnBy(data)}
      date={fieldSheetDate(data.meta.generatedAt)}
    >
      <span className={styles.eyebrow}>Calculation sheet</span>
      <h2 className={styles.h2}>Investment ledger with working refs.</h2>
      <p className={styles.lede}>
        Stage payments stay on gross. Subsidy, when present, is credited later
        — it is not deducted from the payment schedule.
      </p>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Ref</th>
            <th>Line</th>
            <th>Basis</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.ref} className={row.emph ? styles.emphRow : undefined}>
              <td className={styles.ref}>{row.ref}</td>
              <td>{row.item}</td>
              <td>{row.formula}</td>
              <td>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={styles.specRow} style={{ marginTop: 14 }}>
        <div className={styles.specCard}>
          <span>Payback</span>
          <strong>{payback > 0 ? `${payback} yr` : "—"}</strong>
        </div>
        <div className={styles.specCard}>
          <span>Monthly saving</span>
          <strong>{monthly > 0 ? formatInr(monthly) : "—"}</strong>
        </div>
        <div className={styles.specCard}>
          <span>Lifetime benefit</span>
          <strong>{lifetime > 0 ? formatInr(lifetime) : "—"}</strong>
        </div>
        <div className={styles.specCard}>
          <span>Payments</span>
          <strong>GROSS</strong>
        </div>
      </div>

      {emi.length > 0 ? (
        <>
          <h2 className={styles.h2} style={{ marginTop: 14 }}>
            EMI cases
          </h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tenure</th>
                <th>Monthly EMI</th>
                <th>Interest</th>
              </tr>
            </thead>
            <tbody>
              {emi.slice(0, 4).map((row) => (
                <tr key={row.tenureLabel}>
                  <td>{row.tenureLabel || "—"}</td>
                  <td>{row.monthlyEmiInr > 0 ? formatInr(row.monthlyEmiInr) : "—"}</td>
                  <td>{row.interestPaidInr > 0 ? formatInr(row.interestPaidInr) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : null}

      <p className={styles.note}>
        Refs A / B / C are working labels on this sheet only. Subsidy is not
        split into central vs state unless those amounts exist on the proposal.
      </p>
    </DrawingSheet>
  );
}

export default FinancialLedgerPage;
