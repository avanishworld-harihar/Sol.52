"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { formatInrCompact } from "@/components/proposals/_shared/formatters";
import styles from "./Lumina.module.css";
import {
  LUMINA_HERO_PHOTO,
  formatLuminaKw,
  luminaAnnualUnits,
  luminaBrandParts,
  luminaLocation,
  luminaNetInvestment,
} from "./lumina-live";

export function LuminaCover({ data }: { data: ProposalData }) {
  const customer = data.meta.customerName?.trim() || "—";
  const systemKw = Number(data.meta.systemKw) || 0;
  const annual = luminaAnnualUnits(data);
  const net = luminaNetInvestment(data);
  const showSubsidy = data.economics.subsidyInr > 0;
  const location = luminaLocation(data);
  const { head, tail } = luminaBrandParts(data);
  const logo = data.meta.brandLogoUrl?.trim();

  return (
    <section className={styles.a4Lumina}>
      <div className={styles.heroHeader}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LUMINA_HERO_PHOTO} alt="" className={styles.heroImage} />
        <div className={styles.heroOverlay} />
        <div className={styles.logoContainer}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" className={styles.logoImage} />
          ) : null}
          <span className={styles.logoTextMain}>{head}</span>
          {tail ? <span className={styles.logoTextSub}>{tail}</span> : null}
        </div>
      </div>

      <div className={styles.contentArea}>
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
        SOL.52 DEPLOYMENT SPEC{location ? ` · ${location}` : ""} · 01 / 07
      </div>
    </section>
  );
}

export default LuminaCover;
