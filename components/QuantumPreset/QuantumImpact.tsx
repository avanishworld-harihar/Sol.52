"use client";

/**
 * Quantum Impact — Biosphere Dividend with central emerald radar HUD.
 */

import type { ProposalData } from "@/lib/proposal-data";
import { QUANTUM_SPECIFIC_YIELD } from "./quantum-brand";
import styles from "./Quantum.module.css";

export type QuantumImpactProps = {
  data: ProposalData;
};

function formatTrees(n: number): string {
  if (!(n > 0)) return "—";
  if (n >= 1000) {
    const k = n / 1000;
    return `${Number.isInteger(k) ? k : k.toFixed(1)}k+`;
  }
  return Math.round(n).toLocaleString("en-IN");
}

export function QuantumImpact({ data }: QuantumImpactProps) {
  const co2 = data.impact.co2Tons > 0 ? data.impact.co2Tons : 0;
  const trees = data.impact.treesEquivalent > 0 ? data.impact.treesEquivalent : 0;
  const systemKw = Number(data.meta.systemKw) || 3;
  const annualUnits =
    data.closing.annualUnits > 0
      ? data.closing.annualUnits
      : Math.round(systemKw * QUANTUM_SPECIFIC_YIELD);

  const co2Label =
    co2 > 0
      ? co2 >= 10
        ? String(Math.round(co2))
        : co2.toFixed(1)
      : "—";

  return (
    <section className={`${styles.a4Page} ${styles.impactPage}`}>
      <div className={styles.impactRadar} aria-hidden>
        <svg width="700" height="700" viewBox="0 0 700 700" fill="none">
          <circle
            cx="350"
            cy="350"
            r="300"
            stroke="#10B981"
            strokeWidth="1"
            strokeDasharray="5 15"
          />
          <circle cx="350" cy="350" r="220" stroke="#10B981" strokeWidth="2" />
          <circle cx="350" cy="350" r="140" stroke="#10B981" strokeWidth="1" />
          <path
            d="M350 0 V700 M0 350 H700"
            stroke="#10B981"
            strokeWidth="1"
            strokeOpacity="0.5"
          />
          <circle
            cx="350"
            cy="350"
            r="70"
            fill="rgba(16,185,129,0.08)"
            stroke="#10B981"
            strokeWidth="1"
            strokeOpacity="0.35"
          />
        </svg>
      </div>

      <div className={styles.impactIntro}>
        <span className={styles.impactEyebrow}>04 // Biosphere Dividend</span>
        <h2 className={styles.impactTitle}>Ecological Impact.</h2>
        <p className={styles.impactLead}>
          Every kilowatt-hour displaced from the grid is a tonne of carbon that
          never reaches the atmosphere.
        </p>
      </div>

      <div className={styles.impactMetrics}>
        <div className={`${styles.glass3D} ${styles.impactCard}`}>
          <span className={styles.impactNum}>{co2Label}</span>
          <span className={styles.impactMetricLabel}>Tonnes CO₂ Avoided</span>
          <span className={styles.impactMetricSub}>Lifetime Estimate</span>
        </div>
        <div className={`${styles.glass3D} ${styles.impactCard}`}>
          <span className={styles.impactNum}>{formatTrees(trees)}</span>
          <span className={styles.impactMetricLabel}>Trees Equivalent</span>
          <span className={styles.impactMetricSub}>Mature Absorption Parity</span>
        </div>
      </div>

      <div className={styles.impactFooterPill}>
        Clean Energy Generation: ~
        {annualUnits > 0 ? annualUnits.toLocaleString("en-IN") : "—"} Units /
        Year
      </div>
    </section>
  );
}

export default QuantumImpact;
