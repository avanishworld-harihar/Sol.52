"use client";

/**
 * Quantum — luxury schematic roof array (Glass3D).
 * Flush crystalline modules on terrace — no GI legs / structure under panels.
 * Schematic only — not Design Studio / live SLD.
 */

import styles from "./Quantum.module.css";

const MAX_DRAW = 18;

type Pt = { x: number; y: number };

/** Luxury flush module — obsidian glass, platinum frame, cyan rim. No mounts. */
function LuxPanel({ cx, cy }: { cx: number; cy: number }) {
  const rightX = 42;
  const rightY = 11.2;
  const downX = -14.2;
  const downY = 10.2;
  const thick = 1.6;

  const at = (u: number, v: number, z = 0): Pt => ({
    x: cx + rightX * u + downX * v,
    y: cy + rightY * u + downY * v + z,
  });
  const poly = (...pts: Pt[]) => pts.map((p) => `${p.x},${p.y}`).join(" ");

  const p0 = at(0, 0);
  const p1 = at(1, 0);
  const p2 = at(1, 1);
  const p3 = at(0, 1);

  const inset = 0.048;
  const g0 = at(inset, inset);
  const g1 = at(1 - inset, inset);
  const g2 = at(1 - inset, 1 - inset);
  const g3 = at(inset, 1 - inset);

  // Fine TOPCon-style cell mosaic
  const cellCols = 8;
  const cellRows = 4;
  const cells: string[] = [];
  for (let r = 0; r < cellRows; r++) {
    for (let c = 0; c < cellCols; c++) {
      const u0 = inset + ((1 - 2 * inset) * c) / cellCols + 0.004;
      const u1 = inset + ((1 - 2 * inset) * (c + 1)) / cellCols - 0.004;
      const v0 = inset + ((1 - 2 * inset) * r) / cellRows + 0.004;
      const v1 = inset + ((1 - 2 * inset) * (r + 1)) / cellRows - 0.004;
      cells.push(poly(at(u0, v0), at(u1, v0), at(u1, v1), at(u0, v1)));
    }
  }

  // Busbars
  const bus: string[] = [];
  for (const t of [0.18, 0.36, 0.54, 0.72, 0.9]) {
    const a = at(t, inset + 0.02);
    const b = at(t, 1 - inset - 0.02);
    bus.push(`M ${a.x},${a.y} L ${b.x},${b.y}`);
  }

  // Contact shadow (flat footprint only)
  const shadow = poly(
    at(0.04, 0.1, thick + 2.4),
    at(0.96, 0.1, thick + 2.4),
    at(0.96, 0.98, thick + 3.2),
    at(0.04, 0.98, thick + 3.2)
  );

  // Soft deck reflection (luxury showroom cue)
  const refl = poly(
    at(0.08, 1.05, thick + 1),
    at(0.92, 1.05, thick + 1),
    at(0.88, 1.28, thick + 2),
    at(0.12, 1.28, thick + 2)
  );

  return (
    <g>
      <polygon points={refl} fill="url(#qPanelRefl)" opacity="0.55" />
      <polygon points={shadow} fill="rgba(0,0,0,0.45)" />

      {/* Slim depth — no posts */}
      <polygon
        points={poly(p3, p2, at(1, 1, thick), at(0, 1, thick))}
        fill="#04080e"
      />
      <polygon
        points={poly(p1, p2, at(1, 1, thick), at(1, 0, thick))}
        fill="#0c1824"
      />

      {/* Platinum frame */}
      <polygon
        points={poly(p0, p1, p2, p3)}
        fill="url(#qPanelFrame)"
        stroke="rgba(226,232,240,0.65)"
        strokeWidth="0.55"
      />

      {/* Obsidian glass face */}
      <polygon points={poly(g0, g1, g2, g3)} fill="url(#qPanelGlass)" />

      {cells.map((pts, i) => (
        <polygon
          key={i}
          points={pts}
          fill={
            i % 5 === 0
              ? "rgba(8,120,150,0.22)"
              : i % 3 === 0
                ? "rgba(6,100,130,0.16)"
                : "rgba(4,70,95,0.12)"
          }
          stroke="rgba(2,12,20,0.65)"
          strokeWidth="0.22"
        />
      ))}

      <path
        d={bus.join(" ")}
        fill="none"
        stroke="rgba(186,230,253,0.22)"
        strokeWidth="0.35"
        strokeLinecap="round"
      />

      {/* Cyan luxury rim */}
      <polygon
        points={poly(g0, g1, g2, g3)}
        fill="none"
        stroke="rgba(34,211,238,0.45)"
        strokeWidth="0.45"
      />

      {/* Specular glints */}
      <line
        x1={g0.x + rightX * 0.05}
        y1={g0.y + rightY * 0.05 + 0.5}
        x2={g0.x + rightX * 0.48}
        y2={g0.y + rightY * 0.48 + 0.5}
        stroke="rgba(255,255,255,0.42)"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
      <line
        x1={g0.x + rightX * 0.08}
        y1={g0.y + rightY * 0.08 + 1.6}
        x2={g0.x + rightX * 0.34}
        y2={g0.y + rightY * 0.34 + 1.6}
        stroke="rgba(103,232,249,0.35)"
        strokeWidth="0.75"
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

  const stepColX = 44;
  const stepColY = 12;
  const stepRowX = -15.5;
  const stepRowY = 15;

  const arrayW = (cols - 1) * stepColX + (rows - 1) * stepRowX + 42;
  const arrayH = (cols - 1) * stepColY + (rows - 1) * stepRowY + 22;
  const isoOriginX = 168 - arrayW / 2;
  const isoOriginY = 136 - arrayH / 2;

  const panelPositions = Array.from({ length: modulesDraw }).map((_, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return {
      cx: isoOriginX + col * stepColX + row * stepRowX,
      cy: isoOriginY + col * stepColY + row * stepRowY,
    };
  });
  panelPositions.sort((a, b) => a.cy - b.cy || a.cx - b.cx);

  const bankCx =
    isoOriginX +
    ((cols - 1) * stepColX) / 2 +
    ((rows - 1) * stepRowX) / 2 +
    18;
  const bankCy =
    isoOriginY +
    ((cols - 1) * stepColY) / 2 +
    ((rows - 1) * stepRowY) / 2 +
    14;

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
        <radialGradient id="qSceneGlow" cx="52%" cy="48%" r="58%">
          <stop offset="0%" stopColor="rgba(6,182,212,0.16)" />
          <stop offset="45%" stopColor="rgba(6,100,140,0.06)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
        <linearGradient id="qPanelGlass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1e4d62" />
          <stop offset="28%" stopColor="#0f3344" />
          <stop offset="62%" stopColor="#071820" />
          <stop offset="100%" stopColor="#02080c" />
        </linearGradient>
        <linearGradient id="qPanelFrame" x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0%" stopColor="#f1f5f9" />
          <stop offset="35%" stopColor="#cbd5e1" />
          <stop offset="70%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
        <linearGradient id="qPanelRefl" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(6,182,212,0.2)" />
          <stop offset="100%" stopColor="rgba(6,182,212,0)" />
        </linearGradient>
        <linearGradient id="qRoofFloor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0c1522" />
          <stop offset="100%" stopColor="#02060c" />
        </linearGradient>
        <linearGradient id="qRoofSlab" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#243044" />
          <stop offset="45%" stopColor="#152030" />
          <stop offset="100%" stopColor="#0a121c" />
        </linearGradient>
        <linearGradient id="qCaptionBar" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(2,8,14,0.2)" />
          <stop offset="40%" stopColor="rgba(2,8,14,0.78)" />
          <stop offset="100%" stopColor="rgba(2,8,14,0.2)" />
        </linearGradient>
        <filter id="qSoftGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
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
            stroke="rgba(6,182,212,0.07)"
            strokeWidth="0.45"
          />
        </pattern>
      </defs>

      <rect width="320" height="240" fill="url(#qRoofFloor)" rx="8" />
      <rect x="6" y="6" width="308" height="202" fill="url(#qIsoGrid)" rx="6" />
      <rect width="320" height="240" fill="url(#qSceneGlow)" rx="8" />

      {/* Luxury terrace slab */}
      <polygon
        points="34,174 156,112 302,168 176,228"
        fill="url(#qRoofSlab)"
      />
      <polygon
        points="34,174 156,112 302,168 176,182 34,182"
        fill="rgba(34,211,238,0.05)"
      />
      <path
        d="M34 174 L156 112 L302 168"
        fill="none"
        stroke="rgba(34,211,238,0.38)"
        strokeWidth="1.1"
      />
      <path
        d="M34 174 L176 228 L302 168"
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="0.9"
      />
      {/* Deck edge highlight */}
      <path
        d="M48 168 L160 120 L288 168"
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="0.6"
      />

      {/* Ambient pool under array */}
      <ellipse
        cx={bankCx}
        cy={bankCy + 28}
        rx={cols * 26 + 18}
        ry={10 + rows * 2.5}
        fill="rgba(6,182,212,0.1)"
        filter="url(#qSoftGlow)"
      />
      <ellipse
        cx={bankCx}
        cy={bankCy + 30}
        rx={cols * 24 + 10}
        ry={7 + rows * 2}
        fill="rgba(0,0,0,0.35)"
      />

      {panelPositions.map((p, i) => (
        <LuxPanel key={i} cx={p.cx} cy={p.cy} />
      ))}

      {/* Refined compass badge */}
      <g transform="translate(34,32)">
        <circle r="20" fill="rgba(4,10,16,0.92)" stroke="rgba(34,211,238,0.75)" strokeWidth="0.9" />
        <circle r="14" fill="none" stroke="rgba(6,182,212,0.28)" strokeWidth="0.5" />
        <circle r="2.2" fill="#06B6D4" opacity="0.35" />
        <line x1="0" y1="-12" x2="0" y2="12" stroke="rgba(255,255,255,0.16)" strokeWidth="0.45" />
        <line x1="-12" y1="0" x2="12" y2="0" stroke="rgba(255,255,255,0.16)" strokeWidth="0.45" />
        <polygon points="0,-11 2.8,-1.4 0,-3.2 -2.8,-1.4" fill="#22D3EE" />
        <text y="-13.5" textAnchor="middle" fill="#22D3EE" fontSize="6.2" fontWeight="700" letterSpacing="0.8">
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
      <line x1="24" y1="214" x2="296" y2="214" stroke="rgba(34,211,238,0.22)" strokeWidth="0.7" />
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
