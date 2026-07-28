"use client";

/**
 * Premium Luxe — cinematic cover (Page 01).
 * Blueprint grid, ambient gold glow, confidential badge.
 */

import type { ProposalData } from "@/lib/proposal-data";
import { luxeDisplayFont } from "./luxe-fonts";
import styles from "./luxe.module.css";

export type CoverPageProps = {
  data: ProposalData;
};

export function CoverPage({ data }: CoverPageProps) {
  const systemKw = Number(data.meta.systemKw) || 3;
  const yieldKwh =
    data.closing.annualUnits > 0
      ? data.closing.annualUnits
      : Math.round(systemKw * 1440);
  const location =
    data.meta.locationLine && data.meta.locationLine !== "—"
      ? data.meta.locationLine.toUpperCase()
      : "MADHYA PRADESH";

  return (
    <section className={`${styles.a4Page} ${styles.luxeCover} ${luxeDisplayFont.variable}`}>
      {/* Cinematic Lighting and Blueprint Grid */}
      <div className={styles.ambientGlow} />
      <div className={styles.blueprintGrid} />

      <div className={styles.coverTop}>
        <div className={styles.brandBadge}>
          <span className={styles.brandName}>HARIHAR</span>
          <span className={styles.brandVertical}>SOLAR</span>
        </div>
        <div className={styles.confidentialTag}>
          <span className={styles.pulseDot} />
          STRICTLY CONFIDENTIAL
        </div>
      </div>

      <div className={styles.coverCenter}>
        <h3 className={styles.preparedFor}>EXCLUSIVE ENERGY BLUEPRINT FOR</h3>
        <h1 className={styles.clientName}>
          {data.meta.customerName?.trim() || "Customer"}
        </h1>
        <div className={styles.goldLine} />
        <h2 className={styles.assetTitle}>Premium Grid Architecture</h2>
        <p className={styles.locationCoordinates}>
          24.58° N, 80.83° E • {location}
        </p>
      </div>

      <div className={styles.coverBottom}>
        <div className={styles.specBox}>
          <span className={styles.specLabel}>ASSET CAPACITY</span>
          <span className={styles.specValue}>{systemKw} kW AC</span>
        </div>
        <div className={styles.specBox}>
          <span className={styles.specLabel}>ESTIMATED YIELD</span>
          <span className={styles.specValue}>
            ~{yieldKwh.toLocaleString("en-IN")} kWh/yr
          </span>
        </div>
        <div className={styles.specBox}>
          <span className={styles.specLabel}>PROJECT STATUS</span>
          <span className={styles.specValueActive}>AWAITING APPROVAL</span>
        </div>
      </div>
    </section>
  );
}

export default CoverPage;
