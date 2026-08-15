"use client";

import type { ProposalData } from "@/lib/proposal-data";
import styles from "./Lumina.module.css";
import { luminaHardwareRows } from "./lumina-live";

export function LuminaHardware({ data }: { data: ProposalData }) {
  const rows = luminaHardwareRows(data);

  return (
    <section className={styles.a4Lumina}>
      <div className={styles.contentArea}>
        <div className={styles.dateTag}>System architecture</div>
        <h1 className={styles.clientTitle}>Hardware Specs.</h1>
        <p className={styles.subText}>
          Components below are the live bill of materials on this proposal — nothing is
          invented for the card layout.
        </p>

        {rows.length > 0 ? (
          <div className={styles.hardwareGrid}>
            {rows.map((row, i) => (
              <div
                key={`${row.title}-${i}`}
                className={`${styles.hwCard} ${row.accent ? styles.hwCardAccent : ""}`}
              >
                <div className={styles.hwNumber}>{String(i + 1).padStart(2, "0")}</div>
                <div className={styles.hwDetails}>
                  <h4>{row.title}</h4>
                  <p>{row.detail}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.hwCard}>
            <div className={styles.hwNumber}>—</div>
            <div className={styles.hwDetails}>
              <h4>BOM not on file</h4>
              <p>Hardware cards appear here when panel, inverter, and structure lines exist on this proposal.</p>
            </div>
          </div>
        )}
      </div>
      <div className={styles.pageFooter}>Lumina · 03 / 07</div>
    </section>
  );
}

export default LuminaHardware;
