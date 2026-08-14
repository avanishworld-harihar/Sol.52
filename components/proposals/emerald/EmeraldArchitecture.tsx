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
import { useEmeraldLang } from "./emerald-lang-context";

export type EmeraldArchitectureProps = {
  data: ProposalData;
};

export function EmeraldArchitecture({ data }: EmeraldArchitectureProps) {
  const { copy } = useEmeraldLang();
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
          <span className={styles.goldEyebrow}>{copy.arch.eyebrow}</span>
          <h3 className={styles.sidebarTitle}>
            {copy.arch.sidebarTitle[0]}
            <br />
            {copy.arch.sidebarTitle[1]}
          </h3>
          <p className={styles.sidebarBlurb}>{copy.arch.sidebarBlurb}</p>
        </div>
      </div>

      <div className={styles.contentArea}>
        <h2 className={styles.pageHeader}>{copy.arch.pageHeader}</h2>

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
                {copy.arch.step1}
              </span>
              <span className={styles.archStepTitle}>
                {copy.arch.dcTitle(dcLabel)}
              </span>
              <span className={styles.archStepHint}>
                {copy.arch.step1Hint(modules, EMERALD_PANEL_WATT)}
              </span>
            </div>

            <div>
              <span
                className={styles.goldEyebrow}
                style={{ marginBottom: "2px" }}
              >
                {copy.arch.step2}
              </span>
              <span className={styles.archStepTitle}>
                {copy.arch.acTitle(acLabel)}
              </span>
              <span className={styles.archStepHint}>{copy.arch.step2Hint}</span>
            </div>

            <div>
              <span
                className={styles.goldEyebrow}
                style={{ marginBottom: "2px" }}
              >
                {copy.arch.step3}
              </span>
              <span className={styles.archStepTitle}>{copy.arch.gridTitle}</span>
              <span className={styles.archStepHint}>{copy.arch.step3Hint}</span>
            </div>
          </div>
        </div>

        <div className={styles.metricsWrap}>
          <span className={styles.goldEyebrow}>{copy.arch.keyNumbers}</span>
          <table className={styles.goldTable}>
            <tbody>
              <tr>
                <td>{copy.arch.dcAc}</td>
                <td>{ratio > 0 ? `${ratio.toFixed(2)}x` : "—"}</td>
              </tr>
              <tr>
                <td>{copy.arch.pr}</td>
                <td>{prMetric?.value || "~75%"}</td>
              </tr>
              <tr>
                <td>{copy.arch.wind}</td>
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
