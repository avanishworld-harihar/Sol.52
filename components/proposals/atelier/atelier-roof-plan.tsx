"use client";

/**
 * Atelier — soft-tilt terrace PV bank (schematic “yield story”).
 * Light cream editorial — not Quantum dark isometric / not orange blocks.
 */

type AtelierRoofPlanProps = {
  modules: number;
  southLabel?: string;
  className?: string;
};

const MAX_DRAW = 18;

/** Soft iso: u → right-down, v → left-down (south toward bottom). */
const UX = 38;
const UY = 9;
const VX = -8;
const VY = 22;

type Pt = { x: number; y: number };

function moduleGrid(count: number): { cols: number; rows: number } {
  const n = Math.min(Math.max(1, count), MAX_DRAW);
  if (n <= 3) return { cols: n, rows: 1 };
  if (n <= 8) return { cols: Math.ceil(n / 2), rows: 2 };
  return { cols: Math.ceil(n / 3), rows: 3 };
}

function AtelierPvModule({
  ox,
  oy,
  southAccent,
}: {
  ox: number;
  oy: number;
  southAccent: boolean;
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
  const thick = 2.2;
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
        strokeWidth="0.5"
        strokeLinecap="round"
      />
      <line
        x1={glintA.x}
        y1={glintA.y}
        x2={glintB.x}
        y2={glintB.y}
        stroke="rgba(255,255,255,0.45)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {southAccent ? (
        <path
          d={`M ${g3.x},${g3.y} L ${g2.x},${g2.y}`}
          fill="none"
          stroke="#F97316"
          strokeWidth="1.4"
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

  const gapU = 0.14;
  const gapV = 0.22;
  const stepU = 1 + gapU;
  const stepV = 1 + gapV;

  const bankWU = cols * stepU - gapU;
  const bankWV = rows * stepV - gapV;

  const originX = 48;
  const originY = 36;
  const toScreen = (u: number, v: number) => ({
    x: originX + UX * u + VX * v,
    y: originY + UY * u + VY * v,
  });

  const slabPadU = 0.35;
  const slabPadV = 0.4;
  const slab = [
    toScreen(-slabPadU, -slabPadV),
    toScreen(bankWU + slabPadU, -slabPadV),
    toScreen(bankWU + slabPadU, bankWV + slabPadV),
    toScreen(-slabPadU, bankWV + slabPadV),
  ];
  const slabPoly = slab.map((p) => `${p.x},${p.y}`).join(" ");

  const southEdgeMid = toScreen(bankWU / 2, bankWV + 0.15);
  const positions = Array.from({ length: draw }).map((_, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return {
      ox: originX + UX * (col * stepU) + VX * (row * stepV),
      oy: originY + UY * (col * stepU) + VY * (row * stepV),
      row,
    };
  });
  positions.sort((a, b) => a.oy - b.oy || a.ox - b.ox);

  return (
    <svg
      className={className}
      viewBox="0 0 420 260"
      width="100%"
      height="100%"
      aria-hidden
    >
      <defs>
        <linearGradient id="alTerraceV2" x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="55%" stopColor="#EEF2F7" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>
      </defs>

      {/* Soft shadow under slab */}
      <polygon
        points={slab
          .map((p) => `${p.x + 4},${p.y + 6}`)
          .join(" ")}
        fill="rgba(15,23,42,0.08)"
      />

      {/* Terrace slab */}
      <polygon
        points={slabPoly}
        fill="url(#alTerraceV2)"
        stroke="#CBD5E1"
        strokeWidth="1.3"
      />
      {/* Joint lines */}
      {Array.from({ length: 5 }).map((_, i) => {
        const t = (i + 1) / 6;
        const a = toScreen(-slabPadU + t * (bankWU + 2 * slabPadU), -slabPadV);
        const b = toScreen(
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
            stroke="rgba(100,116,139,0.14)"
            strokeWidth="0.7"
          />
        );
      })}

      {positions.map((p, i) => (
        <AtelierPvModule
          key={i}
          ox={p.ox}
          oy={p.oy}
          southAccent={p.row === rows - 1}
        />
      ))}

      {/* SOUTH edge label */}
      <text
        x={southEdgeMid.x}
        y={southEdgeMid.y + 18}
        textAnchor="middle"
        fill="#F97316"
        fontSize="9"
        fontWeight="800"
        letterSpacing="1.6"
        fontFamily="Montserrat, system-ui, sans-serif"
      >
        {southLabel}
      </text>
    </svg>
  );
}
