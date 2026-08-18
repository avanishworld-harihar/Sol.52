"use client";

/**
 * Voltaic E-101 visuals.
 *
 * Two drawings no other preset carries: an exploded section through the
 * mounting assembly (what actually sits between the module and the roof slab),
 * and a tilt/row-pitch geometry diagram with the wind case called out.
 */

import styles from "./voltaic.module.css";

type StackLabels = {
  module: string;
  moduleNote: string;
  clamp: string;
  clampNote: string;
  rail: string;
  railNote: string;
  leg: string;
  legNote: string;
  base: string;
  baseNote: string;
  slab: string;
  slabNote: string;
  title: string;
  scale: string;
};

/* Layout columns: legend | callout | drawing | dimensions */
const LEGEND_X = 4;
const CALLOUT_X = 176;
const DRAW_X = 210;

/** Exploded section — layers pulled apart with leader lines, like an assembly detail. */
export function VoltaicStackDiagram({ labels }: { labels: StackLabels }) {
  const layers = [
    { y: 10, label: labels.module, note: labels.moduleNote },
    { y: 66, label: labels.clamp, note: labels.clampNote },
    { y: 108, label: labels.rail, note: labels.railNote },
    { y: 150, label: labels.leg, note: labels.legNote },
    { y: 196, label: labels.base, note: labels.baseNote },
    { y: 238, label: labels.slab, note: labels.slabNote },
  ];

  return (
    <svg viewBox="0 0 760 300" className={styles.voltaicStackSvg} role="img" aria-label={labels.title}>
      <defs>
        <linearGradient id="vtGlass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2C6FA8" />
          <stop offset="100%" stopColor="#123E68" />
        </linearGradient>
        <pattern id="vtCells" width="26" height="18" patternUnits="userSpaceOnUse">
          <rect width="26" height="18" fill="url(#vtGlass)" />
          <rect width="24" height="16" x="1" y="1" fill="none" stroke="#5FC8F5" strokeWidth="0.5" opacity="0.55" />
        </pattern>
        <pattern id="vtConcrete" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="#5FC8F5" strokeWidth="0.6" opacity="0.35" />
        </pattern>
      </defs>

      {/* ── 1 · PV module ── */}
      <g transform={`translate(${DRAW_X} 10)`}>
        <polygon points="0,26 220,0 300,18 80,44" fill="url(#vtCells)" stroke="#7FD8FF" strokeWidth="1.1" />
        <polygon points="0,26 0,32 80,50 80,44" fill="#0B2F52" stroke="#7FD8FF" strokeWidth="0.8" />
        <polygon points="80,44 80,50 300,24 300,18" fill="#0A2843" stroke="#7FD8FF" strokeWidth="0.8" />
        <text x="314" y="30" className={styles.voltaicStackDim}>2278 × 1134 mm</text>
      </g>

      {/* ── 2 · Mid / end clamps ── */}
      <g transform={`translate(${DRAW_X} 66)`}>
        {[40, 130, 220].map((x) => (
          <g key={x} transform={`translate(${x} ${Math.round(24 - x * 0.115)})`}>
            <rect x="-9" y="-6" width="18" height="11" rx="1.5" fill="#0E3A61" stroke="#7FD8FF" strokeWidth="1" />
            <rect x="-3" y="-12" width="6" height="7" rx="1" fill="#FF6A2B" />
          </g>
        ))}
        <text x="314" y="18" className={styles.voltaicStackDim}>M8 SS 304</text>
      </g>

      {/* ── 3 · Rails ── */}
      <g transform={`translate(${DRAW_X} 106)`}>
        <polygon points="6,24 224,-1 224,7 6,32" fill="#0E3A61" stroke="#7FD8FF" strokeWidth="1.1" />
        <polygon points="76,42 296,16 296,24 76,50" fill="#0B3050" stroke="#7FD8FF" strokeWidth="1.1" />
        <text x="314" y="24" className={styles.voltaicStackDim}>Al 6063-T6</text>
      </g>

      {/* ── 4 · Support legs ── */}
      <g transform={`translate(${DRAW_X} 150)`}>
        {[26, 116, 206].map((x, i) => (
          <line
            key={x}
            x1={x}
            y1={24 - x * 0.115}
            x2={x + 6}
            y2={24 - x * 0.115 + 30 - i * 4}
            stroke="#7FD8FF"
            strokeWidth="3"
            strokeLinecap="round"
          />
        ))}
        <text x="314" y="26" className={styles.voltaicStackDim}>HDG MS ≥80 µm</text>
      </g>

      {/* ── 5 · Base plate + chemical anchor ── */}
      <g transform={`translate(${DRAW_X} 196)`}>
        {[24, 114, 204].map((x, i) => (
          <g key={x} transform={`translate(${x} ${16 - x * 0.09 + i})`}>
            <polygon points="-14,0 12,-4 26,3 0,7" fill="#0E3A61" stroke="#7FD8FF" strokeWidth="1" />
            <line x1="4" y1="4" x2="4" y2="14" stroke="#FF6A2B" strokeWidth="2.4" />
          </g>
        ))}
        <text x="314" y="16" className={styles.voltaicStackDim}>M12 · sealed</text>
      </g>

      {/* ── 6 · RCC slab ── */}
      <g transform={`translate(${DRAW_X} 240)`}>
        <polygon points="-24,26 216,-2 320,22 80,50" fill="url(#vtConcrete)" stroke="#7FD8FF" strokeWidth="1.2" />
        <polygon points="-24,26 -24,33 80,57 80,50" fill="#08243D" stroke="#7FD8FF" strokeWidth="0.9" />
        <polygon points="80,50 80,57 320,29 320,22" fill="#071E33" stroke="#7FD8FF" strokeWidth="0.9" />
        <text x="334" y="28" className={styles.voltaicStackDim}>RCC + waterproofing</text>
      </g>

      {/* ── Legend column: label, note, numbered callout, leader ── */}
      {layers.map((layer, i) => {
        const y = layer.y + 26;
        return (
          <g key={layer.label}>
            <text x={LEGEND_X} y={y - 5} className={styles.voltaicStackLabel}>
              {layer.label}
            </text>
            <text x={LEGEND_X} y={y + 9} className={styles.voltaicStackNote}>
              {layer.note}
            </text>
            <line
              x1={LEGEND_X}
              y1={y + 16}
              x2={CALLOUT_X - 12}
              y2={y + 16}
              stroke="#5FC8F5"
              strokeWidth="0.6"
              opacity="0.3"
            />
            <circle cx={CALLOUT_X} cy={y + 2} r="10" fill="#FF6A2B" />
            <text x={CALLOUT_X} y={y + 6} className={styles.voltaicStackNum}>
              {i + 1}
            </text>
            <line
              x1={CALLOUT_X + 12}
              y1={y + 2}
              x2={DRAW_X - 4}
              y2={y + 2}
              stroke="#5FC8F5"
              strokeWidth="0.9"
              opacity="0.65"
            />
          </g>
        );
      })}
    </svg>
  );
}

