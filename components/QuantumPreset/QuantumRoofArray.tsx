"use client";

/**
 * Quantum — simple top-view south-facing roof array.
 * Compass N-up. Panels face South (toward the bottom of the drawing).
 * Schematic only — not Design Studio / live SLD.
 */

import { useQuantumLang } from "./quantum-lang-context";
import styles from "./Quantum.module.css";

const MAX_DRAW = 18;
const PANEL_W = 44;
const PANEL_H = 24;
const GAP_X = 3.2;
const GAP_Y = 3.2;

function SimplePanel({ x, y }: { x: number; y: number }) {
  const inset = 1.6;
  const glassX = x + inset;
  const glassY = y + inset;
  const glassW = PANEL_W - inset * 2;
  const glassH = PANEL_H - inset * 2;
  const cols = 6;
  const rows = 3;
  const cells: { x: number; y: number; w: number; h: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cw = glassW / cols;
      const ch = glassH / rows;
      cells.push({
        x: glassX + c * cw + 0.35,
        y: glassY + r * ch + 0.35,
        w: cw - 0.7,
        h: ch - 0.7,
      });
    }
  }

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={PANEL_W}
        height={PANEL_H}
        rx="1.4"
        fill="#cfd6de"
        stroke="rgba(226,232,240,0.85)"
        strokeWidth="0.5"
      />
      <rect
        x={glassX}
        y={glassY}
        width={glassW}
        height={glassH}
        rx="0.6"
        fill="#0c3a52"
      />
      {cells.map((cell, i) => (
        <rect
          key={i}
          x={cell.x}
          y={cell.y}
          width={cell.w}
          height={cell.h}
          rx="0.25"
          fill={i % 2 === 0 ? "#134e68" : "#0e455c"}
        />
      ))}
      {[0.33, 0.67].map((t) => (
        <line
          key={t}
          x1={glassX + glassW * t}
          y1={glassY + 0.6}
          x2={glassX + glassW * t}
          y2={glassY + glassH - 0.6}
          stroke="rgba(186, 230, 253, 0.28)"
          strokeWidth="0.45"
        />
      ))}
    </g>
  );
}

function CompassRose() {
  return (
    <g className={styles.engCompass} transform="translate(40,40)">
      <circle r="26" fill="rgba(15, 23, 42, 0.72)" />
      <circle
        r="24"
        fill="rgba(8, 18, 32, 0.92)"
        stroke="#22d3ee"
        strokeWidth="1.6"
      />
      <circle r="16.5" fill="none" stroke="rgba(226,232,240,0.35)" strokeWidth="0.7" />
      <line
        x1="0"
        y1="-14"
        x2="0"
        y2="14"
        stroke="rgba(226,232,240,0.35)"
        strokeWidth="0.7"
      />
      <line
        x1="-14"
        y1="0"
        x2="14"
        y2="0"
        stroke="rgba(226,232,240,0.35)"
        strokeWidth="0.7"
      />
      <polygon points="0,-13 3.2,-2 0,-5 -3.2,-2" fill="#22d3ee" />
      <polygon points="0,13 2.6,2.2 0,5.2 -2.6,2.2" fill="#e2e8f0" />
      <text
        y="-16.5"
        textAnchor="middle"
        fill="#22d3ee"
        fontSize="9"
        fontWeight="800"
        letterSpacing="0.4"
      >
        N
      </text>
      <text
        y="22.5"
        textAnchor="middle"
        fill="#f8fafc"
        fontSize="8"
        fontWeight="700"
      >
        S
      </text>
      <text
        x="18.5"
        y="3.2"
        textAnchor="middle"
        fill="#f8fafc"
        fontSize="7.5"
        fontWeight="700"
      >
        E
      </text>
      <text
        x="-18.5"
        y="3.2"
        textAnchor="middle"
        fill="#f8fafc"
        fontSize="7.5"
        fontWeight="700"
      >
        W
      </text>
    </g>
  );
}

