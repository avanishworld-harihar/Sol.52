"use client";

/**
 * Emerald Signature — seasonal generation + compact green impact.
 */

import type { ProposalData } from "@/lib/proposal-data";
import { buildEmeraldForecastMonths } from "./emerald-forecast";
import { emeraldAnnualUnits } from "./emerald-live";
import { useEmeraldLang } from "./emerald-lang-context";
import styles from "./Emerald.module.css";

export type EmeraldForecastProps = {
  data: ProposalData;
  folio: string;
};

export function EmeraldForecast({ data, folio }: EmeraldForecastProps) {
  const { copy } = useEmeraldLang();
  const annualUnits = emeraldAnnualUnits(data);
  const forecast = buildEmeraldForecastMonths(annualUnits, copy.forecast.months);
  const h1 = forecast.slice(0, 6);
  const h2 = forecast.slice(6, 12);
  const co2 = Number(data.impact.co2Tons) || 0;
  const trees = Math.round(Number(data.impact.treesEquivalent) || 0);

  return (
    <section className={styles.a4Page}>
      <div className={styles.sidebar}>
        <span className={styles.folioNum}>{folio}</span>
        <div>
          <span className={styles.goldEyebrow}>{copy.common.section(folio)}</span>
          <h3 className={styles.sidebarTitle}>
            {copy.forecast.sidebarTitle[0]}
            <br />
            {copy.forecast.sidebarTitle[1]}
          </h3>
          <p className={styles.sidebarBlurb}>{copy.forecast.sidebarBlurb}</p>
        </div>
      </div>

      <div className={styles.contentArea}>
        <h2 className={styles.pageHeader}>{copy.forecast.pageHeader}</h2>

        <p className={styles.forecastLead}>{copy.forecast.lead}</p>

        <div className={styles.forecastContainer}>
          <div>
            <span
              className={styles.goldEyebrow}
              style={{ marginBottom: "12px" }}
            >
              {copy.forecast.h1}
            </span>
            {h1.map((item) => (
              <div className={styles.monthRow} key={item.m}>
                <span className={styles.monthName}>{item.m}</span>
                <div className={styles.monthBarTrack}>
                  <div
                    className={styles.monthBarFill}
                    style={{ width: item.w }}
                  />
                </div>
                <span className={styles.monthData}>
                  {item.val > 0 ? item.val : "—"}
                </span>
              </div>
            ))}
          </div>

          <div>
            <span
              className={styles.goldEyebrow}
              style={{ marginBottom: "12px" }}
            >
              {copy.forecast.h2}
            </span>
            {h2.map((item) => (
              <div className={styles.monthRow} key={item.m}>
                <span className={styles.monthName}>{item.m}</span>
                <div className={styles.monthBarTrack}>
                  <div
                    className={`${styles.monthBarFill} ${styles.monthBarFillGold}`}
                    style={{ width: item.w }}
                  />
                </div>
                <span className={styles.monthData}>
                  {item.val > 0 ? item.val : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.impactStrip}>
          <div className={styles.impactStripStat}>
            <span className={styles.forecastTotalLabel}>
              {copy.forecast.yearly}
            </span>
            <span className={styles.impactStripValue}>
              {annualUnits > 0
                ? copy.forecast.yearlyValue(annualUnits.toLocaleString("en-IN"))
                : "—"}
            </span>
          </div>
          <div className={styles.impactStripStat}>
            <span className={styles.forecastTotalLabel}>
              {copy.impact.co2Label}
            </span>
            <span className={styles.impactStripValue}>
              {co2 > 0 ? `${co2.toFixed(1)} t` : "—"}
            </span>
          </div>
          <div className={styles.impactStripStat}>
            <span className={styles.forecastTotalLabel}>
              {copy.impact.treesLabel}
            </span>
            <span className={styles.impactStripValue}>
              {trees > 0 ? trees.toLocaleString("en-IN") : "—"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default EmeraldForecast;
