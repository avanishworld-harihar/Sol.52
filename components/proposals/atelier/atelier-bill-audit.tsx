/**
 * Bill audit — 12-month invoice breakdown (bill-based proposals).
 * Layout adapted from Canvas BillAudit; Atelier-local styles.
 */

import type { ProposalBillMonth } from "@/lib/proposal-data";
import styles from "./atelier.module.css";

export type AtelierBillAuditProps = {
  months: ProposalBillMonth[];
  totals: {
    units: number;
    energyInr: number;
    fixedInr: number;
    dutyInr: number;
    netInr: number;
  };
  summerTrapPct: number;
  fixedChargesDisplay: string;
  solarSavingsPct: number;
  labels: {
    summerIncrease: string;
    summerHint: string;
    fixedLiability: string;
    fixedHint: string;
    solarSavings: string;
    solarHint: string;
    month: string;
    units: string;
    energy: string;
    fixed: string;
    duty: string;
    netBill: string;
    total: string;
    footnote: string;
    chartLabel: string;
  };
};

function auditInr(value: number): string {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

export function AtelierBillAudit({
  months,
  totals,
  summerTrapPct,
  fixedChargesDisplay,
  solarSavingsPct,
  labels,
}: AtelierBillAuditProps) {
  const rows = months.slice(0, 12);

  return (
    <div className={styles.billAudit}>
      <div className={styles.billAuditMetrics}>
        <div className={`${styles.billAuditMetric} ${styles.billAuditMetricWarn}`}>
          <strong>
            {summerTrapPct > 0 ? `+${Math.round(summerTrapPct)}%` : "—"}
          </strong>
          <span>{labels.summerIncrease}</span>
          <small>{labels.summerHint}</small>
        </div>
        <div className={styles.billAuditMetric}>
          <strong>{fixedChargesDisplay || "—"}</strong>
          <span>{labels.fixedLiability}</span>
          <small>{labels.fixedHint}</small>
        </div>
        <div
          className={`${styles.billAuditMetric} ${styles.billAuditMetricPositive}`}
        >
          <strong>
            {solarSavingsPct > 0 ? `${Math.round(solarSavingsPct)}%` : "—"}
          </strong>
          <span>{labels.solarSavings}</span>
          <small>{labels.solarHint}</small>
        </div>
      </div>

      <div className={styles.billAuditChart} aria-label={labels.chartLabel}>
        {rows.map((month) => (
          <div key={month.label} className={styles.billAuditBarColumn}>
            <div
              className={`${styles.billAuditBar}${
                month.isSummerPeak ? ` ${styles.billAuditBarPeak}` : ""
              }`}
              style={{ height: `${Math.max(8, month.barHeightPct)}%` }}
            />
            <span>{month.label}</span>
          </div>
        ))}
      </div>

      <div className={styles.billAuditTableWrap}>
        <table className={styles.billAuditTable}>
          <thead>
            <tr>
              <th>{labels.month}</th>
              <th>{labels.units}</th>
              <th>{labels.energy}</th>
              <th>{labels.fixed}</th>
              <th>{labels.duty}</th>
              <th>{labels.netBill}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((month) => (
              <tr key={month.label}>
                <td>{month.label}</td>
                <td>{month.units.toLocaleString("en-IN")}</td>
                <td>{auditInr(month.energyInr)}</td>
                <td>{auditInr(month.fixedInr)}</td>
                <td>{auditInr(month.dutyInr)}</td>
                <td
                  className={
                    month.isSummerPeak ? styles.billAuditNetPeak : undefined
                  }
                >
                  {auditInr(month.netInr)}
                </td>
              </tr>
            ))}
            <tr className={styles.billAuditTotal}>
              <td>{labels.total}</td>
              <td>{totals.units.toLocaleString("en-IN")}</td>
              <td>{auditInr(totals.energyInr)}</td>
              <td>{auditInr(totals.fixedInr)}</td>
              <td>{auditInr(totals.dutyInr)}</td>
              <td>{auditInr(totals.netInr)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className={styles.billAuditFootnote}>{labels.footnote}</p>
    </div>
  );
}
