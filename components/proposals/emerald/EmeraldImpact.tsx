"use client";

/**
 * Emerald Signature — Biosphere Dividend (dark emerald data monolith).
 */

import type { ProposalData } from "@/lib/proposal-data";
import { EMERALD_SPECIFIC_YIELD } from "./emerald-brand";
import { useEmeraldLang } from "./emerald-lang-context";
import styles from "./Emerald.module.css";

export type EmeraldImpactProps = {
  data: ProposalData;
};

export function EmeraldImpact({ data }: EmeraldImpactProps) {
  const { copy } = useEmeraldLang();
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
          <span className={styles.goldEyebrow}>{copy.impact.eyebrow}</span>
          <h3 className={styles.sidebarTitle}>
            {copy.impact.sidebarTitle[0]}
            <br />
            {copy.impact.sidebarTitle[1]}
          </h3>
          <p className={styles.sidebarBlurb}>{copy.impact.sidebarBlurb}</p>
        </div>
      </div>

      <div className={styles.contentArea}>
        <h2 className={styles.pageHeader}>{copy.impact.pageHeader}</h2>

        <div className={styles.monolithCard}>
          <div className={styles.monolithStat}>
            <span className={styles.monolithValue}>
              {co2Label}
              {co2 > 0 ? <span className={styles.monolithUnit}>t</span> : null}
            </span>
            <span className={styles.monolithLabel}>{copy.impact.co2Label}</span>
            <span className={styles.monolithSubtext}>{copy.impact.co2Hint}</span>
          </div>

          <div className={styles.monolithStat}>
            <span className={styles.monolithValue}>
              {trees > 0 ? trees.toLocaleString("en-IN") : "—"}
            </span>
            <span className={styles.monolithLabel}>{copy.impact.treesLabel}</span>
            <span className={styles.monolithSubtext}>{copy.impact.treesHint}</span>
          </div>
        </div>

        <div className={styles.impactFoot}>
          {annualUnits > 0
            ? copy.impact.cleanEnergy(annualUnits.toLocaleString("en-IN"))
            : copy.impact.cleanEnergyEmpty}
        </div>
      </div>
    </section>
  );
}

export default EmeraldImpact;
