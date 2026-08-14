"use client";

/**
 * Emerald Signature — Capital Ledger (bank-bond economics, no tables).
 */

import type { ProposalData } from "@/lib/proposal-data";
import {
  formatInrCompact,
  formatLifetimeBenefitInr,
} from "@/components/proposals/_shared/formatters";
import styles from "./Emerald.module.css";

export type EmeraldEconomicsProps = {
  data: ProposalData;
};

export function EmeraldEconomics({ data }: EmeraldEconomicsProps) {
  const gross = data.economics.grossInr;
  const subsidy = data.economics.subsidyInr;
  const net = data.economics.netInr;
  const lifetime =
    data.closing.lifetimeWealthInr > 0
      ? data.closing.lifetimeWealthInr
      : data.economics.lifetimeProfitInr;
  const payback = data.economics.paybackYears;

  return (
    <section className={styles.a4Page}>
      <div className={styles.sidebar}>
        <span className={styles.folioNum}>02</span>
        <div>
          <span className={styles.goldEyebrow}>SECTION TWO</span>
          <h3 className={styles.sidebarTitle}>
            Project
            <br />
            Cost.
          </h3>
          <p className={styles.sidebarBlurb}>
            Clear project cost, subsidy, and savings over 25 years.
          </p>
        </div>
      </div>

      <div className={styles.contentArea}>
        <h2 className={styles.pageHeader}>Investment Summary</h2>

        <div className={styles.ledgerBond}>
          <div className={styles.bondHeader}>
            <span className={styles.bondTitle}>Your Net Cost</span>
            <span className={styles.bondCode}>COST BREAKDOWN</span>
          </div>

          <div className={styles.bondMath}>
            <div className={styles.mathBlock}>
              <span className={styles.mathLabel}>Gross system cost</span>
              <span className={styles.mathValue}>
                {gross > 0 ? formatInrCompact(gross) : "—"}
              </span>
            </div>
            <span className={styles.mathOperator}>-</span>
            <div className={styles.mathBlock}>
              <span className={styles.mathLabel}>MNRE Subsidy</span>
              <span className={`${styles.mathValue} ${styles.mathValueSubsidy}`}>
                {subsidy > 0 ? formatInrCompact(subsidy) : "—"}
              </span>
            </div>
            <span className={styles.mathOperator}>=</span>
            <div className={styles.mathBlock}>
              <span className={styles.mathLabel}>You pay</span>
              <span className={`${styles.mathValue} ${styles.mathValueNet}`}>
                {net > 0 ? formatInrCompact(net) : "—"}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.econMetricRow}>
          <div className={styles.econMetric}>
            <span className={styles.econRule} />
            <span
              className={styles.goldEyebrow}
              style={{ marginBottom: "5px" }}
            >
              LIFETIME SAVINGS
            </span>
            <span className={styles.econMetricValue}>
              {lifetime > 0 ? formatLifetimeBenefitInr(lifetime) : "—"}
            </span>
            <span className={styles.econMetricHint}>
              Total savings over 25 years
            </span>
          </div>

          <div className={styles.econMetric}>
            <span className={styles.econRule} />
            <span
              className={styles.goldEyebrow}
              style={{ marginBottom: "5px" }}
            >
              PAYBACK
            </span>
            <span className={styles.econMetricValue}>
              {payback > 0 ? `${payback.toFixed(1)} Yrs` : "—"}
            </span>
            <span className={styles.econMetricHint}>Estimated payback time</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default EmeraldEconomics;
