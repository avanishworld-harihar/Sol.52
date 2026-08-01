/**
 * Compact two-brand plant-gross compare for Atelier Monthly Economics.
 * Uses Smart catalog snapshot from Proposal Builder brandCompare.
 */

import type { BrandCompareSnapshot } from "@/lib/brand-compare-helpers";
import styles from "./atelier.module.css";

export type AtelierBrandCompareProps = {
  snapshot: BrandCompareSnapshot;
  labels: {
    kicker: string;
    track: string;
    dcr: string;
    nonDcr: string;
    subtitle: (kw: number) => string;
  };
};

function inr(value: number): string {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

export function AtelierBrandCompare({
  snapshot,
  labels,
}: AtelierBrandCompareProps) {
  return (
    <div className={styles.brandCompare}>
      <div className={styles.brandCompareHead}>
        <span className={styles.brandCompareKicker}>{labels.kicker}</span>
        <span className={styles.brandCompareSub}>
          {labels.subtitle(snapshot.kw)}
        </span>
      </div>
      <table className={styles.brandCompareTable}>
        <thead>
          <tr>
            <th>{labels.track}</th>
            <th>{snapshot.brandA.brandLabel}</th>
            <th>{snapshot.brandB.brandLabel}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{labels.dcr}</td>
            <td>
              {snapshot.brandA.dcrOk ? inr(snapshot.brandA.dcrGrossInr) : "—"}
            </td>
            <td>
              {snapshot.brandB.dcrOk ? inr(snapshot.brandB.dcrGrossInr) : "—"}
            </td>
          </tr>
          <tr>
            <td>{labels.nonDcr}</td>
            <td>
              {snapshot.brandA.nonDcrOk
                ? inr(snapshot.brandA.nonDcrGrossInr)
                : "—"}
            </td>
            <td>
              {snapshot.brandB.nonDcrOk
                ? inr(snapshot.brandB.nonDcrGrossInr)
                : "—"}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
