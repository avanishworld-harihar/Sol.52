"use client";

/**
 * Quantum — schematic isometric roof array (Glass3D).
 * Adapted from Premium Luxe EngineeringBlueprint IsoPanel/PanelMount.
 * Schematic only — not Design Studio / live SLD.
 */

import styles from "./Quantum.module.css";

const MAX_DRAW = 18;

/** Landscape module on GI rails — aluminium frame, cell grid, busbars. */
function IsoPanel({ cx, cy }: { cx: number; cy: number }) {
  const rightX = 40;
  const rightY = 11.5;
  const downX = -14;
  const downY = 10.5;
  const thick = 3.2;

  const p0x = cx;
  const p0y = cy;
  const p1x = cx + rightX;
  const p1y = cy + rightY;
  const p2x = cx + rightX + downX;
  const p2y = cy + rightY + downY;
  const p3x = cx + downX;
  const p3y = cy + downY;

  const t1x = p1x;
  const t1y = p1y + thick;
  const t2x = p2x;
  const t2y = p2y + thick;
  const t3x = p3x;
  const t3y = p3y + thick;

  const cells: string[] = [];
  for (let i = 1; i < 6; i++) {
    const t = i / 6;
    cells.push(
      `M ${p0x + rightX * t},${p0y + rightY * t} L ${p0x + rightX * t + downX},${p0y + rightY * t + downY}`
    );
  }
  for (let j = 1; j < 3; j++) {
    const t = j / 3;
    cells.push(
      `M ${p0x + downX * t},${p0y + downY * t} L ${p0x + downX * t + rightX},${p0y + downY * t + rightY}`
    );
  }

  const bus: string[] = [];
  for (const t of [0.22, 0.5, 0.78]) {
    bus.push(
      `M ${p0x + rightX * t + downX * 0.08},${p0y + rightY * t + downY * 0.08} L ${p0x + rightX * t + downX * 0.92},${p0y + rightY * t + downY * 0.92}`
    );
  }

  const inset = 0.06;
  const g0x = p0x + rightX * inset + downX * inset;
  const g0y = p0y + rightY * inset + downY * inset;
  const g1x = p0x + rightX * (1 - inset) + downX * inset;
  const g1y = p0y + rightY * (1 - inset) + downY * inset;
  const g2x = p0x + rightX * (1 - inset) + downX * (1 - inset);
  const g2y = p0y + rightY * (1 - inset) + downY * (1 - inset);
  const g3x = p0x + rightX * inset + downX * (1 - inset);
  const g3y = p0y + rightY * inset + downY * (1 - inset);

  const clampPts = [
    { x: p0x + rightX * 0.5 + downX * 0.02, y: p0y + rightY * 0.5 + downY * 0.02 },
    { x: p0x + rightX * 0.5 + downX * 0.98, y: p0y + rightY * 0.5 + downY * 0.98 },
  ];

  return (
    <g>
      <polygon
        points={`${p3x},${p3y} ${p2x},${p2y} ${t2x},${t2y} ${t3x},${t3y}`}
        fill="#0a1620"
      />
      <polygon
        points={`${p1x},${p1y} ${p2x},${p2y} ${t2x},${t2y} ${t1x},${t1y}`}
        fill="#122636"
      />

      <polygon
        points={`${p0x},${p0y} ${p1x},${p1y} ${p2x},${p2y} ${p3x},${p3y}`}
        fill="url(#qPanelFrame)"
        stroke="#c8d4e0"
        strokeWidth="0.9"
      />

      <polygon
        points={`${g0x},${g0y} ${g1x},${g1y} ${g2x},${g2y} ${g3x},${g3y}`}
        fill="url(#qPanelGlass)"
        stroke="#06B6D4"
        strokeWidth="0.45"
      />
      <path
        d={cells.join(" ")}
        fill="none"
        stroke="rgba(120,210,235,0.32)"
        strokeWidth="0.55"
      />
      <path
        d={bus.join(" ")}
        fill="none"
        stroke="rgba(200,240,255,0.42)"
        strokeWidth="0.7"
        strokeLinecap="round"
      />
      <line
        x1={g0x + rightX * 0.06}
        y1={g0y + rightY * 0.06 + 1.2}
        x2={g0x + rightX * 0.38}
        y2={g0y + rightY * 0.38 + 1.2}
        stroke="rgba(255,255,255,0.38)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {clampPts.map((c, i) => (
        <rect
          key={`cl-${i}`}
          x={c.x - 2.2}
          y={c.y - 1.1}
          width="4.4"
          height="2.2"
          rx="0.4"
          fill="#c5ccd6"
          stroke="#6a7380"
          strokeWidth="0.4"
        />
      ))}
    </g>
  );
}

