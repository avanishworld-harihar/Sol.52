"use client";

/**
 * Emerald Signature — Engineering Topology (SVG power-flow schematic).
 * Live ProposalData / BOM only — no 5 kW / 615W / 9-panel / 1.11x fallbacks.
 */

import type { ProposalData } from "@/lib/proposal-data";
import { formatEmeraldKw } from "./emerald-brand";
import { resolveEmeraldPanelSpec } from "./emerald-live";
import styles from "./Emerald.module.css";
import { useEmeraldLang } from "./emerald-lang-context";

export type EmeraldArchitectureProps = {
  data: ProposalData;
  folio: string;
};

export function EmeraldArchitecture({ data, folio }: EmeraldArchitectureProps) {
  const { copy } = useEmeraldLang();
  const systemKw = Number(data.meta.systemKw) || 0;
  const { modules, watt, dcKwp } = resolveEmeraldPanelSpec(data);
  const ratio = systemKw > 0 && dcKwp > 0 ? dcKwp / systemKw : 0;
  const acLabel = formatEmeraldKw(systemKw, 1);
  const dcLabel = dcKwp > 0 ? formatEmeraldKw(dcKwp) : "—";

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

        <div className={styles.engineeringGrid}>
          <div className={styles.engCard}>
            <span className={styles.engLabel}>{copy.arch.totalArray}</span>
            <span className={styles.engValue}>
              {dcKwp > 0 ? `${dcLabel} kWp` : "—"}
            </span>
          </div>
          <div className={styles.engCard}>
            <span className={styles.engLabel}>{copy.arch.acOutput}</span>
            <span className={styles.engValue}>
              {systemKw > 0 ? `${acLabel} kW` : "—"}
            </span>
          </div>
          <div className={styles.engCard}>
            <span className={styles.engLabel}>{copy.arch.dcAcRatio}</span>
            <span className={styles.engValue}>
              {ratio > 0 ? `${ratio.toFixed(2)}x` : "—"}
            </span>
          </div>
          <div className={styles.engCard}>
            <span className={styles.engLabel}>{copy.arch.topology}</span>
            <span className={styles.engValue}>{copy.arch.onGrid}</span>
          </div>
        </div>

        <div className={styles.schematicWrapper}>
          <span className={`${styles.goldEyebrow} ${styles.schematicEyebrow}`}>
            {copy.arch.schematicEyebrow}
          </span>

          <svg
            viewBox="0 0 800 320"
            className={styles.svgDiagram}
            role="img"
            aria-label={copy.arch.schematicEyebrow}
          >
            <defs>
              <pattern
                id="emerald-eng-dots"
                x="0"
                y="0"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="2" cy="2" r="1" fill="rgba(6, 78, 59, 0.1)" />
              </pattern>
            </defs>
            <rect width="800" height="320" fill="url(#emerald-eng-dots)" />

            <g transform="translate(40, 78)">
              <rect x="0" y="0" width="140" height="120" rx="4" fill="#064E3B" />
              <rect x="10" y="10" width="55" height="45" fill="rgba(255,255,255,0.1)" />
              <rect x="75" y="10" width="55" height="45" fill="rgba(255,255,255,0.1)" />
              <rect x="10" y="65" width="55" height="45" fill="rgba(255,255,255,0.1)" />
              <rect x="75" y="65" width="55" height="45" fill="rgba(255,255,255,0.1)" />
              <text x="70" y="150" textAnchor="middle" className={styles.diagramValue}>
                {copy.arch.pvArray}
              </text>
              <text x="70" y="170" textAnchor="middle" className={styles.diagramLabel}>
                {copy.arch.dcWatts(modules, watt)}
              </text>
            </g>

            <g transform="translate(180, 138)">
              <path
                d="M 0 0 L 140 0"
                stroke="#D4AF37"
                strokeWidth="4"
                strokeDasharray="8 4"
              />
              <circle cx="70" cy="0" r="12" fill="#FAFAF9" stroke="#D4AF37" strokeWidth="2" />
              <text
                x="70"
                y="4"
                textAnchor="middle"
                fill="#D4AF37"
                fontSize="12"
                fontWeight="bold"
              >
                DC
              </text>
            </g>

            <g transform="translate(320, 78)">
              <rect
                x="0"
                y="0"
                width="120"
                height="120"
                rx="8"
                fill="#FAFAF9"
                stroke="#064E3B"
                strokeWidth="3"
              />
              <path
                d="M 18 60 Q 45 22, 70 60 T 102 60"
                fill="none"
                stroke="#064E3B"
                strokeWidth="3"
              />
              <text x="60" y="150" textAnchor="middle" className={styles.diagramValue}>
                {copy.arch.inverter}
              </text>
              <text x="60" y="170" textAnchor="middle" className={styles.diagramLabel}>
                {systemKw > 0 ? `${acLabel} ${copy.arch.mpptSuffix}` : "—"}
              </text>
            </g>

            <g transform="translate(440, 138)">
              <path d="M 0 0 L 100 0 L 100 -60 L 160 -60" stroke="#064E3B" strokeWidth="4" />
              <path d="M 0 0 L 100 0 L 100 60 L 160 60" stroke="#064E3B" strokeWidth="4" />
              <circle cx="50" cy="0" r="12" fill="#064E3B" />
              <text
                x="50"
                y="4"
                textAnchor="middle"
                fill="#FAFAF9"
                fontSize="12"
                fontWeight="bold"
              >
                AC
              </text>
            </g>

            <g transform="translate(600, 38)">
              <rect x="0" y="0" width="140" height="80" rx="4" fill="#E7E5E4" />
              <path d="M 70 18 L 32 62 L 108 62 Z" fill="#78716C" opacity="0.25" />
              <text x="70" y="110" textAnchor="middle" className={styles.diagramValue}>
                {copy.arch.localLoad}
              </text>
              <text x="70" y="128" textAnchor="middle" className={styles.diagramLabel}>
                {copy.arch.prioritySync}
              </text>
            </g>

            <g transform="translate(600, 158)">
              <rect x="0" y="0" width="140" height="80" rx="4" fill="#064E3B" />
              <path
                d="M 40 62 L 40 28 L 100 28 L 100 62 M 30 28 L 110 28"
                fill="none"
                stroke="#D4AF37"
                strokeWidth="2"
              />
              <text x="70" y="110" textAnchor="middle" className={styles.diagramValue}>
                {copy.arch.utilityGrid}
              </text>
              <text x="70" y="128" textAnchor="middle" className={styles.diagramLabel}>
                {copy.arch.netMetering}
              </text>
            </g>
          </svg>
        </div>

        <div className={styles.prMathBlock}>
          <div className={styles.prMathText}>
            <span className={styles.goldEyebrow}>{copy.arch.prDerating}</span>
            <p>{copy.arch.prBlurb}</p>
          </div>
          <div
            className={styles.prMathFormula}
            aria-label={copy.arch.prFormulaAria}
          >
            <span className={styles.prEq}>PR</span>
            <span className={styles.prEqOp}>=</span>
            <span className={styles.prFrac}>
              <span className={styles.prNum}>
                E<sub>grid</sub>
              </span>
              <span className={styles.prDen}>
                P<sub>nom</sub> × H / G<sub>STC</sub>
              </span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default EmeraldArchitecture;
