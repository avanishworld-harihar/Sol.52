"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { formatInrCompact } from "@/components/proposals/_shared/formatters";
import styles from "./Sienna.module.css";
import { SiennaSheet } from "./sienna-brand";
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

  const side =
    showBill && billYear > 0
      ? `${copy.forecast.billYear} ${billYear.toLocaleString("en-IN")}`
      : peak.val > 0
        ? `${copy.forecast.highest} ${peak.m} · ${copy.forecast.lowest} ${low.val > 0 ? low.m : "—"}`
        : "—";

  return (
    <SiennaSheet data={data} page="05 / 09" chapter={copy.spine.year}>
      <p className={styles.kicker}>{copy.forecast.kicker}</p>
      <h1 className={styles.displayTitle}>{copy.forecast.title}</h1>
      <p className={styles.lead}>
        {annual > 0
          ? copy.forecast.lead(annual.toLocaleString("en-IN"), showBill)
          : copy.forecast.leadEmpty}
      </p>

      <div className={styles.seasonHero}>
        <div>
          <span className={styles.seasonHeroVal}>
            {annual > 0 ? annual.toLocaleString("en-IN") : "—"}
          </span>
          {annual > 0 ? (
            <span className={styles.colophonUnit}> {copy.forecast.units}</span>
          ) : null}
        </div>
        <div className={styles.seasonHeroMeta}>{side}</div>
      </div>

      <div
        className={styles.ribbon}
        role="img"
        aria-label={copy.forecast.chartAria(showBill)}
      >
        {months.map((item) => {
          const solarPct = item.val > 0 ? Math.max(8, Math.round((item.val / max) * 100)) : 0;
          const bill = item.billUnits;
          const billPct =
            bill != null && bill > 0 ? Math.max(8, Math.round((bill / max) * 100)) : 0;
          return (
            <div key={item.m} className={styles.ribbonCol}>
              <span className={`${styles.ribbonVal} ${item.peak ? styles.ribbonValPeak : ""}`}>
                {item.val > 0 ? item.val : "—"}
              </span>
              {showBill ? (
                <div className={styles.ribbonPair}>
                  <div className={styles.ribbonTrack}>
                    <div
                      className={`${styles.ribbonFill} ${item.peak ? styles.ribbonFillPeak : ""}`}
                      style={{ height: `${solarPct}%` }}
                    />
                  </div>
                  <div className={styles.ribbonTrack}>
                    <div
                      className={`${styles.ribbonFill} ${styles.ribbonFillBill}`}
                      style={{ height: `${billPct}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className={styles.ribbonTrack}>
                  <div
                    className={`${styles.ribbonFill} ${item.peak ? styles.ribbonFillPeak : ""}`}
                    style={{ height: `${solarPct}%` }}
                  />
                </div>
              )}
              <span className={`${styles.ribbonMonth} ${item.peak ? styles.ribbonMonthPeak : ""}`}>
                {item.m}
              </span>
              <span className={styles.ribbonSave}>
                {item.savingsInr > 0 ? formatInrCompact(item.savingsInr) : "—"}
              </span>
            </div>
          );
        })}
      </div>

      <div className={styles.legend}>
        <span>
          <span className={styles.swatch} /> {copy.forecast.legendSolar}
        </span>
        <span>
          <span className={`${styles.swatch} ${styles.swatchPeak}`} /> {copy.forecast.legendPeak}
        </span>
        {showBill ? (
          <span>
            <span className={`${styles.swatch} ${styles.swatchBill}`} /> {copy.forecast.legendBill}
          </span>
        ) : null}
      </div>

      {notes.savingsBasis ? <p className={styles.forecastBasis}>{notes.savingsBasis}</p> : null}

      <aside className={styles.forecastNote}>
        <p className={styles.forecastNoteTag}>{notes.insightTag}</p>
        <h2 className={styles.forecastNoteTitle}>{notes.insightTitle}</h2>
        <p className={styles.forecastNoteBody}>{notes.insightBody}</p>
      </aside>
    </SiennaSheet>
  );
}

export default SiennaForecast;
