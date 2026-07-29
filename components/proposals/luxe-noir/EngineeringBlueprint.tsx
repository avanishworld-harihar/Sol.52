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
import styles from "./luxe.module.css";

export type EngineeringBlueprintProps = {
  data: ProposalData;
};

const PANEL_WATT = 580;
const M2_PER_PANEL = 2.2;
const MAX_DRAW = 18;

function metricValue(
  data: ProposalData,
  pattern: RegExp,
  fallback: string
): string {
  const hit = data.engineering.metrics.find((m) => pattern.test(m.label));
  return hit?.value?.trim() || fallback;
}

/** Landscape rooftop module — glass face, aluminium frame, GI legs + rails. */
function IsoPanel({
  cx,
  cy,
}: {
  cx: number;
  cy: number;
}) {
  // Landscape: long E–W edge, short N–S edge on roof plane
  const rightX = 40;
  const rightY = 12.5;
  const downX = -15;
  const downY = 11;
  const thick = 3.8;
  const legH = 13;

  const p0x = cx;
  const p0y = cy;
  const p1x = cx + rightX;
  const p1y = cy + rightY;
  const p2x = cx + rightX + downX;
  const p2y = cy + rightY + downY;
  const p3x = cx + downX;
  const p3y = cy + downY;

  // Thickness extrusion (down toward viewer / “ground”)
  const t1x = p1x;
  const t1y = p1y + thick;
  const t2x = p2x;
  const t2y = p2y + thick;
  const t3x = p3x;
  const t3y = p3y + thick;

  // Mount rail under long edges (slightly inset)
  const railInset = 0.12;
  const r0x = p0x + rightX * railInset + downX * 0.15;
  const r0y = p0y + rightY * railInset + downY * 0.15 + thick + 1;
  const r1x = p0x + rightX * (1 - railInset) + downX * 0.15;
  const r1y = p0y + rightY * (1 - railInset) + downY * 0.15 + thick + 1;
  const r2x = p0x + rightX * (1 - railInset) + downX * 0.85;
  const r2y = p0y + rightY * (1 - railInset) + downY * 0.85 + thick + 1;
  const r3x = p0x + rightX * railInset + downX * 0.85;
  const r3y = p0y + rightY * railInset + downY * 0.85 + thick + 1;

  // Four legs: near corners of underside, drop to roof
  const legs = [
    { x: r0x + 2, y: r0y + 1 },
    { x: r1x - 2, y: r1y + 1 },
    { x: r2x - 2, y: r2y + 1 },
    { x: r3x + 2, y: r3y + 1 },
  ];

  const cells: string[] = [];
  for (let i = 1; i < 7; i++) {
    const t = i / 7;
    const ax = p0x + rightX * t;
    const ay = p0y + rightY * t;
    cells.push(`M ${ax},${ay} L ${ax + downX},${ay + downY}`);
  }
  for (let j = 1; j < 4; j++) {
    const t = j / 4;
    const ax = p0x + downX * t;
    const ay = p0y + downY * t;
    cells.push(`M ${ax},${ay} L ${ax + rightX},${ay + rightY}`);
  }

  // Inner glass inset (aluminium frame lip)
  const inset = 0.08;
  const g0x = p0x + rightX * inset + downX * inset;
  const g0y = p0y + rightY * inset + downY * inset;
  const g1x = p0x + rightX * (1 - inset) + downX * inset;
  const g1y = p0y + rightY * (1 - inset) + downY * inset;
  const g2x = p0x + rightX * (1 - inset) + downX * (1 - inset);
  const g2y = p0y + rightY * (1 - inset) + downY * (1 - inset);
  const g3x = p0x + rightX * inset + downX * (1 - inset);
  const g3y = p0y + rightY * inset + downY * (1 - inset);

  return (
    <g>
      {/* Leg feet shadows */}
      {legs.map((leg, i) => (
        <ellipse
          key={`sh-${i}`}
          cx={leg.x + 1}
          cy={leg.y + legH + 1.5}
          rx="3.2"
          ry="1.4"
          fill="rgba(0,0,0,0.35)"
        />
      ))}

      {/* GI legs */}
      {legs.map((leg, i) => (
        <g key={`leg-${i}`}>
          <line
            x1={leg.x}
            y1={leg.y}
            x2={leg.x + 0.8}
            y2={leg.y + legH}
            stroke="#7a8494"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <line
            x1={leg.x + 1.4}
            y1={leg.y}
            x2={leg.x + 2.1}
            y2={leg.y + legH}
            stroke="#c5ccd6"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.85"
          />
          <rect
            x={leg.x - 1.5}
            y={leg.y + legH - 0.5}
            width="5"
            height="2"
            rx="0.4"
            fill="#9aa3b0"
            stroke="#5c6573"
            strokeWidth="0.4"
          />
        </g>
      ))}

      {/* Cross brace between front legs */}
      <line
        x1={legs[2]!.x}
        y1={legs[2]!.y + legH * 0.45}
        x2={legs[3]!.x}
        y2={legs[3]!.y + legH * 0.45}
        stroke="#8a93a0"
        strokeWidth="1.4"
        strokeLinecap="round"
      />

      {/* Mounting rails (C-channel look) */}
      <polygon
        points={`${r0x},${r0y} ${r1x},${r1y} ${r1x},${r1y + 2.2} ${r0x},${r0y + 2.2}`}
        fill="#9aa3b0"
        stroke="#5c6573"
        strokeWidth="0.45"
      />
      <polygon
        points={`${r3x},${r3y} ${r2x},${r2y} ${r2x},${r2y + 2.2} ${r3x},${r3y + 2.2}`}
        fill="#7a8494"
        stroke="#5c6573"
        strokeWidth="0.45"
      />
      <polygon
        points={`${r0x},${r0y} ${r3x},${r3y} ${r3x},${r3y + 2} ${r0x},${r0y + 2}`}
        fill="#b0b7c2"
        stroke="#6a7380"
        strokeWidth="0.35"
      />
      <polygon
        points={`${r1x},${r1y} ${r2x},${r2y} ${r2x},${r2y + 2} ${r1x},${r1y + 2}`}
        fill="#8a93a0"
        stroke="#5c6573"
        strokeWidth="0.35"
      />

      {/* Panel thickness (south + east faces) */}
      <polygon
        points={`${p3x},${p3y} ${p2x},${p2y} ${t2x},${t2y} ${t3x},${t3y}`}
        fill="#1a2433"
      />
      <polygon
        points={`${p1x},${p1y} ${p2x},${p2y} ${t2x},${t2y} ${t1x},${t1y}`}
        fill="#243044"
      />

      {/* Aluminium outer frame */}
      <polygon
        points={`${p0x},${p0y} ${p1x},${p1y} ${p2x},${p2y} ${p3x},${p3y}`}
        fill="url(#panelFrame)"
        stroke="#c8d0da"
        strokeWidth="0.7"
      />

      {/* Glass / cell face */}
      <polygon
        points={`${g0x},${g0y} ${g1x},${g1y} ${g2x},${g2y} ${g3x},${g3y}`}
        fill="url(#panelGlass)"
        stroke="#B8962E"
        strokeWidth="0.55"
      />
      <path
        d={cells.join(" ")}
        fill="none"
        stroke="rgba(200,220,255,0.22)"
        strokeWidth="0.55"
      />
      {/* Specular highlight */}
      <line
        x1={g0x + rightX * 0.08}
        y1={g0y + rightY * 0.08 + 1}
        x2={g0x + rightX * 0.42}
        y2={g0y + rightY * 0.42 + 1}
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <line
        x1={g0x + rightX * 0.12}
        y1={g0y + rightY * 0.12 + 3}
        x2={g0x + rightX * 0.28}
        y2={g0y + rightY * 0.28 + 3}
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </g>
  );
}

