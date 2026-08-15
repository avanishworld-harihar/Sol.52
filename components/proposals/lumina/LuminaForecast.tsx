"use client";

import type { ProposalData } from "@/lib/proposal-data";
import styles from "./Lumina.module.css";
import { luminaAnnualUnits, luminaMonthlyForecast } from "./lumina-live";

export function LuminaForecast({ data }: { data: ProposalData }) {
  const annual = luminaAnnualUnits(data);
  const months = luminaMonthlyForecast(data);
  const max = Math.max(...months.map((m) => m.val), 1);
  const peak = months.reduce((best, m) => (m.val > best.val ? m : best), months[0]!);
  const low = months.reduce((best, m) => (m.val > 0 && m.val < best.val ? m : best), months[0]!);

  return (
    <section className={styles.a4Lumina}>
      <div className={styles.contentArea}>
        <div className={styles.dateTag}>Yield intelligence</div>
        <h1 className={styles.clientTitle}>Seasonal Forecast.</h1>
        <p className={styles.subText}>
          {annual > 0
            ? `Year-1 yield on this proposal is ${annual.toLocaleString("en-IN")} units. Bars use a typical central-India rooftop curve. Green = peak-sun months.`
            : "The chart appears when year-1 yield exists on this proposal — nothing is invented."}
        </p>

        <div className={styles.forecastStats}>
          <div className={styles.forecastStat}>
            <span className={styles.cardLabel}>Year-1 total</span>
            <span className={styles.cardValue}>
              {annual > 0 ? annual.toLocaleString("en-IN") : "—"}
            </span>
            {annual > 0 ? <span className={styles.cardUnit}>units</span> : null}
          </div>
          <div className={`${styles.forecastStat} ${styles.forecastStatPeak}`}>
            <span className={`${styles.cardLabel} ${styles.cardLabelAccent}`}>Highest month</span>
            <span className={`${styles.cardValue} ${styles.cardValueAccent}`}>
              {peak.val > 0 ? peak.m : "—"}
            </span>
            {peak.val > 0 ? (
              <span className={styles.cardUnit}>{peak.val.toLocaleString("en-IN")} U</span>
            ) : null}
          </div>
          <div className={styles.forecastStat}>
            <span className={styles.cardLabel}>Lowest month</span>
            <span className={styles.cardValue}>{low.val > 0 ? low.m : "—"}</span>
            {low.val > 0 ? (
              <span className={styles.cardUnit}>{low.val.toLocaleString("en-IN")} U</span>
            ) : null}
          </div>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartLegend}>
            <span className={styles.legendItem}>
              <span className={styles.legendSwatch} /> Typical
            </span>
            <span className={styles.legendItem}>
              <span className={`${styles.legendSwatch} ${styles.legendSwatchPeak}`} /> Peak sun
            </span>
          </div>
          <div className={styles.barChart} role="img" aria-label="Monthly generation forecast">
            {months.map((item) => {
              const pct = item.val > 0 ? Math.max(8, Math.round((item.val / max) * 100)) : 0;
              return (
                <div key={item.m} className={styles.barCol}>
                  <span className={`${styles.barVal} ${item.peak ? styles.barValPeak : ""}`}>
                    {item.val > 0 ? item.val : "—"}
                  </span>
                  <div className={styles.barTrack}>
                    <div
                      className={`${styles.barFill} ${item.peak ? styles.barFillPeak : ""}`}
                      style={{ height: `${pct}%` }}
                    />
                  </div>
                  <span className={`${styles.barMonth} ${item.peak ? styles.barMonthPeak : ""}`}>
                    {item.m}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className={styles.pageFooter}>Lumina · 05 / 07</div>
    </section>
  );
}

export default LuminaForecast;
