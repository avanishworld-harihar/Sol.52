"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { formatInr } from "@/components/proposals/_shared/formatters";
import { DrawingSheet } from "./DrawingSheet";
import styles from "./Field.module.css";
import {
  fieldAnnualUnits,
  fieldSheetMeta,
  formatFieldKw,
  resolveFieldPanelSpec,
} from "./field-live";

export function AcceptancePage({ data }: { data: ProposalData }) {
  const sheet = fieldSheetMeta(data);
  const systemKw = Number(data.meta.systemKw) || 0;
  const { modules, watt, dcKwp } = resolveFieldPanelSpec(data);
  const annual = fieldAnnualUnits(data);
  const gross = data.economics.grossInr;
  const contact = data.closing.contactPerson?.trim() || "";

  return (
    <DrawingSheet
      dwgNo="FE-09"
      sheetLabel="ACCEPTANCE / SIGN-OFF"
      pageOf="09 / 09"
      familyName={sheet.familyName}
      scale="—"
      date={sheet.date}
      preparedBy={sheet.preparedBy}
    >
      <div className={styles.eyebrow}>Sign-off</div>
      <h2 className={styles.h2}>
        Spec recap <span className={styles.tag}>FE-01 through FE-08</span>
      </h2>
      <p className={styles.bodyText}>
        By signing, the client accepts this drawing set as the specification
        for the rooftop plant, including capacity, hardware, and payment on gross.
      </p>

      <table className={styles.table} style={{ marginTop: "6mm" }}>
        <thead>
          <tr>
            <th>Item</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Client</td>
            <td className={styles.mono}>{sheet.familyName}</td>
          </tr>
          <tr>
            <td>Plant (AC)</td>
            <td className={styles.mono}>{systemKw > 0 ? `${formatFieldKw(systemKw, 1)} kW` : "—"}</td>
          </tr>
          <tr>
            <td>Array</td>
            <td className={styles.mono}>
              {modules > 0 && watt > 0
                ? `${modules} × ${watt}W`
                : dcKwp > 0
                  ? `${formatFieldKw(dcKwp)} kWp`
                  : "—"}
            </td>
          </tr>
          <tr>
            <td>Year-1 yield</td>
            <td className={styles.mono}>
              {annual > 0 ? `${annual.toLocaleString("en-IN")} kWh` : "—"}
            </td>
          </tr>
          <tr>
            <td>System cost (gross)</td>
            <td className={`${styles.mono} ${styles.signal}`}>
              {gross > 0 ? formatInr(gross) : "—"}
            </td>
          </tr>
        </tbody>
      </table>

      <div className={styles.signGrid}>
        <div className={styles.signBox}>
          <span className={styles.tbLabel}>Customer signature / date</span>
          <span className={styles.tbValue}>{sheet.familyName}</span>
        </div>
        <div className={styles.signBox}>
          <span className={styles.tbLabel}>SOL.52 engineer / installer</span>
          <span className={styles.tbValue}>
            {sheet.preparedBy}
            {contact ? ` · ${contact}` : ""}
          </span>
        </div>
      </div>
    </DrawingSheet>
  );
}

export default AcceptancePage;
