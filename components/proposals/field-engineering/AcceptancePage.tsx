"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { formatInr } from "@/components/proposals/_shared/formatters";
import { DrawingSheet } from "./DrawingSheet";
import { GeneralNotes } from "./GeneralNotes";
import styles from "./Field.module.css";
import {
  fieldAnnualUnits,
  fieldDrawingSheetProps,
  fieldSheetMeta,
  formatFieldKw,
  resolveFieldPanelSpec,
} from "./field-live";

export function AcceptancePage({
  data,
  proposalId,
}: {
  data: ProposalData;
  proposalId?: string;
}) {
  const sheet = fieldSheetMeta(data);
  const systemKw = Number(data.meta.systemKw) || 0;
  const { modules, watt, dcKwp } = resolveFieldPanelSpec(data);
  const annual = fieldAnnualUnits(data);
  const gross = data.economics.grossInr;
  const contact = data.closing.contactPerson?.trim() || "";
  const payments = (data.execution.payments ?? []).filter((p) => p.label?.trim());

  return (
    <DrawingSheet
      {...fieldDrawingSheetProps({
        data,
        proposalId,
        dwgNo: "FE-09",
        sheetLabel: "ACCEPTANCE / SIGN-OFF",
        page: 10,
      })}
    >
      <div className={styles.eyebrow}>Sign-off</div>
      <h2 className={styles.h2}>
        Spec recap <span className={styles.tag}>FE-00 through FE-08</span>
      </h2>
      <p className={styles.bodyText}>
        By signing, the client accepts this drawing set as the specification for
        the rooftop plant — including capacity, hardware, FE-06 financial ledger
        on gross, and the install sequence on FE-08.
      </p>

      <table className={styles.table} style={{ marginTop: "6mm" }}>
        <thead>
          <tr>
            <th>Item</th>
            <th>Value</th>
            <th>Ref. sheet</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Client</td>
            <td className={styles.mono}>{sheet.familyName}</td>
            <td className={styles.note}>FE-01</td>
          </tr>
          <tr>
            <td>Plant (AC)</td>
            <td className={styles.mono}>
              {systemKw > 0 ? `${formatFieldKw(systemKw, 1)} kW` : "—"}
            </td>
            <td className={styles.note}>FE-01 / FE-04</td>
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
            <td className={styles.note}>FE-03 / FE-04</td>
          </tr>
          <tr>
            <td>Year-1 yield</td>
            <td className={styles.mono}>
              {annual > 0 ? `${annual.toLocaleString("en-IN")} kWh` : "—"}
            </td>
            <td className={styles.note}>FE-05</td>
          </tr>
          <tr>
            <td>System cost (gross)</td>
            <td className={`${styles.mono} ${styles.signal}`}>
              {gross > 0 ? formatInr(gross) : "—"}
            </td>
            <td className={styles.note}>FE-06</td>
          </tr>
          <tr>
            <td>Install sequence</td>
            <td className={styles.mono}>
              {data.execution.steps?.length ? `${data.execution.steps.length} phases` : "Typical sequence"}
            </td>
            <td className={styles.note}>FE-08</td>
          </tr>
        </tbody>
      </table>

      {payments.length > 0 ? (
        <table className={styles.table} style={{ marginTop: "6mm" }}>
          <thead>
            <tr>
              <th>Payment milestone</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.label}>
                <td>
                  {p.label}
                  {p.pctLabel ? ` · ${p.pctLabel}` : ""}
                </td>
                <td className={styles.mono}>
                  {p.amountInr > 0 ? formatInr(p.amountInr) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

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

      <GeneralNotes
        extra={[
          "Signature binds FE-00 register through FE-08 — not marketing copy on other presets.",
          ...(data.closing.qrUrl ? [`Live proposal link: ${data.closing.qrUrl}`] : []),
        ]}
      />
    </DrawingSheet>
  );
}

export default AcceptancePage;
