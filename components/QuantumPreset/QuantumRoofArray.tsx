"use client";

/**
 * Quantum — luxury schematic roof array (Glass3D).
 * Larger flush modules — no terrace slab / shapes under panels.
 * Schematic only — not Design Studio / live SLD.
 */

import styles from "./Quantum.module.css";

const MAX_DRAW = 18;

type Pt = { x: number; y: number };

/** Larger luxury module — glass mosaic + platinum frame. No mounts / under-shapes. */
function LuxPanel({ cx, cy }: { cx: number; cy: number }) {
  const rightX = 50;
  const rightY = 13.2;
  const downX = -16.5;
  const downY = 12;
  const thick = 1.8;

  const at = (u: number, v: number, z = 0): Pt => ({
    x: cx + rightX * u + downX * v,
    y: cy + rightY * u + downY * v + z,
  });
  const poly = (...pts: Pt[]) => pts.map((p) => `${p.x},${p.y}`).join(" ");

  const p0 = at(0, 0);
  const p1 = at(1, 0);
  const p2 = at(1, 1);
  const p3 = at(0, 1);

  const inset = 0.045;
  const g0 = at(inset, inset);
  const g1 = at(1 - inset, inset);
  const g2 = at(1 - inset, 1 - inset);
  const g3 = at(inset, 1 - inset);

  const cellCols = 8;
  const cellRows = 4;
  const cells: string[] = [];
  for (let r = 0; r < cellRows; r++) {
    for (let c = 0; c < cellCols; c++) {
      const u0 = inset + ((1 - 2 * inset) * c) / cellCols + 0.003;
      const u1 = inset + ((1 - 2 * inset) * (c + 1)) / cellCols - 0.003;
      const v0 = inset + ((1 - 2 * inset) * r) / cellRows + 0.003;
      const v1 = inset + ((1 - 2 * inset) * (r + 1)) / cellRows - 0.003;
      cells.push(poly(at(u0, v0), at(u1, v0), at(u1, v1), at(u0, v1)));
    }
  }

  const bus: string[] = [];
  for (const t of [0.16, 0.33, 0.5, 0.67, 0.84]) {
    const a = at(t, inset + 0.02);
    const b = at(t, 1 - inset - 0.02);
    bus.push(`M ${a.x},${a.y} L ${b.x},${b.y}`);
  }

  return (
    <g>
      {/* Slim depth edge only */}
      <polygon
        points={poly(p3, p2, at(1, 1, thick), at(0, 1, thick))}
        fill="#03070c"
      />
      <polygon
        points={poly(p1, p2, at(1, 1, thick), at(1, 0, thick))}
        fill="#0a1620"
      />

      <polygon
        points={poly(p0, p1, p2, p3)}
        fill="url(#qPanelFrame)"
        stroke="rgba(226,232,240,0.7)"
        strokeWidth="0.6"
      />

      <polygon points={poly(g0, g1, g2, g3)} fill="url(#qPanelGlass)" />

      {cells.map((pts, i) => (
        <polygon
          key={i}
          points={pts}
          fill={
            i % 5 === 0
              ? "rgba(14,140,175,0.28)"
              : i % 3 === 0
                ? "rgba(8,110,145,0.2)"
                : "rgba(4,80,110,0.14)"
          }
          stroke="rgba(2,14,22,0.7)"
          strokeWidth="0.25"
        />
      ))}

      <path
        d={bus.join(" ")}
        fill="none"
        stroke="rgba(186,230,253,0.28)"
        strokeWidth="0.4"
        strokeLinecap="round"
      />

      <polygon
        points={poly(g0, g1, g2, g3)}
        fill="none"
        stroke="rgba(34,211,238,0.5)"
        strokeWidth="0.5"
      />

      <line
        x1={g0.x + rightX * 0.05}
        y1={g0.y + rightY * 0.05 + 0.5}
        x2={g0.x + rightX * 0.5}
        y2={g0.y + rightY * 0.5 + 0.5}
        stroke="rgba(255,255,255,0.48)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1={g0.x + rightX * 0.08}
        y1={g0.y + rightY * 0.08 + 1.8}
        x2={g0.x + rightX * 0.36}
        y2={g0.y + rightY * 0.36 + 1.8}
        stroke="rgba(103,232,249,0.4)"
        strokeWidth="0.85"
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

  const stepColX = 52;
  const stepColY = 14;
  const stepRowX = -18;
  const stepRowY = 17;

  const arrayW = (cols - 1) * stepColX + (rows - 1) * stepRowX + 50;
  const arrayH = (cols - 1) * stepColY + (rows - 1) * stepRowY + 26;
  const isoOriginX = 168 - arrayW / 2;
  const isoOriginY = 118 - arrayH / 2;

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
        <radialGradient id="qSceneGlow" cx="50%" cy="46%" r="55%">
          <stop offset="0%" stopColor="rgba(6,182,212,0.14)" />
          <stop offset="55%" stopColor="rgba(6,100,140,0.05)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
        <linearGradient id="qPanelGlass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#245a70" />
          <stop offset="30%" stopColor="#123848" />
          <stop offset="65%" stopColor="#081c28" />
          <stop offset="100%" stopColor="#02080e" />
        </linearGradient>
        <linearGradient id="qPanelFrame" x1="0" y1="0" x2="0.15" y2="1">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="40%" stopColor="#cbd5e1" />
          <stop offset="75%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
        <linearGradient id="qRoofFloor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0c1522" />
          <stop offset="100%" stopColor="#02060c" />
        </linearGradient>
        <linearGradient id="qCaptionBar" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(2,8,14,0.15)" />
          <stop offset="40%" stopColor="rgba(2,8,14,0.8)" />
          <stop offset="100%" stopColor="rgba(2,8,14,0.15)" />
        </linearGradient>
        <pattern
          id="qIsoGrid"
          width="26"
          height="15"
          patternUnits="userSpaceOnUse"
          patternTransform="skewX(-28)"
        >
          <path
            d="M0 15V0H26"
            fill="none"
            stroke="rgba(6,182,212,0.06)"
            strokeWidth="0.45"
          />
        </pattern>
      </defs>

      <rect width="320" height="240" fill="url(#qRoofFloor)" rx="8" />
      <rect x="6" y="6" width="308" height="202" fill="url(#qIsoGrid)" rx="6" />
      <rect width="320" height="240" fill="url(#qSceneGlow)" rx="8" />

      {panelPositions.map((p, i) => (
        <LuxPanel key={i} cx={p.cx} cy={p.cy} />
      ))}

      <g transform="translate(34,32)">
        <circle
          r="20"
          fill="rgba(4,10,16,0.92)"
          stroke="rgba(34,211,238,0.75)"
          strokeWidth="0.9"
        />
        <circle r="14" fill="none" stroke="rgba(6,182,212,0.28)" strokeWidth="0.5" />
        <circle r="2.2" fill="#06B6D4" opacity="0.35" />
        <line
          x1="0"
          y1="-12"
          x2="0"
          y2="12"
          stroke="rgba(255,255,255,0.16)"
          strokeWidth="0.45"
        />
        <line
          x1="-12"
          y1="0"
          x2="12"
          y2="0"
          stroke="rgba(255,255,255,0.16)"
          strokeWidth="0.45"
        />
        <polygon points="0,-11 2.8,-1.4 0,-3.2 -2.8,-1.4" fill="#22D3EE" />
        <text
          y="-13.5"
          textAnchor="middle"
          fill="#22D3EE"
          fontSize="6.2"
          fontWeight="700"
          letterSpacing="0.8"
        >
          N
        </text>
        <text y="18.5" textAnchor="middle" fill="#64748b" fontSize="5">
          S
        </text>
      </g>
      <text
        x="34"
        y="66"
        textAnchor="middle"
        fill="#67E8F9"
        fontSize="6.5"
        letterSpacing="1.1"
        fontWeight="600"
      >
        180° S · {tilt.toFixed(0)}°
      </text>

      <rect x="0" y="214" width="320" height="26" fill="url(#qCaptionBar)" />
      <line
        x1="24"
        y1="214"
        x2="296"
        y2="214"
        stroke="rgba(34,211,238,0.22)"
        strokeWidth="0.7"
      />
      <text
        x="160"
        y="231"
        textAnchor="middle"
        fill="#e2e8f0"
        fontSize="9.5"
        fontFamily="ui-sans-serif,system-ui,sans-serif"
        letterSpacing="0.45"
      >
        {modules} modules · {kwLabel} kWp DC · {strings}×{perString} string · South ·{" "}
        {panelWatt}W
      </text>
    </svg>
  );
}
