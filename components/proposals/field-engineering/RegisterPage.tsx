"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { DrawingSheet } from "./DrawingSheet";
import { GeneralNotes } from "./GeneralNotes";
import styles from "./Field.module.css";
import {
  FIELD_REGISTER,
  fieldDrawingSheetProps,
  fieldDocNo,
  fieldRevision,
} from "./field-live";

export function RegisterPage({
  data,
  proposalId,
}: {
  data: ProposalData;
  proposalId?: string;
}) {
  const docId = fieldDocNo(proposalId, data.meta.generatedAt);
  const rev = fieldRevision();

  return (
    <DrawingSheet
      {...fieldDrawingSheetProps({
        data,
        proposalId,
        dwgNo: "FE-00",
        sheetLabel: "DRAWING REGISTER / INDEX",
        page: 1,
      })}
    >
      <div className={styles.eyebrow}>Sheet Index</div>
      <h1 className={styles.h1} style={{ fontSize: "24px" }}>
        Field Engineering
        <br />
        Drawing Set
      </h1>
      <p className={styles.bodyText} style={{ maxWidth: "92%" }}>
        Register of sheets issued for this rooftop plant. Cross-reference DWG numbers
        on every page title block. Document ID{" "}
        <span className={styles.mono}>{docId}</span> · {rev}.
      </p>

      <table className={styles.table} style={{ marginTop: "8mm" }}>
        <thead>
          <tr>
            <th>Dwg</th>
            <th>Sheet title</th>
            <th>Sheet</th>
          </tr>
        </thead>
        <tbody>
          {FIELD_REGISTER.map((row) => (
            <tr key={row.dwgNo}>
              <td className={styles.mono}>{row.dwgNo}</td>
              <td>{row.title}</td>
              <td className={styles.mono}>{String(row.page).padStart(2, "0")}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <GeneralNotes
        extra={[
          "This register is sheet FE-00. Cover specification begins FE-01.",
          "Re-issue under a new revision only when BOM, capacity, or price changes.",
        ]}
      />
    </DrawingSheet>
  );
}

export default RegisterPage;
