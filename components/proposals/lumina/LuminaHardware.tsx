"use client";

import type { ProposalData } from "@/lib/proposal-data";
import styles from "./Lumina.module.css";
import { luminaHardwareRows } from "./lumina-live";

function EarthIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="1.8" aria-hidden>
      <circle cx="12" cy="9" r="5" />
      <path d="M12 14v6M8 20h8M10 17h4" strokeLinecap="round" />
    </svg>
  );
}

export function LuminaHardware({ data }: { data: ProposalData }) {
  const rows = luminaHardwareRows(data);

  return (
    <section className={styles.a4Lumina}>
      <div className={styles.contentArea}>
        <div className={styles.dateTag}>System architecture</div>
        <h1 className={styles.clientTitle}>Hardware Specs.</h1>
        <p className={styles.subText}>
          Live BOM with category photos. Earthing is specified as 3 nos × 17 mm copper rod
          (IS 3043) when the quote does not already list it.
        </p>

        <div className={styles.hardwareGrid}>
          {rows.map((row, i) => (
            <div
              key={`${row.role}-${row.title}-${i}`}
              className={`${styles.hwCard} ${row.accent ? styles.hwCardAccent : ""}`}
            >
              <div className={styles.hwThumb}>
                {row.role === "Earthing" ? (
                  <EarthIcon />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={row.image} alt="" />
                )}
              </div>
              <div className={styles.hwNumber}>{String(i + 1).padStart(2, "0")}</div>
              <div className={styles.hwDetails}>
                <div className={styles.hwRole}>{row.role}</div>
                <h4>{row.title}</h4>
                <p>{row.detail}</p>
                {row.chips.length > 0 ? (
                  <div className={styles.hwChips}>
                    {row.chips.map((chip) => (
                      <span key={chip} className={styles.hwChip}>
                        {chip}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.pageFooter}>Lumina · 03 / 07</div>
    </section>
  );
}

export default LuminaHardware;