type GeometryLabels = {
  tilt: string;
  pitch: string;
  clearance: string;
  wind: string;
  uplift: string;
  south: string;
  shadow: string;
  title: string;
};

/** Tilt, row pitch, shadow and the wind uplift case in one section view. */
export function VoltaicGeometryDiagram({
  labels,
  tiltDeg,
  rowPitchM,
  clearanceMm,
  windKmph,
  upliftN,
}: {
  labels: GeometryLabels;
  tiltDeg: number;
  rowPitchM: number;
  clearanceMm: number;
  windKmph: number;
  upliftN: number;
}) {
  const tilt = Math.max(8, Math.min(35, tiltDeg));
  const rad = (tilt * Math.PI) / 180;
  const len = 128;
  const baseY = 132;
  const x0 = 150;
  const x1 = x0 + Math.cos(rad) * len;
  const y1 = baseY - Math.sin(rad) * len;
  const shadow = Math.round(Math.sin(rad) * len * 1.8);
  const row2 = Math.round(shadow + 40);

  return (
    <svg viewBox="0 0 760 200" className={styles.voltaicGeomSvg} role="img" aria-label={labels.title}>
      <defs>
        <marker id="vtDim" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M0,4 L8,1 L8,7 Z" fill="#5FC8F5" />
        </marker>
        <marker id="vtWind" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="#FF6A2B" />
        </marker>
      </defs>

      {/* Roof datum with hatching */}
      <line x1="30" y1={baseY} x2="600" y2={baseY} stroke="#7FD8FF" strokeWidth="1.4" />
      {Array.from({ length: 29 }).map((_, i) => (
        <line
          key={i}
          x1={30 + i * 20}
          y1={baseY}
          x2={23 + i * 20}
          y2={baseY + 8}
          stroke="#5FC8F5"
          strokeWidth="0.7"
          opacity="0.4"
        />
      ))}

      {/* Module row 1 with tilt arc */}
      <line x1={x0} y1={baseY} x2={x1} y2={y1} stroke="#7FD8FF" strokeWidth="5" strokeLinecap="round" />
      <line x1={x0} y1={baseY} x2={x1} y2={baseY} stroke="#5FC8F5" strokeWidth="0.8" strokeDasharray="4 4" opacity="0.6" />
      <line x1={x1} y1={baseY} x2={x1} y2={y1} stroke="#5FC8F5" strokeWidth="0.8" strokeDasharray="4 4" opacity="0.6" />
      <path
        d={`M ${x0 + 36} ${baseY} A 36 36 0 0 0 ${x0 + Math.cos(rad) * 36} ${baseY - Math.sin(rad) * 36}`}
        fill="none"
        stroke="#FF6A2B"
        strokeWidth="1.6"
      />

      {/* Module row 2 */}
      <g transform={`translate(${row2} 0)`}>
        <line x1={x0} y1={baseY} x2={x1} y2={y1} stroke="#7FD8FF" strokeWidth="5" strokeLinecap="round" opacity="0.7" />
      </g>

      {/* Winter shadow between rows */}
      <line x1={x1} y1={baseY} x2={x1 + shadow} y2={baseY} stroke="#FF6A2B" strokeWidth="2.4" opacity="0.5" />

      {/* Row pitch dimension, below the datum */}
      <line
        x1={x0}
        y1={baseY + 26}
        x2={x0 + row2}
        y2={baseY + 26}
        stroke="#5FC8F5"
        strokeWidth="0.9"
        markerStart="url(#vtDim)"
        markerEnd="url(#vtDim)"
      />
      <text x={x0 + row2 / 2} y={baseY + 40} className={styles.voltaicGeomDim} textAnchor="middle">
        {labels.pitch} · {rowPitchM.toFixed(2)} m
      </text>

      {/* Clearance under array — dimension sits left of the first row */}
      <line
        x1={x0 - 26}
        y1={baseY}
        x2={x0 - 26}
        y2={baseY - 34}
        stroke="#5FC8F5"
        strokeWidth="0.9"
        markerStart="url(#vtDim)"
        markerEnd="url(#vtDim)"
      />
      <text x={x0 - 34} y={baseY - 21} className={styles.voltaicGeomLabel} textAnchor="end">
        {labels.clearance}
      </text>
      <text x={x0 - 34} y={baseY - 8} className={styles.voltaicGeomDim} textAnchor="end">
        {clearanceMm} mm
      </text>

      {/* Legend column on the right, clear of the geometry */}
      <g transform="translate(620 24)">
        <text x="0" y="0" className={styles.voltaicGeomLabel}>{labels.tilt}</text>
        <text x="0" y="17" className={styles.voltaicGeomTilt}>{tilt}°</text>

        <text x="0" y="46" className={styles.voltaicGeomLabel}>{labels.wind}</text>
        <text x="0" y="63" className={styles.voltaicGeomTilt}>{windKmph} km/h</text>

        <text x="0" y="90" className={styles.voltaicGeomLabel}>{labels.uplift}</text>
        <text x="0" y="106" className={styles.voltaicGeomDim}>≈ {upliftN} N</text>

        <line x1="0" y1="124" x2="34" y2="124" stroke="#FF6A2B" strokeWidth="1.6" markerEnd="url(#vtWind)" />
        <text x="0" y="146" className={styles.voltaicGeomDim}>{labels.shadow}</text>
      </g>

      {/* South marker, top-left away from the dimensions */}
      <g transform="translate(48 44)">
        <circle cx="0" cy="0" r="16" fill="none" stroke="#7FD8FF" strokeWidth="1" />
        <path d="M0,-12 L4,0 L0,12 L-4,0 Z" fill="#FF6A2B" />
        <text x="0" y="30" className={styles.voltaicGeomDim} textAnchor="middle">
          {labels.south}
        </text>
      </g>
    </svg>
  );
}
