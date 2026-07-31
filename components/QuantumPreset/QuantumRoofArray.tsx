"use client";

/**
 * Quantum — schematic roof array (Glass3D).
 * Flush crystalline modules on terrace — no GI legs / structure under panels.
 * Schematic only — not Design Studio / live SLD.
 */

import styles from "./Quantum.module.css";

const MAX_DRAW = 18;

/** Premium flush isometric module — cell mosaic + thin frame, no mounts. */
function IsoPanel({ cx, cy }: { cx: number; cy: number }) {
  const rightX = 38;
  const rightY = 10.5;
  const downX = -13;
  const downY = 9.5;
  const thick = 1.35;

  const corner = (u: number, v: number, z = 0) => ({
    x: cx + rightX * u + downX * v,
    y: cy + rightY * u + downY * v + z,
  });

  const p0 = corner(0, 0);
  const p1 = corner(1, 0);
  const p2 = corner(1, 1);
  const p3 = corner(0, 1);
  const t1 = corner(1, 0, thick);
  const t2 = corner(1, 1, thick);
  const t3 = corner(0, 1, thick);

  const inset = 0.055;
  const cols = 6;
  const rows = 3;
  const cells: { pts: string; fill: string }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const u0 = inset + ((1 - 2 * inset) * c) / cols;
      const u1 = inset + ((1 - 2 * inset) * (c + 1)) / cols;
      const v0 = inset + ((1 - 2 * inset) * r) / rows;
      const v1 = inset + ((1 - 2 * inset) * (r + 1)) / rows;
      const a = corner(u0, v0);
      const b = corner(u1, v0);
      const d = corner(u1, v1);
      const e = corner(u0, v1);
      const tone = 0.14 + ((c + r) % 3) * 0.04;
      cells.push({
        pts: `${a.x},${a.y} ${b.x},${b.y} ${d.x},${d.y} ${e.x},${e.y}`,
        fill: `rgba(6,140,170,${tone})`,
      });
    }
  }

  const g0 = corner(inset, inset);
  const g1 = corner(1 - inset, inset);
  const g2 = corner(1 - inset, 1 - inset);
  const g3 = corner(inset, 1 - inset);

  // Soft contact shadow matching panel footprint (not legs)
  const s0 = corner(0.05, 0.08, thick + 2.2);
  const s1 = corner(0.95, 0.08, thick + 2.2);
  const s2 = corner(0.95, 0.95, thick + 2.8);
  const s3 = corner(0.05, 0.95, thick + 2.8);

  return (
    <g>
      <polygon
        points={`${s0.x},${s0.y} ${s1.x},${s1.y} ${s2.x},${s2.y} ${s3.x},${s3.y}`}
        fill="rgba(0,0,0,0.38)"
      />

      {/* Slim depth edge only — no posts */}
      <polygon
        points={`${p3.x},${p3.y} ${p2.x},${p2.y} ${t2.x},${t2.y} ${t3.x},${t3.y}`}
        fill="#050c12"
      />
      <polygon
        points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${t2.x},${t2.y} ${t1.x},${t1.y}`}
        fill="#0a1620"
      />

      {/* Aluminium frame */}
      <polygon
        points={`${p0.x},${p0.y} ${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`}
        fill="url(#qPanelFrame)"
        stroke="rgba(200,214,228,0.5)"
        strokeWidth="0.5"
      />

      {/* Glass face */}
      <polygon
        points={`${g0.x},${g0.y} ${g1.x},${g1.y} ${g2.x},${g2.y} ${g3.x},${g3.y}`}
        fill="url(#qPanelGlass)"
      />
      {cells.map((cell, i) => (
        <polygon key={i} points={cell.pts} fill={cell.fill} stroke="rgba(8,20,30,0.55)" strokeWidth="0.28" />
      ))}

      {/* Specular band */}
      <line
        x1={g0.x + rightX * 0.06}
        y1={g0.y + rightY * 0.06 + 0.6}
        x2={g0.x + rightX * 0.45}
        y2={g0.y + rightY * 0.45 + 0.6}
        stroke="rgba(255,255,255,0.28)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <line
        x1={g0.x + rightX * 0.1}
        y1={g0.y + rightY * 0.1 + 1.4}
        x2={g0.x + rightX * 0.32}
        y2={g0.y + rightY * 0.32 + 1.4}
        stroke="rgba(103,232,249,0.22)"
        strokeWidth="0.7"
        strokeLinecap="round"
      />
    </g>
  );
}

export type QuantumRoofArrayProps = {
  modules: number;
  dcKwp: number;
  tilt: number;
  panelWatt: number;
  strings: number;
  perString: number;
};

export function QuantumRoofArray({
  modules,
  dcKwp,
  tilt,
  panelWatt,
  strings,
  perString,
}: QuantumRoofArrayProps) {
  const modulesDraw = Math.min(Math.max(1, modules), MAX_DRAW);
  const preferredRows = modulesDraw <= 4 ? 1 : modulesDraw <= 12 ? 2 : 3;
  const cols = Math.max(1, Math.ceil(modulesDraw / preferredRows));
  const rows = Math.ceil(modulesDraw / cols);

  const stepColX = 40;
  const stepColY = 11;
  const stepRowX = -14.5;
  const stepRowY = 14;

  const arrayW = (cols - 1) * stepColX + (rows - 1) * stepRowX + 38;
  const arrayH = (cols - 1) * stepColY + (rows - 1) * stepRowY + 20;
  const isoOriginX = 170 - arrayW / 2;
  const isoOriginY = 148 - arrayH / 2;

  const panelPositions = Array.from({ length: modulesDraw }).map((_, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return {
      cx: isoOriginX + col * stepColX + row * stepRowX,
      cy: isoOriginY + col * stepColY + row * stepRowY,
    };
  });
  panelPositions.sort((a, b) => a.cy - b.cy || a.cx - b.cx);

  const kwLabel = dcKwp % 1 ? dcKwp.toFixed(2) : dcKwp.toFixed(0);

  return (
    <svg
      viewBox="0 0 320 240"
      width="100%"
      height="228"
      className={styles.engSvgDark}
      aria-hidden
    >
      <defs>
        <linearGradient id="qPanelGlass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#163a4a" />
          <stop offset="40%" stopColor="#0a2432" />
          <stop offset="100%" stopColor="#030a10" />
        </linearGradient>
        <linearGradient id="qPanelFrame" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="40%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id="qRoofFloor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a121c" />
          <stop offset="100%" stopColor="#03060a" />
        </linearGradient>
        <linearGradient id="qRoofSlab" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1c2838" />
          <stop offset="100%" stopColor="#0c141e" />
        </linearGradient>
        <pattern
          id="qIsoGrid"
          width="28"
          height="16"
          patternUnits="userSpaceOnUse"
          patternTransform="skewX(-30)"
        >
          <path
            d="M0 16V0H28"
            fill="none"
            stroke="rgba(6,182,212,0.09)"
            strokeWidth="0.5"
          />
        </pattern>
      </defs>

      <rect width="320" height="240" fill="url(#qRoofFloor)" rx="6" />
      <rect x="8" y="8" width="304" height="200" fill="url(#qIsoGrid)" rx="4" />

      <polygon
        points="40,172 158,114 296,166 178,224"
        fill="url(#qRoofSlab)"
        opacity="0.95"
      />
      <polygon
        points="40,172 158,114 296,166 178,180 40,180"
        fill="rgba(6,182,212,0.05)"
      />
      <path
        d="M40 172 L158 114 L296 166"
        fill="none"
        stroke="rgba(6,182,212,0.32)"
        strokeWidth="1"
      />
      <path
        d="M40 172 L178 224 L296 166"
        fill="none"
        stroke="rgba(255,255,255,0.07)"
        strokeWidth="0.85"
      />

      {panelPositions.map((p, i) => (
        <IsoPanel key={i} cx={p.cx} cy={p.cy} />
      ))}

      <g transform="translate(36,34)">
        <circle r="18" fill="rgba(4,10,16,0.9)" stroke="#06B6D4" strokeWidth="0.85" />
        <circle r="12.5" fill="none" stroke="rgba(6,182,212,0.3)" strokeWidth="0.5" />
        <line x1="0" y1="-11" x2="0" y2="11" stroke="rgba(255,255,255,0.18)" strokeWidth="0.5" />
        <line x1="-11" y1="0" x2="11" y2="0" stroke="rgba(255,255,255,0.18)" strokeWidth="0.5" />
        <polygon points="0,-10 2.6,-1.2 0,-3 -2.6,-1.2" fill="#06B6D4" />
        <text y="-12.5" textAnchor="middle" fill="#06B6D4" fontSize="6" fontWeight="700">
          N
        </text>
        <text y="18" textAnchor="middle" fill="#64748b" fontSize="5">
          S
        </text>
      </g>
      <text
        x="36"
        y="66"
        textAnchor="middle"
        fill="#06B6D4"
        fontSize="6.5"
        letterSpacing="0.9"
        fontWeight="600"
      >
        180° S · {tilt.toFixed(0)}°
      </text>

      <rect x="0" y="214" width="320" height="26" fill="rgba(0,0,0,0.55)" />
      <text
        x="160"
        y="231"
        textAnchor="middle"
        fill="#cbd5e1"
        fontSize="9.5"
        fontFamily="system-ui,sans-serif"
        letterSpacing="0.3"
      >
        {modules} modules · {kwLabel} kWp DC · {strings}×{perString} string · South ·{" "}
        {panelWatt}W
      </text>
    </svg>
  );
}
