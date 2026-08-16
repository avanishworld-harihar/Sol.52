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
      <div className={styles.heroHeader}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={SIENNA_HERO_PHOTO} alt={SIENNA_HERO_ALT} className={styles.heroImage} />
        <div className={styles.heroOverlay} />
        {logo || showWordmark ? (
          <div
            className={`${styles.logoContainer}${logoOnly ? ` ${styles.logoContainerSolo}` : ""}`}
          >
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo}
                alt={installerLogoAlt(brand)}
                className={logoOnly ? styles.logoImageSolo : styles.logoImage}
              />
            ) : null}
            {showWordmark ? (
              <>
                <span className={styles.logoTextMain}>{head}</span>
                {tail ? <span className={styles.logoTextSub}>{tail}</span> : null}
              </>
            ) : null}
          </div>
        ) : null}
        <div className={styles.heroCaption}>
          <span>{copy.cover.heroMms}</span>
          <span>{copy.cover.heroTerrace}</span>
        </div>
      </div>

      <div className={styles.contentCover}>
        <div>
          <div className={styles.dateTag}>{copy.cover.preparedFor(customer)}</div>
          <h1 className={styles.clientTitle}>{copy.cover.title}</h1>
          <p className={styles.subText}>{copy.cover.lead(kwLabel, location)}</p>
        </div>

        <div className={styles.cardGrid}>
          <div className={styles.dataCard}>
            <span className={styles.cardLabel}>{copy.cover.systemEngine}</span>
            <div>
              <span className={styles.cardValue}>{systemKw > 0 ? formatSiennaKw(systemKw) : "—"}</span>
              {systemKw > 0 ? <span className={styles.cardUnit}>kW</span> : null}
            </div>
          </div>

          <div className={`${styles.dataCard} ${styles.dataCardYield}`}>
            <span className={`${styles.cardLabel} ${styles.cardLabelAccent}`}>
              {copy.cover.year1Yield}
            </span>
            <div>
              <span className={`${styles.cardValue} ${styles.cardValueAccent}`}>
                {annual > 0 ? annual.toLocaleString("en-IN") : "—"}
              </span>
              {annual > 0 ? (
                <span className={`${styles.cardUnit} ${styles.cardUnitYield}`}>{copy.cover.units}</span>
              ) : null}
            </div>
          </div>

          <div className={`${styles.dataCard} ${styles.dataCardAccent}`}>
            <span className={`${styles.cardLabel} ${styles.cardLabelSite}`}>{copy.cover.site}</span>
            <div>
              <span className={`${styles.cardValue} ${styles.cardValueSite}`}>
                {location || "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.pageFooter}>
        {brand ? `${brand} · ` : ""}
        {location ? `${location} · ` : ""}
        01 / 09
      </div>
    </section>
  );
}

export default SiennaCover;
