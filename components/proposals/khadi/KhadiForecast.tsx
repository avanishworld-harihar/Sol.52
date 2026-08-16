"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { formatInrCompact } from "@/components/proposals/_shared/formatters";
import styles from "./Khadi.module.css";
import { KhadiSheet } from "./khadi-brand";
import { useKhadiLang } from "./khadi-lang-context";
import {
  khadiAnnualUnits,
  khadiBillYearUnits,
  khadiForecastNotes,
  khadiHasBillUnits,
  khadiMonthlyForecast,
} from "./khadi-live";

export function KhadiForecast({ data }: { data: ProposalData }) {
  const { copy, lang } = useKhadiLang();
  const annual = khadiAnnualUnits(data);
  const months = khadiMonthlyForecast(data);
  const showBill = khadiHasBillUnits(data);
  const billYear = khadiBillYearUnits(data);
  const max = Math.max(
    ...months.map((m) => m.val),
    ...months.map((m) => (m.billUnits != null && m.billUnits > 0 ? m.billUnits : 0)),
    1
  );
  const peak = months.reduce((best, m) => (m.val > best.val ? m : best), months[0]!);
  const low = months.reduce((best, m) => (m.val > 0 && m.val < best.val ? m : best), months[0]!);
  const notes = khadiForecastNotes(data, lang);

  const side =
    showBill && billYear > 0
      ? `${copy.forecast.billYear} ${billYear.toLocaleString("en-IN")}`
      : peak.val > 0
        ? `${copy.forecast.highest} ${peak.m} · ${copy.forecast.lowest} ${low.val > 0 ? low.m : "—"}`
        : "—";

  return (
    <KhadiSheet data={data} page="05 / 09" chapter={copy.spine.year}>
      <div className={styles.mill}>
        <aside className={styles.millSelvage}>
          <p className={styles.kicker}>{copy.forecast.kicker}</p>
          <h1 className={styles.displayTitle}>{copy.forecast.title}</h1>
          <p className={styles.lead}>
            {annual > 0
              ? copy.forecast.lead(annual.toLocaleString("en-IN"), showBill)
              : copy.forecast.leadEmpty}
          </p>

          <div className={styles.millTicket}>
            <span className={styles.millTicketLabel}>{copy.forecast.units}</span>
            <div className={styles.millTicketVal}>
              {annual > 0 ? annual.toLocaleString("en-IN") : "—"}
            </div>
            <p className={styles.millTicketHint}>{side}</p>
          </div>

          {notes.savingsBasis ? (
            <p className={styles.millCaption}>{notes.savingsBasis}</p>
          ) : null}

          <div className={styles.millNote}>
            <span>{notes.insightTag}</span>
            <h2>{notes.insightTitle}</h2>
            <p>{notes.insightBody}</p>
          </div>
        </aside>

        <div className={styles.millWork}>
          <div
            className={styles.millCloth}
            role="img"
            aria-label={copy.forecast.chartAria(showBill)}
          >
            {months.map((item) => {
              const dyePct = item.val > 0 ? Math.max(18, Math.round((item.val / max) * 100)) : 0;
              const bill = item.billUnits;
              return (
                <article
                  key={item.m}
                  className={`${styles.millTile}${item.peak ? ` ${styles.millTilePeak}` : ""}`}
                >
                  <div className={styles.millTileHead}>
                    <span className={styles.millTileMonth}>{item.m}</span>
                    <span className={styles.millTileVal}>{item.val > 0 ? item.val : "—"}</span>
                  </div>
                  {showBill ? (
                    <span className={styles.millTileBill}>
                      {copy.forecast.legendBill}{" "}
                      {bill != null && bill > 0 ? bill : "—"}
                    </span>
                  ) : null}
                  <div className={styles.millTileDye} style={{ width: `${dyePct}%` }} />
                  <span className={styles.millTileSave}>
                    {item.savingsInr > 0 ? formatInrCompact(item.savingsInr) : "—"}
                  </span>
                </article>
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
        </div>
      </div>
    </KhadiSheet>
  );
}

export default KhadiForecast;
