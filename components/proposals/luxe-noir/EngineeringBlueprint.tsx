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
import { LuxeHeaderBrand, LuxePageFooter } from "./luxe-brand";
import styles from "./luxe.module.css";

export type EngineeringBlueprintProps = {
  data: ProposalData;
};

const PANEL_WATT = 580;
/** Incl. walkway allowance; ~2.2 m² × 10.764 → sq ft */
const SQFT_PER_PANEL = 24;
/** Draw up to this many modules so larger plants still show a full bank */
const MAX_DRAW = 36;

/** Front-side isometric — more face visible than a flat side strip */
const ISO = {
  rightX: 30,
  rightY: 17,
  downX: -20,
  downY: 22,
  thick: 2.6,
  stepColX: 32,
  stepColY: 18,
  stepRowX: -21,
  stepRowY: 23,
} as const;

/** Caption strip below the working grid (px in SVG user units). */
const ARRAY_CAPTION_H = 34;

function metricValue(
  data: ProposalData,
  pattern: RegExp,
  fallback: string
): string {
  const hit = data.engineering.metrics.find((m) => pattern.test(m.label));
  return hit?.value?.trim() || fallback;
}

/** Simple isometric module — front-facing face, gold edge. */
function IsoPanel({
  cx,
  cy,
}: {
  cx: number;
  cy: number;
}) {
  const { rightX, rightY, downX, downY, thick } = ISO;

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

  return (
    <g>
      <polygon
        points={`${p3x},${p3y} ${p2x},${p2y} ${t2x},${t2y} ${t3x},${t3y}`}
        fill="#0d1520"
      />
      <polygon
        points={`${p1x},${p1y} ${p2x},${p2y} ${t2x},${t2y} ${t1x},${t1y}`}
        fill="#152232"
      />
      <polygon
        points={`${p0x},${p0y} ${p1x},${p1y} ${p2x},${p2y} ${p3x},${p3y}`}
        fill="#1e3550"
        stroke="#B8962E"
        strokeWidth="1.05"
      />
    </g>
  );
}

