"use client";

/**
 * Atelier — soft-tilt terrace PV bank (schematic “yield story”).
 * Auto-fits / centers in the stage — not Quantum dark isometric.
 */

type AtelierRoofPlanProps = {
  modules: number;
  southLabel?: string;
  className?: string;
};

const MAX_DRAW = 18;
const VB_W = 480;
const VB_H = 280;
const PAD = 28;

type Pt = { x: number; y: number };

function moduleGrid(count: number): { cols: number; rows: number } {
  const n = Math.min(Math.max(1, count), MAX_DRAW);
  if (n <= 3) return { cols: n, rows: 1 };
  if (n <= 8) return { cols: Math.ceil(n / 2), rows: 2 };
  return { cols: Math.ceil(n / 3), rows: 3 };
}

/** Soft iso basis sized so small banks still read large. */
function isoBasis(cols: number, rows: number) {
  const targetW = 340;
  const targetH = 180;
  const gapU = 0.12;
  const gapV = 0.2;
  const bankWU = cols * (1 + gapU) - gapU;
  const bankWV = rows * (1 + gapV) - gapV;
  // Prefer width fill for wide banks; height for tall ones
  const ux = Math.min(52, targetW / Math.max(bankWU, 0.5));
  const uy = ux * 0.22;
  const vy = Math.min(30, targetH / Math.max(bankWV, 0.5));
  const vx = -uy * 0.85;
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
}: {
  ox: number;
  oy: number;
  southAccent: boolean;
  UX: number;
  UY: number;
  VX: number;
  VY: number;
}) {
  const at = (u: number, v: number, z = 0): Pt => ({
    x: ox + UX * u + VX * v,
    y: oy + UY * u + VY * v - z,
  });
  const poly = (...pts: Pt[]) => pts.map((p) => `${p.x},${p.y}`).join(" ");

  const p0 = at(0, 0);
  const p1 = at(1, 0);
  const p2 = at(1, 1);
  const p3 = at(0, 1);
  const thick = Math.max(2.4, UX * 0.06);
  const inset = 0.07;
  const g0 = at(inset, inset);
  const g1 = at(1 - inset, inset);
  const g2 = at(1 - inset, 1 - inset);
  const g3 = at(inset, 1 - inset);

  const cellCols = 6;
  const cellRows = 3;
  const cells: { pts: string; fill: string }[] = [];
  for (let r = 0; r < cellRows; r++) {
    for (let c = 0; c < cellCols; c++) {
      const u0 = inset + ((1 - 2 * inset) * c) / cellCols + 0.006;
      const u1 = inset + ((1 - 2 * inset) * (c + 1)) / cellCols - 0.006;
      const v0 = inset + ((1 - 2 * inset) * r) / cellRows + 0.006;
      const v1 = inset + ((1 - 2 * inset) * (r + 1)) / cellRows - 0.006;
      const tone = 0.92 + ((c + r) % 3) * 0.03;
      cells.push({
        pts: poly(at(u0, v0), at(u1, v0), at(u1, v1), at(u0, v1)),
        fill: `rgb(${14 + r * 3},${48 + c * 4},${88 * tone})`,
      });
    }
  }

  const bus: string[] = [];
  for (const t of [0.22, 0.4, 0.58, 0.76]) {
    const a = at(t, inset + 0.04);
    const b = at(t, 1 - inset - 0.04);
    bus.push(`M ${a.x},${a.y} L ${b.x},${b.y}`);
  }

  const glintA = at(inset + 0.08, inset + 0.1);
  const glintB = at(inset + 0.42, inset + 0.22);

  return (
    <g>
      <polygon
        points={poly(p3, p2, at(1, 1, thick), at(0, 1, thick))}
        fill="#64748B"
      />
      <polygon
        points={poly(p1, p2, at(1, 1, thick), at(1, 0, thick))}
        fill="#94A3B8"
      />
      <polygon
        points={poly(p0, p1, p2, p3)}
        fill="#CBD5E1"
        stroke="#64748B"
        strokeWidth="0.55"
      />
      <polygon points={poly(g0, g1, g2, g3)} fill="#0A2540" />
      {cells.map((cell, i) => (
        <polygon
          key={i}
          points={cell.pts}
          fill={cell.fill}
          stroke="rgba(4,16,28,0.4)"
          strokeWidth="0.25"
        />
      ))}
      <path
        d={bus.join(" ")}
        fill="none"
        stroke="rgba(186,210,230,0.4)"
        strokeWidth="0.55"
        strokeLinecap="round"
      />
      <line
        x1={glintA.x}
        y1={glintA.y}
        x2={glintB.x}
        y2={glintB.y}
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      {southAccent ? (
        <path
          d={`M ${g3.x},${g3.y} L ${g2.x},${g2.y}`}
          fill="none"
          stroke="#F97316"
          strokeWidth="1.6"
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

  const stepU = 1 + gapU;
  const stepV = 1 + gapV;
  const toLocal = (u: number, v: number) => ({
    x: UX * u + VX * v,
    y: UY * u + VY * v,
  });

  const slabPadU = 0.45;
  const slabPadV = 0.5;
  const slab = [
    toLocal(-slabPadU, -slabPadV),
    toLocal(bankWU + slabPadU, -slabPadV),
    toLocal(bankWU + slabPadU, bankWV + slabPadV),
    toLocal(-slabPadU, bankWV + slabPadV),
  ];
  const slabPoly = slab.map((p) => `${p.x},${p.y}`).join(" ");

  const southEdgeMid = toLocal(bankWU / 2, bankWV + 0.2);
  const labelY = southEdgeMid.y + 22;

  const positions = Array.from({ length: draw }).map((_, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const p = toLocal(col * stepU, row * stepV);
    return { ox: p.x, oy: p.y, row };
  });
  positions.sort((a, b) => a.oy - b.oy || a.ox - b.ox);

  // Bounds: slab + module thickness + south label
  const allPts: Pt[] = [
    ...slab,
    ...slab.map((p) => ({ x: p.x + 5, y: p.y + 8 })),
    { x: southEdgeMid.x - 40, y: labelY },
    { x: southEdgeMid.x + 40, y: labelY + 4 },
  ];
  // Include module south faces roughly
  for (const p of positions) {
    allPts.push(
      { x: p.ox, y: p.oy },
      { x: p.ox + UX + VX, y: p.oy + UY + VY + 4 }
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
        <linearGradient id="alTerraceV2" x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="55%" stopColor="#EEF2F7" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>
        <radialGradient id="alStageGlow" cx="50%" cy="42%" r="55%">
          <stop offset="0%" stopColor="rgba(249,115,22,0.07)" />
          <stop offset="100%" stopColor="rgba(249,115,22,0)" />
        </radialGradient>
      </defs>

      {/* Full-bleed stage atmosphere so empty space never reads as a void */}
      <rect width={VB_W} height={VB_H} fill="url(#alStageWash)" />
      <rect width={VB_W} height={VB_H} fill="url(#alStageGlow)" />

      <g transform={`translate(${tx} ${ty}) scale(${scale})`}>
        <polygon
          points={slab
            .map((p) => `${p.x + 5},${p.y + 8}`)
            .join(" ")}
          fill="rgba(15,23,42,0.1)"
        />
        <polygon
          points={slabPoly}
          fill="url(#alTerraceV2)"
          stroke="#CBD5E1"
          strokeWidth={1.4 / scale}
        />
        {Array.from({ length: 5 }).map((_, i) => {
          const t = (i + 1) / 6;
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
              stroke="rgba(100,116,139,0.16)"
              strokeWidth={0.8 / scale}
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
          />
        ))}

        <text
          x={southEdgeMid.x}
          y={labelY}
          textAnchor="middle"
          fill="#F97316"
          fontSize={12 / scale}
          fontWeight="800"
          letterSpacing={1.8 / scale}
          fontFamily="Montserrat, system-ui, sans-serif"
        >
          {southLabel}
        </text>
      </g>
    </svg>
  );
}
