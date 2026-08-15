"use client";

import type { ProposalData } from "@/lib/proposal-data";
import styles from "./Lumina.module.css";
import type { LuminaHwKind } from "./lumina-live";
import { luminaHardwareRows } from "./lumina-live";

function EarthIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="1.8" aria-hidden>
      <circle cx="12" cy="9" r="5" />
      <path d="M12 14v6M8 20h8M10 17h4" strokeLinecap="round" />
    </svg>
  );
}

function DcdbIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="1.7" aria-hidden>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" strokeLinecap="round" />
    </svg>
  );
}

function AcdbIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="1.7" aria-hidden>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M12 7v4M10 11h4" strokeLinecap="round" />
      <path d="M8 16h8" strokeLinecap="round" />
    </svg>
  );
}

function HardwareThumb({ kind, image }: { kind: LuminaHwKind; image: string }) {
  if (kind === "earth") return <EarthIcon />;
  if (kind === "dcdb") return <DcdbIcon />;
  if (kind === "acdb") return <AcdbIcon />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={image} alt="" />;
}

function cardKindClass(kind: LuminaHwKind): string {
  if (kind === "dcdb") return styles.hwCardDcdb;
  if (kind === "acdb") return styles.hwCardAcdb;
  if (kind === "earth") return styles.hwCardEarth;
  return "";
}

export function LuminaHardware({ data }: { data: ProposalData }) {
  const rows = luminaHardwareRows(data);

  return (
    <section className={`${styles.a4Lumina} ${styles.innerSheet}`}>
      <div className={`${styles.contentArea} ${styles.hardwareSheet}`}>
        <div className={styles.dateTag}>System architecture · 6-item BOM</div>
        <h1 className={styles.clientTitle}>Hardware Specs.</h1>
        <p className={styles.subText}>
          DCDB, ACDB and earthing are separate. Earthing: 3 nos × 17 mm copper rod (IS 3043).
        </p>

        <div className={styles.hardwareGrid}>
          {rows.map((row, i) => (
            <div
              key={`${row.kind}-${row.title}-${i}`}
              className={`${styles.hwCard} ${row.accent ? styles.hwCardAccent : ""} ${cardKindClass(row.kind)}`}
            >
              <div className={styles.hwThumb}>
                <HardwareThumb kind={row.kind} image={row.image} />
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
      <div className={styles.pageFooter}>Lumina · 03 / 08</div>
    </section>
  );
}

export default LuminaHardware;
