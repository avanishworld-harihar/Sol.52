"use client";

/**
 * Quantum — south-facing schematic roof array (Glass3D).
 * Compass N-up: panel long edge E–W, tilt face toward South (bottom).
 * Iso floor grid for 3D depth. No under-panel structure shapes.
 * Schematic only — not Design Studio / live SLD.
 */

import styles from "./Quantum.module.css";

const MAX_DRAW = 18;

type Pt = { x: number; y: number };

/**
 * Screen basis aligned to compass (N up, S down, E right-down, W left-up).
 * Panel u = East (landscape), v = South (tilt face toward sun / bottom).
 */
const EAST_X = 48;
const EAST_Y = 12;
const SOUTH_X = 0;
const SOUTH_Y = 16;

function LuxPanel({ cx, cy }: { cx: number; cy: number }) {
  const thick = 2;

  const at = (u: number, v: number, z = 0): Pt => ({
    x: cx + EAST_X * u + SOUTH_X * v,
    y: cy + EAST_Y * u + SOUTH_Y * v + z,
  });
  const poly = (...pts: Pt[]) => pts.map((p) => `${p.x},${p.y}`).join(" ");

  const p0 = at(0, 0); // NW
  const p1 = at(1, 0); // NE
  const p2 = at(1, 1); // SE (south edge)
  const p3 = at(0, 1); // SW (south edge)

  const inset = 0.042;
  const g0 = at(inset, inset);
  const g1 = at(1 - inset, inset);
  const g2 = at(1 - inset, 1 - inset);
  const g3 = at(inset, 1 - inset);

  const cellCols = 8;
  const cellRows = 4;
  const cells: { pts: string; fill: string }[] = [];
  for (let r = 0; r < cellRows; r++) {
    for (let c = 0; c < cellCols; c++) {
      const u0 = inset + ((1 - 2 * inset) * c) / cellCols + 0.002;
      const u1 = inset + ((1 - 2 * inset) * (c + 1)) / cellCols - 0.002;
      const v0 = inset + ((1 - 2 * inset) * r) / cellRows + 0.002;
      const v1 = inset + ((1 - 2 * inset) * (r + 1)) / cellRows - 0.002;
      const tone =
        r === cellRows - 1
          ? 0.32 + (c % 2) * 0.04 // brighter south edge (sun face)
          : 0.14 + ((c + r) % 3) * 0.05;
      cells.push({
        pts: poly(at(u0, v0), at(u1, v0), at(u1, v1), at(u0, v1)),
        fill: `rgba(10,145,175,${tone})`,
      });
    }
  }

  const bus: string[] = [];
  for (const t of [0.15, 0.32, 0.5, 0.68, 0.85]) {
    const a = at(t, inset + 0.03);
    const b = at(t, 1 - inset - 0.03);
    bus.push(`M ${a.x},${a.y} L ${b.x},${b.y}`);
  }

  return (
    <g>
      {/* South + east thickness only — no posts / floor plates */}
      <polygon
        points={poly(p3, p2, at(1, 1, thick), at(0, 1, thick))}
        fill="#02060a"
      />
      <polygon
        points={poly(p1, p2, at(1, 1, thick), at(1, 0, thick))}
        fill="#0a1520"
      />

      <polygon
        points={poly(p0, p1, p2, p3)}
        fill="url(#qPanelFrame)"
        stroke="rgba(226,232,240,0.75)"
        strokeWidth="0.65"
      />

      <polygon points={poly(g0, g1, g2, g3)} fill="url(#qPanelGlass)" />

      {cells.map((cell, i) => (
        <polygon
          key={i}
          points={cell.pts}
          fill={cell.fill}
          stroke="rgba(2,14,22,0.75)"
          strokeWidth="0.28"
        />
      ))}

      <path
        d={bus.join(" ")}
        fill="none"
        stroke="rgba(186,230,253,0.32)"
        strokeWidth="0.45"
        strokeLinecap="round"
      />

      {/* Accent south rim — faces compass S */}
      <path
        d={`M ${g3.x},${g3.y} L ${g2.x},${g2.y}`}
        fill="none"
        stroke="rgba(34,211,238,0.75)"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <polygon
        points={poly(g0, g1, g2, g3)}
        fill="none"
        stroke="rgba(34,211,238,0.35)"
        strokeWidth="0.4"
      />

      <line
        x1={g0.x + EAST_X * 0.06}
        y1={g0.y + EAST_Y * 0.06 + 0.4}
        x2={g0.x + EAST_X * 0.52}
        y2={g0.y + EAST_Y * 0.52 + 0.4}
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="1.55"
        strokeLinecap="round"
      />
      <line
        x1={g0.x + EAST_X * 0.1}
        y1={g0.y + EAST_Y * 0.1 + 1.7}
        x2={g0.x + EAST_X * 0.38}
        y2={g0.y + EAST_Y * 0.38 + 1.7}
        stroke="rgba(103,232,249,0.42)"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
    </g>
  );
}

