"use client";

/**
 * Quantum — south-facing schematic roof array (Glass3D).
 * Compass N-up: long edge E–W, tilt face South. No SOUTH arrow cue.
 * Mature crystalline modules — not cartoon neon cells.
 * Schematic only — not Design Studio / live SLD.
 */

import { useQuantumLang } from "./quantum-lang-context";
import styles from "./Quantum.module.css";

const MAX_DRAW = 18;

type Pt = { x: number; y: number };

/** N-up compass basis: u = East, v = South. */
const EAST_X = 46;
const EAST_Y = 11.5;
const SOUTH_X = 0;
const SOUTH_Y = 15.5;

function LuxPanel({ cx, cy }: { cx: number; cy: number }) {
  const thick = 1.7;

  const at = (u: number, v: number, z = 0): Pt => ({
    x: cx + EAST_X * u + SOUTH_X * v,
    y: cy + EAST_Y * u + SOUTH_Y * v + z,
  });
  const poly = (...pts: Pt[]) => pts.map((p) => `${p.x},${p.y}`).join(" ");

  const p0 = at(0, 0);
  const p1 = at(1, 0);
  const p2 = at(1, 1);
  const p3 = at(0, 1);

  const inset = 0.05;
  const g0 = at(inset, inset);
  const g1 = at(1 - inset, inset);
  const g2 = at(1 - inset, 1 - inset);
  const g3 = at(inset, 1 - inset);

  // Fine TOPCon mosaic — deep navy, subtle variation (no neon glow fills)
  const cellCols = 10;
  const cellRows = 5;
  const cells: { pts: string; fill: string }[] = [];
  for (let r = 0; r < cellRows; r++) {
    for (let c = 0; c < cellCols; c++) {
      const u0 = inset + ((1 - 2 * inset) * c) / cellCols + 0.0015;
      const u1 = inset + ((1 - 2 * inset) * (c + 1)) / cellCols - 0.0015;
      const v0 = inset + ((1 - 2 * inset) * r) / cellRows + 0.0015;
      const v1 = inset + ((1 - 2 * inset) * (r + 1)) / cellRows - 0.0015;
      const shade = 0.08 + ((c + r * 2) % 4) * 0.025 + r * 0.012;
      cells.push({
        pts: poly(at(u0, v0), at(u1, v0), at(u1, v1), at(u0, v1)),
        fill: `rgba(20,55,78,${shade})`,
      });
    }
  }

  const bus: string[] = [];
  for (const t of [0.125, 0.292, 0.458, 0.625, 0.792, 0.958]) {
    if (t >= 1 - inset) continue;
    const a = at(t, inset + 0.02);
    const b = at(t, 1 - inset - 0.02);
    bus.push(`M ${a.x},${a.y} L ${b.x},${b.y}`);
  }

  return (
    <g>
      <polygon
        points={poly(p3, p2, at(1, 1, thick), at(0, 1, thick))}
        fill="#05080c"
      />
      <polygon
        points={poly(p1, p2, at(1, 1, thick), at(1, 0, thick))}
        fill="#121a24"
      />

      {/* Brushed aluminium frame */}
      <polygon
        points={poly(p0, p1, p2, p3)}
        fill="url(#qPanelFrame)"
        stroke="rgba(180,190,205,0.55)"
        strokeWidth="0.5"
      />

      {/* Deep crystalline glass */}
      <polygon points={poly(g0, g1, g2, g3)} fill="url(#qPanelGlass)" />

      {cells.map((cell, i) => (
        <polygon
          key={i}
          points={cell.pts}
          fill={cell.fill}
          stroke="rgba(4,12,20,0.55)"
          strokeWidth="0.2"
        />
      ))}

      <path
        d={bus.join(" ")}
        fill="none"
        stroke="rgba(160,190,210,0.18)"
        strokeWidth="0.35"
        strokeLinecap="round"
      />

      {/* Quiet edge — no neon rim */}
      <polygon
        points={poly(g0, g1, g2, g3)}
        fill="none"
        stroke="rgba(100,140,165,0.35)"
        strokeWidth="0.35"
      />

      {/* Soft specular only */}
      <line
        x1={g0.x + EAST_X * 0.07}
        y1={g0.y + EAST_Y * 0.07 + 0.35}
        x2={g0.x + EAST_X * 0.42}
        y2={g0.y + EAST_Y * 0.42 + 0.35}
        stroke="rgba(255,255,255,0.28)"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </g>
  );
}

