"use client";

/**
 * Premium Luxe — Cover (Page 01).
 * Original Obsidian layout: vertical brand, geometric SVG, minimal footer.
 */

import type { ProposalData } from "@/lib/proposal-data";
import { formatLuxeKw } from "./luxe-format";
import { luxeDisplayFont } from "./luxe-fonts";
import styles from "./luxe.module.css";

export type ObsidianCoverProps = {
  data: ProposalData;
};

export function ObsidianCover({ data }: ObsidianCoverProps) {
  const systemKw = Number(data.meta.systemKw) || 3;
  const location =
    data.meta.locationLine && data.meta.locationLine !== "—"
      ? data.meta.locationLine.replace(/,\s*India$/i, "").trim()
      : "Satna, MP";

  return (
    <section
      className={`${styles.a4Page} ${styles.obsidianCover} ${luxeDisplayFont.variable}`}
    >
      <div className={styles.verticalBrand}>
        <span>HARIHAR SOLAR</span>
        <div className={styles.verticalLine} />
        <span>ENERGY ARCHITECTURE</span>
      </div>

      <div className={styles.heroCenter}>
        <svg
          width="120"
          height="120"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={styles.heroSvg}
        >
          <circle
            cx="50"
            cy="50"
            r="48"
            stroke="#B8962E"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <path d="M50 10 L50 90 M10 50 L90 50" stroke="#B8962E" strokeWidth="0.5" />
          <rect x="35" y="35" width="30" height="30" stroke="#B8962E" strokeWidth="1" />
        </svg>

        <h3 className={styles.heroEyebrow}>PREPARED EXCLUSIVELY FOR</h3>
        <h1 className={styles.heroClient}>
          {data.meta.customerName?.trim() || "Customer"}
        </h1>
        <h2 className={styles.heroSubtitle}>Premium Grid Architecture.</h2>
      </div>

      <div className={styles.coverFooter}>
        <div className={styles.footerNode}>
          <span>SYSTEM</span>
          <strong className={styles.luxeNum}>
            {formatLuxeKw(systemKw)} kW AC
          </strong>
        </div>
        <div className={styles.footerNode}>
          <span>LOCATION</span>
          <strong>{location}</strong>
        </div>
        <div className={styles.footerNode}>
          <span>STATUS</span>
          <strong className={styles.goldText}>CONFIDENTIAL</strong>
        </div>
      </div>
    </section>
  );
}

export default ObsidianCover;
