"use client";

import styles from "./Jaali.module.css";

/** South section of an elevated GI MMS table — one plane, walkable under. Not a top-view sticker sheet. */
export function JaaliSunSection({
  tiltDeg,
  walkLabel,
  southLabel,
  tiltCaption,
}: {
  tiltDeg: number;
  walkLabel: string;
  southLabel: string;
  tiltCaption: string;
}) {
  const tilt = tiltDeg > 0 ? Math.min(30, Math.max(14, tiltDeg)) : 20;

  return (
    <svg
      className={styles.sunSvg}
      viewBox="0 0 720 210"
      role="img"
      aria-hidden
    >
      <rect x="0" y="0" width="720" height="210" fill="#f3ead8" />
      <circle cx="86" cy="40" r="22" fill="#c45c32" opacity="0.92" />
      <g stroke="#c45c32" strokeWidth="1.6" opacity="0.55">
        <line x1="108" y1="48" x2="248" y2="92" />
        <line x1="102" y1="58" x2="236" y2="108" />
        <line x1="96" y1="66" x2="220" y2="118" />
      </g>
      <line
        x1="70"
        y1="72"
        x2="210"
        y2="148"
        stroke="#6b5e4e"
        strokeWidth="1.2"
        strokeDasharray="4 4"
        opacity="0.45"
      />

      <rect x="40" y="168" width="640" height="16" fill="#ead9c1" />
      <rect x="40" y="184" width="640" height="6" fill="#d4c2a4" />

      <g fill="#7a8a94">
        <rect x="228" y="118" width="7" height="50" />
        <rect x="292" y="118" width="7" height="50" />
        <rect x="356" y="118" width="7" height="50" />
        <rect x="420" y="118" width="7" height="50" />
      </g>

      <g transform={`translate(210 138) rotate(-${tilt})`}>
        <rect x="0" y="-26" width="268" height="26" fill="#3a3228" />
        <rect x="0" y="-26" width="268" height="3" fill="#b08d3e" />
        <g stroke="#ead9c1" strokeWidth="1" opacity="0.35">
          <line x1="44" y1="-26" x2="44" y2="0" />
          <line x1="88" y1="-26" x2="88" y2="0" />
          <line x1="132" y1="-26" x2="132" y2="0" />
          <line x1="176" y1="-26" x2="176" y2="0" />
          <line x1="220" y1="-26" x2="220" y2="0" />
        </g>
      </g>

      <rect x="528" y="142" width="36" height="26" fill="#3a3228" rx="1" />
      <rect x="534" y="148" width="24" height="8" fill="#b08d3e" />
      <path d="M568 155 H620" stroke="#b08d3e" strokeWidth="2" fill="none" />
      <path d="M612 149 L620 155 L612 161" stroke="#b08d3e" strokeWidth="2" fill="none" />

      <text x="210" y="162" fill="#6b5e4e" fontSize="9" fontWeight="700" letterSpacing="1.2">
        {walkLabel}
      </text>
      <text x="40" y="202" fill="#b44a2a" fontSize="10" fontWeight="800" letterSpacing="1.6">
        {southLabel}
      </text>
      <text x="248" y="78" fill="#2a2118" fontSize="10" fontWeight="700" letterSpacing="0.8">
        {tiltCaption}
      </text>
      <text x="628" y="142" fill="#6b5e4e" fontSize="9" fontWeight="700" textAnchor="end">
        AC
      </text>
    </svg>
  );
}
