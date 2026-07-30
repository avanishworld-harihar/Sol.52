"use client";

/**
 * Quantum Telemetry — dense engineering page with 3D glass panels.
 */

import type { ProposalData } from "@/lib/proposal-data";
import {
  QUANTUM_SPECIFIC_YIELD,
  quantumDcAcRatio,
  quantumDcKwp,
  quantumModuleCount,
} from "./quantum-brand";
import styles from "./Quantum.module.css";
import { Fragment } from "react";

export type QuantumTelemetryProps = {
  data: ProposalData;
};

const LOCK_AC_KW = 3;
const LOCK_DC_KWP = 3.48;
const LOCK_DC_AC = 1.16;

const TOPO = [
  { id: "PV", sub: "DC STRING" },
  { id: "INV", sub: "MPPT" },
  { id: "NET", sub: "DISCOM" },
] as const;

export function QuantumTelemetry({ data }: QuantumTelemetryProps) {
  const systemKw = Number(data.meta.systemKw) || LOCK_AC_KW;
  const moduleCount = quantumModuleCount(systemKw);
  const dcKwp =
    systemKw === LOCK_AC_KW
      ? LOCK_DC_KWP
      : quantumDcKwp(moduleCount) || LOCK_DC_KWP;
  const dcAc =
    systemKw === LOCK_AC_KW
      ? LOCK_DC_AC
      : Number(quantumDcAcRatio(dcKwp, systemKw).toFixed(2)) || LOCK_DC_AC;

  const annualGen =
    data.closing.annualUnits > 0
      ? data.closing.annualUnits
      : Math.round(systemKw * QUANTUM_SPECIFIC_YIELD);

  const acLabel = systemKw % 1 ? systemKw.toFixed(1) : String(systemKw);

  return (
    <section className={styles.a4Page}>
      <div className={styles.pageHeader}>
        <span
          className={styles.cyanText}
          style={{ fontSize: "0.75rem", letterSpacing: "3px" }}
        >
          01 // ENGINEERING TELEMETRY
        </span>
        <h2>System Architecture.</h2>
      </div>

      <div className={styles.bentoGrid}>
        <div className={`${styles.glass3D} ${styles.span12}`}>
          <span className={styles.label}>Interconnection Topology</span>
          <div className={styles.topoRow}>
            {TOPO.map((node, i) => (
              <Fragment key={node.id}>
                <div className={styles.topoNode}>
                  <div className={styles.topoBox}>{node.id}</div>
                  <span className={styles.topoSub}>{node.sub}</span>
                </div>
                {i < TOPO.length - 1 ? (
                  <div className={styles.topoLink} />
                ) : null}
              </Fragment>
            ))}
          </div>
        </div>

        <div className={`${styles.glass3D} ${styles.span6}`}>
          <span className={styles.label}>DC/AC Oversampling</span>
          <span className={`${styles.valueLarge} ${styles.accentText}`}>
            {dcAc.toFixed(2)}x
          </span>
          <span className={styles.subtext} style={{ marginTop: "15px" }}>
            {dcKwp.toFixed(2)} kWp DC array paired with a {acLabel} kW AC
            inverter. Forces peak yield earlier in the morning and sustains it
            through low-irradiance monsoon conditions.
          </span>
        </div>

        <div className={`${styles.glass3D} ${styles.span6}`}>
          <span className={styles.label}>Annual Yield Estimate</span>
          <span className={styles.valueLarge}>
            {annualGen.toLocaleString("en-IN")}{" "}
            <span style={{ fontSize: "1.2rem", color: "#94A3B8" }}>kWh</span>
          </span>
          <span className={styles.subtext} style={{ marginTop: "15px" }}>
            Site-calibrated generation profile incorporating a strict ~75%
            Performance Ratio (PR) derating for thermal and transmission losses.
          </span>
        </div>
      </div>
    </section>
  );
}

export default QuantumTelemetry;
