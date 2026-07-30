"use client";

/**
 * Quantum Economics — Financial Yield Terminal (glassmorphic trading look).
 */

import type { ProposalData } from "@/lib/proposal-data";
import {
  formatInr,
  formatInrCompact,
} from "@/components/proposals/_shared/formatters";
import { UltraGlassUI } from "./UltraGlassUI";
import styles from "./Quantum.module.css";

export type QuantumEconomicsProps = {
  data: ProposalData;
};

export function QuantumEconomics({ data }: QuantumEconomicsProps) {
  const eco = data.economics;
  const gross = eco.grossInr;
  const subsidy = eco.subsidyInr;
  const payback = eco.paybackYears;
  const lifetime =
    data.closing.lifetimeWealthInr || eco.lifetimeProfitInr;

  const paybackLabel =
    payback > 0
      ? `${payback.toFixed(payback % 1 ? 1 : 0)} Yrs`
      : "—";

  return (
    <section className={styles.a4Page}>
      <div className={styles.pageHeader}>
        <span
          className={styles.cyanText}
          style={{ letterSpacing: "3px", fontSize: "0.8rem" }}
        >
          02 // CAPITAL CLARITY
        </span>
        <h2>Financial Yield Terminal.</h2>
      </div>

      <div style={{ marginBottom: "28px" }}>
        <UltraGlassUI data={data} embed />
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          marginBottom: "28px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "12px 0",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <span className={styles.dataLabel}>GROSS CAPEX (PLANT + BOS)</span>
          <span style={{ fontSize: "1.35rem", color: "#F8FAFC" }}>
            {gross > 0 ? formatInr(gross) : "—"}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "12px 0",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <span className={styles.dataLabel}>ESTIMATED SUBSIDY (MNRE)</span>
          <span style={{ fontSize: "1.35rem", color: "#10B981" }}>
            {subsidy > 0 ? `- ${formatInr(subsidy)}` : "—"}
          </span>
        </div>
      </div>

      <div className={styles.grid2Col}>
        <div>
          <span className={styles.dataLabel}>CAPITAL RECOVERY</span>
          <span
            style={{
              fontSize: "2.2rem",
              fontWeight: 300,
              display: "block",
              color: "#F8FAFC",
            }}
          >
            {paybackLabel}
          </span>
        </div>
        <div>
          <span className={styles.dataLabel}>LIFETIME BENEFIT (25 YRS)</span>
          <span
            className={styles.cyanText}
            style={{ fontSize: "2.2rem", fontWeight: 300, display: "block" }}
          >
            {lifetime > 0 ? formatInrCompact(lifetime) : "—"}
          </span>
        </div>
      </div>
    </section>
  );
}

export default QuantumEconomics;
