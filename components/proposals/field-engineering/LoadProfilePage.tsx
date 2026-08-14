"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { DrawingSheet } from "./DrawingSheet";
import styles from "./Field.module.css";
import { fieldSheetMeta, hasFieldBill } from "./field-live";

export function LoadProfilePage({ data }: { data: ProposalData }) {
  const sheet = fieldSheetMeta(data);
  const live = hasFieldBill(data);
  const months = (data.bill.months ?? []).slice(0, 12);

  return (
    <DrawingSheet
      dwgNo="FE-02"
      sheetLabel="FAMILY ENERGY LOAD PROFILE"
      pageOf="02 / 09"
      familyName={sheet.familyName}
      scale="—"
      date={sheet.date}
      preparedBy={sheet.preparedBy}
    >
      <div className={styles.eyebrow}>Load Ledger</div>
      <h2 className={styles.h2}>
        Monthly unit consumption <span className={styles.tag}>from the DISCOM bill on file</span>
      </h2>
      <p className={styles.bodyText}>
        This sheet is a load ledger, not an estimate. If no bill was uploaded,
        rows stay blank.
      </p>

      {!live ? (
        <p className={styles.note} style={{ marginTop: "8mm" }}>
          No bill on this proposal — load profile not plotted.
        </p>
      ) : (
        <table className={styles.table} style={{ marginTop: "8mm" }}>
          <thead>
            <tr>
              <th>Month</th>
              <th>Units</th>
              <th>Energy (₹)</th>
              <th>Net bill (₹)</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {months.map((m, i) => (
              <tr key={`${m.label}-${i}`}>
                <td>{m.label || "—"}</td>
                <td className={styles.mono}>{m.units > 0 ? Math.round(m.units) : "—"}</td>
                <td className={styles.mono}>
                  {m.energyInr > 0 ? Math.round(m.energyInr).toLocaleString("en-IN") : "—"}
                </td>
                <td className={styles.mono}>
                  {m.netInr > 0 ? Math.round(m.netInr).toLocaleString("en-IN") : "—"}
                </td>
                <td className={styles.note}>{m.isSummerPeak ? "Summer peak" : "—"}</td>
              </tr>
            ))}
            <tr className={styles.totalRow}>
              <td>Yearly / totals</td>
              <td className={styles.mono}>
                {data.bill.totals?.units
                  ? Math.round(data.bill.totals.units).toLocaleString("en-IN")
                  : "—"}
              </td>
              <td className={styles.mono}>
                {data.bill.totals?.energyInr
                  ? Math.round(data.bill.totals.energyInr).toLocaleString("en-IN")
                  : "—"}
              </td>
              <td className={`${styles.mono} ${styles.signal}`}>
                {data.bill.yearlyBillInr > 0
                  ? Math.round(data.bill.yearlyBillInr).toLocaleString("en-IN")
                  : "—"}
              </td>
              <td className={styles.note}>{data.bill.fixedChargesDisplay || "—"}</td>
            </tr>
          </tbody>
        </table>
      )}
    </DrawingSheet>
  );
}

export default LoadProfilePage;
