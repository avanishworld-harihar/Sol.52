"use client";

/**
 * Premium Luxe — Engineering Design page.
 * Dark isometric roof array + illustrated system architecture + site metrics.
 * Schematic only — not Design Studio / live SLD embed.
 */

import type { ProposalData } from "@/lib/proposal-data";
import { formatLuxeKw, formatLuxeUnits } from "./luxe-format";
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

/** Isometric panel face + depth edges + cell grid. */
function IsoPanel({
  cx,
  cy,
  w = 34,
  h = 22,
}: {
  cx: number;
  cy: number;
  w?: number;
  h?: number;
}) {
  const dx = w * 0.55;
  const dy = w * 0.28;
  const depth = 5;
  const p0 = `${cx},${cy}`;
  const p1 = `${cx + dx},${cy + dy}`;
  const p2 = `${cx + dx},${cy + dy + h}`;
  const p3 = `${cx},${cy + h}`;
  const r0 = `${cx + dx},${cy + dy}`;
  const r1 = `${cx + dx + depth * 0.55},${cy + dy + depth * 0.28}`;
  const r2 = `${cx + dx + depth * 0.55},${cy + dy + h + depth * 0.28}`;
  const r3 = `${cx + dx},${cy + dy + h}`;
  const f0 = `${cx},${cy + h}`;
  const f1 = `${cx + dx},${cy + dy + h}`;
  const f2 = `${cx + dx + depth * 0.55},${cy + dy + h + depth * 0.28}`;
  const f3 = `${cx + depth * 0.55},${cy + h + depth * 0.28}`;

  const cells: string[] = [];
  for (let i = 1; i < 3; i++) {
    const t = i / 3;
    cells.push(
      `M ${cx + dx * t},${cy + dy * t} L ${cx + dx * t},${cy + dy * t + h}`
    );
  }
  for (let j = 1; j < 4; j++) {
    const t = j / 4;
    cells.push(
      `M ${cx},${cy + h * t} L ${cx + dx},${cy + dy + h * t}`
    );
  }

  return (
    <g>
      <polygon points={`${r0} ${r1} ${r2} ${r3}`} fill="#1a2433" />
      <polygon points={`${f0} ${f1} ${f2} ${f3}`} fill="#0d1219" />
      <polygon
        points={`${p0} ${p1} ${p2} ${p3}`}
        fill="url(#panelFace)"
        stroke="#B8962E"
        strokeWidth="0.9"
      />
      <path
        d={cells.join(" ")}
        fill="none"
        stroke="rgba(184,150,46,0.28)"
        strokeWidth="0.55"
      />
      <line
        x1={cx + 3}
        y1={cy + 3}
        x2={cx + dx * 0.45}
        y2={cy + dy * 0.45 + 3}
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="1.2"
      />
    </g>
  );
}

