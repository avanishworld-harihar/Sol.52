"use client";

/**
 * Emerald Signature — Tariff Anatomy (current grid vs post-solar savings).
 */

import type { ProposalData } from "@/lib/proposal-data";
import { formatInr } from "@/components/proposals/_shared/formatters";
import { useEmeraldLang } from "./emerald-lang-context";
import styles from "./Emerald.module.css";

export type EmeraldBillAuditProps = {
  data: ProposalData;
};

function dashOr(value: string, ok: boolean): string {
  return ok ? value : "—";
}

export function EmeraldBillAudit({ data }: EmeraldBillAuditProps) {
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
  const monthlyBill =
    billTotal > 0 ? Math.round(billTotal / monthCount) : 0;
  const tariff =
    avgUnits > 0 && monthlyBill > 0 ? monthlyBill / avgUnits : 0;
  const annualBill = yearlyFromLedger
    ? Math.round(billTotal)
    : monthlyBill > 0
      ? monthlyBill * 12
      : 0;
  const monthlySavings = data.economics.monthlySavingsInr;

  return (
    <section className={styles.a4Page}>
      <div className={styles.sidebar}>
        <span className={styles.folioNum}>06</span>
        <div>
          <span className={styles.goldEyebrow}>{copy.bill.eyebrow}</span>
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
              {monthlySavings > 0
                ? `+${formatInr(monthlySavings)}`
                : "—"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default EmeraldBillAudit;
