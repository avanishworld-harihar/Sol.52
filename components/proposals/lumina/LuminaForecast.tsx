"use client";

import type { ProposalData } from "@/lib/proposal-data";
import styles from "./Lumina.module.css";
import { LuminaDocFooter } from "./lumina-brand";
import {
  luminaAnnualUnits,
  luminaBillYearUnits,
  luminaHasBillUnits,
  luminaMonthlyForecast,
} from "./lumina-live";

export function LuminaForecast({ data }: { data: ProposalData }) {
  const annual = luminaAnnualUnits(data);
  const months = luminaMonthlyForecast(data);
  const showBill = luminaHasBillUnits(data);
  const billYear = luminaBillYearUnits(data);
  const max = Math.max(
    ...months.map((m) => m.val),
    ...months.map((m) => (m.billUnits != null && m.billUnits > 0 ? m.billUnits : 0)),
    1
  );
  const peak = months.reduce((best, m) => (m.val > best.val ? m : best), months[0]!);
  const low = months.reduce((best, m) => (m.val > 0 && m.val < best.val ? m : best), months[0]!);

  return (
    <section className={styles.a4Lumina}>
      <div className={styles.contentArea}>
        <div className={styles.dateTag}>Yield intelligence</div>
        <h1 className={styles.clientTitle}>Seasonal Forecast.</h1>
        <p className={styles.subText}>
          {annual > 0
            ? `Year-1 yield on this proposal is ${annual.toLocaleString("en-IN")} units. Bars follow a typical central-India rooftop curve.${
                showBill
                  ? " Dark bars are bill units from the uploaded bill."
                  : " Green = peak-sun months."
              }`
            : "The chart appears when year-1 yield exists on this proposal — nothing is invented."}
        </p>

        <div className={styles.forecastStats}>
          <div className={styles.forecastStat}>
            <span className={styles.cardLabel}>Year-1 solar</span>
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
          {showBill ? (
            <div className={styles.forecastStat}>
              <span className={styles.cardLabel}>Bill year units</span>
              <span className={styles.cardValue}>
                {billYear > 0 ? billYear.toLocaleString("en-IN") : "—"}
              </span>
              {billYear > 0 ? <span className={styles.cardUnit}>units</span> : null}
            </div>
          ) : (
            <div className={styles.forecastStat}>
              <span className={styles.cardLabel}>Lowest month</span>
              <span className={styles.cardValue}>{low.val > 0 ? low.m : "—"}</span>
              {low.val > 0 ? (
                <span className={styles.cardUnit}>{low.val.toLocaleString("en-IN")} U</span>
              ) : null}
            </div>
          )}
        </div>

        <div className={`${styles.chartCard} ${styles.chartCardTall}`}>
          <div className={styles.chartLegend}>
            <span className={styles.legendItem}>
              <span className={styles.legendSwatch} /> Solar
            </span>
            <span className={styles.legendItem}>
              <span className={`${styles.legendSwatch} ${styles.legendSwatchPeak}`} /> Peak sun
            </span>
            {showBill ? (
              <span className={styles.legendItem}>
                <span className={`${styles.legendSwatch} ${styles.legendSwatchBill}`} /> Bill units
              </span>
            ) : null}
          </div>
          <div
            className={`${styles.barChart} ${styles.barChartTall}`}
            role="img"
            aria-label={
              showBill
                ? "Monthly solar generation versus bill units"
                : "Monthly generation forecast"
            }
          >
            {months.map((item) => {
              const solarPct = item.val > 0 ? Math.max(8, Math.round((item.val / max) * 100)) : 0;
              const bill = item.billUnits;
              const billPct =
                bill != null && bill > 0 ? Math.max(8, Math.round((bill / max) * 100)) : 0;
              return (
                <div key={item.m} className={styles.barCol}>
                  <span className={`${styles.barVal} ${item.peak ? styles.barValPeak : ""}`}>
                    {item.val > 0 ? item.val : "—"}
                    {showBill ? (
                      <span className={styles.barValBill}>
                        {bill != null && bill > 0 ? bill : "—"}
                      </span>
                    ) : null}
                  </span>
                  {showBill ? (
                    <div className={styles.barPair}>
                      <div className={`${styles.barTrack} ${styles.barTrackTwin}`}>
                        <div
                          className={`${styles.barFill} ${item.peak ? styles.barFillPeak : ""}`}
                          style={{ height: `${solarPct}%` }}
                        />
                      </div>
                      <div className={`${styles.barTrack} ${styles.barTrackTwin}`}>
                        <div
                          className={`${styles.barFill} ${styles.barFillBill}`}
                          style={{ height: `${billPct}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className={styles.barTrack}>
                      <div
                        className={`${styles.barFill} ${item.peak ? styles.barFillPeak : ""}`}
                        style={{ height: `${solarPct}%` }}
                      />
                    </div>
                  )}
                  <span className={`${styles.barMonth} ${item.peak ? styles.barMonthPeak : ""}`}>
                    {item.m}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <LuminaDocFooter data={data} page="05 / 08" />
    </section>
  );
}

export default LuminaForecast;
