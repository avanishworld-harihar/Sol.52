"use client";

/**
 * Obsidian — Powerplant Blueprint (HUD telemetry + SVG architecture).
 */

import { Fragment } from "react";
import type { ProposalData } from "@/lib/proposal-data";
import {
  OBSIDIAN_PANEL_WATT,
  OBSIDIAN_SPECIFIC_YIELD,
  formatObsidianKw,
  obsidianDcKwp,
  obsidianModuleCount,
} from "./obsidian-brand";
import styles from "./Obsidian.module.css";

export type ObsidianEngineeringProps = {
  data: ProposalData;
};

function PanelMatrix({ count }: { count: number }) {
  const n = Math.min(Math.max(count, 1), 12);
  const cols = n <= 3 ? n : Math.ceil(n / 2);
  const rows = n <= 3 ? 1 : 2;
  const cellW = 55;
  const cellH = 35;
  const gap = 10;
  const width = cols * cellW + (cols - 1) * gap;
  const height = rows * cellH + (rows - 1) * gap;

  const cells: { x: number; y: number; key: string }[] = [];
  let i = 0;
  for (let r = 0; r < rows && i < n; r++) {
    for (let c = 0; c < cols && i < n; c++) {
      cells.push({
        x: c * (cellW + gap),
        y: r * (cellH + gap),
        key: `pv-${r}-${c}`,
      });
      i += 1;
    }
  }

  return (
    <svg width={Math.min(200, width)} height={height} viewBox={`0 0 ${width} ${height}`}>
      {cells.map((cell) => (
        <Fragment key={cell.key}>
          <rect
            x={cell.x}
            y={cell.y}
            width={cellW}
            height={cellH}
            fill="rgba(255,85,0,0.1)"
            stroke="#FF5500"
            strokeWidth="1"
          />
          <rect
            x={cell.x + 2}
            y={cell.y + 2}
            width={cellW - 4}
            height={cellH - 4}
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="0.5"
          />
        </Fragment>
      ))}
    </svg>
  );
}

export function ObsidianEngineering({ data }: ObsidianEngineeringProps) {
  const systemKw = Number(data.meta.systemKw) || 0;
  const modules = obsidianModuleCount(systemKw);
  const dcKwp = obsidianDcKwp(modules);
  const acLabel = formatObsidianKw(systemKw, 1);
  const dcLabel = dcKwp > 0 ? formatObsidianKw(dcKwp) : "—";
  const ratio = systemKw > 0 && dcKwp > 0 ? dcKwp / systemKw : 0;
  const prMetric = data.engineering.metrics.find((m) =>
    /performance|pr\b/i.test(m.label)
  );
  const windMetric = data.engineering.metrics.find((m) =>
    /wind/i.test(m.label)
  );
  const pr = prMetric?.value || "75%";
  const wind = windMetric?.value || "150 km/h";
  const annualUnits =
    data.closing.annualUnits > 0
      ? Math.round(data.closing.annualUnits)
      : systemKw > 0
        ? Math.round(systemKw * OBSIDIAN_SPECIFIC_YIELD)
        : 0;
  const location =
    data.engineering.cityLabel?.trim() ||
    data.meta.locationLine?.trim() ||
    "";

  return (
    <section className={styles.a4TechSpec}>
      <div className={styles.viewfinder}>
        <div className={styles.vfCornerTR} />
        <div className={styles.vfCornerBL} />
      </div>

      <div className={styles.contentArea}>
        <div className={styles.techHeader}>
          <div>
            <span className={styles.systemCode}>
              [ SYS_ARCH_01 ] :: ENG_TELEMETRY
            </span>
            <h2 className={styles.mainTitle}>
              Powerplant
              <br />
              Blueprint.
            </h2>
          </div>
          <div className={styles.headerRight}>
            <span className={styles.systemCode}>STATUS: ACTIVE</span>
            {location ? (
              <div className={styles.headerMeta}>{location}</div>
            ) : null}
          </div>
        </div>

        <div className={styles.telemetryBlock}>
          <div className={styles.dataCluster}>
            <span className={styles.dataLabel}>01 // Direct Current Source</span>
            <span className={styles.dataValue}>
              {dcLabel} <span>kWp</span>
            </span>
            <p className={styles.dataHint}>
              {modules > 0
                ? `${modules} × ${OBSIDIAN_PANEL_WATT}W N-Type TOPCon array. High-efficiency panels that capture sunlight for this rooftop.`
                : "N-Type TOPCon array. High-efficiency panels that capture sunlight for this rooftop."}
            </p>
          </div>
          <div className={styles.chartVisual}>
            <PanelMatrix count={modules > 0 ? modules : 6} />
          </div>
        </div>

        <div className={`${styles.telemetryBlock} ${styles.telemetryCyan}`}>
          <div className={styles.dataCluster}>
            <span className={styles.dataLabel}>
              02 // Alternating Current Sync
            </span>
            <span className={styles.dataValue}>
              {acLabel} <span>kW</span>
            </span>
            <p className={styles.dataHint}>
              Dual-MPPT inverter. Converts DC from the panels into clean,
              grid-ready 230V AC.
            </p>
          </div>
          <div className={styles.chartVisual}>
            <svg width="100%" height="80" viewBox="0 0 300 80">
              <path
                d="M0 40 H300 M150 0 V80"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <path
                d="M0 40 Q 37.5 0, 75 40 T 150 40 T 225 40 T 300 40"
                fill="none"
                stroke="#38BDF8"
                strokeWidth="3"
              />
              <circle cx="150" cy="40" r="4" fill="#38BDF8" />
            </svg>
          </div>
        </div>

        <div className={`${styles.telemetryBlock} ${styles.telemetryGreen}`}>
          <div className={styles.dataCluster}>
            <span className={styles.dataLabel}>03 // Structural Yield Engine</span>
            <span className={styles.dataValue}>
              {ratio > 0 ? `${ratio.toFixed(2)}x` : "—"}{" "}
              <span>DC/AC Ratio</span>
            </span>
            <p className={styles.dataHint}>
              Extra DC capacity for better output in low light and monsoon.
              Wind rating {wind}.
            </p>
          </div>
          <div className={`${styles.chartVisual} ${styles.terminalBox}`}>
            <div className={styles.terminalText}>
              &gt; INITIATING YIELD CALC...
              <br />
              &gt; PR_DERATING_APPLIED: {pr}
              <br />
              &gt; WIND_RATING: {wind}
              <br />
              &gt; ----------------------
              <br />
              <span className={styles.terminalHighlight}>
                &gt; NET_EST_YIELD:{" "}
                {annualUnits > 0
                  ? `${annualUnits.toLocaleString("en-IN")} U/YR`
                  : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ObsidianEngineering;
