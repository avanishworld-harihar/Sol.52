"use client";

/**
 * Voltaic sheet shell.
 *
 * Every page is framed like a drawing sheet: a border, edge coordinates, a
 * sheet code, and a title block along the bottom carrying client, project,
 * revision, date and scale. That frame is what makes the document read as an
 * engineering submittal rather than a brochure.
 */

import type { ReactNode } from "react";
import styles from "./voltaic.module.css";

const EDGE_COLS = ["A", "B", "C", "D", "E", "F"];
const EDGE_ROWS = ["1", "2", "3", "4"];

export type VoltaicSheetProps = {
  code: string;
  kicker: string;
  index: string;
  total: string;
  client: string;
  project: string;
  date: string;
  scale: string;
  drawn: string;
  labels: {
    client: string;
    project: string;
    sheetNo: string;
    rev: string;
    date: string;
    scale: string;
    drawn: string;
    status: string;
  };
  tone?: "vellum" | "cyan";
  children: ReactNode;
};

export function VoltaicSheet({
  code,
  kicker,
  index,
  total,
  client,
  project,
  date,
  scale,
  drawn,
  labels,
  tone = "vellum",
  children,
}: VoltaicSheetProps) {
  return (
    <section
      className={`${styles.sheet} ${tone === "cyan" ? styles.sheetCyan : styles.sheetVellum}`}
    >
      <div className={styles.sheetFrame} aria-hidden>
        <div className={styles.edgeTop}>
          {EDGE_COLS.map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
        <div className={styles.edgeLeft}>
          {EDGE_ROWS.map((r) => (
            <span key={r}>{r}</span>
          ))}
        </div>
        <div className={styles.edgeRight}>
          {EDGE_ROWS.map((r) => (
            <span key={r}>{r}</span>
          ))}
        </div>
      </div>

      <header className={styles.sheetHead}>
        <span className={styles.sheetKicker}>{kicker}</span>
        <span className={styles.sheetCode}>{code}</span>
      </header>

      <div className={styles.sheetBody}>{children}</div>

      <footer className={styles.titleBlock}>
        <div className={styles.tbCell}>
          <span className={styles.tbLabel}>{labels.client}</span>
          <span className={styles.tbValue}>{client}</span>
        </div>
        <div className={styles.tbCell}>
          <span className={styles.tbLabel}>{labels.project}</span>
          <span className={styles.tbValue}>{project}</span>
        </div>
        <div className={styles.tbCell}>
          <span className={styles.tbLabel}>{labels.drawn}</span>
          <span className={styles.tbValue}>{drawn}</span>
        </div>
        <div className={styles.tbCell}>
          <span className={styles.tbLabel}>{labels.date}</span>
          <span className={styles.tbValue}>{date}</span>
        </div>
        <div className={styles.tbCell}>
          <span className={styles.tbLabel}>{labels.scale}</span>
          <span className={styles.tbValue}>{scale}</span>
        </div>
        <div className={`${styles.tbCell} ${styles.tbCellSheet}`}>
          <span className={styles.tbLabel}>{labels.sheetNo}</span>
          <span className={styles.tbValueStrong}>
            {index} / {total}
          </span>
        </div>
        <div className={`${styles.tbCell} ${styles.tbCellStatus}`}>
          <span className={styles.tbLabel}>{labels.rev}</span>
          <span className={styles.tbValueStrong}>A</span>
        </div>
      </footer>
    </section>
  );
}

/** Section heading used inside a sheet body. */
export function VoltaicHead({
  title,
  lead,
  note,
}: {
  title: string;
  lead?: string;
  note?: string;
}) {
  return (
    <div className={styles.pageHead}>
      <h2 className={styles.pageTitle}>{title}</h2>
      {lead ? <p className={styles.pageLead}>{lead}</p> : null}
      {note ? <p className={styles.pageNote}>{note}</p> : null}
    </div>
  );
}

/** Small caption above a drawing or table. */
export function VoltaicCaption({ label, right }: { label: string; right?: string }) {
  return (
    <div className={styles.caption}>
      <span className={styles.captionLabel}>{label}</span>
      {right ? <span className={styles.captionRight}>{right}</span> : null}
    </div>
  );
}
