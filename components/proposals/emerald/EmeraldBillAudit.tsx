"use client";

/**
 * Emerald Signature — current grid bill vs post-solar savings.
 * Rendered only when the proposal has live bill data.
 */

import type { ProposalData } from "@/lib/proposal-data";
import { formatInr } from "@/components/proposals/_shared/formatters";
import { useEmeraldLang } from "./emerald-lang-context";
import styles from "./Emerald.module.css";

export type EmeraldBillAuditProps = {
  data: ProposalData;
  folio: string;
};

function dashOr(value: string, ok: boolean): string {
  return ok ? value : "—";
}

export function EmeraldBillAudit({ data, folio }: EmeraldBillAuditProps) {
  const { copy } = useEmeraldLang();
  const months = (data.bill.months ?? []).filter(
    (m) => m.units > 0 || m.netInr > 0
  );
  const unitsFromMonths = months.reduce((s, m) => s + (m.units || 0), 0);
  const unitsTotal =
    unitsFromMonths > 0 ? unitsFromMonths : data.bill.totals?.units || 0;
  const yearlyFromLedger = data.bill.yearlyBillInr > 0;
  const billTotal = yearlyFromLedger
    ? data.bill.yearlyBillInr
    : months.reduce((s, m) => s + (m.netInr || 0), 0) ||
      data.bill.totals?.netInr ||
      0;
  const monthCount = Math.max(months.length, yearlyFromLedger ? 12 : 1);
  const avgUnits =
    unitsTotal > 0
      ? Math.round(unitsTotal / (months.length > 0 ? months.length : 12))
      : 0;
  const monthlyBill = billTotal > 0 ? Math.round(billTotal / monthCount) : 0;
  const tariff = avgUnits > 0 && monthlyBill > 0 ? monthlyBill / avgUnits : 0;
  const annualBill = yearlyFromLedger
    ? Math.round(billTotal)
    : monthlyBill > 0
      ? monthlyBill * 12
      : 0;
  const monthlySavings = data.economics.monthlySavingsInr;
  const maxBar = Math.max(...months.map((m) => m.barHeightPct || 0), 1);

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
                      height: `${Math.max(8, Math.round((month.barHeightPct / maxBar) * 100))}%`,
                    }}
                  />
                </div>
                <span className={styles.billBarLabel}>{month.label}</span>
              </div>
            ))}
          </div>
        ) : null}

        <div className={styles.auditCard}>
          <h4 className={styles.auditHeader}>{copy.bill.currentCost}</h4>

          <div className={styles.auditRow}>
            <span className={styles.auditLabel}>{copy.bill.avgUse}</span>
            <span className={styles.auditValue}>
              {dashOr(
                copy.bill.unitsWord(avgUnits.toLocaleString("en-IN")),
                avgUnits > 0
              )}
            </span>
          </div>
          <div className={styles.auditRow}>
            <span className={styles.auditLabel}>{copy.bill.avgRate}</span>
            <span className={styles.auditValue}>
              {dashOr(`₹ ${tariff.toFixed(2)}`, tariff > 0)}
            </span>
          </div>
          <div className={styles.auditRow}>
            <span className={styles.auditLabel}>{copy.bill.monthlyBill}</span>
            <span className={styles.auditValue}>
              {dashOr(formatInr(monthlyBill), monthlyBill > 0)}
            </span>
          </div>
          <div className={styles.auditRow}>
            <span className={styles.auditLabel}>{copy.bill.yearlyBill}</span>
            <span className={`${styles.auditValue} ${styles.auditValueWarn}`}>
              {dashOr(formatInr(annualBill), annualBill > 0)}
            </span>
          </div>

          <div className={styles.auditHighlight}>
            <div>
              <span className={styles.auditHighlightKicker}>
                {copy.bill.afterSolar}
              </span>
              <span className={styles.auditHighlightTitle}>
                {copy.bill.monthlySavings}
              </span>
            </div>
            <span className={styles.auditHighlightValue}>
              {monthlySavings > 0 ? `+${formatInr(monthlySavings)}` : "—"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default EmeraldBillAudit;