function IconPv() {
  return (
    <svg viewBox="0 0 72 56" className={styles.archIcon} aria-hidden>
      <rect x="6" y="6" width="28" height="22" rx="1.5" fill="#1e3550" stroke="#B8962E" strokeWidth="1.3" />
      <path d="M13 6v22M20 6v22M27 6v22M6 13h28M6 20h28" stroke="rgba(200,220,255,0.28)" strokeWidth="0.8" />
      <rect x="38" y="6" width="28" height="22" rx="1.5" fill="#1e3550" stroke="#B8962E" strokeWidth="1.3" />
      <path d="M45 6v22M52 6v22M59 6v22M38 13h28M38 20h28" stroke="rgba(200,220,255,0.28)" strokeWidth="0.8" />
      <rect x="10" y="32" width="52" height="5" rx="1" fill="#9aa3b0" stroke="#5c6573" strokeWidth="0.6" />
      <line x1="18" y1="37" x2="16" y2="48" stroke="#8a93a0" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="36" y1="37" x2="36" y2="48" stroke="#8a93a0" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="54" y1="37" x2="56" y2="48" stroke="#8a93a0" strokeWidth="2.2" strokeLinecap="round" />
      <rect x="12" y="48" width="48" height="3" rx="1" fill="#6a7380" />
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
  const roofM2 = Math.round(modulesRaw * M2_PER_PANEL);
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

  // Isometric step — room for metal legs under each module
  const stepColX = 46;
  const stepColY = 14;
  const stepRowX = -18;
  const stepRowY = 18;
  const isoOriginX = 88;
  const isoOriginY = 58;

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
                <stop offset="0%" stopColor="#3a5a7a" />
                <stop offset="35%" stopColor="#1e3550" />
                <stop offset="70%" stopColor="#142838" />
                <stop offset="100%" stopColor="#0c1824" />
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

            {/* Concrete / terrace slab under structure */}
            <polygon
              points="48,188 168,148 292,188 172,228"
              fill="url(#roofSlab)"
              opacity="0.55"
            />
            <polygon
              points="48,188 168,148 292,188 172,200 48,200"
              fill="rgba(184,150,46,0.06)"
            />

            {/* Soft ground shadow for whole array */}
            {panelPositions.length > 0 && (
              <ellipse
                cx={
                  isoOriginX +
                  ((cols - 1) * stepColX) / 2 +
                  ((rows - 1) * stepRowX) / 2 +
                  14
                }
                cy={
                  isoOriginY +
                  ((cols - 1) * stepColY) / 2 +
                  ((rows - 1) * stepRowY) / 2 +
                  36
                }
                rx={cols * 26 + 18}
                ry={12 + rows * 3}
                fill="rgba(0,0,0,0.5)"
              />
            )}

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
              {perString} string · GI mount · South
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
              <strong className={styles.luxeNum}>~{roofM2} m²</strong>
              <small>
                {modulesRaw} × ~{M2_PER_PANEL} m²/module
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
        {isHi
          ? `ऐरे ${formatLuxeKw(dcKwp)} kWp DC बनाम ${formatLuxeKw(systemKw)} kW AC (${dcAc.toFixed(2)} ओवरसाइज़) — सुबह की यील्ड और मानसून मज़बूती के लिए ${tilt.toFixed(0)}° टिल्ट · ${city}। सुरक्षा स्टैक (DCDB → INV → ACDB → LA/अर्थ) ग्राहक पक्ष को DISCOM और CEA अभ्यास में रखता है।`
          : `Array sized at ${formatLuxeKw(dcKwp)} kWp DC against ${formatLuxeKw(systemKw)} kW AC (${dcAc.toFixed(2)} oversize) for earlier morning yield and monsoon resilience at ${tilt.toFixed(0)}° tilt · ${city}. Protection stack (DCDB → INV → ACDB → LA/earth) keeps the customer side within DISCOM and CEA practice.`}
      </ExpertVerdict>

      <p className={styles.standardsStrip}>{standards}</p>
    </section>
  );
}

export default EngineeringBlueprint;
