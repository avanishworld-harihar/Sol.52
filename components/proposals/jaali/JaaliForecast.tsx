"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { formatInrCompact } from "@/components/proposals/_shared/formatters";
import styles from "./Jaali.module.css";
import { JaaliSheet } from "./jaali-brand";
import { useJaaliLang } from "./jaali-lang-context";
import {
  jaaliAnnualUnits,
  jaaliBillYearUnits,
  jaaliForecastNotes,
  jaaliHasBillUnits,
  jaaliMonthlyForecast,
} from "./jaali-live";

export function JaaliForecast({ data }: { data: ProposalData }) {
  const { copy, lang } = useJaaliLang();
  const annual = jaaliAnnualUnits(data);
  const months = jaaliMonthlyForecast(data);
  const showBill = jaaliHasBillUnits(data);
  const billYear = jaaliBillYearUnits(data);
  const max = Math.max(
    ...months.map((m) => m.val),
    ...months.map((m) => (m.billUnits != null && m.billUnits > 0 ? m.billUnits : 0)),
    1
  );
  const peak = months.reduce((best, m) => (m.val > best.val ? m : best), months[0]!);
  const low = months.reduce((best, m) => (m.val > 0 && m.val < best.val ? m : best), months[0]!);
  const notes = jaaliForecastNotes(data, lang);

  const side =
    showBill && billYear > 0
      ? `${copy.forecast.billYear} ${billYear.toLocaleString("en-IN")}`
      : peak.val > 0
        ? `${copy.forecast.highest} ${peak.m} · ${copy.forecast.lowest} ${low.val > 0 ? low.m : "—"}`
        : "—";

  return (
    <JaaliSheet data={data} page="05 / 09" chapter={copy.spine.year}>
      <div className={styles.yearPage}>
        <p className={styles.kicker}>{copy.forecast.kicker}</p>
        <h1 className={styles.displayTitle}>{copy.forecast.title}</h1>
        <p className={styles.lead}>
          {annual > 0
            ? copy.forecast.lead(annual.toLocaleString("en-IN"), showBill)
            : copy.forecast.leadEmpty}
        </p>

        <div className={styles.yearWell}>
          <div className={styles.yearHero}>
            <div>
              <span className={styles.yearHeroVal}>
                {annual > 0 ? annual.toLocaleString("en-IN") : "—"}
              </span>
              {annual > 0 ? (
                <span className={styles.colophonUnit}> {copy.forecast.units}</span>
              ) : null}
            </div>
            <div className={styles.yearHeroMeta}>{side}</div>
          </div>

          <div
            className={styles.arcadeYear}
            role="img"
            aria-label={copy.forecast.chartAria(showBill)}
          >
            {months.map((item) => {
              const solarPct = item.val > 0 ? Math.max(8, Math.round((item.val / max) * 100)) : 0;
              const bill = item.billUnits;
              const billPct =
                bill != null && bill > 0 ? Math.max(8, Math.round((bill / max) * 100)) : 0;
              return (
                <div
                  key={item.m}
                  className={`${styles.arcadeMonth}${item.peak ? ` ${styles.arcadeMonthPeak}` : ""}`}
                >
                  <div className={styles.arcadeNums}>
                    <span
                      className={`${styles.arcadeVal}${item.peak ? ` ${styles.arcadeValPeak}` : ""}`}
                    >
                      {item.val > 0 ? item.val : "—"}
                    </span>
                    {showBill ? (
                      <span className={styles.arcadeValBill}>
                        {bill != null && bill > 0 ? bill : "—"}
                      </span>
                    ) : null}
                  </div>
                  <div className={showBill ? styles.arcadePair : styles.arcadeShaft}>
                    {showBill ? (
                      <>
                        <div className={styles.arcadeSlot}>
                          <div
                            className={`${styles.arcadePier}${item.peak ? ` ${styles.arcadePierPeak}` : ""}`}
                            style={{ height: `${solarPct}%` }}
                          >
                            <span className={styles.arcadeCap} aria-hidden />
                          </div>
                        </div>
                        <div className={styles.arcadeSlot}>
                          <div
                            className={`${styles.arcadePier} ${styles.arcadePierBill}`}
                            style={{ height: `${billPct}%` }}
                          />
                        </div>
                      </>
                    ) : (
                      <div
                        className={`${styles.arcadePier}${item.peak ? ` ${styles.arcadePierPeak}` : ""}`}
                        style={{ height: `${solarPct}%` }}
                      >
                        <span className={styles.arcadeCap} aria-hidden />
                      </div>
                    )}
                  </div>
                  <span
                    className={`${styles.arcadeLbl}${item.peak ? ` ${styles.arcadeLblPeak}` : ""}`}
                  >
                    {item.m}
                  </span>
                  <span className={styles.arcadeSave}>
                    {item.savingsInr > 0 ? formatInrCompact(item.savingsInr) : "—"}
                  </span>
                </div>
              );
            })}
          </div>

          <div className={styles.yearFoot}>
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
          </div>
        </div>

        <aside className={styles.forecastNote}>
          <p className={styles.forecastNoteTag}>{notes.insightTag}</p>
          <h2 className={styles.forecastNoteTitle}>{notes.insightTitle}</h2>
          <p className={styles.forecastNoteBody}>{notes.insightBody}</p>
        </aside>
      </div>
    </JaaliSheet>
  );
}

export default JaaliForecast;
