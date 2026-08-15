"use client";

import type { ProposalData } from "@/lib/proposal-data";
import styles from "./Lumina.module.css";
import { luminaAnnualUnits, luminaMonthlyForecast } from "./lumina-live";

export function LuminaForecast({ data }: { data: ProposalData }) {
  const annual = luminaAnnualUnits(data);
  const months = luminaMonthlyForecast(data);

  return (
    <section className={styles.a4Lumina}>
      <div className={styles.contentArea}>
        <div className={styles.dateTag}>Yield intelligence</div>
        <h1 className={styles.clientTitle}>Seasonal Forecast.</h1>
        <p className={styles.subText}>
          {annual > 0
            ? `Year-1 yield on this proposal (${annual.toLocaleString("en-IN")} units) is split across months using a typical central-India rooftop curve. Green cards are peak-sun months.`
            : "Monthly cards appear when year-1 yield exists on this proposal — nothing is invented."}
        </p>

        <div className={styles.forecastGrid}>
          {months.map((item) => (
            <div
              key={item.m}
              className={`${styles.monthCard} ${item.peak ? styles.monthCardHighlight : ""}`}
            >
              <span className={`${styles.monthLabel} ${item.peak ? styles.monthLabelPeak : ""}`}>
                {item.m}
              </span>
              <span className={`${styles.monthVal} ${item.peak ? styles.monthValPeak : ""}`}>
                {item.val > 0 ? `${item.val.toLocaleString("en-IN")} U` : "—"}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.pageFooter}>Lumina · 05 / 07</div>
    </section>
  );
}

export default LuminaForecast;
