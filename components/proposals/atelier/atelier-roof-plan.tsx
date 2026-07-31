"use client";

/**
 * Atelier — soft-tilt terrace PV bank (schematic “yield story”).
 * Modules aim for a readable TOPCon look: dark cells, Al frame, busbars.
 */

type AtelierRoofPlanProps = {
  modules: number;
  southLabel?: string;
  className?: string;
};

const MAX_DRAW = 18;
const VB_W = 480;
const VB_H = 300;
const PAD = 22;
/** Portrait module footprint (real ~1×1.7 ratio, slightly compressed for bank). */
const MU = 1;
const MV = 1.42;

type Pt = { x: number; y: number };

function moduleGrid(count: number): { cols: number; rows: number } {
  const n = Math.min(Math.max(1, count), MAX_DRAW);
  if (n <= 3) return { cols: n, rows: 1 };
  if (n <= 8) return { cols: Math.ceil(n / 2), rows: 2 };
  return { cols: Math.ceil(n / 3), rows: 3 };
}

/** Soft iso basis sized so small banks still read large. */
function isoBasis(cols: number, rows: number) {
  const targetW = 360;
  const targetH = 200;
  const gapU = 0.1;
  const gapV = 0.14;
  const bankWU = cols * (MU + gapU) - gapU;
  const bankWV = rows * (MV + gapV) - gapV;
  const ux = Math.min(56, targetW / Math.max(bankWU, 0.5));
  const uy = ux * 0.2;
  const vy = Math.min(34, targetH / Math.max(bankWV, 0.5));
  const vx = -uy * 0.9;
  return { UX: ux, UY: uy, VX: vx, VY: vy, gapU, gapV, bankWU, bankWV };
}

function AtelierPvModule({
  ox,
  oy,
  southAccent,
  UX,
  UY,
  VX,
  VY,
  uid,
}: {
  ox: number;
  oy: number;
  southAccent: boolean;
  UX: number;
  UY: number;
  VX: number;
  VY: number;
  uid: string;
}) {
  const at = (u: number, v: number, z = 0): Pt => ({
    x: ox + UX * u + VX * v,
    y: oy + UY * u + VY * v - z,
  });
  const poly = (...pts: Pt[]) => pts.map((p) => `${p.x},${p.y}`).join(" ");

  const p0 = at(0, 0);
  const p1 = at(MU, 0);
  const p2 = at(MU, MV);
  const p3 = at(0, MV);
  const thick = Math.max(2.8, UX * 0.07);

  // Frame inset → glass face
  const f = 0.045;
  const g0 = at(f, f);
  const g1 = at(MU - f, f);
  const g2 = at(MU - f, MV - f);
  const g3 = at(f, MV - f);

  // Cell grid — portrait TOPCon-style (6 × 10 reads as real module)
  const cellCols = 6;
  const cellRows = 10;
  const cellPadU = f + 0.02;
  const cellPadV = f + 0.02;
  const usableU = MU - 2 * cellPadU;
  const usableV = MV - 2 * cellPadV;
  const gapCell = 0.008;
  const cells: { pts: string; fill: string }[] = [];
  for (let r = 0; r < cellRows; r++) {
    for (let c = 0; c < cellCols; c++) {
      const u0 = cellPadU + (usableU * c) / cellCols + gapCell;
      const u1 = cellPadU + (usableU * (c + 1)) / cellCols - gapCell;
      const v0 = cellPadV + (usableV * r) / cellRows + gapCell;
      const v1 = cellPadV + (usableV * (r + 1)) / cellRows - gapCell;
      // Subtle cell-to-cell variation (real modules aren’t flat black)
      const shade = 8 + ((c * 3 + r * 2) % 5) * 2;
      cells.push({
        pts: poly(at(u0, v0), at(u1, v0), at(u1, v1), at(u0, v1)),
        fill: `rgb(${6 + shade},${22 + shade},${42 + shade})`,
      });
    }
  }

  // Vertical busbars (silver)
  const bus: string[] = [];
  for (const t of [0.18, 0.34, 0.5, 0.66, 0.82]) {
    const a = at(cellPadU + usableU * t, cellPadV + 0.01);
    const b = at(cellPadU + usableU * t, MV - cellPadV - 0.01);
    bus.push(`M ${a.x},${a.y} L ${b.x},${b.y}`);
  }

  // Glass glint
  const glintA = at(f + 0.06, f + 0.08);
  const glintB = at(f + 0.38, f + 0.2);
  const glintC = at(f + 0.12, f + 0.28);

  const mountA = at(0.12, MV + 0.02, -1.2);
  const mountB = at(MU - 0.12, MV + 0.02, -1.2);

  return (
    <g>
      {/* Mounting rail hint */}
      <line
        x1={mountA.x}
        y1={mountA.y}
        x2={mountB.x}
        y2={mountB.y}
        stroke="#64748B"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.55"
      />

      {/* Frame thickness (south + east edges) */}
      <polygon
        points={poly(p3, p2, at(MU, MV, thick), at(0, MV, thick))}
        fill="#64748B"
      />
      <polygon
        points={poly(p1, p2, at(MU, MV, thick), at(MU, 0, thick))}
        fill="#94A3B8"
      />

      {/* Aluminum frame face */}
      <polygon
        points={poly(p0, p1, p2, p3)}
        fill={`url(#${uid}-frame)`}
        stroke="#64748B"
        strokeWidth="0.5"
      />

      {/* Dark glass well */}
      <polygon points={poly(g0, g1, g2, g3)} fill="#061018" />

      {cells.map((cell, i) => (
        <polygon
          key={i}
          points={cell.pts}
          fill={cell.fill}
          stroke="rgba(180,200,220,0.22)"
          strokeWidth="0.2"
        />
      ))}

      <path
        d={bus.join(" ")}
        fill="none"
        stroke="rgba(210,220,230,0.55)"
        strokeWidth="0.65"
        strokeLinecap="round"
      />

      {/* Anti-reflective glass wash */}
      <polygon
        points={poly(g0, g1, g2, g3)}
        fill={`url(#${uid}-glass)`}
        opacity="0.55"
      />

      <line
        x1={glintA.x}
        y1={glintA.y}
        x2={glintB.x}
        y2={glintB.y}
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1={glintA.x}
        y1={glintA.y + 2}
        x2={glintC.x}
        y2={glintC.y}
        stroke="rgba(255,255,255,0.22)"
        strokeWidth="0.9"
        strokeLinecap="round"
      />

      {southAccent ? (
        <path
          d={`M ${g3.x},${g3.y} L ${g2.x},${g2.y}`}
          fill="none"
          stroke="#F97316"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      ) : null}
    </g>
  );
}

