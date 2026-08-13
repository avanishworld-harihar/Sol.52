"use client";

/**
 * Emerald Signature architecture — vertical gold elevator track beside the sidebar.
 */

import type { ProposalData } from "@/lib/proposal-data";
import {
  EMERALD_PANEL_WATT,
  emeraldDcKwp,
  emeraldModuleCount,
  formatEmeraldKw,
} from "./emerald-brand";
import styles from "./Emerald.module.css";

export type EmeraldArchitectureProps = {
  data: ProposalData;
};

export function EmeraldArchitecture({ data }: EmeraldArchitectureProps) {
  const systemKw = Number(data.meta.systemKw) || 0;
  const modules = emeraldModuleCount(systemKw);
  const dcKwp = emeraldDcKwp(modules);
  const ratio = systemKw > 0 && dcKwp > 0 ? dcKwp / systemKw : 0;
  const acLabel = formatEmeraldKw(systemKw, 1);
  const dcLabel = dcKwp > 0 ? formatEmeraldKw(dcKwp) : "—";
  const prMetric = data.engineering.metrics.find((m) =>
    /performance|pr\b/i.test(m.label)
  );
  const windMetric = data.engineering.metrics.find((m) =>
    /wind/i.test(m.label)
  );

  return (
    <section className={styles.a4Page}>
      <div className={styles.sidebar}>
        <span className={styles.folioNum}>01</span>
        <div>
          <span className={styles.goldEyebrow}>SECTION ONE</span>
          <h3 className={styles.sidebarTitle}>
            System
            <br />
            Architecture.
          </h3>
          <p className={styles.sidebarBlurb}>
            Precision engineering mapping the journey of photons to usable grid
            power.
          </p>
        </div>
      </div>

      <div className={styles.contentArea}>
        <h2 className={styles.pageHeader}>Interconnection Design</h2>

        <div className={styles.archRow}>
          <div className={styles.goldTrack}>
            <div className={styles.trackNode} />
            <div className={styles.trackLine} />
            <div className={styles.trackNode} />
            <div className={styles.trackLine} />
            <div className={styles.trackNodeFill} />
          </div>

          <div className={styles.archDetails}>
            <div>
              <span
                className={styles.goldEyebrow}
                style={{ marginBottom: "2px" }}
              >
                01 / SOLAR ARRAY
              </span>
              <span className={styles.archStepTitle}>
                {dcLabel} kWp DC Source
              </span>
              <span className={styles.archStepHint}>
                {modules > 0
                  ? `${modules} × ${EMERALD_PANEL_WATT}W N-Type TOPCon Modules capturing raw irradiance.`
                  : "N-Type TOPCon modules capturing raw irradiance."}
              </span>
            </div>

            <div>
              <span
                className={styles.goldEyebrow}
                style={{ marginBottom: "2px" }}
              >
                02 / INVERTER PROCESSOR
              </span>
              <span className={styles.archStepTitle}>{acLabel} kW AC Sync</span>
              <span className={styles.archStepHint}>
                Dual-MPPT tracking converting DC to AC with 97.5% efficiency.
              </span>
            </div>

            <div>
              <span
                className={styles.goldEyebrow}
                style={{ marginBottom: "2px" }}
              >
                03 / UTILITY GRID
              </span>
              <span className={styles.archStepTitle}>
                Bi-directional Net Meter
              </span>
              <span className={styles.archStepHint}>
                Exporting excess power to the local DISCOM grid structure.
              </span>
            </div>
          </div>
        </div>

        <div className={styles.metricsWrap}>
          <span className={styles.goldEyebrow}>PERFORMANCE METRICS</span>
          <table className={styles.goldTable}>
            <tbody>
              <tr>
                <td>System Oversampling (DC/AC)</td>
                <td>{ratio > 0 ? `${ratio.toFixed(2)}x` : "—"}</td>
              </tr>
              <tr>
                <td>Estimated Performance Ratio (PR)</td>
                <td>{prMetric?.value || "~75%"}</td>
              </tr>
              <tr>
                <td>Wind Load Resistance</td>
                <td>{windMetric?.value || "150 km/h"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default EmeraldArchitecture;
