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
import { useQuantumLang } from "./quantum-lang-context";
import styles from "./Quantum.module.css";

/** Same elevated India scene as before, cleaner GI structure — /public */
const COVER_ROOFTOP_SRC = "/assets/proposals/quantum-cover-elevated-clean.jpg";

export type QuantumCoverProps = {
  data: ProposalData;
};

export function QuantumCover({ data }: QuantumCoverProps) {
  const { copy } = useQuantumLang();
  const brand = useQuantumBrand(data) || QUANTUM_DEFAULT_BRAND;
  const client = data.meta.customerName?.trim() || copy.cover.customerFallback;
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
          <span>{copy.cover.confidential}</span>
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
            <span>{copy.cover.photoTitle}</span>
            <span>{copy.cover.photoSub}</span>
          </figcaption>
        </figure>

        <div className={styles.glass3D} style={{ alignSelf: "stretch" }}>
          <span className={styles.label}>{copy.cover.preparedFor}</span>
          <h1 className={styles.clientNameCompact}>{client}</h1>
          <p className={styles.coverTagline}>{copy.cover.tagline}</p>
        </div>

        <div className={`${styles.bentoGrid} ${styles.glass3D}`}>
          <div className={styles.span4}>
            <span className={styles.label}>{copy.cover.acCapacity}</span>
            <span className={styles.valueMedium}>{acLabel} kW</span>
          </div>
          <div className={styles.span4}>
            <span className={styles.label}>{copy.cover.dcArray}</span>
            <span className={styles.valueMedium}>{dcKwp.toFixed(2)} kWp</span>
          </div>
          <div className={styles.span4}>
            <span className={styles.label}>{copy.cover.moduleType}</span>
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
