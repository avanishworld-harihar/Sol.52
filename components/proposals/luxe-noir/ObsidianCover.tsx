"use client";

/**
 * Premium Luxe — Cover (Page 01).
 * Editorial folio: vendor-first, porcelain field, gold spine, rooftop illustration.
 */

import type { ProposalData } from "@/lib/proposal-data";
import { formatLuxeKw } from "./luxe-format";
import { resolveLuxeVendorName } from "./luxe-vendor";
import { useLuxeLang } from "./luxe-lang-context";
import { luxeDisplayFont } from "./luxe-fonts";
import styles from "./luxe.module.css";

export type ObsidianCoverProps = {
  data: ProposalData;
};

function CoverRoofArt() {
  return (
    <svg
      className={styles.coverArt}
      viewBox="0 0 280 200"
      fill="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="coverRoofFace" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2a3d55" />
          <stop offset="100%" stopColor="#141820" />
        </linearGradient>
      </defs>

      {/* Soft ground */}
      <ellipse cx="140" cy="178" rx="110" ry="12" fill="rgba(20,24,32,0.06)" />

      {/* House mass */}
      <path
        d="M40 150 L40 108 L140 58 L240 108 L240 150 Z"
        fill="#F8F9FB"
        stroke="#141820"
        strokeWidth="1.4"
      />
      <path
        d="M40 108 L140 58 L240 108"
        fill="none"
        stroke="#B8962E"
        strokeWidth="1.6"
      />

      {/* Landscape panels on roof */}
      {[0, 1, 2, 3].map((i) => {
        const x = 88 + i * 28;
        return (
          <g key={i}>
            <rect
              x={x}
              y={78 + i * 2.2}
              width="24"
              height="14"
              rx="1"
              fill="url(#coverRoofFace)"
              stroke="#B8962E"
              strokeWidth="0.9"
              transform={`rotate(-18 ${x + 12} ${85 + i * 2.2})`}
            />
          </g>
        );
      })}

      {/* Sun arc */}
      <circle
        cx="214"
        cy="48"
        r="18"
        fill="none"
        stroke="#B8962E"
        strokeWidth="1.2"
      />
      <circle cx="214" cy="48" r="6" fill="rgba(184,150,46,0.35)" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const a = (deg * Math.PI) / 180;
        return (
          <line
            key={deg}
            x1={214 + Math.cos(a) * 22}
            y1={48 + Math.sin(a) * 22}
            x2={214 + Math.cos(a) * 28}
            y2={48 + Math.sin(a) * 28}
            stroke="#B8962E"
            strokeWidth="1"
          />
        );
      })}

      {/* Door hint */}
      <rect
        x="126"
        y="122"
        width="28"
        height="28"
        fill="none"
        stroke="#141820"
        strokeWidth="1.2"
      />
    </svg>
  );
}

export function ObsidianCover({ data }: ObsidianCoverProps) {
  const { copy, isHi } = useLuxeLang();
  const vendor =
    resolveLuxeVendorName(data) || (isHi ? "सोलर पार्टनर" : "Solar Partner");
  const client =
    data.meta.customerName?.trim() ||
    (isHi ? "सम्मानित ग्राहक" : "Valued Customer");
  const systemKw = Number(data.meta.systemKw) || 3;
  const location =
    data.meta.locationLine && data.meta.locationLine !== "—"
      ? data.meta.locationLine.replace(/,\s*India$/i, "").trim()
      : "Madhya Pradesh";
  const year = new Date().getFullYear();
  const longName = vendor.length > 18;

  return (
    <section
      className={`${styles.a4Page} ${styles.obsidianCover} ${luxeDisplayFont.variable}`}
    >
      <div className={styles.coverSpine} aria-hidden />

      <div className={styles.coverAtmosphere} aria-hidden>
        <div className={styles.coverWash} />
        <div className={styles.coverCornerTL} />
        <div className={styles.coverCornerBR} />
      </div>

      <header className={styles.coverTopRail}>
        <span className={styles.coverSeries}>{copy.cover.series}</span>
        <span className={styles.coverConfidential}>{copy.cover.confidential}</span>
      </header>

      <div className={styles.coverMain}>
        <div className={styles.coverBrandBlock}>
          <span className={styles.coverVendorLabel}>{copy.cover.vendor}</span>
          <h1
            className={`${styles.coverVendorName} ${
              longName ? styles.coverVendorNameLong : ""
            }`}
          >
            {vendor}
          </h1>
          <div className={styles.coverBrandRule} />
          <p className={styles.coverBrandDiscipline}>{copy.cover.discipline}</p>
        </div>

        <div className={styles.coverArtWrap}>
          <CoverRoofArt />
        </div>
      </div>

      <div className={styles.coverDedication}>
        <span className={styles.coverPrepared}>{copy.cover.preparedFor}</span>
        <h2 className={styles.coverClientName}>{client}</h2>
        <p className={styles.coverOfferLine}>{copy.cover.offer}</p>
      </div>

      <footer className={styles.coverMeta}>
        <div className={styles.coverMetaCell}>
          <span>{copy.cover.system}</span>
          <strong className={styles.luxeNum}>{formatLuxeKw(systemKw)} kW</strong>
        </div>
        <div className={styles.coverMetaDivider} aria-hidden />
        <div className={styles.coverMetaCell}>
          <span>{copy.cover.location}</span>
          <strong>{location}</strong>
        </div>
        <div className={styles.coverMetaDivider} aria-hidden />
        <div className={styles.coverMetaCell}>
          <span>{copy.cover.year}</span>
          <strong className={styles.luxeNum}>{year}</strong>
        </div>
      </footer>
    </section>
  );
}

export default ObsidianCover;
