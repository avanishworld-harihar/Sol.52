"use client";

/**
 * Premium Luxe — Engineering Blueprint HUD (Page 05).
 * Strict SVG technical drawing — PDF-safe, no CSS 3D boxes.
 */

import type { ProposalData } from "@/lib/proposal-data";
import { luxeDisplayFont } from "./luxe-fonts";
import styles from "./luxe.module.css";

export type EngineeringBlueprintProps = {
  data: ProposalData;
};

export function EngineeringBlueprint({ data }: EngineeringBlueprintProps) {
  const tilt = data.engineering.tiltDeg ?? 20;
  const tiltLabel = Number.isFinite(tilt) ? `${tilt.toFixed(0)}°` : "20°";

  return (
    <section
      className={`${styles.a4Page} ${styles.hudPage} ${luxeDisplayFont.variable}`}
    >
      <header className={styles.luxeHeaderBlock}>
        <span className={styles.goldTag}>01 // SYSTEM TELEMETRY</span>
        <h2 className={styles.luxeHeadline}>Precision Array Matrix.</h2>
      </header>

      <div className={styles.technicalStage}>
        {/* SVG Technical Drawing */}
        <div className={styles.svgDrawingBox}>
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 400 300"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="400" height="300" fill="#0a0a0a" />
            {/* Grid lines */}
            <path
              d="M0 50 H400 M0 100 H400 M0 150 H400 M0 200 H400 M0 250 H400"
              stroke="#333"
              strokeWidth="0.5"
            />
            <path
              d="M50 0 V300 M100 0 V300 M150 0 V300 M200 0 V300 M250 0 V300 M300 0 V300 M350 0 V300"
              stroke="#333"
              strokeWidth="0.5"
            />
            {/* Solar Panel Vector */}
            <rect
              x="80"
              y="60"
              width="240"
              height="180"
              rx="4"
              stroke="#D4AF37"
              strokeWidth="2"
            />
            <rect
              x="90"
              y="70"
              width="105"
              height="75"
              fill="rgba(212, 175, 55, 0.1)"
              stroke="#D4AF37"
              strokeWidth="1"
            />
            <rect
              x="205"
              y="70"
              width="105"
              height="75"
              fill="rgba(212, 175, 55, 0.1)"
              stroke="#D4AF37"
              strokeWidth="1"
            />
            <rect
              x="90"
              y="155"
              width="105"
              height="75"
              fill="rgba(212, 175, 55, 0.1)"
              stroke="#D4AF37"
              strokeWidth="1"
            />
            <rect
              x="205"
              y="155"
              width="105"
              height="75"
              fill="rgba(212, 175, 55, 0.1)"
              stroke="#D4AF37"
              strokeWidth="1"
            />
            {/* Measurement lines */}
            <path
              d="M70 60 V240"
              stroke="#999"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <text
              x="50"
              y="150"
              fill="#999"
              fontSize="10"
              transform="rotate(-90 50,150)"
            >
              {`OPTIMAL TILT ${tiltLabel}`}
            </text>
          </svg>
        </div>

        <div className={styles.telemetryMetrics}>
          <div className={styles.metricRow}>
            <h4>1.16 OVERSAMPLING</h4>
            <p>Oversized DC array forces the inverter to hit peak yield earlier.</p>
          </div>
          <div className={styles.metricRow}>
            <h4>~75% PR DERATING</h4>
            <p>Calibration accounting for thermal resistance.</p>
          </div>
          <div className={styles.metricRow}>
            <h4>180° TRUE SOUTH</h4>
            <p>Perfect azimuth alignment for maximum annual photon capture.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default EngineeringBlueprint;
