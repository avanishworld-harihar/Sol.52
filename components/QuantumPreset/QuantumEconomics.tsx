"use client";

/**
 * Quantum Economics — 3D glass Financial Yield Terminal (bento).
 */

import type { ProposalData } from "@/lib/proposal-data";
import {
  formatInr,
  formatInrCompact,
} from "@/components/proposals/_shared/formatters";
import {
  quantumDcAcRatio,
  quantumDcKwp,
  quantumModuleCount,
} from "./quantum-brand";
import { QuantumAtmosphere } from "./QuantumAtmosphere";
import styles from "./Quantum.module.css";

export type QuantumEconomicsProps = {
  data: ProposalData;
};

export function QuantumEconomics({ data }: QuantumEconomicsProps) {
  const eco = data.economics;
  const gross = eco.grossInr;
  const subsidy = eco.subsidyInr;
  const net = eco.netInr;
  const payback = eco.paybackYears;
  const monthly = eco.monthlySavingsInr;
  const annual =
    data.closing.annualSavingsInr > 0
      ? data.closing.annualSavingsInr
      : monthly > 0
        ? monthly * 12
        : 0;
  const lifetime =
    data.closing.lifetimeWealthInr || eco.lifetimeProfitInr;

  const systemKw = Number(data.meta.systemKw) || 3;
  const modules = quantumModuleCount(systemKw);
  const dcKwp = quantumDcKwp(modules);
  const dcAc = quantumDcAcRatio(dcKwp, systemKw);
  const dcAcLabel = dcAc > 0 ? `${dcAc.toFixed(2)}x` : "—";

  const paybackLabel =
    payback > 0
      ? `${payback.toFixed(payback % 1 ? 1 : 0)} Years`
      : "—";

  const code =
    (data.closing.installerName || data.meta.brandName || "SOLAR")
      .trim()
      .split(/\s+/)[0]
      ?.slice(0, 12)
      .toUpperCase() || "SOLAR";

  return (
    <section className={styles.a4Page}>
      <QuantumAtmosphere variant="finance" />

      <div className={styles.pageStack}>
      <div className={styles.pageHeader}>
        <span
          className={styles.cyanText}
          style={{ fontSize: "0.75rem", letterSpacing: "3px" }}
        >
          02 // COST &amp; SAVINGS
        </span>
        <h2>Your Investment.</h2>
      </div>

      <div className={styles.bentoGrid}>
        <div
          className={`${styles.glass3D} ${styles.bentoBoxHero} ${styles.span12}`}
        >
          <span className={styles.label}>Net amount you pay</span>
          <div className={styles.heroRow}>
            <span className={styles.heroOutlay}>
              {net > 0 ? formatInrCompact(net) : "—"}
            </span>
            <div className={styles.heroMetaPill}>
              <span className={styles.heroMeta}>Code: {code}</span>
            </div>
          </div>
        </div>

        <div className={`${styles.glass3D} ${styles.span6}`}>
          <span className={styles.label}>Price breakup</span>
          <table className={styles.dataTable}>
            <tbody>
              <tr>
                <td>Gross System Capex</td>
                <td>{gross > 0 ? formatInr(gross) : "—"}</td>
              </tr>
              <tr>
                <td>MNRE Subsidy (Estimated)</td>
                <td className={styles.okText}>
                  {subsidy > 0 ? `- ${formatInr(subsidy)}` : "—"}
                </td>
              </tr>
              <tr>
                <td>Net Metering &amp; DISCOM Fees</td>
                <td>Included</td>
              </tr>
              <tr>
                <td>5-Year AMC</td>
                <td>Included</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className={`${styles.glass3D} ${styles.span6}`}>
          <span className={styles.label}>Savings</span>
          <table className={styles.dataTable}>
            <tbody>
              <tr>
                <td>First Year Savings</td>
                <td>{annual > 0 ? formatInr(annual) : "—"}</td>
              </tr>
              <tr>
                <td>Monthly Bill Reduction</td>
                <td>{monthly > 0 ? formatInr(monthly) : "—"}</td>
              </tr>
              <tr>
                <td>Payback time</td>
                <td className={styles.accentText}>{paybackLabel}</td>
              </tr>
              <tr>
                <td>25-year total savings</td>
                <td className={styles.accentText}>
                  {lifetime > 0 ? formatInrCompact(lifetime) : "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className={`${styles.glass3D} ${styles.span3}`}>
          <span className={styles.label}>Maintenance</span>
          <span className={styles.valueMedium}>Zero</span>
          <span className={styles.subtext}>Operational Cost</span>
        </div>
        <div className={`${styles.glass3D} ${styles.span3}`}>
          <span className={styles.label}>Performance</span>
          <span className={styles.valueMedium}>25 Yrs</span>
          <span className={styles.subtext}>Linear Warranty</span>
        </div>
        <div className={`${styles.glass3D} ${styles.span3}`}>
          <span className={styles.label}>Grid Sync</span>
          <span className={styles.valueMedium}>Active</span>
          <span className={styles.subtext}>Net-Meter Ready</span>
        </div>
        <div className={`${styles.glass3D} ${styles.span3}`}>
          <span className={styles.label}>DC / AC</span>
          <span className={styles.valueMedium}>{dcAcLabel}</span>
          <span className={styles.subtext}>Array to inverter ratio</span>
        </div>
      </div>
      </div>
    </section>
  );
}

export default QuantumEconomics;
