"use client";

/**
 * Emerald Signature — Seasonal generation (H1 / H2 yield bars).
 */

import type { ProposalData } from "@/lib/proposal-data";
import { EMERALD_SPECIFIC_YIELD } from "./emerald-brand";
import { buildEmeraldForecastMonths } from "./emerald-forecast";
import { useEmeraldLang } from "./emerald-lang-context";
import styles from "./Emerald.module.css";

export type EmeraldForecastProps = {
  data: ProposalData;
};

export function EmeraldForecast({ data }: EmeraldForecastProps) {
  const { copy } = useEmeraldLang();
  const systemKw = Number(data.meta.systemKw) || 0;
  const annualUnits =
    data.closing.annualUnits > 0
      ? Math.round(data.closing.annualUnits)
      : systemKw > 0
        ? Math.round(systemKw * EMERALD_SPECIFIC_YIELD)
        : 0;
  const forecast = buildEmeraldForecastMonths(annualUnits, copy.forecast.months);
  const h1 = forecast.slice(0, 6);
  const h2 = forecast.slice(6, 12);

  return (
    <section className={styles.a4Page}>
      <div className={styles.sidebar}>
        <span className={styles.folioNum}>07</span>
        <div>
          <span className={styles.goldEyebrow}>{copy.forecast.eyebrow}</span>
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
              style={{ marginBottom: "15px" }}
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
              style={{ marginBottom: "15px" }}
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

        <div className={styles.forecastTotal}>
          <div className={styles.forecastTotalInner}>
            <span className={styles.forecastTotalLabel}>
              {copy.forecast.yearly}
            </span>
            <span className={styles.forecastTotalValue}>
              {annualUnits > 0
                ? copy.forecast.yearlyValue(annualUnits.toLocaleString("en-IN"))
                : "—"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default EmeraldForecast;
