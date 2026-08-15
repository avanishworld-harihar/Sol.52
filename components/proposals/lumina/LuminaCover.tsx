"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { formatInrCompact } from "@/components/proposals/_shared/formatters";
import { installerLogoAlt } from "@/lib/proposal-branding-settings";
import styles from "./Lumina.module.css";
import { splitLuminaWordmark, useLuminaSurfaceBrand } from "./lumina-brand";
import {
  LUMINA_HERO_ALT,
  LUMINA_HERO_PHOTO,
  formatLuminaKw,
  luminaAnnualUnits,
  luminaLocation,
  luminaNetInvestment,
} from "./lumina-live";

export type LuminaCoverProps = {
  data: ProposalData;
  installerLogoUrl?: string;
};

export function LuminaCover({ data, installerLogoUrl }: LuminaCoverProps) {
  const customer = data.meta.customerName?.trim() || "—";
  const systemKw = Number(data.meta.systemKw) || 0;
  const annual = luminaAnnualUnits(data);
  const net = luminaNetInvestment(data);
  const showSubsidy = data.economics.subsidyInr > 0;
  const location = luminaLocation(data);
  const coverBrand = useLuminaSurfaceBrand(data, "cover", installerLogoUrl);
  const brand = coverBrand.installerName?.trim() || "";
  const logo = coverBrand.showLogo ? coverBrand.logoUrl : "";
  const showWordmark = Boolean(brand) && (coverBrand.showName || !logo);
  const { head, tail } = splitLuminaWordmark(brand);
  const logoOnly = Boolean(logo) && !showWordmark;

  return (
    <section className={styles.a4Lumina}>
      <div className={styles.heroHeader}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LUMINA_HERO_PHOTO} alt={LUMINA_HERO_ALT} className={styles.heroImage} />
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
          <span>Elevated GI MMS</span>
          <span>RCC terrace · walkable under array</span>
        </div>
      </div>

      <div className={styles.contentCover}>
        <div>
          <div className={styles.dateTag}>
            {customer !== "—" ? `Prepared for ${customer}` : "Prepared for this property"}
          </div>
          <h1 className={styles.clientTitle}>Smart Energy Portfolio.</h1>
          <p className={styles.subText}>
            A high-efficiency
            {systemKw > 0 ? ` ${formatLuminaKw(systemKw)} kW` : ""} photovoltaic system
            {location ? ` for ${location}` : ""} engineered to reduce grid reliance and deliver
            reliable returns when live economics are on file.
          </p>
        </div>

        <div className={styles.cardGrid}>
          <div className={styles.dataCard}>
            <span className={styles.cardLabel}>System Engine</span>
            <div>
              <span className={styles.cardValue}>{systemKw > 0 ? formatLuminaKw(systemKw) : "—"}</span>
              {systemKw > 0 ? <span className={styles.cardUnit}>kW</span> : null}
            </div>
          </div>

          <div className={styles.dataCard}>
            <span className={styles.cardLabel}>Est. Year 1 Yield</span>
            <div>
              <span className={styles.cardValue}>
                {annual > 0 ? annual.toLocaleString("en-IN") : "—"}
              </span>
              {annual > 0 ? <span className={styles.cardUnit}>Units</span> : null}
            </div>
          </div>

          <div className={`${styles.dataCard} ${styles.dataCardAccent}`}>
            <span className={`${styles.cardLabel} ${styles.cardLabelAccent}`}>
              {showSubsidy ? "Net Investment" : "Turnkey Investment"}
            </span>
            <div>
              <span className={`${styles.cardValue} ${styles.cardValueAccent}`}>
                {net > 0 ? formatInrCompact(net) : "—"}
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

export default LuminaCover;
