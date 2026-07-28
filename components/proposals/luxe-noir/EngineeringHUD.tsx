"use client";

/**
 * Premium Luxe — Engineering HUD (Page 05).
 * CSS isometric glowing solar array + telemetry data cards.
 */

import type { ProposalData } from "@/lib/proposal-data";
import { luxeDisplayFont } from "./luxe-fonts";
import styles from "./luxe.module.css";

export type EngineeringHUDProps = {
  data: ProposalData;
};

const PANEL_WATT = 580;
const MAX_WIREFRAME_PANELS = 24;

export function EngineeringHUD({ data }: EngineeringHUDProps) {
  const systemSize = parseFloat(String(data.meta.systemKw)) || 3;
  const modulesRaw = Math.ceil((systemSize * 1000) / PANEL_WATT);
  const modules = Math.min(Math.max(modulesRaw, 1), MAX_WIREFRAME_PANELS);

  return (
    <section
      className={`${styles.a4Page} ${styles.luxeEngineering} ${luxeDisplayFont.variable}`}
    >
      <div className={styles.pageHeader}>
        <span className={styles.goldEyebrow}>SYSTEM TELEMETRY</span>
        <h2 className={styles.pageTitle}>Precision Engineered Array.</h2>
      </div>

      <div className={styles.hudLayout}>
        {/* Left: 3D Array Visualizer */}
        <div className={styles.hudVisualizer}>
          <div className={styles.azimuthCompass}>
            <span>180° S</span>
            <div className={styles.compassLine} />
          </div>
          <div className={styles.isometricArray}>
            {Array.from({ length: modules }).map((_, i) => (
              <div key={i} className={styles.glowingPanel}>
                <div className={styles.panelGlass} />
              </div>
            ))}
          </div>
          <p className={styles.visualizerCaption}>
            SIMULATED ROOF DEPLOYMENT • {modules} MODULES
          </p>
        </div>

        {/* Right: Telemetry Data */}
        <div className={styles.hudData}>
          <div className={styles.dataCard}>
            <span className={styles.dataLabel}>DC/AC OVERSAMPLING</span>
            <strong className={styles.dataValue}>1.16 Ratio</strong>
            <p className={styles.dataDesc}>
              Oversized DC array forces the inverter to hit peak yield earlier in the
              morning and sustain it through evening hours.
            </p>
          </div>
          <div className={styles.dataCard}>
            <span className={styles.dataLabel}>SYSTEM DERATING (PR)</span>
            <strong className={styles.dataValue}>~75% Efficiency</strong>
            <p className={styles.dataDesc}>
              Real-world calibration accounting for local temperature coefficients and
              wire-transmission losses.
            </p>
          </div>
          <div className={styles.dataCard}>
            <span className={styles.dataLabel}>STRUCTURAL RATING</span>
            <strong className={styles.dataValue}>150 km/h Wind Load</strong>
            <p className={styles.dataDesc}>
              Hot-dip galvanized GI mounts secured for extreme weather endurance.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default EngineeringHUD;
