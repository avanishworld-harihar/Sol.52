"use client";

/**
 * Emerald Signature — Biosphere Dividend (dark emerald data monolith).
 */

import type { ProposalData } from "@/lib/proposal-data";
import { EMERALD_SPECIFIC_YIELD } from "./emerald-brand";
import styles from "./Emerald.module.css";

export type EmeraldImpactProps = {
  data: ProposalData;
};

export function EmeraldImpact({ data }: EmeraldImpactProps) {
  const co2 = Number(data.impact.co2Tons) || 0;
  const trees = Math.round(Number(data.impact.treesEquivalent) || 0);
  const systemKw = Number(data.meta.systemKw) || 0;
  const annualUnits =
    data.closing.annualUnits > 0
      ? Math.round(data.closing.annualUnits)
      : systemKw > 0
        ? Math.round(systemKw * EMERALD_SPECIFIC_YIELD)
        : 0;
  const co2Label = co2 > 0 ? co2.toFixed(1) : "—";

  return (
    <section className={styles.a4Page}>
      <div className={styles.sidebar}>
        <span className={styles.folioNum}>04</span>
        <div>
          <span className={styles.goldEyebrow}>SECTION FOUR</span>
          <h3 className={styles.sidebarTitle}>
            Green
            <br />
            Impact.
          </h3>
          <p className={styles.sidebarBlurb}>
            How this system helps the environment.
          </p>
        </div>
      </div>

      <div className={styles.contentArea}>
        <h2 className={styles.pageHeader}>Environmental Impact</h2>

        <div className={styles.monolithCard}>
          <div className={styles.monolithStat}>
            <span className={styles.monolithValue}>
              {co2Label}
              {co2 > 0 ? <span className={styles.monolithUnit}>t</span> : null}
            </span>
            <span className={styles.monolithLabel}>Tonnes of CO₂ avoided</span>
            <span className={styles.monolithSubtext}>
              CO₂ saved over 25 years by using solar instead of grid power from
              coal and other fossil fuels.
            </span>
          </div>

          <div className={styles.monolithStat}>
            <span className={styles.monolithValue}>
              {trees > 0 ? trees.toLocaleString("en-IN") : "—"}
            </span>
            <span className={styles.monolithLabel}>Equal to this many trees</span>
            <span className={styles.monolithSubtext}>
              About the same CO₂ absorbed by this many mature trees.
            </span>
          </div>
        </div>

        <div className={styles.impactFoot}>
          CLEAN ENERGY:{" "}
          {annualUnits > 0
            ? `~${annualUnits.toLocaleString("en-IN")} UNITS / YEAR`
            : "—"}
        </div>
      </div>
    </section>
  );
}

export default EmeraldImpact;
