"use client";

/**
 * Quantum Cover — cinematic architectural folio with geometric blueprint SVG.
 */

import type { ProposalData } from "@/lib/proposal-data";
import {
  QUANTUM_DEFAULT_BRAND,
  QUANTUM_PANEL_WATT,
  quantumDcKwp,
  quantumModuleCount,
  useQuantumBrand,
} from "./quantum-brand";
import styles from "./Quantum.module.css";

export type QuantumCoverProps = {
  data: ProposalData;
};

export function QuantumCover({ data }: QuantumCoverProps) {
  const brand = useQuantumBrand(data) || QUANTUM_DEFAULT_BRAND;
  const client = data.meta.customerName?.trim() || "Customer";
  const systemKw = Number(data.meta.systemKw) || 3;
  const moduleCount = quantumModuleCount(systemKw) || 6;
  const dcKwp = quantumDcKwp(moduleCount) || 3.48;

  return (
    <section className={styles.a4Page}>
      {/* Massive Background Vector */}
      <div className={styles.heroSvgBox}>
        <svg
          width="600"
          height="600"
          viewBox="0 0 600 600"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <circle
            cx="300"
            cy="300"
            r="280"
            stroke="#06B6D4"
            strokeOpacity="0.2"
            strokeWidth="1"
            strokeDasharray="4 8"
          />
          <circle
            cx="300"
            cy="300"
            r="200"
            stroke="#06B6D4"
            strokeOpacity="0.4"
            strokeWidth="1"
          />
          <circle
            cx="300"
            cy="300"
            r="120"
            stroke="#06B6D4"
            strokeOpacity="0.8"
            strokeWidth="2"
          />
          <path
            d="M300 0 V600 M0 300 H600"
            stroke="#06B6D4"
            strokeOpacity="0.3"
            strokeWidth="1"
          />
          <rect
            x="280"
            y="280"
            width="40"
            height="40"
            fill="#06B6D4"
            fillOpacity="0.2"
            stroke="#06B6D4"
          />
        </svg>
      </div>

      <div className={styles.coverLayout}>
        <div className={styles.brandHeader}>
          <span className={styles.cyanText}>{brand.toUpperCase()}</span>
          <span>ARCHITECTURAL FOLIO</span>
        </div>

        <div>
          <span className={styles.dataLabel}>PREPARED EXCLUSIVELY FOR</span>
          <h1 className={styles.clientName}>{client}</h1>
          <p
            style={{
              color: "#06B6D4",
              letterSpacing: "2px",
              fontSize: "1.2rem",
              margin: 0,
            }}
          >
            PRECISION GRID ARCHITECTURE
          </p>
        </div>

        <div className={styles.coverFooter}>
          <div>
            <span className={styles.dataLabel}>AC CAPACITY</span>
            <span className={styles.dataValue}>
              {systemKw % 1 ? systemKw.toFixed(1) : systemKw} kW
            </span>
          </div>
          <div>
            <span className={styles.dataLabel}>DC ARRAY</span>
            <span className={styles.dataValue}>{dcKwp.toFixed(2)} kWp</span>
          </div>
          <div>
            <span className={styles.dataLabel}>MODULE TYPE</span>
            <span className={styles.dataValue} style={{ fontSize: "1.2rem" }}>
              {moduleCount} × {QUANTUM_PANEL_WATT}W TOPCon
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default QuantumCover;
