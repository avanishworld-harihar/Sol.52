"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { DrawingSheet } from "./DrawingSheet";
import styles from "./Field.module.css";
import { buildFieldForecastMonths } from "./field-forecast";
import { fieldAnnualUnits, fieldDrawnBy, fieldSheetDate } from "./field-live";

export function PerformancePage({ data }: { data: ProposalData }) {
  const annual = fieldAnnualUnits(data);
  const months = buildFieldForecastMonths(annual);
  const peak = Math.max(...months.map((m) => m.val), 1);

  return (
    <DrawingSheet
      dwgNo="FE-04"
      sheetLabel="PERFORMANCE SIMULATION"
      drawnBy={fieldDrawnBy(data)}
      date={fieldSheetDate(data.meta.generatedAt)}
    >
      <span className={styles.eyebrow}>Yield model</span>
      <h2 className={styles.h2}>Monthly generation from the year-1 target.</h2>
      <p className={styles.lede}>
        Bars follow a Central-India seasonal share applied to this proposal’s
        year-1 units. Missing annual yield stays blank — it is not invented.
      </p>

      <div className={styles.metaGrid}>
        <div className={styles.metaCell}>
          <span>Year-1 units</span>
          <strong>{annual > 0 ? `${annual.toLocaleString("en-IN")} u` : "—"}</strong>
        </div>
        <div className={styles.metaCell}>
          <span>Peak month</span>
          <strong>
            {annual > 0
              ? months.reduce((a, b) => (b.val > a.val ? b : a)).m
              : "—"}
          </strong>
        </div>
      </div>

      <div className={styles.chart}>
        {months.map((m) => {
          const h = annual > 0 ? Math.max(6, Math.round((m.val / peak) * 100)) : 8;
          return (
            <div className={styles.barCol} key={m.m}>
              <span className={styles.barVal}>{annual > 0 ? m.val : "—"}</span>
              <div
                className={`${styles.barFill} ${m.pct >= 95 ? styles.barFillPeak : ""}`}
                style={{ height: `${h}%` }}
              />
              <span className={styles.barLbl}>{m.m}</span>
            </div>
          );
        })}
      </div>
      <p className={styles.note}>
        Orange bars mark near-peak months. This is a planning simulation, not a
        generation guarantee.
      </p>
    </DrawingSheet>
  );
}

export default PerformancePage;
