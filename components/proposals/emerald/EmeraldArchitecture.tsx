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
            Design.
          </h3>
          <p className={styles.sidebarBlurb}>
            How sunlight on your roof becomes electricity for your home.
          </p>
        </div>
      </div>

      <div className={styles.contentArea}>
        <h2 className={styles.pageHeader}>How the System Connects</h2>

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
                01 / SOLAR PANELS
              </span>
              <span className={styles.archStepTitle}>
                {dcLabel} kWp DC Array
              </span>
              <span className={styles.archStepHint}>
                {modules > 0
                  ? `${modules} × ${EMERALD_PANEL_WATT}W N-Type TOPCon panels that capture sunlight.`
                  : "N-Type TOPCon panels that capture sunlight."}
              </span>
            </div>

            <div>
              <span
                className={styles.goldEyebrow}
                style={{ marginBottom: "2px" }}
              >
                02 / INVERTER
              </span>
              <span className={styles.archStepTitle}>{acLabel} kW AC Output</span>
              <span className={styles.archStepHint}>
                Converts DC power to AC power at 97.5% efficiency, with dual
                MPPT for better output.
              </span>
            </div>

            <div>
              <span
                className={styles.goldEyebrow}
                style={{ marginBottom: "2px" }}
              >
                03 / GRID
              </span>
              <span className={styles.archStepTitle}>
                Two-way Net Meter
              </span>
              <span className={styles.archStepHint}>
                Extra power goes to your local DISCOM grid.
              </span>
            </div>
          </div>
        </div>

        <div className={styles.metricsWrap}>
          <span className={styles.goldEyebrow}>KEY NUMBERS</span>
          <table className={styles.goldTable}>
            <tbody>
              <tr>
                <td>DC / AC ratio</td>
                <td>{ratio > 0 ? `${ratio.toFixed(2)}x` : "—"}</td>
              </tr>
              <tr>
                <td>Estimated performance ratio (PR)</td>
                <td>{prMetric?.value || "~75%"}</td>
              </tr>
              <tr>
                <td>Wind resistance</td>
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
