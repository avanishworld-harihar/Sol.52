"use client";

/**
 * Quantum Cover — photoreal luxury rooftop hero + frosted glass folio.
 */

import type { ProposalData } from "@/lib/proposal-data";
import {
  QUANTUM_DEFAULT_BRAND,
  QUANTUM_PANEL_WATT,
  quantumDcKwp,
  quantumModuleCount,
  useQuantumBrand,
} from "./quantum-brand";
import { QuantumAtmosphere } from "./QuantumAtmosphere";
import styles from "./Quantum.module.css";

/** India elevated GI (~6–7 ft) + ~20° tilt, evening luxury — /public */
const COVER_ROOFTOP_SRC = "/assets/proposals/quantum-cover-elevated-india.jpg";

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
      <QuantumAtmosphere variant="cover" />

      <div className={`${styles.coverLayout} ${styles.pageStack}`}>
        <div className={styles.brandHeader}>
          <span className={styles.cyanText}>{brand.toUpperCase()}</span>
          <span>Strictly Confidential</span>
        </div>

        <figure className={styles.coverPhotoPlate}>
          <div className={styles.coverPhotoFrame}>
            {/* eslint-disable-next-line @next/next/no-img-element -- print A4 static asset */}
            <img
              className={styles.coverPhotoImg}
              src={COVER_ROOFTOP_SRC}
              alt=""
              width={1600}
              height={900}
            />
            <div className={styles.coverPhotoVignette} aria-hidden />
            <div className={styles.coverPhotoCyanEdge} aria-hidden />
            <div className={styles.coverPhotoGlassSheen} aria-hidden />
          </div>
          <figcaption className={styles.coverPhotoCaption}>
            <span>Elevated rooftop solar</span>
            <span>~20° tilt · Walkable terrace below</span>
          </figcaption>
        </figure>

        <div className={styles.glass3D} style={{ alignSelf: "stretch" }}>
          <span className={styles.label}>Prepared for</span>
          <h1 className={styles.clientNameCompact}>{client}</h1>
          <p className={styles.coverTagline}>Your solar proposal</p>
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
            <span className={styles.valueMedium} style={{ fontSize: "1.25rem" }}>
              {moduleCount} × {QUANTUM_PANEL_WATT}W TOPCon
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default QuantumCover;
