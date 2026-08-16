"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { installerLogoAlt } from "@/lib/proposal-branding-settings";
import styles from "./Sienna.module.css";
import { splitSiennaWordmark, useSiennaSurfaceBrand } from "./sienna-brand";
import { useSiennaLang } from "./sienna-lang-context";
import {
  SIENNA_HERO_ALT,
  SIENNA_HERO_PHOTO,
  formatSiennaKw,
  siennaAnnualUnits,
  siennaLocation,
} from "./sienna-live";

export type SiennaCoverProps = {
  data: ProposalData;
  installerLogoUrl?: string;
};

export function SiennaCover({ data, installerLogoUrl }: SiennaCoverProps) {
  const { copy } = useSiennaLang();
  const customer = data.meta.customerName?.trim() || "—";
  const systemKw = Number(data.meta.systemKw) || 0;
  const annual = siennaAnnualUnits(data);
  const location = siennaLocation(data);
  const coverBrand = useSiennaSurfaceBrand(data, "cover", installerLogoUrl);
  const brand = coverBrand.installerName?.trim() || "";
  const logo = coverBrand.showLogo ? coverBrand.logoUrl : "";
  const showWordmark = Boolean(brand) && (coverBrand.showName || !logo);
  const { head, tail } = splitSiennaWordmark(brand);
  const logoOnly = Boolean(logo) && !showWordmark;
  const kwLabel = systemKw > 0 ? formatSiennaKw(systemKw) : "";

  return (
    <section className={`${styles.a4Sienna} ${styles.bleedSheet}`}>
      <div className={styles.coverColophon}>
        {logo || showWordmark ? (
          <div className={styles.coverBrand}>
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo}
                alt={installerLogoAlt(brand)}
                className={logoOnly ? styles.coverLogoSolo : styles.coverLogo}
              />
            ) : null}
            {showWordmark ? (
              <div className={styles.coverWordmark}>
                {head}
                {tail ? <span className={styles.coverWordmarkTail}>{tail}</span> : null}
              </div>
            ) : null}
          </div>
        ) : null}

        <p className={styles.kicker}>{copy.cover.preparedFor(customer)}</p>
        <h1 className={styles.displayTitle}>{copy.cover.title}</h1>
        <p className={styles.lead}>{copy.cover.lead(kwLabel, location)}</p>

        <div className={styles.colophonStack}>
          <div className={styles.colophonRow}>
            <span className={styles.colophonLabel}>{copy.cover.system}</span>
            <span className={styles.colophonValue}>
              {systemKw > 0 ? formatSiennaKw(systemKw) : "—"}
              {systemKw > 0 ? <span className={styles.colophonUnit}>kW</span> : null}
            </span>
          </div>
          <div className={styles.colophonRow}>
            <span className={styles.colophonLabel}>{copy.cover.yield}</span>
            <span className={styles.colophonValue}>
              {annual > 0 ? annual.toLocaleString("en-IN") : "—"}
              {annual > 0 ? (
                <span className={styles.colophonUnit}>{copy.cover.units}</span>
              ) : null}
            </span>
          </div>
          <div className={styles.colophonRow}>
            <span className={styles.colophonLabel}>{copy.cover.site}</span>
            <span className={styles.colophonValue}>{location || "—"}</span>
          </div>
        </div>

        <div className={styles.coverFoot}>
          {copy.cover.kicker} · 01 / 09
        </div>
      </div>

      <div className={styles.coverPhoto}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={SIENNA_HERO_PHOTO} alt={SIENNA_HERO_ALT} />
        <div className={styles.coverPhotoScrim} />
        <div className={styles.coverCaption}>
          <span>{copy.cover.heroMms}</span>
          <span>{copy.cover.heroTerrace}</span>
        </div>
      </div>
    </section>
  );
}

export default SiennaCover;