export type QuantumRoofArrayProps = {
  modules: number;
  dcKwp: number;
  tilt: number;
  panelWatt: number;
  stringLabel: string;
};

export function QuantumRoofArray({
  modules,
  dcKwp,
  tilt,
  panelWatt,
  stringLabel,
}: QuantumRoofArrayProps) {
  const { copy } = useQuantumLang();
  const modulesDraw = Math.min(Math.max(1, modules), MAX_DRAW);
  const rows = modulesDraw <= 4 ? 1 : modulesDraw <= 12 ? 2 : 3;
  const cols = Math.max(1, Math.ceil(modulesDraw / rows));

  const arrayW = cols * PANEL_W + (cols - 1) * GAP_X;
  const arrayH = rows * PANEL_H + (rows - 1) * GAP_Y;
  const roofPad = 10;
  const originX = 160 - arrayW / 2;
  let originY = 118 - arrayH / 2;
  if (originY - roofPad < 68) originY = 68 + roofPad;

  const panels: { x: number; y: number }[] = [];
  for (let i = 0; i < modulesDraw; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const inRow = Math.min(cols, modulesDraw - row * cols);
    const rowShift = ((cols - inRow) * (PANEL_W + GAP_X)) / 2;
    panels.push({
      x: originX + rowShift + col * (PANEL_W + GAP_X),
      y: originY + row * (PANEL_H + GAP_Y),
    });
  }

  const kwLabel = dcKwp % 1 ? dcKwp.toFixed(2) : dcKwp.toFixed(0);
  const roofPad = 10;
  const roofX = originX - roofPad;
  const roofY = originY - roofPad;
  const roofW = arrayW + roofPad * 2;
  const roofH = arrayH + roofPad * 2;
  const southY = roofY + roofH + 8;

  return (
    <svg
      viewBox="0 0 320 240"
      width="100%"
      height="228"
      className={styles.engSvgDark}
      aria-hidden
    >
      <defs>
        <linearGradient id="qRoofFloor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#122032" />
          <stop offset="100%" stopColor="#070d14" />
        </linearGradient>
        <linearGradient id="qCaptionBar" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(2,8,14,0.12)" />
          <stop offset="40%" stopColor="rgba(2,8,14,0.82)" />
          <stop offset="100%" stopColor="rgba(2,8,14,0.12)" />
        </linearGradient>
      </defs>

      <rect width="320" height="240" fill="url(#qRoofFloor)" rx="8" />

      <rect
        x={roofX}
        y={roofY}
        width={roofW}
        height={roofH}
        rx="4"
        fill="rgba(15, 28, 42, 0.55)"
        stroke="rgba(148, 180, 200, 0.35)"
        strokeWidth="1"
      />
      <rect
        x={roofX + 3}
        y={roofY + 3}
        width={roofW - 6}
        height={roofH - 6}
        rx="2.5"
        fill="none"
        stroke="rgba(6, 182, 212, 0.18)"
        strokeWidth="0.6"
        strokeDasharray="3 3"
      />

      {panels.map((p, i) => (
        <SimplePanel key={i} x={p.x} y={p.y} />
      ))}

      <CompassRose />

      <g transform={`translate(160, ${southY})`}>
        <polygon points="0,9 -5,1 5,1" fill="#22d3ee" />
        <text
          y="-2"
          textAnchor="middle"
          fill="#e2e8f0"
          fontSize="7.5"
          fontWeight="800"
          letterSpacing="1.4"
        >
          {copy.eng.facingSouth.toUpperCase()}
        </text>
        <text
          y="20"
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="6.2"
          letterSpacing="0.6"
        >
          180° · {tilt.toFixed(0)}° tilt
        </text>
      </g>

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
        fill="#e2e8f0"
        fontSize="9.2"
        fontFamily="ui-sans-serif,system-ui,sans-serif"
        letterSpacing="0.3"
      >
        {copy.eng.arrayCaption(modules, kwLabel, stringLabel, panelWatt)}
      </text>
    </svg>
  );
}
