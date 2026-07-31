"use client";

/**
 * Quantum Telemetry — Advanced Engineering: compass, specs matrix, topology, PR waterfall.
 */

import { Fragment } from "react";
import type { ProposalData } from "@/lib/proposal-data";
import {
  QUANTUM_PANEL_WATT,
  quantumDcAcRatio,
  quantumDcKwp,
  quantumModuleCount,
} from "./quantum-brand";
import { QuantumAtmosphere } from "./QuantumAtmosphere";
import styles from "./Quantum.module.css";

export type QuantumTelemetryProps = {
  data: ProposalData;
};

const LOCK_AC_KW = 3;
const LOCK_DC_KWP = 3.48;
const LOCK_DC_AC = 1.16;

const TOPO = [
  { id: "PV", name: "Solar Array", sub: "DC Generation" },
  { id: "INV", name: "Smart Inverter", sub: "DC to AC Sync" },
  { id: "NET", name: "Utility Meter", sub: "Bi-directional" },
] as const;

const PR_ROWS = [
  { label: "STC Ideal Yield", width: "100%", value: "100%", tone: "ideal" as const },
  { label: "Thermal Loss", width: "88%", value: "-12%", tone: "loss" as const },
  {
    label: "Conversion & Cable",
    width: "75%",
    value: "-13%",
    tone: "final" as const,
  },
];

