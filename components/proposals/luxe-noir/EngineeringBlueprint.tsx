"use client";

/**
 * Premium Luxe — Engineering Design page.
 * Dark isometric roof array + illustrated system architecture + site metrics.
 * Schematic only — not Design Studio / live SLD embed.
 */

import type { ProposalData } from "@/lib/proposal-data";
import { formatLuxeKw, formatLuxeUnits } from "./luxe-format";
import { ExpertVerdict } from "./ExpertVerdict";
import { useLuxeLang } from "./luxe-lang-context";
import { luxeDisplayFont } from "./luxe-fonts";
import { useLuxeVendorName, luxeVendorOrFallback } from "./luxe-vendor";
import styles from "./luxe.module.css";

export type EngineeringBlueprintProps = {
  data: ProposalData;
};

const PANEL_WATT = 580;
/** Incl. walkway allowance; ~2.2 m² × 10.764 → sq ft */
const SQFT_PER_PANEL = 24;
const MAX_DRAW = 18;

function metricValue(
  data: ProposalData,
  pattern: RegExp,
  fallback: string
): string {
  const hit = data.engineering.metrics.find((m) => pattern.test(m.label));
  return hit?.value?.trim() || fallback;
}

/**
 * Landscape module on GI rails — aluminium frame, cell grid, busbars, mid-clamps.
 */
