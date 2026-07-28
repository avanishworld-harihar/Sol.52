"use client";

/**
 * Premium Luxe — Obsidian Cover (Page 01).
 * Vertical brand spine + geometric SVG centerpiece.
 */

import type { ProposalData } from "@/lib/proposal-data";
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
      {/* Architectural Vertical Branding */}
      <div className={styles.verticalBrand}>
        <span>HARIHAR SOLAR</span>
        <div className={styles.verticalLine} />
        <span>ENERGY ARCHITECTURE</span>
      </div>

      {/* Centerpiece: Huge Typography & SVG */}
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
            stroke="#D4AF37"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <path d="M50 10 L50 90 M10 50 L90 50" stroke="#D4AF37" strokeWidth="0.5" />
          <rect x="35" y="35" width="30" height="30" stroke="#D4AF37" strokeWidth="1" />
        </svg>

        <h3 className={styles.heroEyebrow}>PREPARED EXCLUSIVELY FOR</h3>
        <h1 className={styles.heroClient}>
          {data.meta.customerName?.trim() || "Customer"}
        </h1>
        <h2 className={styles.heroSubtitle}>Premium Grid Architecture.</h2>
      </div>

      {/* Minimalist Bottom Data */}
      <div className={styles.coverFooter}>
        <div className={styles.footerNode}>
          <span>SYSTEM</span>
          <strong>{systemKw} kW AC</strong>
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
