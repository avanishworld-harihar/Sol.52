"use client";

/**
 * Quantum Telemetry — Luxe-style engineering: Roof Array Plan + metrics + architecture.
 * Schematic illustration only — not Design Studio / live SLD.
 */

import type { ProposalData } from "@/lib/proposal-data";
import {
  QUANTUM_PANEL_WATT,
  QUANTUM_SPECIFIC_YIELD,
  quantumDcAcRatio,
  quantumDcKwp,
  quantumModuleCount,
} from "./quantum-brand";
import { QuantumAtmosphere } from "./QuantumAtmosphere";
import { QuantumRoofArray } from "./QuantumRoofArray";
import styles from "./Quantum.module.css";

export type QuantumTelemetryProps = {
  data: ProposalData;
};

const LOCK_AC_KW = 3;
const LOCK_DC_KWP = 3.48;
const LOCK_DC_AC = 1.16;
const SQFT_PER_PANEL = 24;

const ARCH = [
  { code: "PV", name: "Modules", sub: "" },
  { code: "DCDB", name: "DC Box", sub: "Fuse + SPD" },
  { code: "INV", name: "String INV", sub: "" },
  { code: "ACDB", name: "AC Box", sub: "MCB + SPD" },
  { code: "GRID", name: "Net meter", sub: "Bi-directional" },
] as const;

function FlowArrow() {
  return (
    <span className={styles.engFlowArrow} aria-hidden>
      <svg width="20" height="12" viewBox="0 0 20 12">
        <path
          d="M0 6h14M11 2l7 4-7 4"
          fill="none"
          stroke="#06B6D4"
          strokeWidth="1.5"
        />
      </svg>
    </span>
  );
}

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
  const roofSqft = Math.round(moduleCount * SQFT_PER_PANEL);
  const strings = Math.max(1, Math.ceil(moduleCount / 6));
  const perString = Math.ceil(moduleCount / strings);
  const annualUnits =
    data.closing.annualUnits > 0
      ? data.closing.annualUnits
      : Math.round(systemKw * QUANTUM_SPECIFIC_YIELD);
  const specificYield =
    systemKw > 0 ? Math.round(annualUnits / systemKw) : QUANTUM_SPECIFIC_YIELD;
  const acLabel = systemKw % 1 ? systemKw.toFixed(1) : String(systemKw);
  const standards =
    data.engineering.standards.length > 0
      ? data.engineering.standards.slice(0, 4).join(" · ")
      : "IS/IEC · CEA · DISCOM net-metering · IS 3043 earthing";

  const archSubs = [
    `${moduleCount}×${QUANTUM_PANEL_WATT} Wp`,
    "Fuse + SPD",
    `${acLabel} kW`,
    "MCB + SPD",
    "Bi-directional",
  ];

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
          <h2 className={styles.telemetryHeadline}>Roof Array Plan.</h2>
        </div>

        <div className={styles.engLayout}>
          <div className={`${styles.glass3D} ${styles.engPanelFlush}`}>
            <span className={styles.engPanelTitle}>Roof Array Plan</span>
            <QuantumRoofArray
              modules={moduleCount}
              dcKwp={dcKwp}
              tilt={tilt}
              panelWatt={QUANTUM_PANEL_WATT}
              strings={strings}
              perString={perString}
            />
          </div>

          <div className={styles.glass3D}>
            <span className={styles.engPanelTitle}>Site & Array Metrics</span>
            <div className={styles.engMetricList}>
              <div className={styles.engMetricRow}>
                <span>Location</span>
                <strong>{city}</strong>
                <small>Site irradiance · survey confirms final orientation</small>
              </div>
              <div className={styles.engMetricRow}>
                <span>Roof area</span>
                <strong>~{roofSqft} sq ft</strong>
                <small>
                  {moduleCount} × ~{SQFT_PER_PANEL} sq ft/module incl. walkway.
                  Final after survey.
                </small>
              </div>
              <div className={styles.engMetricRow}>
                <span>String topology</span>
                <strong>
                  {strings} × {perString} @ {QUANTUM_PANEL_WATT} Wp
                </strong>
                <small>Series strings into DCDB / inverter MPPTs</small>
              </div>
              <div className={styles.engMetricRow}>
                <span>Specific yield</span>
                <strong>{specificYield.toLocaleString("en-IN")} kWh/kW</strong>
                <small>
                  Est. {annualUnits.toLocaleString("en-IN")} units/yr · PR ~75% ·
                  wind 150 km/h mounts.
                </small>
              </div>
            </div>

            <div className={styles.engChipRow}>
              <div className={styles.engChip}>
                <em>DC</em>
                <strong>{dcKwp.toFixed(2)} kWp</strong>
              </div>
              <div className={styles.engChip}>
                <em>AC</em>
                <strong>{acLabel} kW</strong>
              </div>
              <div className={styles.engChip}>
                <em>DC/AC</em>
                <strong>{dcAc.toFixed(2)}</strong>
              </div>
              <div className={styles.engChip}>
                <em>TILT</em>
                <strong>{tilt.toFixed(0)}°</strong>
              </div>
            </div>
          </div>
        </div>

        <div className={`${styles.glass3D} ${styles.engArchPanel}`}>
          <span className={styles.engPanelTitle}>System Architecture</span>
          <p className={styles.engArchLead}>
            DC generation through protection, inversion, and bi-directional
            metering — schematic pathway for this proposal.
          </p>
          <div className={styles.engArchTrack}>
            {ARCH.map((node, i) => (
              <div key={node.code} className={styles.engArchNodeSlot}>
                {i > 0 ? <FlowArrow /> : null}
                <div className={styles.engArchNode}>
                  <span className={styles.engArchCode}>{node.code}</span>
                  <strong>{node.name}</strong>
                  <em>{archSubs[i]}</em>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.engPrStrip}>
            <span>
              Real-world PR ~75% · thermal, conversion &amp; cable derating
            </span>
            <span className={styles.engStandards}>{standards}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default QuantumTelemetry;
