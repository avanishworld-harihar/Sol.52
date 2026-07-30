"use client";

/**
 * Quantum Telemetry — clean system design blueprint.
 * DC/AC locked to proper oversizing: 3.48 kWp / 1.16 on 3 kW AC.
 */

import type { ProposalData } from "@/lib/proposal-data";
import {
  QUANTUM_SPECIFIC_YIELD,
  quantumDcAcRatio,
  quantumDcKwp,
  quantumModuleCount,
} from "./quantum-brand";
import styles from "./Quantum.module.css";

export type QuantumTelemetryProps = {
  data: ProposalData;
};

const LOCK_AC_KW = 3;
const LOCK_DC_KWP = 3.48;
const LOCK_DC_AC = 1.16;

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

  return (
    <section className={styles.a4Page}>
      <div className={styles.pageHeader}>
        <span
          className={styles.cyanText}
          style={{ letterSpacing: "3px", fontSize: "0.8rem" }}
        >
          01 // ENGINEERING TELEMETRY
        </span>
        <h2>System Design Blueprint.</h2>
      </div>

      {/* Topology — pure HTML/CSS for perfect print */}
      <div className={styles.glassPanel} style={{ marginBottom: "40px" }}>
        <span className={styles.dataLabel}>INTERCONNECTION PATH</span>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "20px",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "60px",
                height: "60px",
                border: "2px solid #06B6D4",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 10px",
                color: "#F8FAFC",
                fontWeight: 500,
              }}
            >
              PV
            </div>
            <span style={{ fontSize: "0.7rem", color: "#94A3B8" }}>
              DC STRING
            </span>
          </div>
          <div
            style={{
              height: "2px",
              flexGrow: 1,
              background: "#06B6D4",
              opacity: 0.5,
              margin: "0 15px",
              position: "relative",
              top: "-15px",
            }}
          />
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "60px",
                height: "60px",
                border: "2px solid #06B6D4",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 10px",
                color: "#F8FAFC",
                fontWeight: 500,
              }}
            >
              INV
            </div>
            <span style={{ fontSize: "0.7rem", color: "#94A3B8" }}>MPPT</span>
          </div>
          <div
            style={{
              height: "2px",
              flexGrow: 1,
              background: "#06B6D4",
              opacity: 0.5,
              margin: "0 15px",
              position: "relative",
              top: "-15px",
            }}
          />
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "60px",
                height: "60px",
                border: "2px solid #06B6D4",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 10px",
                color: "#F8FAFC",
                fontWeight: 500,
              }}
            >
              NET
            </div>
            <span style={{ fontSize: "0.7rem", color: "#94A3B8" }}>DISCOM</span>
          </div>
        </div>
      </div>

      <div className={styles.grid2Col}>
        <div className={styles.glassPanel}>
          <span className={styles.dataLabel}>DC/AC OVERSAMPLING</span>
          <span
            className={styles.cyanText}
            style={{ fontSize: "3rem", fontWeight: 300, display: "block" }}
          >
            {dcAc.toFixed(2)}
          </span>
          <p style={{ fontSize: "0.85rem", color: "#94A3B8", margin: "8px 0 0" }}>
            {dcKwp.toFixed(2)} kWp DC array against {systemKw} kW AC inverter
            ensures peak yield during early mornings and monsoons.
          </p>
        </div>
        <div className={styles.glassPanel}>
          <span className={styles.dataLabel}>ESTIMATED ANNUAL YIELD</span>
          <span
            className={styles.cyanText}
            style={{ fontSize: "3rem", fontWeight: 300, display: "block" }}
          >
            {annualGen.toLocaleString("en-IN")}{" "}
            <span style={{ fontSize: "1rem" }}>kWh</span>
          </span>
          <p style={{ fontSize: "0.85rem", color: "#94A3B8", margin: "8px 0 0" }}>
            Calibrated for Central India climate zone with ~75% PR derating
            factor.
          </p>
        </div>
      </div>
    </section>
  );
}

export default QuantumTelemetry;
