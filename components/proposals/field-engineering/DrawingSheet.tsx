"use client";

import type { ReactNode } from "react";
import styles from "./Field.module.css";

export type DrawingSheetProps = {
  dwgNo: string;
  sheetLabel: string;
  drawnBy: string;
  date: string;
  scale?: string;
  checked?: string;
  children: ReactNode;
};

export function DrawingSheet({
  dwgNo,
  sheetLabel,
  drawnBy,
  date,
  scale = "NTS",
  checked = "—",
  children,
}: DrawingSheetProps) {
  return (
    <section className={styles.sheet}>
      <div className={styles.frame}>
        <header className={styles.sheetHead}>
          <span className={styles.sheetHeadMark}>FIELD ENGINEERING</span>
          <span>{sheetLabel}</span>
          <span>REV 0 · ISSUED FOR CLIENT</span>
        </header>
        <div className={styles.body}>{children}</div>
        <footer className={styles.titleBlock}>
          <div className={styles.titleCell}>
            <span>Drawn by</span>
            <strong>{drawnBy || "—"}</strong>
          </div>
          <div className={styles.titleCell}>
            <span>Checked</span>
            <strong>{checked}</strong>
          </div>
          <div className={styles.titleCell}>
            <span>Scale</span>
            <strong>{scale}</strong>
          </div>
          <div className={styles.titleCell}>
            <span>Date</span>
            <strong>{date}</strong>
          </div>
          <div className={styles.titleCell}>
            <span>Dwg no</span>
            <strong className={styles.dwgNo}>{dwgNo}</strong>
          </div>
        </footer>
      </div>
    </section>
  );
}

export default DrawingSheet;
