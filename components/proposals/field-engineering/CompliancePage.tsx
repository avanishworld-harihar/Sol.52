"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { DrawingSheet } from "./DrawingSheet";
import { GeneralNotes } from "./GeneralNotes";
import styles from "./Field.module.css";
import { fieldDrawingSheetProps } from "./field-live";

const DISCOM_STEPS = [
  "Site survey recorded",
  "Net-meter application to DISCOM",
  "CEIG / safety as applicable",
  "Meter installation & commissioning",
];

export function CompliancePage({
  data,
  proposalId,
}: {
  data: ProposalData;
  proposalId?: string;
}) {
  const standards = (data.engineering.standards ?? []).filter((s) => s.trim());
  const warranty = (data.warranty.rows ?? []).filter((r) => r.item?.trim());
  const highlights = (data.warranty.highlights ?? []).filter((h) => h.label?.trim());

  return (
    <DrawingSheet
      {...fieldDrawingSheetProps({
        data,
        proposalId,
        dwgNo: "FE-07",
        sheetLabel: "COMPLIANCE & CERTIFICATION",
        page: 8,
        verified: true,
      })}
    >
      <div className={styles.eyebrow}>Certification Sheet</div>
      <h2 className={styles.h2}>
        Standards & warranty <span className={styles.tag}>against the proposal record</span>
      </h2>

      <table className={styles.table}>
        <thead>
          <tr>
            <th />
            <th>Item</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={styles.verifiedMark}>●</td>
            <td>IS / IEC standards on file</td>
            <td className={styles.mono}>
              {standards.length > 0 ? `${standards.length} listed` : "—"}
            </td>
          </tr>
          <tr>
            <td className={styles.verifiedMark}>●</td>
            <td>ALMM / make as per selected modules</td>
            <td className={styles.note}>Follows live BOM — not a certificate number</td>
          </tr>
          <tr>
            <td className={styles.verifiedMark}>●</td>
            <td>Warranty rows</td>
            <td className={styles.mono}>
              {warranty.length > 0 || highlights.length > 0 ? "On record" : "—"}
            </td>
          </tr>
        </tbody>
      </table>

      {standards.length > 0 ? (
        <table className={styles.table} style={{ marginTop: "6mm" }}>
          <thead>
            <tr>
              <th>#</th>
              <th>Standard / note</th>
            </tr>
          </thead>
          <tbody>
            {standards.slice(0, 5).map((s, i) => (
              <tr key={`${s}-${i}`}>
                <td className={styles.mono}>{String(i + 1).padStart(2, "0")}</td>
                <td>{s}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      {warranty.length > 0 || highlights.length > 0 ? (
        <table className={styles.table} style={{ marginTop: "6mm" }}>
          <thead>
            <tr>
              <th>Warranty</th>
              <th>Duration</th>
              <th>By</th>
            </tr>
          </thead>
          <tbody>
            {warranty.slice(0, 4).map((row) => (
              <tr key={row.item}>
                <td>{row.item}</td>
                <td className={styles.mono}>{row.duration || "—"}</td>
                <td className={styles.note}>{row.by || "—"}</td>
              </tr>
            ))}
            {warranty.length === 0
              ? highlights.slice(0, 3).map((h) => (
                  <tr key={h.label}>
                    <td>{h.label}</td>
                    <td className={styles.mono}>
                      {h.value || "—"} {h.unit || ""}
                    </td>
                    <td>—</td>
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      ) : null}

      <h2 className={styles.h2} style={{ marginTop: "6mm" }}>
        DISCOM net-metering steps <span className={styles.tag}>sequence</span>
      </h2>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Step</th>
            <th>Activity</th>
          </tr>
        </thead>
        <tbody>
          {DISCOM_STEPS.map((s, i) => (
            <tr key={s}>
              <td className={styles.mono}>{String(i + 1).padStart(2, "0")}</td>
              <td>{s}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <GeneralNotes extra={["VERIFIED stamp on this sheet indicates compliance review against the live BOM."]} />
    </DrawingSheet>
  );
}

export default CompliancePage;
