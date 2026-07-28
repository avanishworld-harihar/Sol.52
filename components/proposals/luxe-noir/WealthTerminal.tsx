"use client";

/**
 * Premium Luxe — Wealth Terminal (Page 03).
 * Neon financial waterfall: gross − subsidy = net.
 */

import type { ProposalData } from "@/lib/proposal-data";
import { formatInr } from "@/components/proposals/_shared/formatters";
import { luxeDisplayFont } from "./luxe-fonts";
import styles from "./luxe.module.css";

export type WealthTerminalProps = {
  data: ProposalData;
};

export function WealthTerminal({ data }: WealthTerminalProps) {
  const gross = data.economics.grossInr;
  const subsidy = data.economics.subsidyInr;
  const net = data.economics.netInr;
  const savingsAnnual =
    data.closing.annualSavingsInr > 0
      ? data.closing.annualSavingsInr
      : data.economics.monthlySavingsInr * 12;
  const payback = data.economics.paybackYears;

  return (
    <section
      className={`${styles.a4Page} ${styles.luxeTerminal} ${luxeDisplayFont.variable}`}
    >
      <div className={styles.pageHeader}>
        <span className={styles.goldEyebrow}>CAPITAL CLARITY</span>
        <h2 className={styles.pageTitle}>Transparent Economics.</h2>
      </div>

      {/* The Neon Financial Waterfall */}
      <div className={styles.waterfallContainer}>
        <div className={styles.waterfallStep}>
          <span>GROSS SYSTEM CAPEX</span>
          <strong>{gross > 0 ? formatInr(gross) : "—"}</strong>
        </div>
        <div className={styles.waterfallMinus}>-</div>
        <div className={styles.waterfallStep}>
          <span className={styles.subsidyText}>GOVERNMENT SUBSIDY</span>
          <strong className={styles.subsidyText}>
            {subsidy > 0 ? formatInr(subsidy) : "—"}
          </strong>
        </div>
        <div className={styles.waterfallEquals}>=</div>
        <div className={styles.waterfallFinal}>
          <span>YOUR NET INVESTMENT</span>
          <strong>{net > 0 ? formatInr(net) : "—"}</strong>
        </div>
      </div>

      {/* Terminal Metrics */}
      <div className={styles.terminalMetrics}>
        <div className={styles.metricBlock}>
          <span className={styles.metricLabel}>ANNUAL YIELD VALUE</span>
          <span className={styles.metricBig}>
            {savingsAnnual > 0 ? formatInr(savingsAnnual) : "—"}
          </span>
          <span className={styles.metricSub}>Year 1 Bill Reduction</span>
        </div>
        <div className={styles.metricBlock}>
          <span className={styles.metricLabel}>CAPITAL RECOVERY</span>
          <span className={styles.metricBig}>
            {payback > 0 ? `${payback.toFixed(1)} Yrs` : "—"}
          </span>
          <span className={styles.metricSub}>Guaranteed Payback</span>
        </div>
      </div>
    </section>
  );
}

export default WealthTerminal;
