"use client";

/**
 * Atelier — top-down terrace PV bank (schematic).
 * Warm editorial look — not Quantum isometric / not orange blocks.
 */

type AtelierRoofPlanProps = {
  modules: number;
  className?: string;
};

const MAX_DRAW = 18;

function moduleGrid(count: number): { cols: number; rows: number } {
  const n = Math.min(Math.max(1, count), MAX_DRAW);
  if (n <= 3) return { cols: n, rows: 1 };
  if (n <= 8) return { cols: Math.ceil(n / 2), rows: 2 };
  return { cols: Math.ceil(n / 3), rows: 3 };
}

function AtelierPvModule({
  x,
  y,
  w,
  h,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
}) {
  const inset = 1.8;
  const gx = x + inset;
  const gy = y + inset;
  const gw = w - inset * 2;
  const gh = h - inset * 2;
  const cols = 6;
  const rows = 4;
  const gap = 0.55;
  const cw = (gw - gap * (cols - 1)) / cols;
  const ch = (gh - gap * (rows - 1)) / rows;

  const cells: { cx: number; cy: number; fill: string }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const shade = 0.88 + ((c + r) % 3) * 0.04;
      cells.push({
        cx: gx + c * (cw + gap),
        cy: gy + r * (ch + gap),
        fill: `rgb(${18 + r * 2},${55 + c * 3},${95 * shade})`,
      });
    }
  }

  const busXs = [0.2, 0.4, 0.6, 0.8].map((t) => gx + gw * t);

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={1.2}
        fill="#9AA4B2"
        stroke="#5B6574"
        strokeWidth={0.6}
      />
      <rect x={gx} y={gy} width={gw} height={gh} rx={0.6} fill="#0B2740" />
      {cells.map((cell, i) => (
        <rect
          key={i}
          x={cell.cx}
          y={cell.cy}
          width={cw}
          height={ch}
          rx={0.25}
          fill={cell.fill}
          stroke="rgba(4,16,28,0.45)"
          strokeWidth={0.2}
        />
      ))}
      {busXs.map((bx, i) => (
        <line
          key={i}
          x1={bx}
          y1={gy + 1}
          x2={bx}
          y2={gy + gh - 1}
          stroke="rgba(200,215,230,0.35)"
          strokeWidth={0.45}
          strokeLinecap="round"
        />
      ))}
      {/* Thin south-edge accent (atelier orange) — orientation cue only */}
      <rect x={x + 2} y={y + h - 1.4} width={w - 4} height={0.9} fill="#F97316" opacity={0.85} />
    </g>
  );
}

export function AtelierRoofPlan({ modules, className }: AtelierRoofPlanProps) {
  const draw = Math.min(Math.max(1, modules), MAX_DRAW);
  const { cols, rows } = moduleGrid(draw);

  const vbW = 520;
  const vbH = 220;
  const padX = 36;
  const padY = 28;
  const gapX = 7;
  const gapY = 9;
  const bankW = vbW - padX * 2;
  const bankH = vbH - padY * 2 - 18;
  const modW = (bankW - gapX * (cols - 1)) / cols;
  const modH = (bankH - gapY * (rows - 1)) / rows;
  const originX = padX;
  const originY = padY;

  const slabPad = 14;

  return (
    <svg
      className={className}
      viewBox={`0 0 ${vbW} ${vbH}`}
      width="100%"
      height="100%"
      aria-hidden
    >
      <defs>
        <linearGradient id="alTerrace" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="100%" stopColor="#E8EEF5" />
        </linearGradient>
        <pattern
          id="alJoints"
          width="28"
          height="28"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M28 0 H0 M0 0 V28"
            stroke="rgba(100,116,139,0.12)"
            strokeWidth="0.6"
            fill="none"
          />
        </pattern>
      </defs>

      {/* Terrace slab */}
      <rect
        x={originX - slabPad}
        y={originY - slabPad}
        width={bankW + slabPad * 2}
        height={bankH + slabPad * 2}
        rx={10}
        fill="url(#alTerrace)"
        stroke="#CBD5E1"
        strokeWidth={1.2}
      />
      <rect
        x={originX - slabPad}
        y={originY - slabPad}
        width={bankW + slabPad * 2}
        height={bankH + slabPad * 2}
        rx={10}
        fill="url(#alJoints)"
      />
      {/* Soft edge depth */}
      <rect
        x={originX - slabPad}
        y={originY - slabPad + bankH + slabPad * 2 - 8}
        width={bankW + slabPad * 2}
        height={8}
        fill="rgba(15,23,42,0.06)"
      />

      {Array.from({ length: draw }).map((_, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        return (
          <AtelierPvModule
            key={i}
            x={originX + col * (modW + gapX)}
            y={originY + row * (modH + gapY)}
            w={modW}
            h={modH}
          />
        );
      })}
    </svg>
  );
}
