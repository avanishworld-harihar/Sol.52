"use client";

/**
 * Premium Luxe — Engineering Blueprint (Page 05).
 * Dynamic SVG array matrix + live telemetry + engineer verdict.
 */

import type { ProposalData } from "@/lib/proposal-data";
import { luxeDisplayFont } from "./luxe-fonts";
import styles from "./luxe.module.css";

export type EngineeringBlueprintProps = {
  data: ProposalData;
};

const PANEL_WATT = 580;
const OVERSIZE = 1.16;
const M2_PER_PANEL = 2.2;
const MAX_DRAW = 24;

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
  const dcAc = systemKw > 0 ? dcKwp / systemKw : OVERSIZE;
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

  const prValue = metricValue(data, /pr|derat|loss|performance/i, "~75% PR");
  const clipValue = metricValue(
    data,
    /dc\s*\/\s*ac|clip|oversize|ratio/i,
    `${dcAc.toFixed(2)} Ratio`
  );
  const standards =
    data.engineering.standards.length > 0
      ? data.engineering.standards.slice(0, 4).join(" · ")
      : "IS/IEC modules · CEA / DISCOM net-metering · OEM warranty stack";

  const cols = 4;
  const rows = Math.ceil(modulesDraw / cols);
  const cellW = 48;
  const cellH = 36;
  const gap = 6;
  const gridW = cols * cellW + (cols - 1) * gap;
  const gridH = rows * cellH + (rows - 1) * gap;
  const originX = (520 - gridW) / 2;
  const originY = 48;

  return (
    <section
      className={`${styles.a4Page} ${styles.hudPage} ${luxeDisplayFont.variable}`}
    >
      <header className={styles.luxeHeaderBlock}>
        <span className={styles.goldTag}>05 // SYSTEM TELEMETRY</span>
        <h2 className={styles.luxeHeadline}>Precision Array Matrix.</h2>
      </header>

      <div className={styles.technicalStage}>
        <div className={styles.svgDrawingBox}>
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 520 280"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="520" height="280" fill="#FFFFFF" />
            {/* Grid */}
            {Array.from({ length: 11 }).map((_, i) => (
              <line
                key={`h${i}`}
                x1="0"
                y1={i * 28}
                x2="520"
                y2={i * 28}
                stroke="#E8ECF1"
                strokeWidth="0.5"
              />
            ))}
            {Array.from({ length: 19 }).map((_, i) => (
              <line
                key={`v${i}`}
                x1={i * 28}
                y1="0"
                x2={i * 28}
                y2="280"
                stroke="#E8ECF1"
                strokeWidth="0.5"
              />
            ))}

            {/* Compass */}
            <circle
              cx="48"
              cy="48"
              r="22"
              stroke="#B8962E"
              strokeWidth="1"
              strokeOpacity="0.7"
            />
            <line
              x1="48"
              y1="48"
              x2="48"
              y2="30"
              stroke="#B8962E"
              strokeWidth="1.5"
            />
            <text
              x="48"
              y="82"
              textAnchor="middle"
              fill="#B8962E"
              fontSize="8"
              letterSpacing="1"
            >
              180° S
            </text>

            {/* Dynamic panel matrix */}
            {Array.from({ length: modulesDraw }).map((_, i) => {
              const col = i % cols;
              const row = Math.floor(i / cols);
              const x = originX + col * (cellW + gap);
              const y = originY + row * (cellH + gap);
              return (
                <rect
                  key={i}
                  x={x}
                  y={y}
                  width={cellW}
                  height={cellH}
                  rx="2"
                  fill="rgba(184, 150, 46, 0.08)"
                  stroke="#B8962E"
                  strokeWidth="1.1"
                />
              );
            })}

            {/* Dimension callouts */}
            <text
              x="260"
              y="250"
              textAnchor="middle"
              fill="#5C6570"
              fontSize="10"
              letterSpacing="1.5"
              fontFamily="system-ui, sans-serif"
            >
              {modulesRaw} × {PANEL_WATT}Wp · {dcKwp.toFixed(2)} kWp DC · {systemKw}{" "}
              kW AC · ~{roofM2} m²
            </text>
            {modulesRaw > MAX_DRAW ? (
              <text
                x="260"
                y="268"
                textAnchor="middle"
                fill="#5C6570"
                fontSize="8"
              >
                Drawing shows {MAX_DRAW} of {modulesRaw} modules
              </text>
            ) : null}
          </svg>
        </div>

        <div className={styles.specGrid}>
          <div className={styles.specCell}>
            <span className={styles.specK}>TILT / SITE</span>
            <strong className={styles.specV}>
              {tilt.toFixed(0)}° · {city}
            </strong>
          </div>
          <div className={styles.specCell}>
            <span className={styles.specK}>DC / AC</span>
            <strong className={styles.specV}>{clipValue}</strong>
          </div>
          <div className={styles.specCell}>
            <span className={styles.specK}>PERFORMANCE</span>
            <strong className={styles.specV}>{prValue}</strong>
          </div>
          <div className={styles.specCell}>
            <span className={styles.specK}>SPECIFIC YIELD</span>
            <strong className={styles.specV}>{specificYield} kWh/kW</strong>
          </div>
          <div className={styles.specCell}>
            <span className={styles.specK}>ANNUAL GENERATION</span>
            <strong className={styles.specV}>
              {annualUnits.toLocaleString("en-IN")} u
            </strong>
          </div>
          <div className={styles.specCell}>
            <span className={styles.specK}>STRUCTURE</span>
            <strong className={styles.specV}>150 km/h wind</strong>
          </div>
        </div>
      </div>

      <div className={styles.engineerVerdict}>
        <span className={styles.verdictLabel}>CHIEF ENGINEER&apos;S VERDICT</span>
        <p>
          By over-paneling to {dcKwp.toFixed(2)} kWp DC against a {systemKw} kW AC
          inverter ({dcAc.toFixed(2)} ratio), the array wakes earlier, holds peak longer,
          and delivers a flatter monsoon curve — calibrated for {city} at {tilt.toFixed(0)}°
          tilt.
        </p>
      </div>

      <p className={styles.standardsStrip}>{standards}</p>
    </section>
  );
}

export default EngineeringBlueprint;
