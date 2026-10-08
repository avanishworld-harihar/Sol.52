"use client";

import type { ProposalData } from "@/lib/proposal-data";
import styles from "./Sienna.module.css";
import { SiennaSheet } from "./sienna-brand";
import { useSiennaLang } from "./sienna-lang-context";

function auditInr(value: number): string {
  const rounded = Math.round(value || 0);
  const absolute = Math.abs(rounded).toLocaleString("en-IN");
  return rounded < 0 ? `−₹${absolute}` : `₹${absolute}`;
}

export function SiennaAudit({ data }: { data: ProposalData }) {
  const { copy } = useSiennaLang();
  const months = (data.bill.months ?? []).slice(0, 12);

  return (
    <SiennaSheet data={data} page="02 / 09" chapter={copy.spine.bill}>
      <p className={styles.kicker}>{copy.audit.kicker}</p>
      <h1 className={styles.displayTitle}>{copy.audit.title}</h1>
      <p className={styles.lead}>{copy.audit.lead}</p>

      <div className={styles.auditMetrics}>
        <article className={`${styles.auditMetric} ${styles.auditMetricWarn}`}>
          <strong>
            {data.bill.summerTrapPct > 0
              ? `+${Math.round(data.bill.summerTrapPct)}%`
              : "—"}
          </strong>
          <span>{copy.audit.summerIncrease}</span>
          <small>{copy.audit.summerHint}</small>
        </article>
        <article className={styles.auditMetric}>
          <strong>{data.bill.fixedChargesDisplay || "—"}</strong>
          <span>{copy.audit.fixedLiability}</span>
          <small>{copy.audit.fixedHint}</small>
        </article>
        <article className={`${styles.auditMetric} ${styles.auditMetricPositive}`}>
          <strong>
            {data.bill.solarSavingsPct > 0
              ? `${Math.round(data.bill.solarSavingsPct)}%`
              : "—"}
          </strong>
          <span>{copy.audit.solarSavings}</span>
          <small>{copy.audit.solarHint}</small>
        </article>
      </div>

      {months.length > 0 ? (
        <>
          <div className={styles.monthRail}>
            {months.map((month) => (
              <div key={month.label} className={styles.monthTick}>
                <div className={styles.monthStem}>
                  <div
                    className={`${styles.monthFill}${
                      month.isSummerPeak ? ` ${styles.monthFillPeak}` : ""
                    }`}
                    style={{
                      height: `${Math.max(8, month.barHeightPct)}%`,
                    }}
                  />
                </div>
                <span className={styles.monthLbl}>{month.label}</span>
              </div>
            ))}
          </div>

          <div className={styles.auditTableWrap}>
            <table className={styles.auditTable}>
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
                  <th>{copy.audit.month}</th>
                  <th>{copy.audit.units}</th>
                  <th>{copy.audit.energy}</th>
                  <th>{copy.audit.fixed}</th>
                  <th>{copy.audit.duty}</th>
                  <th>{copy.audit.netBill}</th>
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
                    <td className={month.isSummerPeak ? styles.auditNetPeak : undefined}>
                      {auditInr(month.netInr)}
                    </td>
                  </tr>
                ))}
                <tr className={styles.auditTotal}>
                  <td>{copy.audit.total}</td>
                  <td>{data.bill.totals.units.toLocaleString("en-IN")}</td>
                  <td>{auditInr(data.bill.totals.energyInr)}</td>
                  <td>{auditInr(data.bill.totals.fixedInr)}</td>
                  <td>{auditInr(data.bill.totals.dutyInr)}</td>
                  <td>{auditInr(data.bill.totals.netInr)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className={styles.auditFootnote}>{copy.audit.footnote}</p>
        </>
      ) : (
        <p className={styles.note}>{copy.audit.monthsEmpty}</p>
      )}
    </SiennaSheet>
  );
}

export default SiennaAudit;
