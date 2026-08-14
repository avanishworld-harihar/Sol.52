"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { DrawingSheet } from "./DrawingSheet";
import styles from "./Field.module.css";
import { fieldDrawnBy, fieldSheetDate, formatFieldKw, resolveFieldPanelSpec } from "./field-live";

export function CoverPage({ data }: { data: ProposalData }) {
  const systemKw = Number(data.meta.systemKw) || 0;
  const { modules, watt, dcKwp } = resolveFieldPanelSpec(data);
  const customer = data.meta.customerName?.trim() || "—";
  const site = data.meta.locationLine?.trim() || "—";
  const ac = formatFieldKw(systemKw, 1);
  const dc = dcKwp > 0 ? formatFieldKw(dcKwp) : "—";

  return (
    <DrawingSheet
      dwgNo="FE-01"
      sheetLabel="SYSTEM SPECIFICATION SHEET"
      drawnBy={fieldDrawnBy(data)}
      date={fieldSheetDate(data.meta.generatedAt)}
    >
      <span className={styles.eyebrow}>Project record</span>
      <h1 className={styles.h1}>Rooftop solar plant specification.</h1>
      <p className={styles.lede}>
        This set is a numbered engineering drawing package — not a brochure.
        Figures on later sheets are taken from this proposal record.
      </p>
      <span className={styles.tag}>ISSUED FOR CLIENT REVIEW</span>

      <div className={styles.metaGrid}>
        <div className={styles.metaCell}>
          <span>Client</span>
          <strong>{customer}</strong>
        </div>
        <div className={styles.metaCell}>
          <span>Site</span>
          <strong>{site}</strong>
        </div>
        <div className={styles.metaCell}>
          <span>Plant (AC)</span>
          <strong>{systemKw > 0 ? `${ac} kW` : "—"}</strong>
        </div>
        <div className={styles.metaCell}>
          <span>Array (DC)</span>
          <strong>{dcKwp > 0 ? `${dc} kWp` : "—"}</strong>
        </div>
      </div>

      <div className={styles.callout}>
        Topology: on-grid, net-metered. Home load is served first; surplus
        exports to the DISCOM grid.
      </div>

      <div className={styles.specRow}>
        <div className={styles.specCard}>
          <span>Modules</span>
          <strong>{modules > 0 ? modules : "—"}</strong>
        </div>
        <div className={styles.specCard}>
          <span>Module Wp</span>
          <strong>{watt > 0 ? watt : "—"}</strong>
        </div>
        <div className={styles.specCard}>
          <span>DC / AC</span>
          <strong>
            {systemKw > 0 && dcKwp > 0 ? `${(dcKwp / systemKw).toFixed(2)}x` : "—"}
          </strong>
        </div>
        <div className={styles.specCard}>
          <span>Sheets</span>
          <strong>FE-01…09</strong>
        </div>
      </div>
    </DrawingSheet>
  );
}

export default CoverPage;
