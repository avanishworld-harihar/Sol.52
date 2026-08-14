"use client";

/**
 * Emerald Signature — Engineering Topology (golden node map + bento metrics).
 * Live ProposalData / BOM only — no 5 kW / 615W / Waaree / 75% PR fallbacks.
 */

import type { ProposalData } from "@/lib/proposal-data";
import { formatEmeraldKw } from "./emerald-brand";
import { emeraldMetric, resolveEmeraldPanelSpec } from "./emerald-live";
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
  const dcLabel = dcKwp > 0 ? formatEmeraldKw(dcKwp) : "—";
  const panelMake = panelItem?.brand?.trim() || "";
  const inverterMake = inverterItem?.brand?.trim() || "";
  const prValue = emeraldMetric(data, /performance|pr\b/i);

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

        <div className={styles.topologyContainer}>
          <div className={styles.topologyNode}>
            <div className={styles.nodeVisual}>
              <div className={styles.nodeIconBox}>
                <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden>
                  <rect
                    x="2"
                    y="2"
                    width="26"
                    height="26"
                    fill="none"
                    stroke="#064E3B"
                    strokeWidth="2"
                  />
                  <line
                    x1="15"
                    y1="2"
                    x2="15"
                    y2="28"
                    stroke="#064E3B"
                    strokeWidth="1.5"
                  />
                  <line
                    x1="2"
                    y1="15"
                    x2="28"
                    y2="15"
                    stroke="#064E3B"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
              <div className={styles.nodeLine} />
            </div>
            <div className={styles.nodeData}>
              <div className={styles.nodeHeader}>
                <span className={styles.nodeTitle}>{copy.arch.nodeDc}</span>
                <span className={styles.nodeSpec}>{dcLabel} kWp</span>
              </div>
              <p className={styles.nodeDesc}>
                {copy.arch.nodeDcDesc(modules, watt, panelMake)}
              </p>
            </div>
          </div>

          <div className={styles.topologyNode}>
            <div className={styles.nodeVisual}>
              <div className={styles.nodeIconBox}>
                <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden>
                  <path
                    d="M2 15 Q 8.5 2, 15 15 T 28 15"
                    fill="none"
                    stroke="#D4AF37"
                    strokeWidth="2.5"
                  />
                </svg>
              </div>
              <div className={styles.nodeLine} />
            </div>
            <div className={styles.nodeData}>
              <div className={styles.nodeHeader}>
                <span className={styles.nodeTitle}>{copy.arch.nodeAc}</span>
                <span className={styles.nodeSpec}>{acLabel} kW AC</span>
              </div>
              <p className={styles.nodeDesc}>{copy.arch.nodeAcDesc(inverterMake)}</p>
            </div>
          </div>

          <div className={`${styles.topologyNode} ${styles.topologyNodeLast}`}>
            <div className={styles.nodeVisual}>
              <div className={`${styles.nodeIconBox} ${styles.nodeIconFill}`}>
                <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden>
                  <path
                    d="M5 12 L15 2 L25 12 M15 2 V28 M5 18 L15 28 L25 18"
                    fill="none"
                    stroke="#D4AF37"
                    strokeWidth="2"
                  />
                </svg>
              </div>
            </div>
            <div className={`${styles.nodeData} ${styles.nodeDataLast}`}>
              <div className={styles.nodeHeader}>
                <span className={styles.nodeTitle}>{copy.arch.nodeGrid}</span>
                <span className={styles.nodeSpec}>{copy.arch.nodeGridSpec}</span>
              </div>
              <p className={styles.nodeDesc}>{copy.arch.nodeGridDesc}</p>
            </div>
          </div>
        </div>

        <div className={styles.techBento}>
          <div className={styles.bentoCell}>
            <span className={styles.bentoLabel}>{copy.arch.bentoSize}</span>
            <span className={styles.bentoValue}>
              {systemKw > 0 ? `${acLabel} kW` : "—"}
            </span>
          </div>
          <div className={styles.bentoCell}>
            <span className={styles.bentoLabel}>{copy.arch.bentoRatio}</span>
            <span className={styles.bentoValue}>
              {ratio > 0 ? `${ratio.toFixed(2)}x` : "—"}
            </span>
          </div>
          <div className={styles.bentoCell}>
            <span className={styles.bentoLabel}>{copy.arch.bentoPr}</span>
            <span className={styles.bentoValue}>{prValue || "—"}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default EmeraldArchitecture;
