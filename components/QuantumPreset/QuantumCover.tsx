"use client";

/**
 * Quantum Cover — cinematic neo-glass folio with structural PV wireframe.
 */

import type { ProposalData } from "@/lib/proposal-data";
import styles from "./Quantum.module.css";

export type QuantumCoverProps = {
  data: ProposalData;
};

/** Structural wireframe of a rooftop solar array — print-safe inline SVG. */
function SolarArrayWireframe() {
  const modules: { x: number; y: number }[] = [];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 6; col++) {
      modules.push({
        x: 40 + col * 52 + row * 8,
        y: 60 + row * 38,
      });
    }
  }

  return (
    <svg
      className={styles.coverWireframe}
      viewBox="0 0 420 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="qWireGlow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.15" />
        </linearGradient>
        <radialGradient id="qWireAura" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="210" cy="200" r="180" fill="url(#qWireAura)" />

      {/* Perspective roof plane */}
      <path
        d="M48 110 L360 78 L390 290 L72 340 Z"
        stroke="url(#qWireGlow)"
        strokeWidth="1.2"
        fill="rgba(6,182,212,0.03)"
      />
      <path
        d="M72 340 L390 290 L390 312 L72 362 Z"
        stroke="rgba(6,182,212,0.35)"
        strokeWidth="1"
        fill="rgba(15,23,42,0.4)"
      />

      {/* Rafter / purlin grid */}
      {[0, 1, 2, 3, 4].map((i) => (
        <line
          key={`rail-${i}`}
          x1={70 + i * 14}
          y1={130 + i * 42}
          x2={350 + i * 8}
          y2={105 + i * 40}
          stroke="rgba(6,182,212,0.22)"
          strokeWidth="0.8"
        />
      ))}

      {/* Module wireframes */}
      {modules.map((m, i) => {
        const w = 44;
        const h = 28;
        const skew = 10;
        return (
          <g key={`mod-${i}`} opacity={0.85 - (i % 7) * 0.04}>
            <path
              d={`M${m.x} ${m.y} L${m.x + w} ${m.y - 4} L${m.x + w - skew} ${m.y + h} L${m.x - skew} ${m.y + h + 4} Z`}
              stroke="#06b6d4"
              strokeWidth="0.9"
              fill="rgba(6,182,212,0.05)"
            />
            <line
              x1={m.x + w * 0.33}
              y1={m.y - 1.2}
              x2={m.x + w * 0.33 - skew * 0.55}
              y2={m.y + h + 1.5}
              stroke="rgba(34,211,238,0.35)"
              strokeWidth="0.5"
            />
            <line
              x1={m.x + w * 0.66}
              y1={m.y - 2.5}
              x2={m.x + w * 0.66 - skew * 0.55}
              y2={m.y + h + 0.5}
              stroke="rgba(34,211,238,0.35)"
              strokeWidth="0.5"
            />
          </g>
        );
      })}

      {/* DC string bus annotation */}
      <path
        d="M86 318 C140 300, 220 286, 310 268"
        stroke="#22d3ee"
        strokeWidth="1.4"
        strokeDasharray="4 3"
        fill="none"
      />
      <circle cx="310" cy="268" r="3.5" fill="#06b6d4" />
      <text
        x="318"
        y="264"
        fill="#94a3b8"
        fontSize="9"
        fontFamily="JetBrains Mono, monospace"
        letterSpacing="1.2"
      >
        DC STRING BUS
      </text>

      {/* Corner ticks */}
      <path d="M28 28 H58 M28 28 V58" stroke="#06b6d4" strokeWidth="1.2" />
      <path d="M392 28 H362 M392 28 V58" stroke="#06b6d4" strokeWidth="1.2" />
      <path d="M28 392 H58 M28 392 V362" stroke="#06b6d4" strokeWidth="1.2" />
      <path d="M392 392 H362 M392 392 V362" stroke="#06b6d4" strokeWidth="1.2" />
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
          <radialGradient id="qCoverBloom" cx="82%" cy="38%" r="45%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="210" height="297" fill="url(#qCoverWash)" />
        <rect width="210" height="297" fill="url(#qCoverBloom)" />
        {/* Fine structural grid */}
        {Array.from({ length: 14 }).map((_, i) => (
          <line
            key={`vg-${i}`}
            x1={12 + i * 14}
            y1="0"
            x2={12 + i * 14}
            y2="297"
            stroke="rgba(148,163,184,0.04)"
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
            stroke="rgba(148,163,184,0.04)"
            strokeWidth="0.3"
          />
        ))}
      </svg>
    </div>
  );
}

export function QuantumCover({ data }: QuantumCoverProps) {
  const brand = data.meta.brandName?.trim() || "Harihar Solar";
  const client = data.meta.customerName?.trim() || "Valued Customer";
  const systemKw = Number(data.meta.systemKw) || 0;
  const location =
    data.meta.locationLine && data.meta.locationLine !== "—"
      ? data.meta.locationLine.replace(/,\s*India$/i, "").trim()
      : "Madhya Pradesh";
  const panelWatt = 580;
  const moduleCount =
    systemKw > 0 ? Math.max(1, Math.round((systemKw * 1000) / panelWatt)) : 0;
  const year = new Date().getFullYear();

  return (
    <section className={styles.a4Page}>
      <CoverAtmosphere />
      <SolarArrayWireframe />

      <div className={styles.coverInner}>
        <header className={styles.coverTopRail}>
          <span>QUANTUM · RESIDENTIAL FOLIO</span>
          <span>CONFIDENTIAL · {year}</span>
        </header>

        <div className={styles.coverBrandBlock}>
          <p className={styles.eyebrow}>Cinematic Neo-Glass Proposal</p>
          <h1 className={styles.coverBrandName}>{brand}</h1>
          <p className={styles.coverDiscipline}>
            Precision-engineered rooftop photovoltaic system — structural array
            architecture, inverter telemetry, and capital recovery modeled for
            residential interconnection.
          </p>
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
                {systemKw > 0 ? `${systemKw.toFixed(systemKw % 1 ? 1 : 0)} kW` : "—"}
              </span>
            </div>
            <div className={`${styles.glassPanel} ${styles.coverMetric}`}>
              <span className={styles.coverMetricLabel}>PV Modules</span>
              <span className={styles.coverMetricValueMuted}>
                {moduleCount > 0 ? `${moduleCount} × ${panelWatt}W` : "—"}
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
