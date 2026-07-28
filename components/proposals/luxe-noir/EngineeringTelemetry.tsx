"use client";

/**
 * Premium Luxe (residential_luxe_noir) — Engineering Telemetry block.
 * Renders as page content inside an A4 wrapper (no outer page chrome).
 */

import type { ProposalData } from "@/lib/proposal-data";
import { luxeDisplayFont } from "./luxe-fonts";
import styles from "./luxe.module.css";

export type EngineeringTelemetryProps = {
  data: ProposalData;
};

const PANEL_WATT = 580;
const MAX_WIREFRAME_PANELS = 24;
const OVERSIZE_FACTOR = 1.16;

export function EngineeringTelemetry({ data }: EngineeringTelemetryProps) {
  const systemSize = Number(data.meta.systemKw) || 3;
  const modulesRaw = Math.ceil((systemSize * 1000) / PANEL_WATT);
  const modules = Math.min(Math.max(modulesRaw, 1), MAX_WIREFRAME_PANELS);
  const dcKwp = systemSize * OVERSIZE_FACTOR;

  const city =
    data.engineering.cityLabel?.trim() ||
    data.meta.locationLine?.split(",")[0]?.trim() ||
    "Madhya Pradesh";
  const tilt = data.engineering.tiltDeg ?? 24.5;
  const latLabel = Number.isFinite(tilt)
    ? `${tilt.toFixed(1)}° N (${city})`
    : `24.5° N (${city})`;

  const clippingMetric = data.engineering.metrics.find((m) =>
    /dc\s*\/\s*ac|clip|oversize|ratio/i.test(m.label)
  );
  const clippingValue =
    clippingMetric?.value?.trim() || `${OVERSIZE_FACTOR.toFixed(2)} Oversize Factor`;

  const prMetric = data.engineering.metrics.find((m) =>
    /pr|derat|loss|performance/i.test(m.label)
  );
  const prValue = prMetric?.value?.trim() || "~75% Derating";

  return (
    <div className={`${styles.telemetryRoot} ${luxeDisplayFont.variable}`}>
      <div className={styles.luxeHeader}>
        <span className={styles.goldEyebrow}>SYSTEM ARCHITECTURE & TELEMETRY</span>
        <h2 className={styles.luxeTitle}>Precision Engineered for Peak Yield.</h2>
        <div className={styles.goldDivider} />
      </div>

      <div className={styles.blueprintStage}>
        <div className={styles.blueprintVisual}>
          <div className={styles.wireframeArray} aria-hidden>
            {Array.from({ length: modules }).map((_, i) => (
              <div key={i} className={styles.luxePanel} />
            ))}
          </div>
          <div className={styles.azimuthRing}>
            <span className={styles.southMarker}>180° TRUE SOUTH</span>
          </div>
        </div>

        <div className={styles.telemetryPanel}>
          <div className={styles.dataBlock}>
            <span className={styles.dataLabel}>LATITUDE OPTIMIZATION</span>
            <strong className={styles.dataValue}>{latLabel}</strong>
            <p className={styles.dataSub}>Calibrated for maximum annual photon capture.</p>
          </div>
          <div className={styles.dataBlock}>
            <span className={styles.dataLabel}>DC/AC CLIPPING RATIO</span>
            <strong className={styles.dataValue}>{clippingValue}</strong>
            <p className={styles.dataSub}>
              Ensures inverter operates at peak capacity even during monsoon.
            </p>
          </div>
          <div className={styles.dataBlock}>
            <span className={styles.dataLabel}>SYSTEM LOSS (PR)</span>
            <strong className={styles.dataValue}>{prValue}</strong>
            <p className={styles.dataSub}>
              Accounts for thermal resistance and wire-transmission drop.
            </p>
          </div>
        </div>
      </div>

      <div className={styles.architecturalVerdict}>
        <div className={styles.verdictIcon}>⬡</div>
        <div className={styles.verdictText}>
          <strong>CHIEF ENGINEER&apos;S VERDICT</strong>
          <p>
            By over-paneling the DC array to {dcKwp.toFixed(2)} kWp against a {systemSize} kW AC
            inverter, we guarantee a flatter, wider power curve. This means earlier wake-up times
            for your system and sustained peak generation even in low-irradiance conditions.
          </p>
        </div>
      </div>
    </div>
  );
}

export default EngineeringTelemetry;
