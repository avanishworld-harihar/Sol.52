"use client";

/**
 * Quantum — Bill Audit page (bill-based proposals only).
 * Month-by-month units / energy / fixed / duty / net from live bill data.
 */

import type { ProposalData } from "@/lib/proposal-data";
import { QuantumAtmosphere } from "./QuantumAtmosphere";
import { QuantumGrowBar } from "./quantum-motion";
import { useQuantumLang } from "./quantum-lang-context";
import styles from "./Quantum.module.css";

function auditInr(value: number): string {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

export type QuantumBillAuditProps = {
  data: ProposalData;
};

export function QuantumBillAudit({ data }: QuantumBillAuditProps) {
  const { copy } = useQuantumLang();
  const c = copy.billAudit;
  const bill = data.bill;
  const rows = bill.months.slice(0, 12);
  const colCount = Math.max(rows.length, 1);
  const systemKw = Number(data.meta.systemKw) || 0;
  const monthlyAvg =
    rows.length > 0
      ? Math.round(
          rows.reduce((s, m) => s + (m.units || 0), 0) / Math.max(rows.length, 1)
        )
      : 0;

  return (
    <section className={`${styles.a4Page} ${styles.billAuditPage}`}>
      <QuantumAtmosphere variant="finance" />

      <div className={styles.pageStack}>
        <div className={styles.pageHeader}>
          <span
            className={styles.cyanText}
            style={{ fontSize: "0.75rem", letterSpacing: "3px" }}
          >
            {c.eyebrow}
          </span>
          <h2>{c.title}</h2>
        </div>

        <p className={styles.billAuditLead}>{c.lead}</p>

        <div className={styles.billAuditKpis}>
          <div className={`${styles.glass3D} ${styles.billAuditKpi}`}>
            <strong>
              {bill.summerTrapPct > 0
                ? `+${Math.round(bill.summerTrapPct)}%`
                : "—"}
            </strong>
            <span className={styles.label}>{c.summerIncrease}</span>
            <em>{c.summerHint}</em>
          </div>
          <div className={`${styles.glass3D} ${styles.billAuditKpi}`}>
            <strong>{bill.fixedChargesDisplay || "—"}</strong>
            <span className={styles.label}>{c.fixedLiability}</span>
            <em>{c.fixedHint}</em>
          </div>
          <div className={`${styles.glass3D} ${styles.billAuditKpi}`}>
            <strong>
              {bill.solarSavingsPct > 0
                ? `${Math.round(bill.solarSavingsPct)}%`
                : "—"}
            </strong>
            <span className={styles.label}>{c.solarSavings}</span>
            <em>{c.solarHint}</em>
          </div>
        </div>

        <div className={`${styles.glass3D} ${styles.billAuditChartCard}`}>
          <div
            className={styles.billAuditChart}
            role="img"
            aria-label={c.chartLabel}
            style={{
              gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
            }}
          >
            {rows.map((month, i) => (
              <div key={month.label} className={styles.billAuditBarCol}>
                <div className={styles.billAuditBarTrack}>
                  <QuantumGrowBar
                    className={`${styles.billAuditBar}${
                      month.isSummerPeak ? ` ${styles.billAuditBarPeak}` : ""
                    }`}
                    heightPct={Math.max(10, month.barHeightPct)}
                    delay={0.025 * i}
                  />
                </div>
                <span>{month.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`${styles.glass3D} ${styles.billAuditTableWrap}`}>
          <table className={styles.billAuditTable}>
            <thead>
              <tr>
                <th>{c.month}</th>
                <th>{c.units}</th>
                <th>{c.energy}</th>
                <th>{c.fixed}</th>
                <th>{c.duty}</th>
                <th>{c.netBill}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((month) => (
                <tr key={month.label}>
                  <td>
                    {month.label}
                    {month.isSummerPeak ? (
                      <em className={styles.billAuditPeak}> · {c.peak}</em>
                    ) : null}
                  </td>
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
                <td>{c.total}</td>
                <td>{bill.totals.units.toLocaleString("en-IN")}</td>
                <td>{auditInr(bill.totals.energyInr)}</td>
                <td>{auditInr(bill.totals.fixedInr)}</td>
                <td>{auditInr(bill.totals.dutyInr)}</td>
                <td>{auditInr(bill.totals.netInr)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className={styles.billAuditFoot}>{c.footnote}</p>

        <div className={`${styles.glass3D} ${styles.billAuditVerdict}`}>
          <span className={styles.label}>{c.verdictLabel}</span>
          <p>
            {monthlyAvg > 0 && systemKw > 0
              ? c.verdictWithData(
                  monthlyAvg.toLocaleString("en-IN"),
                  String(systemKw),
                  String(rows.length)
                )
              : c.verdictFallback}
          </p>
        </div>
      </div>
    </section>
  );
}

export default QuantumBillAudit;
