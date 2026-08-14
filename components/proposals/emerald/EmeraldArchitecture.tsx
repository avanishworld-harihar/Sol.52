"use client";

/**
 * Emerald Signature architecture — vertical gold elevator track beside the sidebar.
 */

import type { ProposalData } from "@/lib/proposal-data";
import { formatEmeraldKw } from "./emerald-brand";
import {
  emeraldBomLine,
  emeraldMetric,
  resolveEmeraldPanelSpec,
} from "./emerald-live";
import styles from "./Emerald.module.css";
import { useEmeraldLang } from "./emerald-lang-context";

export type EmeraldArchitectureProps = {
  data: ProposalData;
  folio: string;
};

export function EmeraldArchitecture({ data, folio }: EmeraldArchitectureProps) {
  const { copy } = useEmeraldLang();
  const systemKw = Number(data.meta.systemKw) || 0;
  const { modules, watt, dcKwp, panelItem, inverterItem } =
    resolveEmeraldPanelSpec(data);
  const ratio = systemKw > 0 && dcKwp > 0 ? dcKwp / systemKw : 0;
  const acLabel = formatEmeraldKw(systemKw, 1);
  const dcLabel = dcKwp > 0 ? formatEmeraldKw(dcKwp) : "";
  const prValue = emeraldMetric(data, /performance|pr\b/i);
  const windValue = emeraldMetric(data, /wind/i);
  const panelHint = emeraldBomLine(panelItem) || copy.arch.step1Hint(modules, watt);
  const inverterHint = emeraldBomLine(inverterItem) || copy.arch.step2Hint;
  const showMetrics = ratio > 0 || Boolean(prValue) || Boolean(windValue);

  return (
    <section className={styles.a4Page}>
      <div className={styles.sidebar}>
        <span className={styles.folioNum}>{folio}</span>
        <div>
          <span className={styles.goldEyebrow}>{copy.common.section(folio)}</span>
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
                {dcLabel ? copy.arch.dcTitle(dcLabel) : copy.arch.dcTitleEmpty}
              </span>
              <span className={styles.archStepHint}>{panelHint}</span>
            </div>

            <div>
              <span
                className={styles.goldEyebrow}
                style={{ marginBottom: "2px" }}
              >
                {copy.arch.step2}
              </span>
              <span className={styles.archStepTitle}>
                {acLabel !== "—"
                  ? copy.arch.acTitle(acLabel)
                  : copy.arch.acTitleEmpty}
              </span>
              <span className={styles.archStepHint}>{inverterHint}</span>
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

        {showMetrics ? (
          <div className={styles.metricsWrap}>
            <span className={styles.goldEyebrow}>{copy.arch.keyNumbers}</span>
            <table className={styles.goldTable}>
              <tbody>
                {ratio > 0 ? (
                  <tr>
                    <td>{copy.arch.dcAc}</td>
                    <td>{`${ratio.toFixed(2)}x`}</td>
                  </tr>
                ) : null}
                {prValue ? (
                  <tr>
                    <td>{copy.arch.pr}</td>
                    <td>{prValue}</td>
                  </tr>
                ) : null}
                {windValue ? (
                  <tr>
                    <td>{copy.arch.wind}</td>
                    <td>{windValue}</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default EmeraldArchitecture;
