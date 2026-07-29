"use client";

/**
 * Premium Luxe — Cover (Page 01).
 * Monument brand cover: atmospheric porcelain field, gold architecture motif,
 * brand-first typography, exclusive client dedication.
 */

import type { ProposalData } from "@/lib/proposal-data";
import { formatLuxeKw } from "./luxe-format";
import { luxeDisplayFont } from "./luxe-fonts";
import styles from "./luxe.module.css";

export type ObsidianCoverProps = {
  data: ProposalData;
};

export function ObsidianCover({ data }: ObsidianCoverProps) {
  const brand = (data.meta.brandName?.trim() || "Harihar Solar").toUpperCase();
  const brandParts = brand.split(/\s+/);
  const brandPrimary = brandParts[0] || "HARIHAR";
  const brandSecondary = brandParts.slice(1).join(" ") || "SOLAR";
  const client = data.meta.customerName?.trim() || "Valued Customer";
  const systemKw = Number(data.meta.systemKw) || 3;
  const location =
    data.meta.locationLine && data.meta.locationLine !== "—"
      ? data.meta.locationLine.replace(/,\s*India$/i, "").trim()
      : "Satna, MP";
  const year = new Date().getFullYear();

  return (
    <section
      className={`${styles.a4Page} ${styles.obsidianCover} ${luxeDisplayFont.variable}`}
    >
      {/* Atmospheric field + architectural motif */}
      <div className={styles.coverAtmosphere} aria-hidden>
        <svg
          className={styles.coverMotif}
          viewBox="0 0 420 594"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="coverField" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FBF7F0" />
              <stop offset="42%" stopColor="#F8F9FB" />
              <stop offset="100%" stopColor="#EEF1F6" />
            </linearGradient>
            <linearGradient id="coverGoldWash" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(184,150,46,0.14)" />
              <stop offset="55%" stopColor="rgba(184,150,46,0)" />
              <stop offset="100%" stopColor="rgba(184,150,46,0.08)" />
            </linearGradient>
            <radialGradient id="coverBloom" cx="78%" cy="18%" r="42%">
              <stop offset="0%" stopColor="rgba(184,150,46,0.18)" />
              <stop offset="100%" stopColor="rgba(184,150,46,0)" />
            </radialGradient>
          </defs>
          <rect width="420" height="594" fill="url(#coverField)" />
          <rect width="420" height="594" fill="url(#coverGoldWash)" />
          <rect width="420" height="594" fill="url(#coverBloom)" />

          {/* Fine perspective grid */}
          {Array.from({ length: 14 }).map((_, i) => (
            <line
              key={`v-${i}`}
              x1={30 + i * 28}
              y1={0}
              x2={30 + i * 28}
              y2={594}
              stroke="rgba(20,24,32,0.035)"
              strokeWidth="1"
            />
          ))}
          {Array.from({ length: 18 }).map((_, i) => (
            <line
              key={`h-${i}`}
              x1={0}
              y1={20 + i * 32}
              x2={420}
              y2={20 + i * 32}
              stroke="rgba(20,24,32,0.03)"
              strokeWidth="1"
            />
          ))}

          {/* Large architectural circle — right field */}
          <circle
            cx="340"
            cy="160"
            r="118"
            fill="none"
            stroke="rgba(184,150,46,0.28)"
            strokeWidth="1"
          />
          <circle
            cx="340"
            cy="160"
            r="88"
            fill="none"
            stroke="rgba(184,150,46,0.16)"
            strokeWidth="1"
            strokeDasharray="3 5"
          />
          <circle
            cx="340"
            cy="160"
            r="42"
            fill="none"
            stroke="rgba(184,150,46,0.35)"
            strokeWidth="1.2"
          />

          {/* Sun / array rays */}
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i * Math.PI * 2) / 12 - Math.PI / 2;
            const x1 = 340 + Math.cos(a) * 52;
            const y1 = 160 + Math.sin(a) * 52;
            const x2 = 340 + Math.cos(a) * 108;
            const y2 = 160 + Math.sin(a) * 108;
            return (
              <line
                key={`ray-${i}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="rgba(184,150,46,0.22)"
                strokeWidth="0.8"
              />
            );
          })}

          {/* Abstract panel row */}
          {[0, 1, 2, 3, 4].map((i) => (
            <rect
              key={`panel-${i}`}
              x={248 + i * 22}
              y={268}
              width={18}
              height={28}
              rx="1"
              fill="none"
              stroke="rgba(184,150,46,0.32)"
              strokeWidth="0.9"
              transform={`rotate(-8 ${257 + i * 22} 282)`}
            />
          ))}

          {/* Bottom horizon rule */}
          <line
            x1="40"
            y1="520"
            x2="380"
            y2="520"
            stroke="rgba(184,150,46,0.25)"
            strokeWidth="1"
          />
        </svg>
      </div>

      <div className={styles.coverFrame} aria-hidden />

      {/* Top meta rail */}
      <header className={styles.coverTopRail}>
        <span className={styles.coverSeries}>PREMIUM LUXE · PRIVATE OFFER</span>
        <span className={styles.coverConfidential}>CONFIDENTIAL</span>
      </header>

      {/* Brand monument — hero signal */}
      <div className={styles.coverBrandMonument}>
        <p className={styles.coverBrandPrimary}>{brandPrimary}</p>
        <p className={styles.coverBrandSecondary}>{brandSecondary}</p>
        <div className={styles.coverBrandRule} />
        <p className={styles.coverBrandDiscipline}>Energy Architecture</p>
      </div>

      {/* Client dedication */}
      <div className={styles.coverDedication}>
        <span className={styles.coverPrepared}>Prepared exclusively for</span>
        <h1 className={styles.coverClientName}>{client}</h1>
        <p className={styles.coverOfferLine}>
          A private rooftop solar proposal — engineered for yield, warranty, and
          lasting value.
        </p>
      </div>

      {/* Bottom meta */}
      <footer className={styles.coverMeta}>
        <div className={styles.coverMetaCell}>
          <span>System</span>
          <strong className={styles.luxeNum}>
            {formatLuxeKw(systemKw)} kW AC
          </strong>
        </div>
        <div className={styles.coverMetaDivider} aria-hidden />
        <div className={styles.coverMetaCell}>
          <span>Location</span>
          <strong>{location}</strong>
        </div>
        <div className={styles.coverMetaDivider} aria-hidden />
        <div className={styles.coverMetaCell}>
          <span>Year</span>
          <strong className={styles.luxeNum}>{year}</strong>
        </div>
      </footer>
    </section>
  );
}

export default ObsidianCover;
