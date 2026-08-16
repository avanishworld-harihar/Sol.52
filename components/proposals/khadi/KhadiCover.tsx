"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { installerLogoAlt } from "@/lib/proposal-branding-settings";
import styles from "./Khadi.module.css";
import { splitKhadiWordmark, useKhadiSurfaceBrand } from "./khadi-brand";
import { useKhadiLang } from "./khadi-lang-context";
import {
  KHADI_HERO_ALT,
  KHADI_HERO_PHOTO,
  formatKhadiKw,
  khadiAnnualUnits,
  khadiLocation,
} from "./khadi-live";

export type KhadiCoverProps = {
  data: ProposalData;
  installerLogoUrl?: string;
};

export function KhadiCover({ data, installerLogoUrl }: KhadiCoverProps) {
  const { copy } = useKhadiLang();
  const customer = data.meta.customerName?.trim() || "—";
  const systemKw = Number(data.meta.systemKw) || 0;
  const annual = khadiAnnualUnits(data);
  const location = khadiLocation(data);
  const coverBrand = useKhadiSurfaceBrand(data, "cover", installerLogoUrl);
  const brand = coverBrand.installerName?.trim() || "";
  const logo = coverBrand.showLogo ? coverBrand.logoUrl : "";
  const showWordmark = Boolean(brand) && (coverBrand.showName || !logo);
  const { head, tail } = splitKhadiWordmark(brand);
  const logoOnly = Boolean(logo) && !showWordmark;
  const kwLabel = systemKw > 0 ? formatKhadiKw(systemKw) : "";

  return (
    <section className={`${styles.a4Khadi} ${styles.bleedSheet} ${styles.coverBleed}`}>
      <div className={styles.coverPhoto}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={KHADI_HERO_PHOTO} alt={KHADI_HERO_ALT} />
        <div className={styles.coverPhotoScrim} />
        <div className={styles.coverCaption}>
          <span>{copy.cover.heroMms}</span>
          <span>{copy.cover.heroTerrace}</span>
        </div>
      </div>

      <div className={styles.coverStamp}>
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

        <div className={styles.coverSeals}>
          <div className={styles.seal}>
            <span className={styles.colophonLabel}>{copy.cover.system}</span>
            <span className={styles.colophonValue}>
              {systemKw > 0 ? formatKhadiKw(systemKw) : "—"}
              {systemKw > 0 ? <span className={styles.colophonUnit}>kW</span> : null}
            </span>
          </div>
          <div className={styles.seal}>
            <span className={styles.colophonLabel}>{copy.cover.yield}</span>
            <span className={styles.colophonValue}>
              {annual > 0 ? annual.toLocaleString("en-IN") : "—"}
              {annual > 0 ? (
                <span className={styles.colophonUnit}>{copy.cover.units}</span>
              ) : null}
            </span>
          </div>
          <div className={styles.seal}>
            <span className={styles.colophonLabel}>{copy.cover.site}</span>
            <span className={styles.colophonValue}>{location || "—"}</span>
          </div>
        </div>

        <div className={styles.coverFoot}>
          {copy.cover.kicker} · 01 / 09
        </div>
      </div>
    </section>
  );
}

export default KhadiCover;
