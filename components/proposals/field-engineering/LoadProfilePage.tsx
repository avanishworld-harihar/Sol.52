"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { formatInr } from "@/components/proposals/_shared/formatters";
import { DrawingSheet } from "./DrawingSheet";
import styles from "./Field.module.css";
import { fieldDrawnBy, fieldSheetDate, hasFieldBill } from "./field-live";

export function LoadProfilePage({ data }: { data: ProposalData }) {
  const live = hasFieldBill(data);
  const months = data.bill.months ?? [];
  const maxUnits = Math.max(...months.map((m) => m.units), 1);

  return (
    <DrawingSheet
      dwgNo="FE-05"
      sheetLabel="ENERGY LOAD PROFILE"
      drawnBy={fieldDrawnBy(data)}
      date={fieldSheetDate(data.meta.generatedAt)}
    >
      <span className={styles.eyebrow}>Bill record</span>
      <h2 className={styles.h2}>How the home uses electricity today.</h2>
      <p className={styles.lede}>
        Plotted from the uploaded DISCOM bill. If no bill is on file, this
        sheet stays empty rather than guessing a load.
      </p>

      {!live ? (
        <div className={styles.callout}>
          No bill on this proposal — load profile not plotted.
        </div>
      ) : (
        <>
          <div className={styles.metaGrid}>
            <div className={styles.metaCell}>
              <span>Yearly bill</span>
              <strong>
                {data.bill.yearlyBillInr > 0 ? formatInr(data.bill.yearlyBillInr) : "—"}
              </strong>
            </div>
            <div className={styles.metaCell}>
              <span>Recorded units</span>
              <strong>
                {data.bill.totals?.units
                  ? `${Math.round(data.bill.totals.units).toLocaleString("en-IN")} u`
                  : "—"}
              </strong>
            </div>
          </div>
          <div className={styles.chart}>
            {months.slice(0, 12).map((m, i) => {
              const h = m.units > 0 ? Math.max(6, Math.round((m.units / maxUnits) * 100)) : 8;
              return (
                <div className={styles.barCol} key={`${m.label}-${i}`}>
                  <span className={styles.barVal}>{m.units > 0 ? Math.round(m.units) : "—"}</span>
                  <div
                    className={`${styles.barFill} ${m.isSummerPeak ? styles.barFillPeak : ""}`}
                    style={{ height: `${h}%` }}
                  />
                  <span className={styles.barLbl}>{(m.label || "").slice(0, 3) || "—"}</span>
                </div>
              );
            })}
          </div>
          <p className={styles.note}>
            Orange marks summer-peak months from the bill audit. Solar covers
            daytime load first.
          </p>
        </>
      )}
    </DrawingSheet>
  );
}

export default LoadProfilePage;
