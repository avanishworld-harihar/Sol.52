"use client";

/**
 * Emerald Signature architecture — system connection + live engineering numbers.
 */

import type { ProposalData } from "@/lib/proposal-data";
import { formatEmeraldKw } from "./emerald-brand";
import {
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
  const panelHint =
    [panelItem?.brand, panelItem?.spec].filter(Boolean).join(" · ") ||
    copy.arch.step1Hint(modules, watt);
  const inverterHint =
    [inverterItem?.brand, inverterItem?.spec].filter(Boolean).join(" · ") ||
    copy.arch.step2Hint;

  const metricRows: { label: string; value: string }[] = [];
  if (modules > 0 && watt > 0) {
    metricRows.push({
      label: copy.arch.modules,
      value: `${modules} × ${watt}W`,
    });
  }
  if (dcKwp > 0) {
    metricRows.push({
      label: copy.cover.solarArray,
      value: `${formatEmeraldKw(dcKwp)} kWp`,
    });
  }
  if (systemKw > 0) {
    metricRows.push({
      label: copy.cover.systemSize,
      value: `${acLabel} kW`,
    });
  }
  if (ratio > 0) {
    metricRows.push({ label: copy.arch.dcAc, value: `${ratio.toFixed(2)}x` });
  }
  if (panelItem?.brand) {
    metricRows.push({ label: copy.arch.panelBrand, value: panelItem.brand });
  }
  if (inverterItem?.brand) {
    metricRows.push({
      label: copy.arch.inverterBrand,
      value: inverterItem.brand,
    });
  }

  const annual = emeraldMetric(data, /annual generation|yearly/i);
  const coverage = emeraldMetric(data, /coverage|load/i);
  const tilt = emeraldMetric(data, /tilt/i);
  const prValue = emeraldMetric(data, /performance|pr\b/i);
  const windValue = emeraldMetric(data, /wind/i);
  if (annual) metricRows.push({ label: copy.arch.annualGen, value: annual });
  if (coverage) metricRows.push({ label: copy.arch.coverage, value: coverage });
  if (tilt) metricRows.push({ label: copy.arch.tilt, value: tilt });
  if (prValue) metricRows.push({ label: copy.arch.pr, value: prValue });
  if (windValue) metricRows.push({ label: copy.arch.wind, value: windValue });

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
              <span className={styles.goldEyebrow} style={{ marginBottom: "2px" }}>
                {copy.arch.step1}
              </span>
              <span className={styles.archStepTitle}>
                {dcLabel ? copy.arch.dcTitle(dcLabel) : copy.arch.dcTitleEmpty}
              </span>
              <span className={styles.archStepHint}>{panelHint}</span>
            </div>

            <div>
              <span className={styles.goldEyebrow} style={{ marginBottom: "2px" }}>
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
              <span className={styles.goldEyebrow} style={{ marginBottom: "2px" }}>
                {copy.arch.step3}
              </span>
              <span className={styles.archStepTitle}>{copy.arch.gridTitle}</span>
              <span className={styles.archStepHint}>{copy.arch.step3Hint}</span>
            </div>
          </div>
        </div>

        {metricRows.length > 0 ? (
          <div className={styles.metricsWrap}>
            <span className={styles.goldEyebrow}>{copy.arch.keyNumbers}</span>
            <table className={styles.goldTable}>
              <tbody>
                {metricRows.map((row) => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    <td>{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default EmeraldArchitecture;
