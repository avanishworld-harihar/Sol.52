"use client";

/**
 * Quantum — top-view south-facing roof array.
 * Portrait modules (Atelier-style cyan cells). Compass N-up; array faces South.
 * Schematic only — not Design Studio / live SLD.
 */

import { useQuantumLang } from "./quantum-lang-context";
import styles from "./Quantum.module.css";

const MAX_DRAW = 18;
/** Portrait TOPCon (~2278×1134) — taller than wide. */
const PANEL_W = 22;
const PANEL_H = 38;
const GAP_X = 4;
const GAP_Y = 4.5;
const VIEW_W = 280;
const VIEW_H = 340;

function PortraitPanel({ x, y }: { x: number; y: number }) {
  const ix = x + 1.35;
  const iy = y + 1.35;
  const iw = PANEL_W - 2.7;
  const ih = PANEL_H - 2.7;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={PANEL_W}
        height={PANEL_H}
        rx="1.6"
        fill="rgba(34, 211, 238, 0.38)"
        stroke="rgba(103, 232, 249, 0.92)"
        strokeWidth="0.95"
      />
      <rect
        x={ix}
        y={iy}
        width={iw}
        height={ih}
        rx="0.9"
        fill="rgba(8, 47, 73, 0.28)"
        stroke="rgba(14, 116, 144, 0.45)"
        strokeWidth="0.4"
      />
      <line
        x1={x + PANEL_W / 2}
        y1={iy + 1}
        x2={x + PANEL_W / 2}
        y2={iy + ih - 1}
        stroke="rgba(8, 47, 73, 0.4)"
        strokeWidth="0.45"
      />
      {[0.33, 0.67].map((t) => (
        <line
          key={t}
          x1={ix + 1}
          y1={iy + ih * t}
          x2={ix + iw - 1}
          y2={iy + ih * t}
          stroke="rgba(165, 243, 252, 0.22)"
          strokeWidth="0.35"
        />
      ))}
    </g>
  );
}

function CompassRose() {
  return (
    <g className={styles.engCompass} transform="translate(36,36)">
      <circle r="23" fill="rgba(15, 23, 42, 0.78)" />
      <circle
        r="21"
        fill="rgba(8, 18, 32, 0.92)"
        stroke="#22d3ee"
        strokeWidth="1.5"
      />
      <circle r="14.5" fill="none" stroke="rgba(226,232,240,0.35)" strokeWidth="0.7" />
      <line
        x1="0"
        y1="-12.5"
        x2="0"
        y2="12.5"
        stroke="rgba(226,232,240,0.35)"
        strokeWidth="0.7"
      />
      <line
        x1="-12.5"
        y1="0"
        x2="12.5"
        y2="0"
        stroke="rgba(226,232,240,0.35)"
        strokeWidth="0.7"
      />
      <polygon points="0,-11.5 2.8,-1.8 0,-4.4 -2.8,-1.8" fill="#22d3ee" />
      <polygon points="0,11.5 2.3,2 0,4.6 -2.3,2" fill="#e2e8f0" />
      <text
        y="-14.5"
        textAnchor="middle"
        fill="#22d3ee"
        fontSize="8.5"
        fontWeight="800"
      >
        N
      </text>
      <text y="20" textAnchor="middle" fill="#f8fafc" fontSize="7.5" fontWeight="700">
        S
      </text>
      <text x="16.5" y="3" textAnchor="middle" fill="#f8fafc" fontSize="7" fontWeight="700">
        E
      </text>
      <text x="-16.5" y="3" textAnchor="middle" fill="#f8fafc" fontSize="7" fontWeight="700">
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
  const cols = Math.min(5, Math.max(3, Math.ceil(Math.sqrt(modulesDraw))));
  const rows = Math.ceil(modulesDraw / cols);

  const arrayW = cols * PANEL_W + (cols - 1) * GAP_X;
  const arrayH = rows * PANEL_H + (rows - 1) * GAP_Y;
  const roofW = Math.max(arrayW + 28, 112);
  const roofH = Math.max(arrayH + 40, 228);
  const roofX = (VIEW_W - roofW) / 2;
  const roofY = 52;
  const originX = roofX + (roofW - arrayW) / 2;
  const originY = roofY + (roofH - arrayH) / 2 - 6;

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
  const southY = roofY + roofH + 14;
  const captionY = VIEW_H - 12;

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      width="100%"
      height="300"
      className={styles.engSvgDark}
      aria-hidden
    >
      <defs>
        <pattern
          id="qRoofGrid"
          width="16"
          height="16"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 16 0 L 0 0 0 16"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
          />
        </pattern>
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

      <rect width={VIEW_W} height={VIEW_H} fill="url(#qRoofFloor)" rx="8" />
      <rect width={VIEW_W} height={VIEW_H} fill="url(#qRoofGrid)" rx="8" />

      <rect
        x={roofX}
        y={roofY}
        width={roofW}
        height={roofH}
        rx="5"
        fill="rgba(10, 22, 36, 0.72)"
        stroke="rgba(148, 180, 200, 0.38)"
        strokeWidth="1.1"
      />
      <rect
        x={roofX + 4}
        y={roofY + 4}
        width={roofW - 8}
        height={roofH - 8}
        rx="3"
        fill="none"
        stroke="rgba(6, 182, 212, 0.2)"
        strokeWidth="0.6"
        strokeDasharray="3.5 3.5"
      />

      {panels.map((p, i) => (
        <PortraitPanel key={i} x={p.x} y={p.y} />
      ))}

      <CompassRose />

      <g transform={`translate(${VIEW_W / 2}, ${southY})`}>
        <polygon points="0,8 -4.5,0.5 4.5,0.5" fill="#22d3ee" />
        <text
          y="-3"
          textAnchor="middle"
          fill="#e2e8f0"
          fontSize="7.2"
          fontWeight="800"
          letterSpacing="1.3"
        >
          {copy.eng.facingSouth.toUpperCase()}
        </text>
        <text
          y="18"
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="6"
          letterSpacing="0.5"
        >
          180° · {tilt.toFixed(0)}° tilt
        </text>
      </g>

      <rect x="0" y={VIEW_H - 26} width={VIEW_W} height="26" fill="url(#qCaptionBar)" />
      <line
        x1="20"
        y1={VIEW_H - 26}
        x2={VIEW_W - 20}
        y2={VIEW_H - 26}
        stroke="rgba(100,140,170,0.25)"
        strokeWidth="0.6"
      />
      <text
        x={VIEW_W / 2}
        y={captionY}
        textAnchor="middle"
        fill="#e2e8f0"
        fontSize="8.6"
        fontFamily="ui-sans-serif,system-ui,sans-serif"
        letterSpacing="0.25"
      >
        {copy.eng.arrayCaption(modules, kwLabel, stringLabel, panelWatt)}
      </text>
    </svg>
  );
}
