"use client";

/**
 * Premium Luxe — Bill Audit (Page 02, bill-based proposals only).
 * Month-by-month units / energy / fixed / duty / net — Atelier-inspired layout,
 * Luxe-local styles (does not import Atelier).
 */

import type { ProposalData } from "@/lib/proposal-data";
import type { PremiumProposalPptInput } from "@/lib/proposal-ppt";
import { useLuxeLang } from "./luxe-lang-context";
import { luxeDisplayFont } from "./luxe-fonts";
import { LuxeHeaderBrand, LuxePageFooter } from "./luxe-brand";
import { ExpertVerdict } from "./ExpertVerdict";
import styles from "./luxe.module.css";

export type BillAuditPageProps = {
  data: ProposalData;
  pptInput?: PremiumProposalPptInput | null;
};

function auditInr(value: number): string {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

export function BillAuditPage({ data }: BillAuditPageProps) {
  const { copy } = useLuxeLang();
  const bill = data.bill;
  const rows = bill.months.slice(0, 12);
  const colCount = Math.max(rows.length, 1);
  const c = copy.billAudit;
  const systemKw = Number(data.meta.systemKw) || 0;
  const monthlyAvg =
    rows.length > 0
      ? Math.round(
          rows.reduce((s, m) => s + (m.units || 0), 0) / Math.max(rows.length, 1)
        )
      : 0;

  return (
    <section
      className={`${styles.a4Page} ${styles.billAuditPage} ${luxeDisplayFont.variable}`}
    >
      <header className={styles.luxeHeaderBlock}>
        <div className={styles.luxeHeaderRow}>
          <div className={styles.luxeHeaderCopy}>
            <span className={styles.goldTag}>{c.tag}</span>
            <h2 className={styles.luxeHeadline}>{c.title}</h2>
          </div>
          <LuxeHeaderBrand />
        </div>
        <p className={styles.billAuditLead}>{c.lead}</p>
      </header>

      <div className={styles.billAudit}>
        <div className={styles.billAuditMetrics}>
          <div
            className={`${styles.billAuditMetric} ${styles.billAuditMetricWarn}`}
          >
            <strong className={styles.luxeNum}>
              {bill.summerTrapPct > 0
                ? `+${Math.round(bill.summerTrapPct)}%`
                : "—"}
            </strong>
            <span>{c.summerIncrease}</span>
            <small>{c.summerHint}</small>
          </div>
          <div className={styles.billAuditMetric}>
            <strong className={styles.luxeNum}>
              {bill.fixedChargesDisplay || "—"}
            </strong>
            <span>{c.fixedLiability}</span>
            <small>{c.fixedHint}</small>
          </div>
          <div
            className={`${styles.billAuditMetric} ${styles.billAuditMetricPositive}`}
          >
            <strong className={styles.luxeNum}>
              {bill.solarSavingsPct > 0
                ? `${Math.round(bill.solarSavingsPct)}%`
                : "—"}
            </strong>
            <span>{c.solarSavings}</span>
            <small>{c.solarHint}</small>
          </div>
        </div>

        <div
          className={styles.billAuditChart}
          aria-label={c.chartLabel}
          style={{
            gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
          }}
        >
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
            <colgroup>
              <col style={{ width: "17%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "17.5%" }} />
              <col style={{ width: "17.5%" }} />
              <col style={{ width: "17.5%" }} />
              <col style={{ width: "17.5%" }} />
            </colgroup>
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
                      <em className={styles.billAuditPeakMark}> · {c.peak}</em>
                    ) : null}
                  </td>
                  <td className={styles.luxeNum}>
                    {month.units.toLocaleString("en-IN")}
                  </td>
                  <td className={styles.luxeNum}>
                    {auditInr(month.energyInr)}
                  </td>
                  <td className={styles.luxeNum}>
                    {auditInr(month.fixedInr)}
                  </td>
                  <td className={styles.luxeNum}>{auditInr(month.dutyInr)}</td>
                  <td
                    className={`${styles.luxeNum}${
                      month.isSummerPeak
                        ? ` ${styles.billAuditNetPeak}`
                        : ""
                    }`}
                  >
                    {auditInr(month.netInr)}
                  </td>
                </tr>
              ))}
              <tr className={styles.billAuditTotal}>
                <td>{c.total}</td>
                <td className={styles.luxeNum}>
                  {bill.totals.units.toLocaleString("en-IN")}
                </td>
                <td className={styles.luxeNum}>
                  {auditInr(bill.totals.energyInr)}
                </td>
                <td className={styles.luxeNum}>
                  {auditInr(bill.totals.fixedInr)}
                </td>
                <td className={styles.luxeNum}>
                  {auditInr(bill.totals.dutyInr)}
                </td>
                <td className={styles.luxeNum}>
                  {auditInr(bill.totals.netInr)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className={styles.billAuditFootnote}>{c.footnote}</p>
      </div>

      <ExpertVerdict label={c.verdictLabel}>
        {monthlyAvg > 0 && systemKw > 0
          ? c.verdictWithData(
              monthlyAvg.toLocaleString("en-IN"),
              String(systemKw),
              String(rows.length)
            )
          : c.verdictFallback}
      </ExpertVerdict>

      <LuxePageFooter pageLabel="02 / 12" />
    </section>
  );
}

export default BillAuditPage;