export function AtelierRoofPlan({
  modules,
  southLabel = "SOUTH",
  className,
}: AtelierRoofPlanProps) {
  const draw = Math.min(Math.max(1, modules), MAX_DRAW);
  const { cols, rows } = moduleGrid(draw);
  const { UX, UY, VX, VY, gapU, gapV, bankWU, bankWV } = isoBasis(cols, rows);
  const uid = `alRoof${draw}x${cols}${rows}`;

  const stepU = MU + gapU;
  const stepV = MV + gapV;
  const toLocal = (u: number, v: number) => ({
    x: UX * u + VX * v,
    y: UY * u + VY * v,
  });

  const slabPadU = 0.55;
  const slabPadV = 0.55;
  const slab = [
    toLocal(-slabPadU, -slabPadV),
    toLocal(bankWU + slabPadU, -slabPadV),
    toLocal(bankWU + slabPadU, bankWV + slabPadV),
    toLocal(-slabPadU, bankWV + slabPadV),
  ];
  const slabPoly = slab.map((p) => `${p.x},${p.y}`).join(" ");

  // Parapet ring (slightly inset from slab edge)
  const para = 0.12;
  const parapet = [
    toLocal(-slabPadU + para, -slabPadV + para),
    toLocal(bankWU + slabPadU - para, -slabPadV + para),
    toLocal(bankWU + slabPadU - para, bankWV + slabPadV - para),
    toLocal(-slabPadU + para, bankWV + slabPadV - para),
  ];

  const southEdgeMid = toLocal(bankWU / 2, bankWV + 0.15);
  const labelY = southEdgeMid.y + 20;

  const positions = Array.from({ length: draw }).map((_, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const p = toLocal(col * stepU, row * stepV);
    return { ox: p.x, oy: p.y, row };
  });
  positions.sort((a, b) => a.oy - b.oy || a.ox - b.ox);

  const allPts: Pt[] = [
    ...slab,
    ...slab.map((p) => ({ x: p.x + 6, y: p.y + 10 })),
    { x: southEdgeMid.x - 40, y: labelY },
    { x: southEdgeMid.x + 40, y: labelY + 4 },
  ];
  for (const p of positions) {
    allPts.push(
      { x: p.ox, y: p.oy },
      { x: p.ox + UX * MU + VX * MV, y: p.oy + UY * MU + VY * MV + 6 }
    );
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of allPts) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }

  const contentW = Math.max(1, maxX - minX);
  const contentH = Math.max(1, maxY - minY);
  const scale = Math.min(
    (VB_W - PAD * 2) / contentW,
    (VB_H - PAD * 2) / contentH
  );
  const tx = (VB_W - contentW * scale) / 2 - minX * scale;
  const ty = (VB_H - contentH * scale) / 2 - minY * scale;

  return (
    <svg
      className={className}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      width="100%"
      height="100%"
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="alStageWash" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#F1F5F9" />
          <stop offset="55%" stopColor="#F8FAFC" />
          <stop offset="100%" stopColor="#E8EEF5" />
        </linearGradient>
        <linearGradient id="alTerraceV2" x1="0" y1="0" x2="0.15" y2="1">
          <stop offset="0%" stopColor="#F1F5F9" />
          <stop offset="40%" stopColor="#E8EDF3" />
          <stop offset="100%" stopColor="#D5DDE8" />
        </linearGradient>
        <linearGradient id={`${uid}-frame`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E8EEF5" />
          <stop offset="45%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#94A3B8" />
        </linearGradient>
        <linearGradient id={`${uid}-glass`} x1="0" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.28)" />
          <stop offset="35%" stopColor="rgba(255,255,255,0.04)" />
          <stop offset="100%" stopColor="rgba(8,20,40,0.15)" />
        </linearGradient>
        <radialGradient id="alStageGlow" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="rgba(249,115,22,0.08)" />
          <stop offset="100%" stopColor="rgba(249,115,22,0)" />
        </radialGradient>
      </defs>

      <rect width={VB_W} height={VB_H} fill="url(#alStageWash)" />
      <rect width={VB_W} height={VB_H} fill="url(#alStageGlow)" />

      <g transform={`translate(${tx} ${ty}) scale(${scale})`}>
        {/* Drop shadow */}
        <polygon
          points={slab.map((p) => `${p.x + 6},${p.y + 10}`).join(" ")}
          fill="rgba(15,23,42,0.12)"
        />

        {/* RCC terrace slab */}
        <polygon
          points={slabPoly}
          fill="url(#alTerraceV2)"
          stroke="#94A3B8"
          strokeWidth={1.5 / scale}
        />

        {/* Parapet lip */}
        <polygon
          points={parapet.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke="rgba(100,116,139,0.45)"
          strokeWidth={2.2 / scale}
        />

        {/* Expansion joints */}
        {Array.from({ length: 4 }).map((_, i) => {
          const t = (i + 1) / 5;
          const a = toLocal(
            -slabPadU + t * (bankWU + 2 * slabPadU),
            -slabPadV
          );
          const b = toLocal(
            -slabPadU + t * (bankWU + 2 * slabPadU),
            bankWV + slabPadV
          );
          return (
            <line
              key={`j-${i}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="rgba(100,116,139,0.18)"
              strokeWidth={0.85 / scale}
            />
          );
        })}

        {positions.map((p, i) => (
          <AtelierPvModule
            key={i}
            ox={p.ox}
            oy={p.oy}
            southAccent={p.row === rows - 1}
            UX={UX}
            UY={UY}
            VX={VX}
            VY={VY}
            uid={uid}
          />
        ))}

        <text
          x={southEdgeMid.x}
          y={labelY}
          textAnchor="middle"
          fill="#F97316"
          fontSize={11.5 / scale}
          fontWeight="800"
          letterSpacing={1.6 / scale}
          fontFamily="Montserrat, system-ui, sans-serif"
        >
          {southLabel}
        </text>
      </g>
    </svg>
  );
}
