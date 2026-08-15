"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { formatInrCompact } from "@/components/proposals/_shared/formatters";
import styles from "./Lumina.module.css";
import {
  LUMINA_HERO_PHOTO,
  formatLuminaKw,
  luminaAnnualUnits,
  luminaBrandParts,
  luminaIssueDate,
  luminaLocation,
  luminaNetInvestment,
} from "./lumina-live";

function BoltIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function RupeeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

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
        <div className={styles.brandBadge}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" className={styles.brandLogo} />
          ) : (
            <div className={styles.brandDot} />
          )}
          <span className={styles.brandName}>
            {head}
            {tail ? <span className={styles.brandAccent}>{` ${tail}`}</span> : null}
          </span>
        </div>
      </div>

      <div className={styles.contentArea}>
        <div>
          <div className={styles.dateTag}>Prepared on {luminaIssueDate(data.meta.generatedAt)}</div>
          <h1 className={styles.clientTitle}>
            {customer !== "—" ? `Smart Energy Portfolio for ${customer}.` : "Smart Energy Portfolio."}
          </h1>
          <p className={styles.subText}>
            A high-efficiency photovoltaic system sized for this property
            {location ? ` in ${location}` : ""}. Engineered to reduce grid reliance and deliver
            reliable returns when live economics are on file.
          </p>
        </div>

        <div className={styles.cardGrid}>
          <div className={styles.dataCard}>
            <div className={styles.cardIcon}>
              <BoltIcon />
            </div>
            <span className={styles.cardLabel}>System Engine</span>
            <div>
              <span className={styles.cardValue}>{systemKw > 0 ? formatLuminaKw(systemKw) : "—"}</span>
              {systemKw > 0 ? <span className={styles.cardUnit}>kW</span> : null}
            </div>
          </div>

          <div className={styles.dataCard}>
            <div className={styles.cardIcon}>
              <ClockIcon />
            </div>
            <span className={styles.cardLabel}>Est. Year 1 Yield</span>
            <div>
              <span className={styles.cardValue}>
                {annual > 0 ? annual.toLocaleString("en-IN") : "—"}
              </span>
              {annual > 0 ? <span className={styles.cardUnit}>Units</span> : null}
            </div>
          </div>

          <div className={`${styles.dataCard} ${styles.dataCardAccent}`}>
            <div className={`${styles.cardIcon} ${styles.cardIconAccent}`}>
              <RupeeIcon />
            </div>
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
    </section>
  );
}

export default LuminaCover;
