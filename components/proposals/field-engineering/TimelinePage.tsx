"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { formatInr } from "@/components/proposals/_shared/formatters";
import { DrawingSheet } from "./DrawingSheet";
import styles from "./Field.module.css";
import { fieldDrawnBy, fieldSheetDate } from "./field-live";

export function TimelinePage({ data }: { data: ProposalData }) {
  const steps = (data.execution.steps ?? []).filter((s) => s.title?.trim());
  const pays = (data.execution.payments ?? []).filter((p) => p.label?.trim());

  return (
    <DrawingSheet
      dwgNo="FE-08"
      sheetLabel="INSTALLATION TIMELINE"
      drawnBy={fieldDrawnBy(data)}
      date={fieldSheetDate(data.meta.generatedAt)}
    >
      <span className={styles.eyebrow}>Works sequence</span>
      <h2 className={styles.h2}>From kickoff to net meter.</h2>
      <p className={styles.lede}>
        Sequence is the execution plan on this proposal. Payment amounts are
        on gross — subsidy is credited later.
      </p>

      {steps.length === 0 ? (
        <div className={styles.callout}>No installation steps on file.</div>
      ) : (
        <div className={styles.steps}>
          {steps.slice(0, 6).map((step, i) => (
            <div className={styles.step} key={`${step.num}-${step.title}`}>
              <span className={styles.stepNum}>
                {step.num || String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.description || "—"}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {pays.length > 0 ? (
        <>
          <h2 className={styles.h2} style={{ marginTop: 12 }}>
            Payment stages (gross)
          </h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Stage</th>
                <th>%</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {pays.map((row) => (
                <tr key={row.label} className={row.isTotal ? styles.emphRow : undefined}>
                  <td>{row.label}</td>
                  <td>{row.pctLabel || "—"}</td>
                  <td>{row.amountInr > 0 ? formatInr(row.amountInr) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : null}
    </DrawingSheet>
  );
}

export default TimelinePage;
