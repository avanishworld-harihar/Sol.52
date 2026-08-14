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
import { useEmeraldLang } from "./emerald-lang-context";

export type EmeraldEconomicsProps = {
  data: ProposalData;
};

export function EmeraldEconomics({ data }: EmeraldEconomicsProps) {
  const { copy } = useEmeraldLang();
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
          <span className={styles.goldEyebrow}>{copy.econ.eyebrow}</span>
          <h3 className={styles.sidebarTitle}>
            {copy.econ.sidebarTitle[0]}
            <br />
            {copy.econ.sidebarTitle[1]}
          </h3>
          <p className={styles.sidebarBlurb}>{copy.econ.sidebarBlurb}</p>
        </div>
      </div>

      <div className={styles.contentArea}>
        <h2 className={styles.pageHeader}>{copy.econ.pageHeader}</h2>

        <div className={styles.ledgerBond}>
          <div className={styles.bondHeader}>
            <span className={styles.bondTitle}>{copy.econ.netCost}</span>
            <span className={styles.bondCode}>{copy.econ.breakdown}</span>
          </div>

          <div className={styles.bondMath}>
            <div className={styles.mathBlock}>
              <span className={styles.mathLabel}>{copy.econ.gross}</span>
              <span className={styles.mathValue}>
                {gross > 0 ? formatInrCompact(gross) : "—"}
              </span>
            </div>
            <span className={styles.mathOperator}>-</span>
            <div className={styles.mathBlock}>
              <span className={styles.mathLabel}>{copy.econ.subsidy}</span>
              <span className={`${styles.mathValue} ${styles.mathValueSubsidy}`}>
                {subsidy > 0 ? formatInrCompact(subsidy) : "—"}
              </span>
            </div>
            <span className={styles.mathOperator}>=</span>
            <div className={styles.mathBlock}>
              <span className={styles.mathLabel}>{copy.econ.youPay}</span>
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
              {copy.econ.lifetime}
            </span>
            <span className={styles.econMetricValue}>
              {lifetime > 0 ? formatLifetimeBenefitInr(lifetime) : "—"}
            </span>
            <span className={styles.econMetricHint}>{copy.econ.lifetimeHint}</span>
          </div>

          <div className={styles.econMetric}>
            <span className={styles.econRule} />
            <span
              className={styles.goldEyebrow}
              style={{ marginBottom: "5px" }}
            >
              {copy.econ.payback}
            </span>
            <span className={styles.econMetricValue}>
              {payback > 0
                ? `${payback.toFixed(1)} ${copy.common.years}`
                : "—"}
            </span>
            <span className={styles.econMetricHint}>{copy.econ.paybackHint}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default EmeraldEconomics;