export function QuantumTelemetry({ data }: QuantumTelemetryProps) {
  const systemKw = Number(data.meta.systemKw) || LOCK_AC_KW;
  const moduleCount = quantumModuleCount(systemKw) || 6;
  const dcKwp =
    systemKw === LOCK_AC_KW
      ? LOCK_DC_KWP
      : quantumDcKwp(moduleCount) || LOCK_DC_KWP;
  const dcAc =
    systemKw === LOCK_AC_KW
      ? LOCK_DC_AC
      : Number(quantumDcAcRatio(dcKwp, systemKw).toFixed(2)) || LOCK_DC_AC;

  const tilt = data.engineering.tiltDeg ?? 20;
  const city =
    data.engineering.cityLabel?.trim() ||
    data.meta.locationLine?.split(",")[0]?.trim() ||
    "Satna";
  const region =
    data.meta.locationLine?.includes("Madhya") || /mp|madhya/i.test(city)
      ? "MP"
      : data.meta.locationLine?.split(",")[1]?.trim()?.slice(0, 12) || "MP";
  const latLabel = /satna/i.test(city) ? "24.5° N" : "Central India";
  const acLabel = systemKw % 1 ? systemKw.toFixed(1) : systemKw.toFixed(1);

  return (
    <section className={`${styles.a4Page} ${styles.telemetryPage}`}>
      <QuantumAtmosphere variant="engineering" />

      <div className={styles.pageStack}>
        <div className={styles.pageHeader}>
          <span
            className={styles.cyanText}
            style={{ fontSize: "0.75rem", letterSpacing: "3px" }}
          >
            01 // ENGINEERING TELEMETRY
          </span>
          <h2 className={styles.telemetryHeadline}>System Architecture.</h2>
        </div>

        <div className={`${styles.bentoGrid} ${styles.telemetryGrid}`}>
          {/* Azimuth compass */}
          <div className={`${styles.glass3D} ${styles.span5} ${styles.compassCard}`}>
            <span className={styles.label} style={{ alignSelf: "flex-start" }}>
              Solar Geometry
            </span>
            <div className={styles.compassWrap}>
              <svg viewBox="0 0 200 200" fill="none" aria-hidden>
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  stroke="rgba(6,182,212,0.2)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="60"
                  stroke="rgba(6,182,212,0.4)"
                  strokeWidth="1"
                />
                <path
                  d="M100 10 V190 M10 100 H190"
                  stroke="rgba(6,182,212,0.3)"
                  strokeWidth="1"
                />
                <path d="M100 100 L100 30" stroke="#06B6D4" strokeWidth="3" />
                <circle cx="100" cy="30" r="4" fill="#06B6D4" />
                <text
                  x="100"
                  y="145"
                  fill="#fff"
                  fontSize="11"
                  textAnchor="middle"
                  letterSpacing="1"
                >
                  180° TRUE SOUTH
                </text>
                <text
                  x="100"
                  y="162"
                  fill="#06B6D4"
                  fontSize="9"
                  textAnchor="middle"
                  letterSpacing="1.5"
                >
                  {`LAT ${latLabel} (${city.toUpperCase()}, ${region.toUpperCase()})`}
                </text>
                <text
                  x="100"
                  y="178"
                  fill="#94A3B8"
                  fontSize="9"
                  textAnchor="middle"
                >
                  {`OPTIMAL TILT: ~${tilt}°`}
                </text>
              </svg>
            </div>
          </div>

          {/* Core specs 2×2 */}
          <div className={`${styles.span7} ${styles.specMatrix}`}>
            <div className={styles.glass3D}>
              <span className={styles.label}>DC Array</span>
              <span className={styles.valueLarge}>
                {dcKwp.toFixed(2)}
                <span className={styles.valueUnit}> kWp</span>
              </span>
              <span className={styles.subtext}>
                {moduleCount} × {QUANTUM_PANEL_WATT}W TOPCon
              </span>
            </div>
            <div className={styles.glass3D}>
              <span className={styles.label}>AC Inverter</span>
              <span className={styles.valueLarge}>
                {acLabel}
                <span className={styles.valueUnit}> kW</span>
              </span>
              <span className={styles.subtext}>Max Export Capacity</span>
            </div>
            <div className={styles.glass3D}>
              <span className={styles.label}>DC/AC Ratio</span>
              <span className={`${styles.valueLarge} ${styles.accentText}`}>
                {dcAc.toFixed(2)}x
              </span>
              <span className={styles.subtext}>Oversampling Multiplier</span>
            </div>
            <div className={styles.glass3D}>
              <span className={styles.label}>Structural Yield</span>
              <span className={styles.valueLarge}>
                150
                <span className={styles.valueUnit}> km/h</span>
              </span>
              <span className={styles.subtext}>Wind Load Rating (GI)</span>
            </div>
          </div>

          {/* Interconnection pathway */}
          <div className={`${styles.glass3D} ${styles.span12} ${styles.pathwayCard}`}>
            <span className={styles.label}>Interconnection Pathway</span>
            <div className={styles.pathwayRow}>
              {TOPO.map((node, i) => (
                <Fragment key={node.id}>
                  <div className={styles.pathwayNode}>
                    <div className={styles.pathwayBox}>{node.id}</div>
                    <span className={styles.pathwayName}>{node.name}</span>
                    <span className={styles.pathwaySub}>{node.sub}</span>
                  </div>
                  {i < TOPO.length - 1 ? (
                    <div className={styles.pathwayLink}>
                      <span className={styles.pathwayDot} />
                    </div>
                  ) : null}
                </Fragment>
              ))}
            </div>
          </div>

          {/* PR waterfall */}
          <div className={`${styles.glass3D} ${styles.span12}`}>
            <span className={styles.label}>
              System Derating (Performance Ratio)
            </span>
            <p className={styles.prLead}>
              A standard 100% ideal yield is practically impossible. We engineer
              for a realistic ~75% PR by accounting for real-world environmental
              and hardware resistance.
            </p>
            <div className={styles.prList}>
              {PR_ROWS.map((row) => (
                <div key={row.label} className={styles.prRow}>
                  <div className={styles.prLabel}>{row.label}</div>
                  <div className={styles.prTrack}>
                    <div
                      className={
                        row.tone === "ideal"
                          ? styles.prFillIdeal
                          : row.tone === "loss"
                            ? styles.prFillLoss
                            : styles.prFillFinal
                      }
                      style={{ width: row.width }}
                    />
                  </div>
                  <div
                    className={
                      row.tone === "ideal" ? styles.prValIdeal : styles.prValLoss
                    }
                  >
                    {row.value}
                  </div>
                </div>
              ))}
              <div className={styles.prResult}>
                <div className={styles.prResultLabel}>Real-World PR</div>
                <div className={styles.prResultValue}>~75%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default QuantumTelemetry;
