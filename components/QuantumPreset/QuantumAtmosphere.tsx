"use client";

/**
 * Soft blurred scene layers behind Quantum glass panels.
 * Each variant matches the page purpose (not random decoration).
 */

import styles from "./Quantum.module.css";

export type QuantumAtmosphereVariant = "cover" | "engineering" | "finance";

export function QuantumAtmosphere({
  variant,
}: {
  variant: QuantumAtmosphereVariant;
}) {
  if (variant === "cover") {
    /* Soft cyan blooms only — photoreal rooftop is the hero */
    return (
      <div className={styles.atmosphere} aria-hidden>
        <div className={styles.atmBloom} />
        <div className={styles.atmBloomAlt} />
        <div className={styles.atmVignette} />
      </div>
    );
  }

  if (variant === "engineering") {
    /* Blurred interconnection field — ghosts the PV→INV→NET path */
    return (
      <div className={styles.atmosphere} aria-hidden>
        <div className={styles.atmBloomEng} />
        <div className={styles.atmSceneBlur}>
          <svg
            className={styles.atmSvgFill}
            viewBox="0 0 320 240"
            preserveAspectRatio="xMidYMid slice"
          >
            {/* Soft isometric tech grid = engineering blueprint field */}
            <g stroke="rgba(6,182,212,0.35)" strokeWidth="0.7" fill="none">
              {Array.from({ length: 14 }).map((_, i) => (
                <path
                  key={`h-${i}`}
                  d={`M0 ${20 + i * 16} H320`}
                  opacity={0.35 + (i % 3) * 0.08}
                />
              ))}
              {Array.from({ length: 12 }).map((_, i) => (
                <path
                  key={`v-${i}`}
                  d={`M${16 + i * 26} 0 V240`}
                  opacity={0.25 + (i % 2) * 0.1}
                />
              ))}
            </g>
            {/* Ghost topology nodes */}
            <g fill="rgba(6,182,212,0.18)" stroke="rgba(34,211,238,0.45)" strokeWidth="2">
              <rect x="36" y="88" width="56" height="56" rx="12" />
              <rect x="132" y="88" width="56" height="56" rx="12" />
              <rect x="228" y="88" width="56" height="56" rx="12" />
            </g>
            <path
              d="M92 116 H132 M188 116 H228"
              stroke="rgba(6,182,212,0.55)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Soft irradiance arcs */}
            <path
              d="M40 200 Q160 120 280 200"
              stroke="rgba(34,211,238,0.35)"
              strokeWidth="8"
              fill="none"
            />
            <path
              d="M50 210 Q160 150 270 210"
              stroke="rgba(6,182,212,0.2)"
              strokeWidth="14"
              fill="none"
            />
          </svg>
        </div>
        <div className={styles.atmVignette} />
      </div>
    );
  }

  /* finance — blurred yield curve / capital growth field */
  return (
    <div className={styles.atmosphere} aria-hidden>
      <div className={styles.atmBloomFin} />
      <div className={styles.atmSceneBlur}>
        <svg
          className={styles.atmSvgFill}
          viewBox="0 0 320 240"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="qYieldFill" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.35" />
            </linearGradient>
          </defs>
          {/* Ascending bars = capital recovery silhouette */}
          {[48, 72, 64, 96, 88, 120, 110, 142, 136, 168].map((h, i) => (
            <rect
              key={i}
              x={28 + i * 28}
              y={210 - h}
              width="18"
              height={h}
              rx="4"
              fill="rgba(6,182,212,0.22)"
              stroke="rgba(34,211,238,0.35)"
              strokeWidth="1"
            />
          ))}
          {/* Smooth lifetime wealth curve */}
          <path
            d="M20 190 C 70 170, 110 140, 150 120 S 230 70, 300 40"
            stroke="rgba(34,211,238,0.55)"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M20 190 C 70 170, 110 140, 150 120 S 230 70, 300 40 L 300 220 L 20 220 Z"
            fill="url(#qYieldFill)"
          />
          <circle cx="300" cy="40" r="10" fill="#22d3ee" opacity="0.55" />
        </svg>
      </div>
      <div className={styles.atmVignette} />
    </div>
  );
}

export default QuantumAtmosphere;
