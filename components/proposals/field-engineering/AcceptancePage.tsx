"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { DrawingSheet } from "./DrawingSheet";
import styles from "./Field.module.css";
import { fieldDrawnBy, fieldSheetDate } from "./field-live";

export function AcceptancePage({ data }: { data: ProposalData }) {
  const customer = data.meta.customerName?.trim() || data.closing.customerName?.trim() || "—";
  const installer = fieldDrawnBy(data);
  const contact = data.closing.contactPerson?.trim() || "";

  return (
    <DrawingSheet
      dwgNo="FE-09"
      sheetLabel="ACCEPTANCE"
      drawnBy={installer}
      date={fieldSheetDate(data.meta.generatedAt)}
    >
      <span className={styles.eyebrow}>Sign-off</span>
      <h2 className={styles.h2}>Client acceptance of this drawing set.</h2>
      <p className={styles.lede}>
        By signing, the client confirms that sheets FE-01 through FE-08 describe
        the plant they want installed, including capacity, hardware, and the
        payment schedule on gross.
      </p>

      <div className={styles.callout}>
        Prepared for {customer}. Installer of record: {installer}.
        {contact ? ` Site contact: ${contact}.` : ""}
      </div>

      <div className={styles.signGrid}>
        <div className={styles.signBox}>
          <span>Client signature / date</span>
          <div className={styles.signLine}>{customer}</div>
        </div>
        <div className={styles.signBox}>
          <span>Engineer / installer</span>
          <div className={styles.signLine}>{installer}</div>
        </div>
      </div>

      <p className={styles.note}>
        This is an acceptance of the specification in this set. It is not a
        tax invoice. Hardware makes and wattage follow the live BOM — blanks
        stay as —.
      </p>
    </DrawingSheet>
  );
}

export default AcceptancePage;
