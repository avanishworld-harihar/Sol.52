"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { DrawingSheet } from "./DrawingSheet";
import { GeneralNotes } from "./GeneralNotes";
import styles from "./Field.module.css";
import { fieldDrawingSheetProps } from "./field-live";

export function FinancialLedgerPage({
  data,
  proposalId,
}: {
  data: ProposalData;
  proposalId?: string;
}) {
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
  const payments = (data.execution.payments ?? []).filter((p) => p.label?.trim());

  const rupee = (n: number) => (n > 0 ? `₹${Math.round(n).toLocaleString("en-IN")}` : "—");

  return (
    <DrawingSheet
      {...fieldDrawingSheetProps({
        data,
        proposalId,
        dwgNo: "FE-06",
        sheetLabel: "FINANCIAL ENGINEERING LEDGER",
        page: 7,
      })}
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
              <td className={styles.mono}>−₹{Math.round(subsidy).toLocaleString("en-IN")}</td>
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
        Payback Calculation <span className={styles.tag}>D ÷ Annual Savings = Years</span>
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

      {payments.length > 0 ? (
        <>
          <h2 className={styles.h2} style={{ marginTop: "8mm" }}>
            Stage payments <span className={styles.tag}>on gross · cross-ref FE-08 / FE-09</span>
          </h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Milestone</th>
                <th>%</th>
                <th>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.label}>
                  <td>{p.label}</td>
                  <td className={styles.mono}>{p.pctLabel || "—"}</td>
                  <td className={styles.mono}>
                    {p.amountInr > 0 ? rupee(p.amountInr) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : null}

      <GeneralNotes
        extra={[
          "Stage payments stay on gross (A). Subsidy is credited later when on file.",
          "Acceptance on FE-09 references this ledger and the install sequence on FE-08.",
        ]}
      />
    </DrawingSheet>
  );
}

export default FinancialLedgerPage;
