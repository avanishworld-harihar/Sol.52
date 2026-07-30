"use client";

/**
 * Quantum Cover — cinematic folio with glowing radar orb + 3D glass panels.
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
  const acLabel = systemKw % 1 ? systemKw.toFixed(1) : String(systemKw);

  return (
    <section className={styles.a4Page}>
      <div className={styles.heroSvgBox} aria-hidden>
        <svg width="500" height="500" viewBox="0 0 500 500" fill="none">
          <circle
            cx="250"
            cy="250"
            r="240"
            stroke="rgba(6, 182, 212, 0.2)"
            strokeWidth="2"
            strokeDasharray="10 15"
          />
          <circle
            cx="250"
            cy="250"
            r="200"
            stroke="rgba(6, 182, 212, 0.4)"
            strokeWidth="1"
          />
          <circle
            cx="250"
            cy="250"
            r="140"
            fill="rgba(6, 182, 212, 0.05)"
            stroke="#06B6D4"
            strokeWidth="4"
          />
          <path
            d="M250 50 V450 M50 250 H450"
            stroke="rgba(6, 182, 212, 0.3)"
            strokeWidth="1"
          />
          <circle
            cx="250"
            cy="250"
            r="50"
            fill="#06B6D4"
            filter="blur(20px)"
            opacity="0.3"
          />
        </svg>
      </div>

      <div className={styles.coverLayout}>
        <div className={styles.brandHeader}>
          <span className={styles.cyanText}>{brand.toUpperCase()}</span>
          <span>Strictly Confidential</span>
        </div>

        <div className={styles.glass3D} style={{ alignSelf: "flex-start", maxWidth: "80%" }}>
          <span className={styles.label}>Energy Blueprint Prepared For</span>
          <h1 className={styles.clientName}>{client}</h1>
          <p className={styles.coverTagline}>Cinematic Grid Architecture</p>
        </div>

        <div className={`${styles.bentoGrid} ${styles.glass3D}`}>
          <div className={styles.span4}>
            <span className={styles.label}>AC Capacity</span>
            <span className={styles.valueMedium}>{acLabel} kW</span>
          </div>
          <div className={styles.span4}>
            <span className={styles.label}>DC Array</span>
            <span className={styles.valueMedium}>{dcKwp.toFixed(2)} kWp</span>
          </div>
          <div className={styles.span4}>
            <span className={styles.label}>Module Type</span>
            <span className={styles.valueMedium} style={{ fontSize: "1.4rem" }}>
              {moduleCount} × {QUANTUM_PANEL_WATT}W TOPCon
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default QuantumCover;