function IconPv() {
  return (
    <svg viewBox="0 0 72 56" className={styles.archIcon} aria-hidden>
      <rect
        x="10"
        y="14"
        width="22"
        height="28"
        rx="2"
        fill="#1e3550"
        stroke="#B8962E"
        strokeWidth="1.4"
      />
      <rect
        x="40"
        y="14"
        width="22"
        height="28"
        rx="2"
        fill="#1e3550"
        stroke="#B8962E"
        strokeWidth="1.4"
      />
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

  // Physical layout on roof — 6 modules render as two rows of three (3+3),
  // not a single long string line (matches site survey / client expectation).
  const preferredRows =
    modulesDraw <= 6 ? 2 : modulesDraw <= 12 ? 2 : modulesDraw <= 24 ? 3 : 4;
  const cols = Math.max(1, Math.ceil(modulesDraw / preferredRows));
  const strings = Math.max(1, Math.ceil(modulesRaw / 6));
  const perString = Math.ceil(modulesRaw / strings);

  const { stepColX, stepColY, stepRowX, stepRowY, rightX, rightY, downX, downY } =
    ISO;

  const rawPositions = Array.from({ length: modulesDraw }).map((_, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return {
      cx: col * stepColX + row * stepRowX,
      cy: col * stepColY + row * stepRowY,
    };
  });

  // Bounds include full panel diamonds so nothing clips the viewBox edges
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of rawPositions) {
    const xs = [p.cx, p.cx + rightX, p.cx + rightX + downX, p.cx + downX];
    const ys = [p.cy, p.cy + rightY, p.cy + rightY + downY, p.cy + downY];
    minX = Math.min(minX, ...xs);
    maxX = Math.max(maxX, ...xs);
    minY = Math.min(minY, ...ys);
    maxY = Math.max(maxY, ...ys);
  }

  const sidePad = 4;
  const topPad = 8;
  const bottomPad = 8;
  const maxDrawW = 308;
  const maxDrawH = 168;
  const contentW = Math.max(1, maxX - minX);
  const contentH = Math.max(1, maxY - minY);
  const scale = Math.min(1, maxDrawW / contentW, maxDrawH / contentH);
  const offsetX = sidePad - minX * scale;
  const offsetY = topPad - minY * scale;

  const tMinX = minX * scale + offsetX;
  const tMaxX = maxX * scale + offsetX;
  const tMinY = minY * scale + offsetY;
  const tMaxY = maxY * scale + offsetY;

  const gridInset = 4;
  const gridX = tMinX - gridInset;
  const gridY = tMinY - gridInset;
  const gridW = tMaxX - tMinX + gridInset * 2;
  const gridH = tMaxY - tMinY + gridInset * 2;
  const floorY = tMaxY + bottomPad;
  const compassCx = gridX + gridW - 24;
  const compassCy = gridY + 24;
  const vbW = Math.ceil(gridX + gridW + sidePad);
  const vbH = floorY + ARRAY_CAPTION_H + 6;

  // Sort in raw space (back → front), then draw inside a fitted transform
  const panelPositions = [...rawPositions].sort(
    (a, b) => a.cy - b.cy || a.cx - b.cx
  );

  const { copy, isHi } = useLuxeLang();

  return (
    <section
      className={`${styles.a4Page} ${styles.hudPage} ${luxeDisplayFont.variable}`}
    >
      <header className={styles.luxeHeaderBlock}>
        <div className={styles.luxeHeaderRow}>
          <div className={styles.luxeHeaderCopy}>
            <span className={styles.goldTag}>{copy.eng.tag}</span>
            <h2 className={styles.luxeHeadline}>{copy.eng.title}</h2>
          </div>
          <LuxeHeaderBrand />
        </div>
      </header>

      <div className={styles.engDesignLayout}>
        {/* Dark 3D roof array */}
        <div className={`${styles.engPanel} ${styles.engPanelFlush}`}>
          <div className={styles.engPanelTitle}>{copy.eng.roofPlan}</div>
          <svg
            viewBox={`0 0 ${vbW} ${vbH}`}
            width="100%"
            preserveAspectRatio="xMidYMid meet"
            className={styles.engSvgDark}
            aria-hidden
          >
            <defs>
              <linearGradient id="roofFloor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1a2230" />
                <stop offset="100%" stopColor="#080c12" />
              </linearGradient>
              <pattern
                id="isoGrid"
                width="28"
                height="16"
                patternUnits="userSpaceOnUse"
                patternTransform="skewX(-26)"
              >
                <path
                  d="M0 16V0H28"
                  fill="none"
                  stroke="rgba(184,150,46,0.14)"
                  strokeWidth="0.6"
                />
              </pattern>
            </defs>

            <rect
              x={gridX}
              y={gridY}
              width={gridW}
              height={gridH}
              fill="url(#roofFloor)"
              rx="6"
            />
            <rect
              x={gridX}
              y={gridY}
              width={gridW}
              height={gridH}
              fill="url(#isoGrid)"
              rx="4"
            />

            <g transform={`translate(${offsetX} ${offsetY}) scale(${scale})`}>
              {panelPositions.map((p, i) => (
                <IsoPanel key={i} cx={p.cx} cy={p.cy} />
              ))}
            </g>

            {/* Compass rose — top-right corner, clear of the module bank */}
            <g transform={`translate(${compassCx},${compassCy})`}>
              <circle r="18" fill="rgba(10,14,20,0.92)" stroke="#B8962E" strokeWidth="1.05" />
              <circle r="13" fill="none" stroke="rgba(184,150,46,0.4)" strokeWidth="0.65" />
              <line x1="0" y1="-11" x2="0" y2="11" stroke="rgba(255,255,255,0.28)" strokeWidth="0.65" />
              <line x1="-11" y1="0" x2="11" y2="0" stroke="rgba(255,255,255,0.28)" strokeWidth="0.65" />
              <polygon points="0,-10.5 3.2,-2 0,-3.5 -3.2,-2" fill="#B8962E" />
              <polygon points="0,10.5 2.6,2.4 0,4.2 -2.6,2.4" fill="#2a3140" />
              <text
                y="-13"
                textAnchor="middle"
                fill="#B8962E"
                fontSize="6.5"
                fontWeight="700"
                letterSpacing="0.8"
              >
                N
              </text>
              <text y="17" textAnchor="middle" fill="#a8b0bc" fontSize="6">
                S
              </text>
              <text x="14" y="3" textAnchor="middle" fill="#a8b0bc" fontSize="5.5">
                E
              </text>
              <text x="-14" y="3" textAnchor="middle" fill="#a8b0bc" fontSize="5.5">
                W
              </text>
            </g>
            <text
              x={compassCx}
              y={compassCy + 30}
              textAnchor="middle"
              fill="#B8962E"
              fontSize="6.5"
              letterSpacing="0.8"
              fontWeight="600"
            >
              180° S · {tilt.toFixed(0)}°
            </text>

            {/* Caption bar — full grid width, inset text so labels never clip edges */}
            <rect
              x={gridX}
              y={floorY}
              width={gridW}
              height={ARRAY_CAPTION_H}
              fill="rgba(0,0,0,0.78)"
              rx="0 0 6 6"
            />
            <text
              x={gridX + gridW / 2}
              y={floorY + 22}
              textAnchor="middle"
              fill="#e8ecf2"
              fontSize="8.75"
              fontFamily="system-ui,sans-serif"
              letterSpacing="0.25"
            >
              {modulesRaw} modules · {formatLuxeKw(dcKwp)} kWp DC · {strings}×
              {perString} string · South · tilt {tilt.toFixed(0)}°
              {modulesRaw > modulesDraw
                ? ` · showing ${modulesDraw}`
                : ""}
            </text>
          </svg>
        </div>

        {/* Site metrics — denser */}
        <div className={`${styles.engPanel} ${styles.engPanelMetrics}`}>
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

      <LuxePageFooter pageLabel="05 / 12" />
    </section>
  );
}

export default EngineeringBlueprint;