function IsoFloorGrid() {
  const lines: string[] = [];
  const ox = 42;
  const oy = 50;
  const cols = 11;
  const rows = 9;
  const stepU = 26;
  const stepV = 18;

  for (let i = 0; i <= cols; i++) {
    const a = {
      x: ox + (EAST_X / 46) * stepU * i,
      y: oy + (EAST_Y / 46) * stepU * i,
    };
    const b = {
      x: a.x + (SOUTH_X / 15.5) * stepV * rows,
      y: a.y + (SOUTH_Y / 15.5) * stepV * rows,
    };
    lines.push(`M ${a.x},${a.y} L ${b.x},${b.y}`);
  }
  for (let j = 0; j <= rows; j++) {
    const a = {
      x: ox + (SOUTH_X / 15.5) * stepV * j,
      y: oy + (SOUTH_Y / 15.5) * stepV * j,
    };
    const b = {
      x: a.x + (EAST_X / 46) * stepU * cols,
      y: a.y + (EAST_Y / 46) * stepU * cols,
    };
    lines.push(`M ${a.x},${a.y} L ${b.x},${b.y}`);
  }

  return (
    <g opacity="0.4">
      <path
        d={lines.join(" ")}
        fill="none"
        stroke="rgba(100,140,170,0.28)"
        strokeWidth="0.5"
      />
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
  const { copy } = useQuantumLang();
  const modulesDraw = Math.min(Math.max(1, modules), MAX_DRAW);
  const preferredRows = modulesDraw <= 4 ? 1 : modulesDraw <= 12 ? 2 : 3;
  const cols = Math.max(1, Math.ceil(modulesDraw / preferredRows));
  const rows = Math.ceil(modulesDraw / cols);

  const stepColX = EAST_X + 3.5;
  const stepColY = EAST_Y + 0.8;
  const stepRowX = -SOUTH_X + 1.5;
  const stepRowY = -(SOUTH_Y + 0.8);

  const arrayW = (cols - 1) * stepColX + (rows - 1) * stepRowX + EAST_X;
  const arrayH =
    Math.abs((cols - 1) * stepColY) +
    Math.abs((rows - 1) * stepRowY) +
    SOUTH_Y;
  const isoOriginX = 160 - arrayW / 2;
  const isoOriginY = 102 - arrayH / 2 + (rows - 1) * Math.abs(stepRowY) * 0.12;

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
        <radialGradient id="qSceneGlow" cx="50%" cy="48%" r="58%">
          <stop offset="0%" stopColor="rgba(40,70,95,0.14)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
        <linearGradient id="qPanelGlass" x1="0" y1="0" x2="0.15" y2="1">
          <stop offset="0%" stopColor="#1c3a4c" />
          <stop offset="40%" stopColor="#0d2432" />
          <stop offset="100%" stopColor="#040a10" />
        </linearGradient>
        <linearGradient id="qPanelFrame" x1="0" y1="0" x2="0.1" y2="1">
          <stop offset="0%" stopColor="#e8edf2" />
          <stop offset="45%" stopColor="#a8b4c0" />
          <stop offset="100%" stopColor="#4a5564" />
        </linearGradient>
        <linearGradient id="qRoofFloor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0c141e" />
          <stop offset="100%" stopColor="#03060a" />
        </linearGradient>
        <linearGradient id="qGridFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(3,6,10,0.6)" />
          <stop offset="100%" stopColor="rgba(3,6,10,0)" />
        </linearGradient>
        <linearGradient id="qCaptionBar" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(2,8,14,0.12)" />
          <stop offset="40%" stopColor="rgba(2,8,14,0.8)" />
          <stop offset="100%" stopColor="rgba(2,8,14,0.12)" />
        </linearGradient>
      </defs>

      <rect width="320" height="240" fill="url(#qRoofFloor)" rx="8" />
      <IsoFloorGrid />
      <rect width="320" height="240" fill="url(#qSceneGlow)" rx="8" />

      {panelPositions.map((p, i) => (
        <LuxPanel key={i} cx={p.cx} cy={p.cy} />
      ))}

      {/* Compass only — orientation cue without SOUTH arrow */}
      <g transform="translate(36,34)">
        <circle
          r="19"
          fill="rgba(4,10,16,0.94)"
          stroke="rgba(148,180,200,0.55)"
          strokeWidth="0.85"
        />
        <circle r="13" fill="none" stroke="rgba(120,150,175,0.25)" strokeWidth="0.45" />
        <line
          x1="0"
          y1="-11"
          x2="0"
          y2="11"
          stroke="rgba(255,255,255,0.14)"
          strokeWidth="0.4"
        />
        <line
          x1="-11"
          y1="0"
          x2="11"
          y2="0"
          stroke="rgba(255,255,255,0.14)"
          strokeWidth="0.4"
        />
        <polygon points="0,-10 2.5,-1.2 0,-3 -2.5,-1.2" fill="#94A3B8" />
        <text
          y="-12.5"
          textAnchor="middle"
          fill="#CBD5E1"
          fontSize="6"
          fontWeight="700"
        >
          N
        </text>
        <text y="18" textAnchor="middle" fill="#64748b" fontSize="5.2">
          S
        </text>
      </g>
      <text
        x="36"
        y="66"
        textAnchor="middle"
        fill="#94A3B8"
        fontSize="6.2"
        letterSpacing="0.9"
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
        stroke="rgba(100,140,170,0.25)"
        strokeWidth="0.6"
      />
      <text
        x="160"
        y="231"
        textAnchor="middle"
        fill="#cbd5e1"
        fontSize="9.5"
        fontFamily="ui-sans-serif,system-ui,sans-serif"
        letterSpacing="0.35"
      >
        {copy.eng.arrayCaption(modules, kwLabel, strings, perString, panelWatt)}
      </text>
    </svg>
  );
}
