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
            Biosphere
            <br />
            Dividend.
          </h3>
          <p className={styles.sidebarBlurb}>
            A quantifiable commitment to ecological preservation and carbon
            offset.
          </p>
        </div>
      </div>

      <div className={styles.contentArea}>
        <h2 className={styles.pageHeader}>Ecological Impact</h2>

        <div className={styles.monolithCard}>
          <div className={styles.monolithStat}>
            <span className={styles.monolithValue}>
              {co2Label}
              {co2 > 0 ? <span className={styles.monolithUnit}>t</span> : null}
            </span>
            <span className={styles.monolithLabel}>Tonnes CO₂ Avoided</span>
            <span className={styles.monolithSubtext}>
              Estimated lifetime carbon offset. Displacing fossil-fuel reliant
              grid power with zero-emission solar generation over 25 years.
            </span>
          </div>

          <div className={styles.monolithStat}>
            <span className={styles.monolithValue}>
              {trees > 0 ? trees.toLocaleString("en-IN") : "—"}
            </span>
            <span className={styles.monolithLabel}>Trees Equivalent</span>
            <span className={styles.monolithSubtext}>
              Mature tree absorption parity. An indicative ecological metric
              measuring the environmental relief provided by your specific
              array.
            </span>
          </div>
        </div>

        <div className={styles.impactFoot}>
          CLEAN ENERGY GENERATION:{" "}
          {annualUnits > 0
            ? `~${annualUnits.toLocaleString("en-IN")} UNITS / YEAR`
            : "—"}
        </div>
      </div>
    </section>
  );
}

export default EmeraldImpact;
