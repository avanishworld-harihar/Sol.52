"use client";

/**
 * Quantum Cover — brand-first folio with aerospace geometric focal SVG.
 */

import type { ProposalData } from "@/lib/proposal-data";
import {
  QUANTUM_PANEL_WATT,
  QUANTUM_PRODUCT_MARK,
  quantumModuleCount,
  useQuantumBrand,
} from "./quantum-brand";
import styles from "./Quantum.module.css";

export type QuantumCoverProps = {
  data: ProposalData;
};

/** Massive geometric focal — intersecting circles + precision construction lines. */
function FocalGeometryGraphic() {
  const cx = 240;
  const cy = 178;

  return (
    <svg
      className={styles.coverFocalSvg}
      viewBox="0 0 480 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <radialGradient id="qFocalAura" cx="50%" cy="48%" r="48%">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.32" />
          <stop offset="55%" stopColor="#06b6d4" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
        </radialGradient>
        <filter id="qFocalSoft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <ellipse cx={cx} cy={cy} rx="200" ry="150" fill="url(#qFocalAura)" />

      {/* Precision corner brackets */}
      <path
        d="M36 36 H110 M36 36 V100 M444 36 H370 M444 36 V100 M36 324 H110 M36 324 V260 M444 324 H370 M444 324 V260"
        stroke="#06b6d4"
        strokeWidth="1.8"
      />

      {/* Concentric rings */}
      {[52, 88, 124, 160].map((r) => (
        <circle
          key={`ring-${r}`}
          cx={cx}
          cy={cy}
          r={r}
          stroke="#06b6d4"
          strokeWidth={r === 124 ? 1.6 : 0.9}
          strokeOpacity={r === 124 ? 0.85 : 0.35}
          fill="none"
        />
      ))}

      {/* Intersecting offset circles */}
      <circle
        cx={cx - 56}
        cy={cy - 18}
        r="98"
        stroke="#06b6d4"
        strokeWidth="1.1"
        strokeOpacity="0.55"
        fill="none"
      />
      <circle
        cx={cx + 56}
        cy={cy + 14}
        r="98"
        stroke="#22d3ee"
        strokeWidth="1.1"
        strokeOpacity="0.45"
        fill="none"
      />
      <circle
        cx={cx + 10}
        cy={cy - 62}
        r="72"
        stroke="#06b6d4"
        strokeWidth="0.9"
        strokeOpacity="0.4"
        fill="none"
        strokeDasharray="4 5"
      />

      {/* Precision crosshairs + radials */}
      <line
        x1={cx - 175}
        y1={cy}
        x2={cx + 175}
        y2={cy}
        stroke="#06b6d4"
        strokeWidth="0.7"
        strokeOpacity="0.45"
      />
      <line
        x1={cx}
        y1={cy - 155}
        x2={cx}
        y2={cy + 155}
        stroke="#06b6d4"
        strokeWidth="0.7"
        strokeOpacity="0.45"
      />
      {[22.5, 45, 67.5, 112.5, 135, 157.5].map((deg) => {
        const a = (deg * Math.PI) / 180;
        return (
          <line
            key={`rad-${deg}`}
            x1={cx + Math.cos(a) * 40}
            y1={cy + Math.sin(a) * 40}
            x2={cx + Math.cos(a) * 158}
            y2={cy + Math.sin(a) * 158}
            stroke="#06b6d4"
            strokeWidth="0.55"
            strokeOpacity="0.28"
          />
        );
      })}

      {/* Inner diamond / hex precision mark */}
      <g filter="url(#qFocalSoft)">
        <polygon
          points={`${cx},${cy - 36} ${cx + 32},${cy} ${cx},${cy + 36} ${cx - 32},${cy}`}
          stroke="#22d3ee"
          strokeWidth="1.4"
          fill="rgba(6,182,212,0.08)"
        />
        <circle cx={cx} cy={cy} r="6" fill="#06b6d4" />
        <circle cx={cx} cy={cy} r="14" stroke="#22d3ee" strokeWidth="1" fill="none" />
      </g>

      {/* Tick marks on outer ring */}
      {Array.from({ length: 48 }).map((_, i) => {
        const a = (i / 48) * Math.PI * 2 - Math.PI / 2;
        const major = i % 6 === 0;
        const r0 = 160;
        const r1 = major ? 172 : 166;
        return (
          <line
            key={`tick-${i}`}
            x1={cx + Math.cos(a) * r0}
            y1={cy + Math.sin(a) * r0}
            x2={cx + Math.cos(a) * r1}
            y2={cy + Math.sin(a) * r1}
            stroke="#06b6d4"
            strokeWidth={major ? 1.4 : 0.7}
            strokeOpacity={major ? 0.75 : 0.35}
          />
        );
      })}

      <text
        x={cx}
        y={cy + 198}
        textAnchor="middle"
        fill="#94a3b8"
        fontSize="11"
        fontFamily="JetBrains Mono, monospace"
        letterSpacing="3"
      >
        STRUCTURAL ARRAY GEOMETRY
      </text>
    </svg>
  );
}

function CoverAtmosphere() {
  return (
    <div className={styles.atmosphere} aria-hidden>
      <svg width="100%" height="100%" viewBox="0 0 210 297" preserveAspectRatio="none">
        <defs>
          <linearGradient id="qCoverWash" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="55%" stopColor="#111827" />
            <stop offset="100%" stopColor="#0b1220" />
          </linearGradient>
          <radialGradient id="qCoverBloom" cx="50%" cy="38%" r="48%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="210" height="297" fill="url(#qCoverWash)" />
        <rect width="210" height="297" fill="url(#qCoverBloom)" />
        {Array.from({ length: 14 }).map((_, i) => (
          <line
            key={`vg-${i}`}
            x1={12 + i * 14}
            y1="0"
            x2={12 + i * 14}
            y2="297"
            stroke="rgba(148,163,184,0.045)"
            strokeWidth="0.3"
          />
        ))}
        {Array.from({ length: 18 }).map((_, i) => (
          <line
            key={`hg-${i}`}
            x1="0"
            y1={10 + i * 16}
            x2="210"
            y2={10 + i * 16}
            stroke="rgba(148,163,184,0.045)"
            strokeWidth="0.3"
          />
        ))}
      </svg>
    </div>
  );
}

export function QuantumCover({ data }: QuantumCoverProps) {
  const brand = useQuantumBrand(data);
  const client = data.meta.customerName?.trim() || "Valued Customer";
  const systemKw = Number(data.meta.systemKw) || 0;
  const location =
    data.meta.locationLine && data.meta.locationLine !== "—"
      ? data.meta.locationLine.replace(/,\s*India$/i, "").trim()
      : "Madhya Pradesh";
  const moduleCount = quantumModuleCount(systemKw);
  const year = new Date().getFullYear();

  return (
    <section className={styles.a4Page}>
      <CoverAtmosphere />

      <div className={styles.coverInner}>
        <header className={styles.coverTopRail}>
          <span>
            {QUANTUM_PRODUCT_MARK} · QUANTUM FOLIO
          </span>
          <span>CONFIDENTIAL · {year}</span>
        </header>

        <div className={styles.coverBrandBlock}>
          <p className={styles.eyebrow}>Rooftop Solar Proposal</p>
          <h1 className={styles.coverBrandName}>{brand}</h1>
          <p className={styles.coverDiscipline}>
            A clear residential offer — system design, interconnection path, and
            payback modelled for your Madhya Pradesh rooftop.
          </p>
        </div>

        <div className={styles.coverFocal}>
          <FocalGeometryGraphic />
        </div>

        <div className={styles.coverClientStack}>
          <div className={`${styles.glassPanel} ${styles.coverClientGlass}`}>
            <span className={styles.coverPrepared}>Prepared for</span>
            <h2 className={styles.coverClientName}>{client}</h2>
          </div>

          <div className={styles.coverCapacityRow}>
            <div className={`${styles.glassPanel} ${styles.coverMetric}`}>
              <span className={styles.coverMetricLabel}>AC System Capacity</span>
              <span className={styles.coverMetricValue}>
                {systemKw > 0
                  ? `${systemKw.toFixed(systemKw % 1 ? 1 : 0)} kW`
                  : "—"}
              </span>
            </div>
            <div className={`${styles.glassPanel} ${styles.coverMetric}`}>
              <span className={styles.coverMetricLabel}>PV Modules</span>
              <span className={styles.coverMetricValueMuted}>
                {moduleCount > 0
                  ? `${moduleCount} × ${QUANTUM_PANEL_WATT}W N-Type TOPCon`
                  : "—"}
              </span>
            </div>
            <div className={`${styles.glassPanel} ${styles.coverMetric}`}>
              <span className={styles.coverMetricLabel}>Site Locale</span>
              <span className={styles.coverMetricValueMuted}>{location}</span>
            </div>
          </div>
        </div>

        <footer className={styles.pageFooter}>
          <span className={styles.pageFooterAccent}>{brand.toUpperCase()}</span>
          <span>01 / 03 · COVER</span>
        </footer>
      </div>
    </section>
  );
}

export default QuantumCover;