/** Isometric diamond floor grid aligned to E/S basis. */
function IsoFloorGrid() {
  const lines: string[] = [];
  const ox = 40;
  const oy = 48;
  const cols = 11;
  const rows = 9;
  const stepU = 26;
  const stepV = 18;

  for (let i = 0; i <= cols; i++) {
    const a = {
      x: ox + (EAST_X / 48) * stepU * i,
      y: oy + (EAST_Y / 48) * stepU * i,
    };
    const b = {
      x: a.x + (SOUTH_X / 16) * stepV * rows,
      y: a.y + (SOUTH_Y / 16) * stepV * rows,
    };
    lines.push(`M ${a.x},${a.y} L ${b.x},${b.y}`);
  }
  for (let j = 0; j <= rows; j++) {
    const a = {
      x: ox + (SOUTH_X / 16) * stepV * j,
      y: oy + (SOUTH_Y / 16) * stepV * j,
    };
    const b = {
      x: a.x + (EAST_X / 48) * stepU * cols,
      y: a.y + (EAST_Y / 48) * stepU * cols,
    };
    lines.push(`M ${a.x},${a.y} L ${b.x},${b.y}`);
  }

  return (
    <g opacity="0.55">
      <path
        d={lines.join(" ")}
        fill="none"
        stroke="rgba(6,182,212,0.22)"
        strokeWidth="0.55"
      />
      {/* Horizon depth fade */}
      <rect x="8" y="8" width="304" height="80" fill="url(#qGridFade)" />
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

  // Columns = East, rows = North (away from south face)
  const stepColX = EAST_X + 4;
  const stepColY = EAST_Y + 1;
  const stepRowX = -SOUTH_X + 2;
  const stepRowY = -(SOUTH_Y + 1);

  const arrayW = (cols - 1) * stepColX + (rows - 1) * stepRowX + EAST_X;
  const arrayH =
    Math.abs((cols - 1) * stepColY) +
    Math.abs((rows - 1) * stepRowY) +
    SOUTH_Y;
  const isoOriginX = 160 - arrayW / 2;
  // Place bank so south face sits toward bottom of scene
  const isoOriginY = 100 - arrayH / 2 + (rows - 1) * Math.abs(stepRowY) * 0.15;

  const panelPositions = Array.from({ length: modulesDraw }).map((_, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return {
      cx: isoOriginX + col * stepColX + row * stepRowX,
      cy: isoOriginY + col * stepColY + row * stepRowY,
    };
  });
  // Draw north rows first so south-facing fronts occlude
  panelPositions.sort((a, b) => a.cy - b.cy || a.cx - b.cx);

  const bankSouthX =
    isoOriginX +
    ((cols - 1) * stepColX) / 2 +
    EAST_X / 2 +
    ((rows - 1) * stepRowX) / 2;
  const bankSouthY =
    isoOriginY +
    ((cols - 1) * stepColY) / 2 +
    SOUTH_Y +
    ((rows - 1) * stepRowY) / 2 +
    8;

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
        <radialGradient id="qSceneGlow" cx="50%" cy="48%" r="58%">
          <stop offset="0%" stopColor="rgba(6,182,212,0.12)" />
          <stop offset="55%" stopColor="rgba(6,100,140,0.04)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
        <linearGradient id="qPanelGlass" x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0%" stopColor="#1a4a5e" />
          <stop offset="35%" stopColor="#0e3040" />
          <stop offset="70%" stopColor="#071820" />
          <stop offset="100%" stopColor="#02080e" />
        </linearGradient>
        <linearGradient id="qPanelFrame" x1="0" y1="0" x2="0.1" y2="1">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="40%" stopColor="#cbd5e1" />
          <stop offset="75%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
        <linearGradient id="qRoofFloor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0e1824" />
          <stop offset="100%" stopColor="#03070c" />
        </linearGradient>
        <linearGradient id="qGridFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(3,7,12,0.55)" />
          <stop offset="100%" stopColor="rgba(3,7,12,0)" />
        </linearGradient>
        <linearGradient id="qCaptionBar" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(2,8,14,0.15)" />
          <stop offset="40%" stopColor="rgba(2,8,14,0.82)" />
          <stop offset="100%" stopColor="rgba(2,8,14,0.15)" />
        </linearGradient>
      </defs>

      <rect width="320" height="240" fill="url(#qRoofFloor)" rx="8" />
      <IsoFloorGrid />
      <rect width="320" height="240" fill="url(#qSceneGlow)" rx="8" />

      {panelPositions.map((p, i) => (
        <LuxPanel key={i} cx={p.cx} cy={p.cy} />
      ))}

      {/* South cue — tilt faces this way (matches compass S) */}
      <g transform={`translate(${bankSouthX}, ${Math.min(198, bankSouthY + 10)})`}>
        <path
          d="M0 0 L6 10 L2 10 L2 18 L-2 18 L-2 10 L-6 10 Z"
          fill="#22D3EE"
          opacity="0.9"
        />
        <text
          y="30"
          textAnchor="middle"
          fill="#67E8F9"
          fontSize="7"
          fontWeight="700"
          letterSpacing="1"
        >
          SOUTH
        </text>
      </g>

      {/* Compass — N up, S down */}
      <g transform="translate(36,34)">
        <circle
          r="20"
          fill="rgba(4,10,16,0.94)"
          stroke="rgba(34,211,238,0.75)"
          strokeWidth="0.9"
        />
        <circle r="14" fill="none" stroke="rgba(6,182,212,0.28)" strokeWidth="0.5" />
        <line
          x1="0"
          y1="-12"
          x2="0"
          y2="12"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="0.45"
        />
        <line
          x1="-12"
          y1="0"
          x2="12"
          y2="0"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="0.45"
        />
        <polygon points="0,-11 2.8,-1.4 0,-3.2 -2.8,-1.4" fill="#22D3EE" />
        <polygon points="0,11 2.2,2 0,3.8 -2.2,2" fill="#475569" />
        <text
          y="-13.5"
          textAnchor="middle"
          fill="#22D3EE"
          fontSize="6.2"
          fontWeight="700"
        >
          N
        </text>
        <text y="19" textAnchor="middle" fill="#94a3b8" fontSize="5.5" fontWeight="600">
          S
        </text>
        <text x="15" y="3" textAnchor="middle" fill="#64748b" fontSize="5">
          E
        </text>
        <text x="-15" y="3" textAnchor="middle" fill="#64748b" fontSize="5">
          W
        </text>
      </g>
      <text
        x="36"
        y="68"
        textAnchor="middle"
        fill="#67E8F9"
        fontSize="6.5"
        letterSpacing="1"
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
        letterSpacing="0.4"
      >
        {modules} modules · {kwLabel} kWp DC · {strings}×{perString} string · South
        face · {panelWatt}W
      </text>
    </svg>
  );
}
