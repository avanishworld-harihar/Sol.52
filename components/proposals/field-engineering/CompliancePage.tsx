"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { DrawingSheet } from "./DrawingSheet";
import styles from "./Field.module.css";
import { fieldDrawnBy, fieldSheetDate } from "./field-live";

export function CompliancePage({ data }: { data: ProposalData }) {
  const standards = (data.engineering.standards ?? []).filter((s) => s.trim());
  const warranty = (data.warranty.rows ?? []).filter((r) => r.item?.trim());
  const highlights = (data.warranty.highlights ?? []).filter((h) => h.label?.trim());

  return (
    <DrawingSheet
      dwgNo="FE-07"
      sheetLabel="COMPLIANCE & CERTIFICATION"
      drawnBy={fieldDrawnBy(data)}
      date={fieldSheetDate(data.meta.generatedAt)}
    >
      <span className={styles.eyebrow}>Inspection vernacular</span>
      <h2 className={styles.h2}>Standards, warranty, and the verified stamp.</h2>
      <p className={styles.lede}>
        This sheet lists what is on the proposal record for DISCOM / MNRE
        inspection talk — not marketing claims.
      </p>

      <span className={`${styles.tag} ${styles.tagOk}`}>VERIFIED AGAINST RECORD</span>

      <h2 className={styles.h2} style={{ marginTop: 14 }}>
        Referenced standards
      </h2>
      {standards.length === 0 ? (
        <p className={styles.note}>No standards listed on this proposal.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Standard / note</th>
            </tr>
          </thead>
          <tbody>
            {standards.slice(0, 8).map((s, i) => (
              <tr key={`${s}-${i}`}>
                <td className={styles.ref}>{String(i + 1).padStart(2, "0")}</td>
                <td>{s}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 className={styles.h2} style={{ marginTop: 14 }}>
        Warranty highlights
      </h2>
      {warranty.length === 0 && highlights.length === 0 ? (
        <p className={styles.note}>No warranty rows on this proposal.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Item</th>
              <th>Duration</th>
              <th>By</th>
            </tr>
          </thead>
          <tbody>
            {warranty.slice(0, 6).map((row) => (
              <tr key={row.item}>
                <td>{row.item}</td>
                <td>{row.duration || "—"}</td>
                <td>{row.by || "—"}</td>
              </tr>
            ))}
            {warranty.length === 0
              ? highlights.slice(0, 4).map((h) => (
                  <tr key={h.label}>
                    <td>{h.label}</td>
                    <td>
                      {h.value || "—"} {h.unit || ""}
                    </td>
                    <td>—</td>
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      )}

      <div className={styles.stamp} aria-hidden>
        FIELD
        <br />
        CHECK
      </div>
    </DrawingSheet>
  );
}

export default CompliancePage;
