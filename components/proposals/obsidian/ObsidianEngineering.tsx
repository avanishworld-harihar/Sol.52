"use client";

/**
 * Obsidian — Powerplant Blueprint (HUD telemetry + SVG architecture).
 * Live ProposalData only — no 3 kW / 580W / Satna lat-long fallbacks.
 */

import { Fragment } from "react";
import type { ProposalData } from "@/lib/proposal-data";
import type { PremiumProposalPptInput } from "@/lib/proposal-ppt";
import { formatObsidianKw, resolveObsidianPanelSpec } from "./obsidian-brand";
import styles from "./Obsidian.module.css";

export type ObsidianEngineeringProps = {
  data: ProposalData;
  pptInput?: PremiumProposalPptInput | null;
};

function PanelMatrix() {
  return (
    <svg width="200" height="80" viewBox="0 0 200 80">
      {[0, 1, 2].map((x) => (
        <Fragment key={`row1-${x}`}>
          <rect
            x={x * 65}
            y="0"
            width="55"
            height="35"
            fill="rgba(255,85,0,0.1)"
            stroke="#FF5500"
            strokeWidth="1"
          />
          <rect
            x={x * 65 + 2}
            y="2"
            width="51"
            height="31"
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="0.5"
          />
        </Fragment>
      ))}
      {[0, 1, 2].map((x) => (
        <Fragment key={`row2-${x}`}>
          <rect
            x={x * 65}
            y="45"
            width="55"
            height="35"
            fill="rgba(255,85,0,0.1)"
            stroke="#FF5500"
            strokeWidth="1"
          />
          <rect
            x={x * 65 + 2}
            y="47"
            width="51"
            height="31"
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="0.5"
          />
        </Fragment>
      ))}
    </svg>
  );
}

export function ObsidianEngineering({ data, pptInput }: ObsidianEngineeringProps) {
  const systemKw = Number(data.meta.systemKw) || 0;
  const { watt, modules, dcKwp, panelItem, inverterItem } =
    resolveObsidianPanelSpec(data);
  const inverterKw = systemKw;
  const ratio = systemKw > 0 && dcKwp > 0 ? dcKwp / systemKw : 0;
  const annualYield =
    data.closing.annualUnits > 0 ? Math.round(data.closing.annualUnits) : 0;
  const customerName = data.meta.customerName?.trim() || "";
  const panelMake = panelItem?.brand?.trim() || panelItem?.spec?.trim() || "";
  const inverterMake = inverterItem?.brand?.trim() || inverterItem?.name?.trim() || "";
  const location =
    data.engineering.cityLabel?.trim() || data.meta.locationLine?.trim() || "";
  const siteLat = pptInput?.residentialTechnicalSpecs?.mounting?.siteLat;
  const hasLat = typeof siteLat === "number" && Number.isFinite(siteLat);
  const geoLine = hasLat
    ? `LAT: ${siteLat.toFixed(1)}° N`
    : location
      ? location
      : "";

  const dcLabel = formatObsidianKw(dcKwp);
  const acLabel = formatObsidianKw(inverterKw, 1);
  const ratioLabel = ratio > 0 ? ratio.toFixed(2) : "—";

  const arrayHint =
    modules > 0 && watt > 0
      ? `${modules}x ${watt}W${panelMake ? ` ${panelMake}` : ""} Array. Highly engineered silicon matrix designed to capture raw solar irradiance.`
      : "Highly engineered silicon matrix designed to capture raw solar irradiance.";

  const inverterHint = inverterMake
    ? `${inverterMake} inverter. Processing raw DC into clean, grid-synchronized 230V AC output.`
    : "Intelligent inverter. Processing raw DC into clean, grid-synchronized 230V AC output.";

  const telemetryTag = customerName
    ? `[ SYS_ARCH_01 ] :: ENG_TELEMETRY :: ${customerName.toUpperCase()}`
    : "[ SYS_ARCH_01 ] :: ENG_TELEMETRY";

  return (
    <section className={styles.a4TechSpec}>
      <div className={styles.viewfinder}>
        <div className={styles.vfCornerTR} />
        <div className={styles.vfCornerBL} />
      </div>

      <div className={styles.contentArea}>
        <div className={styles.techHeader}>
          <div>
            <span className={styles.systemCode}>{telemetryTag}</span>
            <h2 className={styles.mainTitle}>
              Powerplant
              <br />
              Blueprint.
            </h2>
          </div>
          <div className={styles.headerRight}>
            <span className={styles.systemCode}>STATUS: ACTIVE</span>
            {geoLine ? <div className={styles.headerMeta}>{geoLine}</div> : null}
          </div>
        </div>

        <div className={styles.telemetryBlock}>
          <div className={styles.dataCluster}>
            <span className={styles.dataLabel}>01 // Direct Current Source</span>
            <span className={styles.dataValue}>
              {dcLabel} <span>kWp</span>
            </span>
            <p className={styles.dataHint}>{arrayHint}</p>
          </div>
          <div className={styles.chartVisual}>
            <PanelMatrix />
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
            <p className={styles.dataHint}>{inverterHint}</p>
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
              {ratio > 0 ? `${ratioLabel}x` : "—"}{" "}
              <span>DC/AC Ratio</span>
            </span>
            <p className={styles.dataHint}>
              Oversampled architecture ensuring maximum yield during low-light
              conditions. Wind-load certified deployment.
            </p>
          </div>
          <div className={`${styles.chartVisual} ${styles.terminalBox}`}>
            <div className={styles.terminalText}>
              &gt; INITIATING YIELD CALC...
              <br />
              &gt; SYSTEM_CAPACITY: {acLabel !== "—" ? `${acLabel} kW` : "—"}
              <br />
              &gt; ARRAY_PEAK: {dcLabel !== "—" ? `${dcLabel} kWp` : "—"}
              <br />
              &gt; EFFICIENCY_DERATING_ACTIVE
              <br />
              &gt; ----------------------
              <br />
              <span className={styles.terminalHighlight}>
                &gt; NET_EST_YIELD:{" "}
                {annualYield > 0
                  ? `${annualYield.toLocaleString("en-IN")} U/YR`
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
