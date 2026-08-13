"use client";

/**
 * Quantum Cover — full-bleed daytime rooftop hero + glass folio.
 */

import type { ProposalData } from "@/lib/proposal-data";
import {
  QUANTUM_DEFAULT_BRAND,
  QUANTUM_PANEL_WATT,
  quantumDcKwp,
  quantumModuleCount,
  useQuantumCoverBrand,
} from "./quantum-brand";
import { QuantumAtmosphere } from "./QuantumAtmosphere";
import { useQuantumLang } from "./quantum-lang-context";
import styles from "./Quantum.module.css";

const COVER_ROOFTOP_SRC = "/assets/proposals/quantum-cover-indian-day.jpg";

export type QuantumCoverProps = {
  data: ProposalData;
  installerLogoUrl?: string;
};

function CoverWordmark({ brandName }: { brandName: string }) {
  const parts = brandName.trim().split(/\s+/).filter(Boolean);
  const primary = (parts[0] || QUANTUM_DEFAULT_BRAND).toUpperCase();
  const secondary = parts.slice(1).join(" ").toUpperCase();
  return (
    <div className={styles.coverWordmark}>
      <span className={styles.coverWordmarkPrimary}>{primary}</span>
      {secondary ? (
        <span className={styles.coverWordmarkSecondary}>{secondary}</span>
      ) : null}
    </div>
  );
}

export function QuantumCover({ data, installerLogoUrl }: QuantumCoverProps) {
  const { copy } = useQuantumLang();
  const coverBrand = useQuantumCoverBrand(data, installerLogoUrl);
  const brand = coverBrand.installerName || QUANTUM_DEFAULT_BRAND;
  const logoUrl = coverBrand.showLogo ? coverBrand.logoUrl : "";
  const client = data.meta.customerName?.trim() || copy.cover.customerFallback;
  const systemKw = Number(data.meta.systemKw) || 3;
  const moduleCount = quantumModuleCount(systemKw) || 6;
  const dcKwp = quantumDcKwp(moduleCount) || 3.48;
  const acLabel = systemKw % 1 ? systemKw.toFixed(1) : String(systemKw);

  return (
    <section className={`${styles.a4Page} ${styles.coverPage}`}>
      <QuantumAtmosphere variant="cover" />

      <div className={styles.coverHero}>
        {/* eslint-disable-next-line @next/next/no-img-element -- print A4 static asset */}
        <img
          className={styles.coverHeroImg}
          src={COVER_ROOFTOP_SRC}
          alt={copy.cover.photoTitle}
          width={1600}
          height={1200}
        />
        <div className={styles.coverHeroFade} aria-hidden />
        <div className={styles.coverHeroSheen} aria-hidden />

        <header className={styles.coverMagHeader}>
          <div className={styles.coverLogoBadge}>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={brand} className={styles.coverLogoImg} />
            ) : (
              <CoverWordmark brandName={brand} />
            )}
          </div>
          <span className={styles.coverConfidential}>
            {copy.cover.confidential}
          </span>
        </header>

        <div className={styles.coverHeroCaption}>
          <span>{copy.cover.photoTitle}</span>
          <span>{copy.cover.photoSub}</span>
        </div>
      </div>

      <div className={styles.coverFolio}>
        <span className={styles.label}>{copy.cover.preparedFor}</span>
        <h1 className={styles.clientNameCompact}>{client}</h1>
        <p className={styles.coverTagline}>{copy.cover.tagline}</p>
        <div className={styles.coverMetrics}>
          <div className={styles.coverMetric}>
            <span className={styles.label}>{copy.cover.acCapacity}</span>
            <span className={styles.valueMedium}>{acLabel} kW</span>
          </div>
          <div className={styles.coverMetric}>
            <span className={styles.label}>{copy.cover.dcArray}</span>
            <span className={styles.valueMedium}>{dcKwp.toFixed(2)} kWp</span>
          </div>
          <div className={styles.coverMetric}>
            <span className={styles.label}>{copy.cover.moduleType}</span>
            <span className={styles.coverMetricModules}>
              {moduleCount} × {QUANTUM_PANEL_WATT}W TOPCon
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default QuantumCover;
