"use client";

/**
 * Premium Luxe — Cover (Page 01).
 * Luxury editorial folio: brand-first typography, ink architectural plate,
 * champagne spine — no clip-art house/sun.
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

/** Architectural rooftop plate — refined elevation, not cartoon house. */
function CoverArchitecturePlate({ caption }: { caption: string }) {
  return (
    <svg
      className={styles.coverPlateSvg}
      viewBox="0 0 560 220"
      fill="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="coverPlateBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1a2230" />
          <stop offset="55%" stopColor="#121820" />
          <stop offset="100%" stopColor="#0a0e14" />
        </linearGradient>
        <linearGradient id="coverPanelGlass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3a5a7a" />
          <stop offset="40%" stopColor="#1e3550" />
          <stop offset="100%" stopColor="#0e1a28" />
        </linearGradient>
        <linearGradient id="coverFrameMetal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8ecf2" />
          <stop offset="100%" stopColor="#8a93a0" />
        </linearGradient>
        <linearGradient id="coverVillaFace" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a3344" />
          <stop offset="100%" stopColor="#151c28" />
        </linearGradient>
      </defs>

      <rect width="560" height="220" fill="url(#coverPlateBg)" />

      {/* Fine editorial grid */}
      {Array.from({ length: 12 }).map((_, i) => (
        <line
          key={`v-${i}`}
          x1={40 + i * 42}
          y1="16"
          x2={40 + i * 42}
          y2="196"
          stroke="rgba(184,150,46,0.06)"
          strokeWidth="0.6"
        />
      ))}
      {Array.from({ length: 6 }).map((_, i) => (
        <line
          key={`h-${i}`}
          x1="24"
          y1={28 + i * 28}
          x2="536"
          y2={28 + i * 28}
          stroke="rgba(184,150,46,0.05)"
          strokeWidth="0.6"
        />
      ))}

      {/* Gold plate frame */}
      <rect
        x="18"
        y="14"
        width="524"
        height="192"
        fill="none"
        stroke="rgba(184,150,46,0.45)"
        strokeWidth="1.2"
      />
      <rect
        x="24"
        y="20"
        width="512"
        height="180"
        fill="none"
        stroke="rgba(184,150,46,0.18)"
        strokeWidth="0.7"
      />

      {/* Horizon wash */}
      <ellipse
        cx="280"
        cy="168"
        rx="200"
        ry="28"
        fill="rgba(184,150,46,0.08)"
      />

      {/* Villa mass — quiet modern elevation */}
      <path
        d="M72 168 L72 118 L280 72 L488 118 L488 168 Z"
        fill="url(#coverVillaFace)"
        stroke="#B8962E"
        strokeWidth="1.4"
      />
      <path
        d="M72 118 L280 72 L488 118"
        fill="none"
        stroke="#C9A84A"
        strokeWidth="1.8"
      />
      {/* Facade planes */}
      <path
        d="M72 118 L72 168 L280 168 L280 72 Z"
        fill="rgba(255,255,255,0.03)"
      />
      <path
        d="M280 72 L488 118 L488 168 L280 168 Z"
        fill="rgba(0,0,0,0.18)"
      />

      {/* Window bays */}
      {[0, 1, 2].map((i) => (
        <rect
          key={`w-${i}`}
          x={118 + i * 48}
          y="128"
          width="28"
          height="22"
          fill="rgba(10,14,20,0.55)"
          stroke="rgba(184,150,46,0.35)"
          strokeWidth="0.8"
        />
      ))}
      <rect
        x="340"
        y="126"
        width="36"
        height="26"
        fill="rgba(10,14,20,0.55)"
        stroke="rgba(184,150,46,0.3)"
        strokeWidth="0.8"
      />
      <rect
        x="390"
        y="126"
        width="36"
        height="26"
        fill="rgba(10,14,20,0.55)"
        stroke="rgba(184,150,46,0.3)"
        strokeWidth="0.8"
      />

      {/* Rooftop panel bank — landscape modules with frame + legs hint */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const x = 168 + i * 36;
        const y = 86 + (i % 2) * 1.5;
        return (
          <g key={`p-${i}`}>
            <line
              x1={x + 8}
              y1={y + 18}
              x2={x + 6}
              y2={y + 28}
              stroke="#8a93a0"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <line
              x1={x + 26}
              y1={y + 18}
              x2={x + 28}
              y2={y + 28}
              stroke="#8a93a0"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <rect
              x={x}
              y={y}
              width="32"
              height="16"
              rx="1"
              fill="url(#coverFrameMetal)"
              opacity="0.9"
            />
            <rect
              x={x + 2}
              y={y + 2}
              width="28"
              height="12"
              rx="0.5"
              fill="url(#coverPanelGlass)"
              stroke="#B8962E"
              strokeWidth="0.6"
            />
            <path
              d={`M${x + 7} ${y + 2} V${y + 14} M${x + 14} ${y + 2} V${y + 14} M${x + 21} ${y + 2} V${y + 14} M${x + 2} ${y + 6} H${x + 30} M${x + 2} ${y + 10} H${x + 30}`}
              stroke="rgba(200,220,255,0.2)"
              strokeWidth="0.5"
            />
          </g>
        );
      })}

      {/* Quiet sun disc — no cartoon rays */}
      <circle
        cx="456"
        cy="52"
        r="22"
        fill="rgba(184,150,46,0.12)"
        stroke="rgba(184,150,46,0.55)"
        strokeWidth="1.2"
      />
      <circle cx="456" cy="52" r="8" fill="rgba(184,150,46,0.35)" />

      {/* Plate caption */}
      <text
        x="36"
        y="198"
        fill="rgba(232,236,242,0.75)"
        fontSize="9"
        letterSpacing="2.4"
        fontFamily="system-ui,sans-serif"
        fontWeight="600"
      >
        {caption}
      </text>
      <text
        x="524"
        y="198"
        textAnchor="end"
        fill="#B8962E"
        fontSize="9"
        letterSpacing="1.8"
        fontFamily="system-ui,sans-serif"
        fontWeight="700"
      >
        FOLIO 01
      </text>
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
  const plateCaption = isHi
    ? "निजी रूफटॉप अध्ययन"
    : "PRIVATE ROOFTOP STUDY";

  return (
    <section
      className={`${styles.a4Page} ${styles.obsidianCover} ${luxeDisplayFont.variable}`}
    >
      <div className={styles.coverSpine} aria-hidden />
      <div className={styles.coverAtmosphere} aria-hidden>
        <div className={styles.coverWash} />
        <div className={styles.coverLinen} />
        <div className={styles.coverFrame} />
      </div>

      <header className={styles.coverTopRail}>
        <span className={styles.coverSeries}>{copy.cover.series}</span>
        <span className={styles.coverConfidential}>{copy.cover.confidential}</span>
      </header>
      <div className={styles.coverTopRule} aria-hidden />

      <div className={styles.coverHero}>
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

      <div className={styles.coverPlate}>
        <CoverArchitecturePlate caption={plateCaption} />
      </div>

      <div className={styles.coverDedication}>
        <div className={styles.coverDedicationCopy}>
          <span className={styles.coverPrepared}>{copy.cover.preparedFor}</span>
          <h2 className={styles.coverClientName}>{client}</h2>
          <p className={styles.coverOfferLine}>{copy.cover.offer}</p>
        </div>
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
