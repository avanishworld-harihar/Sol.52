"use client";

/**
 * Premium Luxe — Engineering Design page.
 * Array plan + single-line power-flow (DCDB → INV → ACDB → Grid) + site metrics.
 */

import type { ProposalData } from "@/lib/proposal-data";
import {
  formatLuxeKw,
  formatLuxeUnits,
} from "./luxe-format";
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
  const cellW = 36;
  const cellH = 28;
  const gap = 4;
  const gridW = cols * cellW + (cols - 1) * gap;
  const originX = 40 + (240 - gridW) / 2;
  const originY = 56;

  return (
    <section
      className={`${styles.a4Page} ${styles.hudPage} ${luxeDisplayFont.variable}`}
    >
      <header className={styles.luxeHeaderBlock}>
        <span className={styles.goldTag}>05 // ENGINEERING DESIGN</span>
        <h2 className={styles.luxeHeadline}>Array & Power Architecture.</h2>
      </header>

      <div className={styles.engDesignLayout}>
        {/* Array plan */}
        <div className={styles.engPanel}>
          <div className={styles.engPanelTitle}>ROOF ARRAY PLAN</div>
          <svg
            viewBox="0 0 320 220"
            width="100%"
            height="200"
            className={styles.engSvg}
            aria-hidden
          >
            <rect width="320" height="220" fill="#FFFFFF" />
            <circle cx="36" cy="36" r="20" stroke="#B8962E" strokeWidth="1" />
            <line x1="36" y1="36" x2="36" y2="20" stroke="#B8962E" strokeWidth="1.5" />
            <text x="36" y="66" textAnchor="middle" fill="#B8962E" fontSize="7" letterSpacing="1">
              180° S
            </text>
            {Array.from({ length: modulesDraw }).map((_, i) => {
              const col = i % cols;
              const row = Math.floor(i / cols);
              return (
                <rect
                  key={i}
                  x={originX + col * (cellW + gap)}
                  y={originY + row * (cellH + gap)}
                  width={cellW}
                  height={cellH}
                  rx="2"
                  fill="rgba(184,150,46,0.1)"
                  stroke="#B8962E"
                  strokeWidth="1"
                />
              );
            })}
            <text
              x="160"
              y="205"
              textAnchor="middle"
              fill="#5C6570"
              fontSize="9"
              fontFamily="system-ui,sans-serif"
            >
              {modulesRaw} modules · {formatLuxeKw(dcKwp)} kWp DC · tilt {tilt.toFixed(0)}°
            </text>
          </svg>
        </div>

        {/* Site metrics */}
        <div className={styles.engPanel}>
          <div className={styles.engPanelTitle}>SITE & ROOF METRICS</div>
          <div className={styles.engMetricList}>
            <div className={styles.engMetricRow}>
              <span>Location / latitude basis</span>
              <strong>{city}</strong>
              <small>Optimizes annual photon capture angle.</small>
            </div>
            <div className={styles.engMetricRow}>
              <span>Required roof area</span>
              <strong className={styles.luxeNum}>~{roofM2} m²</strong>
              <small>
                {modulesRaw} × ~{M2_PER_PANEL} m²/module (panel + walkway). Final after site
                survey.
              </small>
            </div>
            <div className={styles.engMetricRow}>
              <span>Shadow tolerance</span>
              <strong>Dual MPPT tracking</strong>
              <small>Inverter adjusts dynamically under partial shade / cloud.</small>
            </div>
            <div className={styles.engMetricRow}>
              <span>Specific yield</span>
              <strong className={styles.luxeNum}>
                {formatLuxeUnits(specificYield)} kWh/kW
              </strong>
              <small>
                Est. annual {formatLuxeUnits(annualUnits)} units at {formatLuxeKw(systemKw)}{" "}
                kW AC.
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* Single-line power flow — engineering design */}
      <div className={styles.powerFlow}>
        <div className={styles.engPanelTitle}>SINGLE-LINE POWER FLOW</div>
        <div className={styles.flowTrack}>
          <div className={styles.flowNode}>
            <span className={styles.flowCode}>PV</span>
            <strong>Array</strong>
            <em className={styles.luxeNum}>
              {modulesRaw}×{PANEL_WATT}Wp
            </em>
          </div>
          <span className={styles.flowArrow}>→</span>
          <div className={styles.flowNode}>
            <span className={styles.flowCode}>DCDB</span>
            <strong>DC Box</strong>
            <em>Fuse + SPD</em>
          </div>
          <span className={styles.flowArrow}>→</span>
          <div className={styles.flowNode}>
            <span className={styles.flowCode}>INV</span>
            <strong>Inverter</strong>
            <em className={styles.luxeNum}>{formatLuxeKw(systemKw)} kW</em>
          </div>
          <span className={styles.flowArrow}>→</span>
          <div className={styles.flowNode}>
            <span className={styles.flowCode}>ACDB</span>
            <strong>AC Box</strong>
            <em>MCB + SPD</em>
          </div>
          <span className={styles.flowArrow}>→</span>
          <div className={styles.flowNode}>
            <span className={styles.flowCode}>GRID</span>
            <strong>Net meter</strong>
            <em>Export</em>
          </div>
        </div>
        <div className={styles.flowSafety}>
          <span>
            <strong>Lightning arrestor</strong> — Type-I/II surge path to earth
          </span>
          <span>
            <strong>Copper earthing</strong> — ≤1 Ω (IS 3043)
          </span>
          <span>
            <strong>DC/AC ratio</strong>{" "}
            <em className={styles.luxeNum}>{dcAc.toFixed(2)}</em> · PR {prValue}
          </span>
        </div>
      </div>

      <div className={styles.engineerVerdict}>
        <span className={styles.verdictLabel}>CHIEF ENGINEER&apos;S VERDICT</span>
        <p>
          Array sized at {formatLuxeKw(dcKwp)} kWp DC against {formatLuxeKw(systemKw)} kW
          AC ({dcAc.toFixed(2)} oversize) for earlier morning yield and monsoon resilience
          at {tilt.toFixed(0)}° tilt · {city}.
        </p>
      </div>

      <p className={styles.standardsStrip}>{standards}</p>
    </section>
  );
}

export default EngineeringBlueprint;
