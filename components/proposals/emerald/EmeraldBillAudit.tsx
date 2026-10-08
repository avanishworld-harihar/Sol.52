"use client";

/**
 * Emerald Signature — 12-month electricity-bill audit.
 * Preset-local implementation; intentionally does not depend on Golden styles.
 */

import type { ProposalData } from "@/lib/proposal-data";
import { useEmeraldLang } from "./emerald-lang-context";
import styles from "./Emerald.module.css";

export type EmeraldBillAuditProps = {
  data: ProposalData;
  folio: string;
};

function auditInr(value: number): string {
  const rounded = Math.round(value || 0);
  const absolute = Math.abs(rounded).toLocaleString("en-IN");
  return rounded < 0 ? `−₹${absolute}` : `₹${absolute}`;
}

export function EmeraldBillAudit({ data, folio }: EmeraldBillAuditProps) {
  const { copy } = useEmeraldLang();
  const months = (data.bill.months ?? []).slice(0, 12);

  return (
    <section className={styles.a4Page}>
      <div className={styles.sidebar}>
        <span className={styles.folioNum}>{folio}</span>
        <div>
          <span className={styles.goldEyebrow}>{copy.common.section(folio)}</span>
          <h3 className={styles.sidebarTitle}>
            {copy.bill.sidebarTitle[0]}
            <br />
            {copy.bill.sidebarTitle[1]}
          </h3>
          <p className={styles.sidebarBlurb}>{copy.bill.sidebarBlurb}</p>
        </div>
      </div>

      <div className={styles.contentArea}>
        <h2 className={styles.pageHeader}>{copy.bill.pageHeader}</h2>

        <p className={styles.auditLead}>{copy.bill.lead}</p>

        {months.length > 0 ? (
          <div
            className={styles.billChart}
            role="img"
            aria-label={copy.bill.monthUse}
            style={{
              gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))`,
            }}
          >
            {months.map((month) => (
              <div key={month.label} className={styles.billBarCol}>
                <div className={styles.billBarTrack}>
                  <div
                    className={`${styles.billBarFill}${
                      month.isSummerPeak ? ` ${styles.billBarPeak}` : ""
                    }`}
                    style={{
                      height: `${Math.max(8, month.barHeightPct)}%`,
                    }}
                  />
                </div>
                <span className={styles.billBarLabel}>{month.label}</span>
              </div>
            ))}
          </div>
        ) : null}

        <div className={styles.billAuditMetrics}>
          <article className={`${styles.billAuditMetric} ${styles.billAuditMetricWarn}`}>
            <strong>
              {data.bill.summerTrapPct > 0
                ? `+${Math.round(data.bill.summerTrapPct)}%`
                : "—"}
            </strong>
            <span>{copy.bill.summerIncrease}</span>
            <small>{copy.bill.summerHint}</small>
          </article>
          <article className={styles.billAuditMetric}>
            <strong>{data.bill.fixedChargesDisplay || "—"}</strong>
            <span>{copy.bill.fixedLiability}</span>
            <small>{copy.bill.fixedHint}</small>
          </article>
          <article className={`${styles.billAuditMetric} ${styles.billAuditMetricPositive}`}>
            <strong>
              {data.bill.solarSavingsPct > 0
                ? `${Math.round(data.bill.solarSavingsPct)}%`
                : "—"}
            </strong>
            <span>{copy.bill.solarSavings}</span>
            <small>{copy.bill.solarHint}</small>
          </article>
        </div>

        <div className={styles.billAuditTableWrap}>
          <table className={styles.billAuditTable}>
            <colgroup>
              <col style={{ width: "16%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "17%" }} />
              <col style={{ width: "17%" }} />
              <col style={{ width: "19%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>{copy.bill.month}</th>
                <th>{copy.bill.units}</th>
                <th>{copy.bill.energy}</th>
                <th>{copy.bill.fixed}</th>
                <th>{copy.bill.duty}</th>
                <th>{copy.bill.netBill}</th>
              </tr>
            </thead>
            <tbody>
              {months.map((month) => (
                <tr key={month.label}>
                  <td>{month.label}</td>
                  <td>{month.units.toLocaleString("en-IN")}</td>
                  <td>{auditInr(month.energyInr)}</td>
                  <td>{auditInr(month.fixedInr)}</td>
                  <td>{auditInr(month.dutyInr)}</td>
                  <td className={month.isSummerPeak ? styles.billAuditNetPeak : undefined}>
                    {auditInr(month.netInr)}
                  </td>
                </tr>
              ))}
              <tr className={styles.billAuditTotal}>
                <td>{copy.bill.total}</td>
                <td>{data.bill.totals.units.toLocaleString("en-IN")}</td>
                <td>{auditInr(data.bill.totals.energyInr)}</td>
                <td>{auditInr(data.bill.totals.fixedInr)}</td>
                <td>{auditInr(data.bill.totals.dutyInr)}</td>
                <td>{auditInr(data.bill.totals.netInr)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className={styles.billAuditFootnote}>{copy.bill.footnote}</p>
      </div>
    </section>
  );
}

export default EmeraldBillAudit;