function IconPv() {
  return (
    <svg viewBox="0 0 64 48" className={styles.archIcon} aria-hidden>
      <rect x="4" y="8" width="26" height="18" rx="1.5" fill="#1e2a3a" stroke="#B8962E" strokeWidth="1.2" />
      <path d="M10 8v18M17 8v18M24 8v18M4 14h26M4 20h26" stroke="rgba(184,150,46,0.35)" strokeWidth="0.7" />
      <rect x="34" y="8" width="26" height="18" rx="1.5" fill="#1e2a3a" stroke="#B8962E" strokeWidth="1.2" />
      <path d="M40 8v18M47 8v18M54 8v18M34 14h26M34 20h26" stroke="rgba(184,150,46,0.35)" strokeWidth="0.7" />
      <rect x="10" y="30" width="44" height="4" rx="1" fill="#3a4250" />
      <rect x="18" y="36" width="28" height="3" rx="1" fill="#2a3140" />
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
      <svg width="18" height="12" viewBox="0 0 18 12">
        <path d="M0 6h14M10 1l6 5-6 5" fill="none" stroke="#B8962E" strokeWidth="1.4" />
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

  const cols = Math.min(6, Math.max(3, Math.ceil(Math.sqrt(modulesDraw))));
  const rows = Math.ceil(modulesDraw / cols);
  const strings = Math.max(1, Math.ceil(modulesRaw / 6));
  const perString = Math.ceil(modulesRaw / strings);

  const isoOriginX = 118;
  const isoOriginY = 58;
  const stepX = 30;
  const stepY = 18;

  const panelPositions = Array.from({ length: modulesDraw }).map((_, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return {
      cx: isoOriginX + (col - row) * stepX,
      cy: isoOriginY + (col + row) * stepY,
    };
  });

  return (
    <section
      className={`${styles.a4Page} ${styles.hudPage} ${luxeDisplayFont.variable}`}
    >
      <header className={styles.luxeHeaderBlock}>
        <span className={styles.goldTag}>05 // ENGINEERING DESIGN</span>
        <h2 className={styles.luxeHeadline}>Array & Power Architecture.</h2>
      </header>

      <div className={styles.engDesignLayout}>
        {/* Dark 3D roof array */}
        <div className={`${styles.engPanel} ${styles.engPanelFlush}`}>
          <div className={styles.engPanelTitle}>ROOF ARRAY PLAN</div>
          <svg
            viewBox="0 0 320 228"
            width="100%"
            height="210"
            className={styles.engSvgDark}
            aria-hidden
          >
            <defs>
              <linearGradient id="panelFace" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#2a3d55" />
                <stop offset="45%" stopColor="#1a2838" />
                <stop offset="100%" stopColor="#121c28" />
              </linearGradient>
              <linearGradient id="roofFloor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#151c28" />
                <stop offset="100%" stopColor="#0a0e14" />
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
                  stroke="rgba(184,150,46,0.12)"
                  strokeWidth="0.6"
                />
              </pattern>
            </defs>

            <rect width="320" height="228" fill="url(#roofFloor)" rx="6" />
            <rect x="8" y="8" width="304" height="188" fill="url(#isoGrid)" rx="4" />

            {/* Horizon / depth lines */}
            {Array.from({ length: 8 }).map((_, i) => (
              <line
                key={`hz-${i}`}
                x1={20 + i * 18}
                y1={196}
                x2={100 + i * 28}
                y2={40}
                stroke="rgba(184,150,46,0.06)"
                strokeWidth="0.6"
              />
            ))}

            {/* Mounting rail under array */}
            {panelPositions.length > 0 && (
              <ellipse
                cx={isoOriginX + ((cols - 1) * stepX) / 2}
                cy={
                  isoOriginY +
                  ((rows - 1 + cols - 1) * stepY) / 2 +
                  36
                }
                rx={cols * 22}
                ry={10}
                fill="rgba(0,0,0,0.45)"
              />
            )}

            {panelPositions.map((p, i) => (
              <IsoPanel key={i} cx={p.cx} cy={p.cy} />
            ))}

            {/* Compass rose */}
            <g transform="translate(42,42)">
              <circle r="22" fill="rgba(10,14,20,0.85)" stroke="#B8962E" strokeWidth="1" />
              <circle r="16" fill="none" stroke="rgba(184,150,46,0.35)" strokeWidth="0.6" />
              <line x1="0" y1="-14" x2="0" y2="14" stroke="rgba(255,255,255,0.25)" strokeWidth="0.6" />
              <line x1="-14" y1="0" x2="14" y2="0" stroke="rgba(255,255,255,0.25)" strokeWidth="0.6" />
              <polygon points="0,-13 3.5,-2 0,-4 -3.5,-2" fill="#B8962E" />
              <polygon points="0,13 3,3 0,5 -3,3" fill="#2a3140" />
              <text
                y="-16"
                textAnchor="middle"
                fill="#B8962E"
                fontSize="6"
                fontWeight="700"
                letterSpacing="1"
              >
                N
              </text>
              <text y="22" textAnchor="middle" fill="#8a93a0" fontSize="5.5">
                S
              </text>
              <text x="18" y="3" textAnchor="middle" fill="#8a93a0" fontSize="5">
                E
              </text>
              <text x="-18" y="3" textAnchor="middle" fill="#8a93a0" fontSize="5">
                W
              </text>
            </g>
            <text
              x="42"
              y="78"
              textAnchor="middle"
              fill="#B8962E"
              fontSize="7"
              letterSpacing="1.2"
            >
              180° S · TILT {tilt.toFixed(0)}°
            </text>

            {/* Caption bar */}
            <rect x="0" y="200" width="320" height="28" fill="rgba(0,0,0,0.55)" />
            <text
              x="160"
              y="218"
              textAnchor="middle"
              fill="#d8dee6"
              fontSize="9"
              fontFamily="system-ui,sans-serif"
              letterSpacing="0.4"
            >
              {modulesRaw} modules · {formatLuxeKw(dcKwp)} kWp DC · {strings}×
              {perString} string · azimuth South
            </text>
          </svg>
        </div>

        {/* Site metrics — denser */}
        <div className={styles.engPanel}>
          <div className={styles.engPanelTitle}>SITE & ARRAY METRICS</div>
          <div className={styles.engMetricList}>
            <div className={styles.engMetricRow}>
              <span>Location / latitude basis</span>
              <strong>{city}</strong>
              <small>South-facing array optimizes annual photon capture.</small>
            </div>
            <div className={styles.engMetricRow}>
              <span>Required roof area</span>
              <strong className={styles.luxeNum}>~{roofM2} m²</strong>
              <small>
                {modulesRaw} × ~{M2_PER_PANEL} m²/module incl. walkway. Final after survey.
              </small>
            </div>
            <div className={styles.engMetricRow}>
              <span>String topology</span>
              <strong className={styles.luxeNum}>
                {strings} × {perString} @ {PANEL_WATT} Wp
              </strong>
              <small>Dual MPPT inputs · shade-tolerant tracking.</small>
            </div>
            <div className={styles.engMetricRow}>
              <span>Specific yield</span>
              <strong className={styles.luxeNum}>
                {formatLuxeUnits(specificYield)} kWh/kW
              </strong>
              <small>
                Est. {formatLuxeUnits(annualUnits)} units/yr · PR {prValue} · wind
                150 km/h mounts.
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
        <div className={styles.engPanelTitle}>SYSTEM ARCHITECTURE</div>
        <p className={styles.archLead}>
          DC generation → protection → conversion → AC protection → DISCOM net meter
        </p>
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
              <strong>Lightning arrestor</strong>
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
              <strong>Copper earthing</strong>
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
              <strong>Cable class</strong>
              <small>TUV DC / FRLS AC sized to string current</small>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.engineerVerdict}>
        <span className={styles.verdictLabel}>CHIEF ENGINEER&apos;S VERDICT</span>
        <p>
          Array sized at {formatLuxeKw(dcKwp)} kWp DC against {formatLuxeKw(systemKw)}{" "}
          kW AC ({dcAc.toFixed(2)} oversize) for earlier morning yield and monsoon
          resilience at {tilt.toFixed(0)}° tilt · {city}. Protection stack (DCDB →
          INV → ACDB → LA/earth) keeps the customer side within DISCOM and CEA
          practice.
        </p>
      </div>

      <p className={styles.standardsStrip}>{standards}</p>
    </section>
  );
}

export default EngineeringBlueprint;