function IsoPanel({
  cx,
  cy,
}: {
  cx: number;
  cy: number;
}) {
  // Landscape on roof; south tilt via down vector
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

  // Cell grid (6 × 3 landscape)
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

  // Thin busbars
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

  // Mid-clamp positions on long edges (into rails)
  const clampPts = [
    { x: p0x + rightX * 0.5 + downX * 0.02, y: p0y + rightY * 0.5 + downY * 0.02 },
    { x: p0x + rightX * 0.5 + downX * 0.98, y: p0y + rightY * 0.5 + downY * 0.98 },
  ];

  return (
    <g>
      {/* Panel thickness (depth) */}
      <polygon
        points={`${p3x},${p3y} ${p2x},${p2y} ${t2x},${t2y} ${t3x},${t3y}`}
        fill="#121a26"
      />
      <polygon
        points={`${p1x},${p1y} ${p2x},${p2y} ${t2x},${t2y} ${t1x},${t1y}`}
        fill="#1e2a3a"
      />

      {/* Aluminium frame */}
      <polygon
        points={`${p0x},${p0y} ${p1x},${p1y} ${p2x},${p2y} ${p3x},${p3y}`}
        fill="url(#panelFrame)"
        stroke="#dce2ea"
        strokeWidth="0.9"
      />

      {/* Photovoltaic glass + cells */}
      <polygon
        points={`${g0x},${g0y} ${g1x},${g1y} ${g2x},${g2y} ${g3x},${g3y}`}
        fill="url(#panelGlass)"
        stroke="#B8962E"
        strokeWidth="0.45"
      />
      <path
        d={cells.join(" ")}
        fill="none"
        stroke="rgba(180,205,235,0.28)"
        strokeWidth="0.55"
      />
      <path
        d={bus.join(" ")}
        fill="none"
        stroke="rgba(220,230,245,0.45)"
        strokeWidth="0.7"
        strokeLinecap="round"
      />
      {/* Specular glint */}
      <line
        x1={g0x + rightX * 0.06}
        y1={g0y + rightY * 0.06 + 1.2}
        x2={g0x + rightX * 0.38}
        y2={g0y + rightY * 0.38 + 1.2}
        stroke="rgba(255,255,255,0.38)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {/* Mid clamps gripping frame to rail */}
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

/** Continuous C-channel GI rails on standing legs — elevated rooftop mount. */
function ArrayRailBank({
  positions,
}: {
  positions: { cx: number; cy: number }[];
  cols: number;
}) {
  if (positions.length === 0) return null;
  const rows: { cx: number; cy: number }[][] = [];
  for (const p of positions) {
    const last = rows[rows.length - 1];
    if (!last || Math.abs(last[0]!.cy - p.cy) > 8) {
      rows.push([p]);
    } else {
      last.push(p);
    }
  }

  /** Front shorter / rear taller → south tilt reads clearly */
  const LEG_FRONT = 14;
  const LEG_REAR = 20;
  /** Rails sit just under module silhouette so legs stay visible */
  const RAIL_FRONT = 21;
  const RAIL_REAR = 29;

  return (
    <g>
      {rows.map((row, ri) => {
        const sorted = [...row].sort((a, b) => a.cx - b.cx);
        const first = sorted[0]!;
        const last = sorted[sorted.length - 1]!;
        const skew = (last.cy - first.cy) * 0.12;
        const x0 = first.cx - 4;
        const x1 = last.cx + 46;
        const yFront = first.cy + RAIL_FRONT;
        const yBack = first.cy + RAIL_REAR;

        const legs = sorted.flatMap((p, pi) => {
          const t = sorted.length > 1 ? pi / (sorted.length - 1) : 0;
          const sk = skew * t;
          return [
            {
              kind: "front" as const,
              xTop: p.cx + 10,
              yTop: yFront + sk,
              h: LEG_FRONT,
            },
            {
              kind: "rear" as const,
              xTop: p.cx + 30,
              yTop: yBack + sk,
              h: LEG_REAR,
            },
          ];
        });

        return (
          <g key={`rails-${ri}`}>
            {/* Standing GI legs (draw first — under rails) */}
            {legs.map((leg, li) => {
              const xBot = leg.xTop + 1.2;
              const yBot = leg.yTop + leg.h;
              const isRear = leg.kind === "rear";
              return (
                <g key={`leg-${ri}-${li}`}>
                  {/* Contact shadow on deck */}
                  <ellipse
                    cx={xBot + 0.5}
                    cy={yBot + 1.2}
                    rx="3.2"
                    ry="1.3"
                    fill="rgba(0,0,0,0.4)"
                  />
                  {/* Vertical post */}
                  <line
                    x1={leg.xTop}
                    y1={leg.yTop}
                    x2={xBot}
                    y2={yBot}
                    stroke={isRear ? "#8a93a0" : "#b0b7c2"}
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                  {/* Post highlight edge */}
                  <line
                    x1={leg.xTop - 0.7}
                    y1={leg.yTop + 1}
                    x2={xBot - 0.7}
                    y2={yBot - 1}
                    stroke="rgba(232,236,242,0.35)"
                    strokeWidth="0.7"
                    strokeLinecap="round"
                  />
                  {/* Base plate on roof */}
                  <rect
                    x={xBot - 3.2}
                    y={yBot - 0.4}
                    width="6.8"
                    height="2"
                    rx="0.35"
                    fill="#c5ccd6"
                    stroke="#5c6573"
                    strokeWidth="0.4"
                  />
                  {/* Top cleat into rail */}
                  <rect
                    x={leg.xTop - 2.6}
                    y={leg.yTop - 1.2}
                    width="5.4"
                    height="2.2"
                    rx="0.3"
                    fill="#d0d6de"
                    stroke="#6a7380"
                    strokeWidth="0.35"
                  />
                </g>
              );
            })}

            {/* Light diagonal brace per module bay */}
            {sorted.map((p, pi) => {
              const t = sorted.length > 1 ? pi / (sorted.length - 1) : 0;
              const sk = skew * t;
              const fx = p.cx + 10;
              const fy = yFront + sk + 3;
              const rx = p.cx + 30;
              const ry = yBack + sk + LEG_REAR - 3;
              return (
                <line
                  key={`brace-${ri}-${pi}`}
                  x1={fx + 1}
                  y1={fy}
                  x2={rx - 1}
                  y2={ry}
                  stroke="#7a8494"
                  strokeWidth="1.1"
                  strokeLinecap="round"
                  opacity="0.75"
                />
              );
            })}

            {/* Cross purlin linking legs mid-height */}
            <line
              x1={x0 + 4}
              y1={yFront + LEG_FRONT * 0.55}
              x2={x1 - 4}
              y2={yFront + LEG_FRONT * 0.55 + skew}
              stroke="#6a7380"
              strokeWidth="1.8"
              strokeLinecap="round"
              opacity="0.75"
            />

            {/* Front C-rail */}
            <line
              x1={x0}
              y1={yFront}
              x2={x1}
              y2={yFront + skew}
              stroke="#c8d0da"
              strokeWidth="3.4"
              strokeLinecap="round"
            />
            <line
              x1={x0}
              y1={yFront + 1.6}
              x2={x1}
              y2={yFront + 1.6 + skew}
              stroke="#7a8494"
              strokeWidth="1.4"
              strokeLinecap="round"
            />

            {/* Rear C-rail (higher for tilt) */}
            <line
              x1={x0 + 3}
              y1={yBack}
              x2={x1 + 1}
              y2={yBack + skew}
              stroke="#a8b0bc"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <line
              x1={x0 + 3}
              y1={yBack + 1.5}
              x2={x1 + 1}
              y2={yBack + 1.5 + skew}
              stroke="#5c6573"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </g>
        );
      })}
    </g>
  );
}

function IconPv() {
  return (
    <svg viewBox="0 0 72 56" className={styles.archIcon} aria-hidden>
      <rect x="6" y="4" width="28" height="22" rx="1.5" fill="#1e3550" stroke="#B8962E" strokeWidth="1.3" />
      <path d="M13 4v22M20 4v22M27 4v22M6 11h28M6 18h28" stroke="rgba(200,220,255,0.28)" strokeWidth="0.8" />
      <rect x="38" y="4" width="28" height="22" rx="1.5" fill="#1e3550" stroke="#B8962E" strokeWidth="1.3" />
      <path d="M45 4v22M52 4v22M59 4v22M38 11h28M38 18h28" stroke="rgba(200,220,255,0.28)" strokeWidth="0.8" />
      {/* Rail bank + short L-feet (not table legs) */}
      <rect x="8" y="30" width="56" height="4" rx="1" fill="#9aa3b0" stroke="#5c6573" strokeWidth="0.6" />
      <rect x="10" y="36" width="52" height="3.2" rx="0.8" fill="#7a8494" />
      <line x1="16" y1="39" x2="16" y2="44" stroke="#8a93a0" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="36" y1="39" x2="36" y2="44" stroke="#8a93a0" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="56" y1="39" x2="56" y2="44" stroke="#8a93a0" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="12" y="44" width="48" height="2.5" rx="0.6" fill="#6a7380" />
    </svg>
  );
}

function IconDcdb() {
  return (
    <svg viewBox="0 0 64 48" className={styles.archIcon} aria-hidden>
      <rect x="10" y="4" width="44" height="40" rx="3" fill="#f0f2f5" stroke="#141820" strokeWidth="1.4" />
      <rect x="10" y="4" width="44" height="8" rx="3" fill="#1e2a3a" />
      <text x="32" y="10" textAnchor="middle" fill="#B8962E" fontSize="5.5" fontWeight="700" letterSpacing="0.5">
        DCDB
      </text>
      <rect x="16" y="16" width="14" height="10" rx="1" fill="#fff" stroke="#B8962E" strokeWidth="1" />
      <line x1="19" y1="19" x2="27" y2="19" stroke="#B8962E" strokeWidth="1" />
      <line x1="19" y1="23" x2="27" y2="23" stroke="#B8962E" strokeWidth="1" />
      <rect x="34" y="16" width="14" height="10" rx="1" fill="#fff" stroke="#3a4250" strokeWidth="1" />
      <circle cx="41" cy="21" r="3" fill="none" stroke="#c45c26" strokeWidth="1.2" />
      <text x="18" y="36" fill="#2a3140" fontSize="4.5">
        Fuse
      </text>
      <text x="36" y="36" fill="#2a3140" fontSize="4.5">
        SPD
      </text>
      <circle cx="48" cy="40" r="2" fill="#B8962E" />
    </svg>
  );
}

function IconInv() {
  return (
    <svg viewBox="0 0 64 48" className={styles.archIcon} aria-hidden>
      <rect x="8" y="6" width="48" height="36" rx="3" fill="#1a2030" stroke="#B8962E" strokeWidth="1.3" />
      <rect x="14" y="12" width="28" height="14" rx="1.5" fill="#0a0e14" stroke="#3a4250" strokeWidth="0.8" />
      <text x="28" y="21" textAnchor="middle" fill="#7dcea0" fontSize="6" fontFamily="ui-monospace,monospace">
        INV
      </text>
      <rect x="46" y="12" width="4" height="22" rx="0.5" fill="#3a4250" />
      <rect x="51" y="14" width="3" height="18" rx="0.5" fill="#2a3140" />
      <circle cx="18" cy="34" r="2.2" fill="#2ecc71" />
      <circle cx="26" cy="34" r="2.2" fill="#B8962E" />
      <rect x="34" y="31" width="12" height="5" rx="1" fill="#3a4250" />
    </svg>
  );
}

function IconAcdb() {
  return (
    <svg viewBox="0 0 64 48" className={styles.archIcon} aria-hidden>
      <rect x="10" y="4" width="44" height="40" rx="3" fill="#f0f2f5" stroke="#141820" strokeWidth="1.4" />
      <rect x="10" y="4" width="44" height="8" rx="3" fill="#1e2a3a" />
      <text x="32" y="10" textAnchor="middle" fill="#B8962E" fontSize="5.5" fontWeight="700" letterSpacing="0.5">
        ACDB
      </text>
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${16 + i * 12}, 16)`}>
          <rect width="8" height="14" rx="1" fill="#fff" stroke="#3a4250" strokeWidth="0.9" />
          <rect x="2" y="3" width="4" height="6" rx="0.5" fill="#B8962E" />
          <circle cx="4" cy="12" r="1.2" fill="#c45c26" />
        </g>
      ))}
      <text x="32" y="40" textAnchor="middle" fill="#2a3140" fontSize="4.5">
        MCB · SPD · Isolator
      </text>
    </svg>
  );
}

function IconMeter() {
  return (
    <svg viewBox="0 0 64 48" className={styles.archIcon} aria-hidden>
      <rect x="14" y="4" width="36" height="40" rx="3" fill="#e8ecf1" stroke="#141820" strokeWidth="1.3" />
      <circle cx="32" cy="22" r="12" fill="#fff" stroke="#B8962E" strokeWidth="1.4" />
      <circle cx="32" cy="22" r="2" fill="#141820" />
      <line x1="32" y1="22" x2="32" y2="12" stroke="#141820" strokeWidth="1.4" />
      <line x1="32" y1="22" x2="40" y2="26" stroke="#B8962E" strokeWidth="1.2" />
      <text x="32" y="42" textAnchor="middle" fill="#2a3140" fontSize="5" fontWeight="600">
        NET
      </text>
      <path d="M22 30 Q32 36 42 30" fill="none" stroke="#2ecc71" strokeWidth="1" />
    </svg>
  );
}

function FlowArrow() {
  return (
    <span className={styles.flowArrow} aria-hidden>
      <svg width="22" height="14" viewBox="0 0 22 14">
        <path d="M0 7h16M12 2l8 5-8 5" fill="none" stroke="#B8962E" strokeWidth="1.6" />
      </svg>
    </span>
  );
}

export function EngineeringBlueprint({ data }: EngineeringBlueprintProps) {
  const systemKw = Number(data.meta.systemKw) || 3;
  const modulesRaw = Math.max(1, Math.ceil((systemKw * 1000) / PANEL_WATT));
  const modulesDraw = Math.min(modulesRaw, MAX_DRAW);
  const dcKwp = (modulesRaw * PANEL_WATT) / 1000;
  const dcAc = systemKw > 0 ? dcKwp / systemKw : 1.16;
  const roofSqft = Math.round(modulesRaw * SQFT_PER_PANEL);
  const tilt = data.engineering.tiltDeg ?? 20;
  const city =
    data.engineering.cityLabel?.trim() ||
    data.meta.locationLine?.split(",")[0]?.trim() ||
    "Madhya Pradesh";
  const annualUnits =
    data.closing.annualUnits > 0
      ? data.closing.annualUnits
      : Math.round(systemKw * 1450);
  const specificYield =
    systemKw > 0 ? Math.round(annualUnits / systemKw) : 1450;
  const prValue = metricValue(data, /pr|derat|loss|performance/i, "~75%");
  const standards =
    data.engineering.standards.length > 0
      ? data.engineering.standards.slice(0, 4).join(" · ")
      : "IS/IEC · CEA · DISCOM net-metering · IS 3043 earthing";

  // Landscape bank: prefer wide rows (panels lying flat E–W), 1–3 rows
  const preferredRows =
    modulesDraw <= 4 ? 1 : modulesDraw <= 12 ? 2 : 3;
  const cols = Math.max(1, Math.ceil(modulesDraw / preferredRows));
  const rows = Math.ceil(modulesDraw / cols);
  const strings = Math.max(1, Math.ceil(modulesRaw / 6));
  const perString = Math.ceil(modulesRaw / strings);

  // Isometric step — modules elevated on GI legs above roof deck
  const stepColX = 42;
  const stepColY = 12;
  const stepRowX = -16;
  const stepRowY = 16;
  const isoOriginX = 92;
  const isoOriginY = 72;

  const panelPositions = Array.from({ length: modulesDraw }).map((_, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return {
      cx: isoOriginX + col * stepColX + row * stepRowX,
      cy: isoOriginY + col * stepColY + row * stepRowY,
      z: row * 100 + col,
    };
  });
  // Draw back-to-front so nearer panels occlude structure behind
  panelPositions.sort((a, b) => a.cy - b.cy || a.cx - b.cx);

  const { copy, isHi } = useLuxeLang();
  const vendor = luxeVendorOrFallback(useLuxeVendorName(data), isHi);

  return (
    <section
      className={`${styles.a4Page} ${styles.hudPage} ${luxeDisplayFont.variable}`}
    >
      <header className={styles.luxeHeaderBlock}>
        <span className={styles.goldTag}>{copy.eng.tag}</span>
        <h2 className={styles.luxeHeadline}>{copy.eng.title}</h2>
      </header>

      <div className={styles.engDesignLayout}>
        {/* Dark 3D roof array */}
        <div className={`${styles.engPanel} ${styles.engPanelFlush}`}>
          <div className={styles.engPanelTitle}>{copy.eng.roofPlan}</div>
          <svg
            viewBox="0 0 320 240"
            width="100%"
            height="228"
            className={styles.engSvgDark}
            aria-hidden
          >
            <defs>
              <linearGradient id="panelGlass" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#4a6f92" />
                <stop offset="28%" stopColor="#244866" />
                <stop offset="62%" stopColor="#152a3c" />
                <stop offset="100%" stopColor="#0a1520" />
              </linearGradient>
              <linearGradient id="panelFrame" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e8ecf2" />
                <stop offset="45%" stopColor="#b8c0cc" />
                <stop offset="100%" stopColor="#7a8494" />
              </linearGradient>
              <linearGradient id="roofFloor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1a2230" />
                <stop offset="100%" stopColor="#080c12" />
              </linearGradient>
              <linearGradient id="roofSlab" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#2a3344" />
                <stop offset="100%" stopColor="#151c28" />
              </linearGradient>
              <pattern
                id="isoGrid"
                width="28"
                height="16"
                patternUnits="userSpaceOnUse"
                patternTransform="skewX(-30)"
              >
                <path
                  d="M0 16V0H28"
                  fill="none"
                  stroke="rgba(184,150,46,0.14)"
                  strokeWidth="0.6"
                />
              </pattern>
            </defs>

            <rect width="320" height="240" fill="url(#roofFloor)" rx="6" />
            <rect x="8" y="8" width="304" height="200" fill="url(#isoGrid)" rx="4" />

            {/* Isometric terrace / roof deck — clear surface the array sits on */}
            <polygon
              points="36,176 156,118 300,168 180,226"
              fill="url(#roofSlab)"
              opacity="0.92"
            />
            <polygon
              points="36,176 156,118 300,168 180,184 36,184"
              fill="rgba(184,150,46,0.07)"
            />
            {/* Deck edge highlight */}
            <path
              d="M36 176 L156 118 L300 168"
              fill="none"
              stroke="rgba(184,150,46,0.45)"
              strokeWidth="1.2"
            />
            <path
              d="M36 176 L180 226 L300 168"
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
            />
            {/* Soft contact shadow under standing legs */}
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
                  38
                }
                rx={cols * 22 + 16}
                ry={10 + rows * 2}
                fill="rgba(0,0,0,0.42)"
              />
            )}

            <ArrayRailBank positions={panelPositions} cols={cols} />

            {panelPositions.map((p, i) => (
              <IsoPanel key={i} cx={p.cx} cy={p.cy} />
            ))}

            {/* Compass rose */}
            <g transform="translate(42,42)">
              <circle r="24" fill="rgba(10,14,20,0.88)" stroke="#B8962E" strokeWidth="1.1" />
              <circle r="17" fill="none" stroke="rgba(184,150,46,0.4)" strokeWidth="0.7" />
              <line x1="0" y1="-15" x2="0" y2="15" stroke="rgba(255,255,255,0.28)" strokeWidth="0.7" />
              <line x1="-15" y1="0" x2="15" y2="0" stroke="rgba(255,255,255,0.28)" strokeWidth="0.7" />
              <polygon points="0,-14 3.8,-2 0,-4.2 -3.8,-2" fill="#B8962E" />
              <polygon points="0,14 3.2,3 0,5.2 -3.2,3" fill="#2a3140" />
              <text
                y="-17"
                textAnchor="middle"
                fill="#B8962E"
                fontSize="7"
                fontWeight="700"
                letterSpacing="1"
              >
                N
              </text>
              <text y="24" textAnchor="middle" fill="#a8b0bc" fontSize="6.5">
                S
              </text>
              <text x="19" y="3.5" textAnchor="middle" fill="#a8b0bc" fontSize="6">
                E
              </text>
              <text x="-19" y="3.5" textAnchor="middle" fill="#a8b0bc" fontSize="6">
                W
              </text>
            </g>
            <text
              x="42"
              y="82"
              textAnchor="middle"
              fill="#B8962E"
              fontSize="8"
              letterSpacing="1.2"
              fontWeight="600"
            >
              180° S · TILT {tilt.toFixed(0)}°
            </text>

            {/* Caption bar */}
            <rect x="0" y="212" width="320" height="28" fill="rgba(0,0,0,0.6)" />
            <text
              x="160"
              y="230"
              textAnchor="middle"
              fill="#e8ecf2"
              fontSize="10"
              fontFamily="system-ui,sans-serif"
              letterSpacing="0.4"
            >
              {modulesRaw} modules · {formatLuxeKw(dcKwp)} kWp DC · {strings}×
              {perString} string · rail mount · South
            </text>
          </svg>
        </div>

        {/* Site metrics — denser */}
        <div className={styles.engPanel}>
          <div className={styles.engPanelTitle}>{copy.eng.siteMetrics}</div>
          <div className={styles.engMetricList}>
            <div className={styles.engMetricRow}>
              <span>{copy.eng.location}</span>
              <strong>{city}</strong>
              <small>{copy.eng.locationHint}</small>
            </div>
            <div className={styles.engMetricRow}>
              <span>{copy.eng.roofArea}</span>
              <strong className={styles.luxeNum}>~{roofSqft} sq ft</strong>
              <small>
                {modulesRaw} × ~{SQFT_PER_PANEL} sq ft/module
                {isHi ? " incl. walkway. सर्वे के बाद अंतिम।" : " incl. walkway. Final after survey."}
              </small>
            </div>
            <div className={styles.engMetricRow}>
              <span>{copy.eng.stringTopo}</span>
              <strong className={styles.luxeNum}>
                {strings} × {perString} @ {PANEL_WATT} Wp
              </strong>
              <small>{copy.eng.stringHint}</small>
            </div>
            <div className={styles.engMetricRow}>
              <span>{copy.eng.specificYield}</span>
              <strong className={styles.luxeNum}>
                {formatLuxeUnits(specificYield)} kWh/kW
              </strong>
              <small>
                Est. {formatLuxeUnits(annualUnits)} {isHi ? "यूनिट/वर्ष" : "units/yr"} · PR{" "}
                {prValue} · wind 150 km/h mounts.
              </small>
            </div>
          </div>

          <div className={styles.engChipRow}>
            <div className={styles.engChip}>
              <em>DC</em>
              <strong className={styles.luxeNum}>{formatLuxeKw(dcKwp)} kWp</strong>
            </div>
            <div className={styles.engChip}>
              <em>AC</em>
              <strong className={styles.luxeNum}>{formatLuxeKw(systemKw)} kW</strong>
            </div>
            <div className={styles.engChip}>
              <em>DC/AC</em>
              <strong className={styles.luxeNum}>{dcAc.toFixed(2)}</strong>
            </div>
            <div className={styles.engChip}>
              <em>TILT</em>
              <strong className={styles.luxeNum}>{tilt.toFixed(0)}°</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Illustrated system architecture */}
      <div className={styles.powerFlow}>
        <div className={styles.engPanelTitle}>{copy.eng.arch}</div>
        <p className={styles.archLead}>{copy.eng.archLead}</p>
        <div className={styles.archTrack}>
          <div className={styles.archNode}>
            <IconPv />
            <span className={styles.flowCode}>PV ARRAY</span>
            <strong>Modules</strong>
            <em className={styles.luxeNum}>
              {modulesRaw}×{PANEL_WATT} Wp
            </em>
          </div>
          <FlowArrow />
          <div className={styles.archNode}>
            <IconDcdb />
            <span className={styles.flowCode}>DCDB</span>
            <strong>DC Box</strong>
            <em>Fuse + SPD</em>
          </div>
          <FlowArrow />
          <div className={styles.archNode}>
            <IconInv />
            <span className={styles.flowCode}>INVERTER</span>
            <strong>String INV</strong>
            <em className={styles.luxeNum}>{formatLuxeKw(systemKw)} kW</em>
          </div>
          <FlowArrow />
          <div className={styles.archNode}>
            <IconAcdb />
            <span className={styles.flowCode}>ACDB</span>
            <strong>AC Box</strong>
            <em>MCB + SPD</em>
          </div>
          <FlowArrow />
          <div className={styles.archNode}>
            <IconMeter />
            <span className={styles.flowCode}>GRID</span>
            <strong>Net meter</strong>
            <em>Bi-directional</em>
          </div>
        </div>

        <div className={styles.archProtect}>
          <div className={styles.archProtectItem}>
            <svg className={styles.archProtectIcon} viewBox="0 0 24 24" aria-hidden>
              <path
                d="M13 2L4 14h7l-1 8 10-14h-7l0-6z"
                fill="none"
                stroke="#B8962E"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
            <div>
              <strong>{copy.eng.la}</strong>
              <small>Type-I/II surge path bonded to earth electrode</small>
            </div>
          </div>
          <div className={styles.archProtectItem}>
            <svg className={styles.archProtectIcon} viewBox="0 0 24 24" aria-hidden>
              <path
                d="M12 3v10M8 13h8M9 16h6M10.5 19h3"
                fill="none"
                stroke="#B8962E"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
            <div>
              <strong>{copy.eng.earth}</strong>
              <small>≤1 Ω resistance · IS 3043 compliant pits</small>
            </div>
          </div>
          <div className={styles.archProtectItem}>
            <svg className={styles.archProtectIcon} viewBox="0 0 24 24" aria-hidden>
              <path
                d="M4 8h16M4 12h16M4 16h16"
                fill="none"
                stroke="#B8962E"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <circle cx="8" cy="8" r="1.5" fill="#B8962E" />
              <circle cx="16" cy="12" r="1.5" fill="#B8962E" />
              <circle cx="10" cy="16" r="1.5" fill="#B8962E" />
            </svg>
            <div>
              <strong>{copy.eng.cable}</strong>
              <small>TUV DC / FRLS AC sized to string current</small>
            </div>
          </div>
        </div>
      </div>

      <ExpertVerdict label={copy.eng.verdictLabel}>
        {copy.eng.verdict}
      </ExpertVerdict>

      <p className={styles.standardsStrip}>{standards}</p>

      <footer className={styles.impactPageFooter}>
        <span>{vendor.toUpperCase()}</span>
        <span>05 / 11</span>
      </footer>
    </section>
  );
}

export default EngineeringBlueprint;
