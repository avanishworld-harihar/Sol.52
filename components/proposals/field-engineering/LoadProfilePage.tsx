"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { DrawingSheet } from "./DrawingSheet";
import { GeneralNotes } from "./GeneralNotes";
import styles from "./Field.module.css";
import { buildFieldForecastMonths } from "./field-forecast";
import {
  fieldAnnualUnits,
  fieldDrawingSheetProps,
  fieldLoadCoverage,
  hasFieldBill,
} from "./field-live";

export function LoadProfilePage({
  data,
  proposalId,
}: {
  data: ProposalData;
  proposalId?: string;
}) {
  const live = hasFieldBill(data);
  const months = (data.bill.months ?? []).slice(0, 12);
  const annual = fieldAnnualUnits(data);
  const forecast = buildFieldForecastMonths(annual);
  const recon = fieldLoadCoverage(data);
  const showRecon = recon.billUnits > 0 || recon.genUnits > 0;

  return (
    <DrawingSheet
      {...fieldDrawingSheetProps({
        data,
        proposalId,
        dwgNo: "FE-02",
        sheetLabel: "FAMILY ENERGY LOAD PROFILE",
        page: 3,
      })}
    >
      <div className={styles.eyebrow}>Load Ledger</div>
      <h2 className={styles.h2}>
        Monthly unit consumption <span className={styles.tag}>DISCOM bill on file</span>
      </h2>
      <p className={styles.bodyText}>
        Load ledger — not an estimate. When year-1 generation is on the proposal,
        the reconciliation strip compares bill load to simulated yield.
      </p>

      {showRecon ? (
        <div className={styles.reconStrip}>
          <div className={styles.specCell}>
            <div className={styles.specLabel}>Annual load (bill)</div>
            <div className={styles.callout} style={{ fontSize: "16px" }}>
              {recon.billUnits > 0 ? recon.billUnits.toLocaleString("en-IN") : "—"}{" "}
              {recon.billUnits > 0 ? <span className={styles.unit}>units</span> : null}
            </div>
          </div>
          <div className={styles.specCell}>
            <div className={styles.specLabel}>Year-1 generation (sim.)</div>
            <div className={styles.callout} style={{ fontSize: "16px" }}>
              {recon.genUnits > 0 ? recon.genUnits.toLocaleString("en-IN") : "—"}{" "}
              {recon.genUnits > 0 ? <span className={styles.unit}>kWh</span> : null}
            </div>
          </div>
          <div className={styles.specCell}>
            <div className={styles.specLabel}>Load coverage</div>
            <div className={styles.callout} style={{ fontSize: "16px" }}>
              {recon.coveragePct != null ? (
                <>
                  {recon.coveragePct}
                  <span className={styles.unit}>%</span>
                </>
              ) : (
                "—"
              )}
            </div>
          </div>
        </div>
      ) : null}

      {!live ? (
        <p className={styles.note} style={{ marginTop: "8mm" }}>
          No bill on this proposal — load profile not plotted.
        </p>
      ) : (
        <table className={styles.table} style={{ marginTop: "6mm" }}>
          <thead>
            <tr>
              <th>Month</th>
              <th>Load (units)</th>
              {annual > 0 ? <th>Sim. gen (kWh)</th> : null}
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
                {annual > 0 ? (
                  <td className={styles.mono}>{forecast[i]?.val ?? "—"}</td>
                ) : null}
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
                {recon.billUnits > 0 ? recon.billUnits.toLocaleString("en-IN") : "—"}
              </td>
              {annual > 0 ? (
                <td className={styles.mono}>{annual.toLocaleString("en-IN")}</td>
              ) : null}
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
              <td className={styles.note}>
                {recon.surplusUnits
                  ? `+${recon.surplusUnits.toLocaleString("en-IN")} kWh surplus`
                  : data.bill.fixedChargesDisplay || "—"}
              </td>
            </tr>
          </tbody>
        </table>
      )}

      <GeneralNotes
        extra={[
          "Simulated monthly kWh uses the same seasonal share as FE-05.",
          "Coverage % = min(100, year-1 generation ÷ annual bill units).",
        ]}
      />
    </DrawingSheet>
  );
}

export default LoadProfilePage;