/** Per-module GI rails + standing legs — under IsoPanel. */
function PanelMount({ cx, cy }: { cx: number; cy: number }) {
  const rightX = 40;
  const rightY = 11.5;
  const downX = -14;
  const downY = 10.5;
  const thick = 3.4;

  const along = (u: number, v: number) => ({
    x: cx + rightX * u + downX * v,
    y: cy + rightY * u + downY * v + thick,
  });

  const rearA = along(0.06, 0.18);
  const rearB = along(0.94, 0.18);
  const frontA = along(0.06, 0.92);
  const frontB = along(0.94, 0.92);

  const LEG_FRONT = 26;
  const LEG_REAR = 36;

  function post(
    key: string,
    top: { x: number; y: number },
    h: number,
    front: boolean
  ) {
    const xBot = top.x + 0.6;
    const yBot = top.y + h;
    return (
      <g key={key}>
        <ellipse
          cx={xBot + 0.3}
          cy={yBot + 1.2}
          rx="3.4"
          ry="1.35"
          fill="rgba(0,0,0,0.48)"
        />
        <line
          x1={top.x}
          y1={top.y}
          x2={xBot}
          y2={yBot}
          stroke={front ? "#c8d0da" : "#8a93a0"}
          strokeWidth={front ? 3.2 : 2.8}
          strokeLinecap="round"
        />
        <line
          x1={top.x - 0.9}
          y1={top.y + 1.5}
          x2={xBot - 0.9}
          y2={yBot - 1.5}
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="0.85"
          strokeLinecap="round"
        />
        <rect
          x={xBot - 3.4}
          y={yBot - 0.4}
          width="7.2"
          height="2.1"
          rx="0.35"
          fill="#d4dae2"
          stroke="#4a5564"
          strokeWidth="0.4"
        />
      </g>
    );
  }

  const rearPosts = [along(0.28, 0.18), along(0.72, 0.18)];
  const frontPosts = [along(0.28, 0.92), along(0.72, 0.92)];

  return (
    <g>
      {rearPosts.map((p, i) => post(`rp-${i}`, p, LEG_REAR, false))}
      {frontPosts.map((p, i) => post(`fp-${i}`, p, LEG_FRONT, true))}

      <line
        x1={frontPosts[0]!.x}
        y1={frontPosts[0]!.y + 5}
        x2={rearPosts[0]!.x}
        y2={rearPosts[0]!.y + LEG_REAR - 4}
        stroke="#7a8494"
        strokeWidth="1.1"
        opacity="0.7"
        strokeLinecap="round"
      />
      <line
        x1={frontPosts[1]!.x}
        y1={frontPosts[1]!.y + 5}
        x2={rearPosts[1]!.x}
        y2={rearPosts[1]!.y + LEG_REAR - 4}
        stroke="#7a8494"
        strokeWidth="1.1"
        opacity="0.7"
        strokeLinecap="round"
      />

      <line
        x1={rearA.x}
        y1={rearA.y}
        x2={rearB.x}
        y2={rearB.y}
        stroke="#9aa3b0"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1={rearA.x}
        y1={rearA.y + 1.4}
        x2={rearB.x}
        y2={rearB.y + 1.4}
        stroke="#5c6573"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <line
        x1={frontA.x}
        y1={frontA.y}
        x2={frontB.x}
        y2={frontB.y}
        stroke="#c8d0da"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <line
        x1={frontA.x}
        y1={frontA.y + 1.5}
        x2={frontB.x}
        y2={frontB.y + 1.5}
        stroke="#6a7380"
        strokeWidth="1.25"
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

  const stepColX = 42;
  const stepColY = 12;
  const stepRowX = -16;
  const stepRowY = 16;
  const isoOriginX = 92;
  const isoOriginY = 58;

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
          <stop offset="0%" stopColor="#2a6a82" />
          <stop offset="28%" stopColor="#164a5e" />
          <stop offset="62%" stopColor="#0c2838" />
          <stop offset="100%" stopColor="#061018" />
        </linearGradient>
        <linearGradient id="qPanelFrame" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8ecf2" />
          <stop offset="45%" stopColor="#b8c0cc" />
          <stop offset="100%" stopColor="#7a8494" />
        </linearGradient>
        <linearGradient id="qRoofFloor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0e1824" />
          <stop offset="100%" stopColor="#050a10" />
        </linearGradient>
        <linearGradient id="qRoofSlab" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1a2838" />
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
            stroke="rgba(6,182,212,0.16)"
            strokeWidth="0.6"
          />
        </pattern>
      </defs>

      <rect width="320" height="240" fill="url(#qRoofFloor)" rx="6" />
      <rect x="8" y="8" width="304" height="200" fill="url(#qIsoGrid)" rx="4" />

      <polygon
        points="36,176 156,118 300,168 180,226"
        fill="url(#qRoofSlab)"
        opacity="0.92"
      />
      <polygon
        points="36,176 156,118 300,168 180,184 36,184"
        fill="rgba(6,182,212,0.06)"
      />
      <path
        d="M36 176 L156 118 L300 168"
        fill="none"
        stroke="rgba(6,182,212,0.42)"
        strokeWidth="1.2"
      />
      <path
        d="M36 176 L180 226 L300 168"
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="1"
      />

      {panelPositions.length > 0 && (
        <ellipse
          cx={
            isoOriginX +
            ((cols - 1) * stepColX) / 2 +
            ((rows - 1) * stepRowX) / 2 +
            12
          }
          cy={
            isoOriginY +
            ((cols - 1) * stepColY) / 2 +
            ((rows - 1) * stepRowY) / 2 +
            42
          }
          rx={cols * 22 + 16}
          ry={11 + rows * 2}
          fill="rgba(0,0,0,0.42)"
        />
      )}

      {panelPositions.map((p, i) => (
        <g key={i}>
          <PanelMount cx={p.cx} cy={p.cy} />
          <IsoPanel cx={p.cx} cy={p.cy} />
        </g>
      ))}

      <g transform="translate(42,42)">
        <circle r="24" fill="rgba(6,12,20,0.9)" stroke="#06B6D4" strokeWidth="1.1" />
        <circle r="17" fill="none" stroke="rgba(6,182,212,0.4)" strokeWidth="0.7" />
        <line
          x1="0"
          y1="-15"
          x2="0"
          y2="15"
          stroke="rgba(255,255,255,0.28)"
          strokeWidth="0.7"
        />
        <line
          x1="-15"
          y1="0"
          x2="15"
          y2="0"
          stroke="rgba(255,255,255,0.28)"
          strokeWidth="0.7"
        />
        <polygon points="0,-14 3.8,-2 0,-4.2 -3.8,-2" fill="#06B6D4" />
        <polygon points="0,14 3.2,3 0,5.2 -3.2,3" fill="#1a2838" />
        <text
          y="-17"
          textAnchor="middle"
          fill="#06B6D4"
          fontSize="7"
          fontWeight="700"
          letterSpacing="1"
        >
          N
        </text>
        <text y="24" textAnchor="middle" fill="#94a3b8" fontSize="6.5">
          S
        </text>
        <text x="19" y="3.5" textAnchor="middle" fill="#94a3b8" fontSize="6">
          E
        </text>
        <text x="-19" y="3.5" textAnchor="middle" fill="#94a3b8" fontSize="6">
          W
        </text>
      </g>
      <text
        x="42"
        y="82"
        textAnchor="middle"
        fill="#06B6D4"
        fontSize="8"
        letterSpacing="1.2"
        fontWeight="600"
      >
        180° S · TILT {tilt.toFixed(0)}°
      </text>

      <rect x="0" y="212" width="320" height="28" fill="rgba(0,0,0,0.62)" />
      <text
        x="160"
        y="230"
        textAnchor="middle"
        fill="#e8ecf2"
        fontSize="10"
        fontFamily="system-ui,sans-serif"
        letterSpacing="0.4"
      >
        {modules} modules · {kwLabel} kWp DC · {strings}×{perString} string · rail
        mount · South · {panelWatt}W
      </text>
    </svg>
  );
}
