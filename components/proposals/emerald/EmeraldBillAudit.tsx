"use client";

/**
 * Emerald Signature — Tariff Anatomy (current grid vs post-solar savings).
 */

import type { ProposalData } from "@/lib/proposal-data";
import { formatInr } from "@/components/proposals/_shared/formatters";
import styles from "./Emerald.module.css";

export type EmeraldBillAuditProps = {
  data: ProposalData;
};

function dashOr(value: string, ok: boolean): string {
  return ok ? value : "—";
}

export function EmeraldBillAudit({ data }: EmeraldBillAuditProps) {
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
          <span className={styles.goldEyebrow}>SECTION FIVE</span>
          <h3 className={styles.sidebarTitle}>
            Energy
            <br />
            Audit.
          </h3>
          <p className={styles.sidebarBlurb}>
            A comprehensive analysis of your current utility liabilities versus
            post-solar independence.
          </p>
        </div>
      </div>

      <div className={styles.contentArea}>
        <h2 className={styles.pageHeader}>Tariff Anatomy</h2>

        <p className={styles.auditLead}>
          By shifting your primary energy reliance from the traditional grid to
          a localized solar architecture, we neutralize escalating tariff rates
          and establish a fixed, predictable energy economy for your estate.
        </p>

        <div className={styles.auditCard}>
          <h4 className={styles.auditHeader}>Current Grid Liability</h4>

          <div className={styles.auditRow}>
            <span className={styles.auditLabel}>Average Monthly Consumption</span>
            <span className={styles.auditValue}>
              {dashOr(`${avgUnits.toLocaleString("en-IN")} Units`, avgUnits > 0)}
            </span>
          </div>
          <div className={styles.auditRow}>
            <span className={styles.auditLabel}>
              Effective Blended Tariff (per Unit)
            </span>
            <span className={styles.auditValue}>
              {dashOr(`₹ ${tariff.toFixed(2)}`, tariff > 0)}
            </span>
          </div>
          <div className={styles.auditRow}>
            <span className={styles.auditLabel}>Estimated Current Monthly Bill</span>
            <span className={styles.auditValue}>
              {dashOr(formatInr(monthlyBill), monthlyBill > 0)}
            </span>
          </div>
          <div className={styles.auditRow}>
            <span className={styles.auditLabel}>Estimated Annual Grid Expense</span>
            <span className={`${styles.auditValue} ${styles.auditValueWarn}`}>
              {dashOr(formatInr(annualBill), annualBill > 0)}
            </span>
          </div>

          <div className={styles.auditHighlight}>
            <div>
              <span className={styles.auditHighlightKicker}>
                Post-Solar Projection
              </span>
              <span className={styles.auditHighlightTitle}>
                Estimated Monthly Savings
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
