"use client";

import type { ProposalData } from "@/lib/proposal-data";
import styles from "./Lumina.module.css";
import { LuminaDocFooter } from "./lumina-brand";
import type { LuminaHwKind } from "./lumina-live";
import { luminaHardwareRows } from "./lumina-live";
import { useLuminaLang } from "./lumina-lang-context";

function EarthIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1C1814" strokeWidth="1.8" aria-hidden>
      <circle cx="12" cy="9" r="5" />
      <path d="M12 14v6M8 20h8M10 17h4" strokeLinecap="round" />
    </svg>
  );
}

function DcdbIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1C1814" strokeWidth="1.7" aria-hidden>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" strokeLinecap="round" />
    </svg>
  );
}

function AcdbIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1C1814" strokeWidth="1.7" aria-hidden>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M12 7v4M10 11h4" strokeLinecap="round" />
      <path d="M8 16h8" strokeLinecap="round" />
    </svg>
  );
}

function LaIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1C1814" strokeWidth="1.8" aria-hidden>
      <path d="M13 2 4 14h8l-1 8 9-12h-8l1-8Z" strokeLinejoin="round" />
    </svg>
  );
}

function HardwareThumb({ kind, image }: { kind: LuminaHwKind; image: string }) {
  if (kind === "earth") return <EarthIcon />;
  if (kind === "dcdb") return <DcdbIcon />;
  if (kind === "acdb") return <AcdbIcon />;
  if (kind === "la") return <LaIcon />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={image} alt="" />;
}

function cardKindClass(kind: LuminaHwKind): string {
  if (kind === "dcdb") return styles.hwCardDcdb;
  if (kind === "acdb") return styles.hwCardAcdb;
  if (kind === "earth") return styles.hwCardEarth;
  if (kind === "la") return styles.hwCardLa;
  return "";
}

function HwSpecLine({ text }: { text: string }) {
  const parts = text.split(/\s*·\s*/).map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return null;
  return (
    <p className={styles.hwSpecLine}>
      {parts.map((part, i) => (
        <span key={`${i}-${part}`} className={styles.hwSpecPart}>
          {i > 0 ? <span className={styles.hwSpecDot} aria-hidden /> : null}
          {part}
        </span>
      ))}
    </p>
  );
}

export function LuminaHardware({ data }: { data: ProposalData }) {
  const { copy } = useLuminaLang();
  const rows = luminaHardwareRows(data);

  return (
    <section className={`${styles.a4Lumina} ${styles.innerSheet} ${styles.hardwarePage}`}>
      <div className={`${styles.contentArea} ${styles.hardwareSheet}`}>
        <div className={styles.dateTag}>{copy.hardware.tag}</div>
        <h1 className={styles.clientTitle}>{copy.hardware.title}</h1>
        <p className={styles.subText}>{copy.hardware.lead}</p>

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
                <HwSpecLine text={row.detail} />
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
      <LuminaDocFooter data={data} page="03 / 09" />
    </section>
  );
}

export default LuminaHardware;
