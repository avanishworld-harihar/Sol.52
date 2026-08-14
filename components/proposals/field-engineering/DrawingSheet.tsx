"use client";

/**
 * DrawingSheet — sheet shell + title block (signature element).
 * v2: no logic change; readability comes from Field.module.css tokens.
 */
import type { ReactNode } from "react";
import styles from "./Field.module.css";

export type DrawingSheetProps = {
  dwgNo: string;
  sheetLabel: string;
  pageOf: string;
  familyName?: string;
  scale?: string;
  date: string;
  preparedBy: string;
  revision?: string;
  docId?: string;
  verified?: boolean;
  children: ReactNode;
};

export function DrawingSheet({
  dwgNo,
  sheetLabel,
  pageOf,
  familyName,
  scale = "NTS",
  date,
  preparedBy,
  revision,
  docId,
  verified = false,
  children,
}: DrawingSheetProps) {
  const metaLine = [
    "SOL.52 · FIELD ENGINEERING SET",
    docId,
    revision,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <section className={styles.sheet}>
      <div className={styles.microbar}>
        <span>{metaLine}</span>
        <strong>
          {familyName || "RESIDENCE"} — DWG {dwgNo}
        </strong>
      </div>
      <div className={styles.body}>{children}</div>
      <footer className={styles.titleBlock}>
        <div>
          <span className={styles.tbLabel}>Sheet Title</span>
          <span className={styles.tbValue}>{sheetLabel}</span>
        </div>
        <div>
          <span className={styles.tbLabel}>Dwg No.</span>
          <span className={styles.tbValue}>{dwgNo}</span>
        </div>
        <div>
          <span className={styles.tbLabel}>Sheet</span>
          <span className={styles.tbValue}>{pageOf}</span>
        </div>
        <div>
          <span className={styles.tbLabel}>Scale</span>
          <span className={styles.tbValue}>{scale}</span>
        </div>
        <div>
          <span className={styles.tbLabel}>Date</span>
          <span className={styles.tbValue}>{date}</span>
        </div>
        <div>
          {verified ? (
            <span className={styles.tbStamp}>VERIFIED</span>
          ) : (
            <>
              <span className={styles.tbLabel}>Prepared By</span>
              <span className={styles.tbValue}>{preparedBy || "—"}</span>
            </>
          )}
        </div>
      </footer>
    </section>
  );
}

export default DrawingSheet;
