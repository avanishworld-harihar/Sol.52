"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { formatInrCompact } from "@/components/proposals/_shared/formatters";
import styles from "./Sienna.module.css";
import { SiennaDocFooter } from "./sienna-brand";
import { useSiennaLang } from "./sienna-lang-context";
import {
  siennaAnnualUnits,
  siennaBillYearUnits,
  siennaForecastNotes,
  siennaHasBillUnits,
  siennaMonthlyForecast,
} from "./sienna-live";

export function SiennaForecast({ data }: { data: ProposalData }) {
  const { copy, lang } = useSiennaLang();
  const annual = siennaAnnualUnits(data);
  const months = siennaMonthlyForecast(data);
  const showBill = siennaHasBillUnits(data);
  const billYear = siennaBillYearUnits(data);
  const max = Math.max(
    ...months.map((m) => m.val),
    ...months.map((m) => (m.billUnits != null && m.billUnits > 0 ? m.billUnits : 0)),
    1
  );
  const peak = months.reduce((best, m) => (m.val > best.val ? m : best), months[0]!);
  const low = months.reduce((best, m) => (m.val > 0 && m.val < best.val ? m : best), months[0]!);
  const notes = siennaForecastNotes(data, lang);

  return (
    <section className={`${styles.a4Sienna} ${styles.innerSheet} ${styles.forecastSheet}`}>
      <div className={styles.contentArea}>
        <div className={styles.dateTag}>{copy.forecast.tag}</div>
        <h1 className={styles.clientTitle}>{copy.forecast.title}</h1>
        <p className={styles.subText}>
          {annual > 0
            ? copy.forecast.lead(annual.toLocaleString("en-IN"), showBill)
            : copy.forecast.leadEmpty}
        </p>

        <div className={styles.forecastStats}>
          <div className={styles.forecastStat}>
            <span className={styles.cardLabel}>{copy.forecast.year1Solar}</span>
            <span className={styles.cardValue}>
              {annual > 0 ? annual.toLocaleString("en-IN") : "—"}
            </span>
            {annual > 0 ? <span className={`${styles.cardUnit} ${styles.cardUnitYield}`}>{copy.forecast.units}</span> : null}
          </div>
          <div className={`${styles.forecastStat} ${styles.forecastStatPeak}`}>
            <span className={`${styles.cardLabel} ${styles.cardLabelAccent}`}>{copy.forecast.highest}</span>
            <span className={`${styles.cardValue} ${styles.cardValueAccent}`}>
              {peak.val > 0 ? peak.m : "—"}
            </span>
            {peak.val > 0 ? (
              <span className={styles.cardUnit}>{peak.val.toLocaleString("en-IN")} U</span>
            ) : null}
          </div>
          {showBill ? (
            <div className={styles.forecastStat}>
              <span className={styles.cardLabel}>{copy.forecast.billYear}</span>
              <span className={styles.cardValue}>
                {billYear > 0 ? billYear.toLocaleString("en-IN") : "—"}
              </span>
              {billYear > 0 ? <span className={styles.cardUnit}>{copy.forecast.units}</span> : null}
            </div>
          ) : (
            <div className={styles.forecastStat}>
              <span className={styles.cardLabel}>{copy.forecast.lowest}</span>
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
              <span className={styles.legendSwatch} /> {copy.forecast.legendSolar}
            </span>
            <span className={styles.legendItem}>
              <span className={`${styles.legendSwatch} ${styles.legendSwatchPeak}`} /> {copy.forecast.legendPeak}
            </span>
            {showBill ? (
              <span className={styles.legendItem}>
                <span className={`${styles.legendSwatch} ${styles.legendSwatchBill}`} /> {copy.forecast.legendBill}
              </span>
            ) : null}
          </div>
          <div
            className={`${styles.barChart} ${styles.barChartTall}`}
            role="img"
              aria-label={copy.forecast.chartAria(showBill)}
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
                  <span className={styles.barSave}>
                    {item.savingsInr > 0 ? formatInrCompact(item.savingsInr) : "—"}
                  </span>
                </div>
              );
            })}
          </div>
          <div className={styles.chartAxis}>
            <span>{copy.forecast.axisUnits}</span>
            <span>{copy.forecast.axisSave}</span>
          </div>
          {notes.savingsBasis ? (
            <p className={styles.forecastBasis}>{notes.savingsBasis}</p>
          ) : null}
        </div>

        <aside className={styles.forecastInsight}>
          <p className={styles.forecastInsightTag}>{notes.insightTag}</p>
          <h2 className={styles.forecastInsightTitle}>{notes.insightTitle}</h2>
          <p className={styles.forecastInsightBody}>{notes.insightBody}</p>
        </aside>
      </div>
      <SiennaDocFooter data={data} page="05 / 09" />
    </section>
  );
}

export default SiennaForecast;
