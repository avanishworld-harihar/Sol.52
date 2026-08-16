"use client";

import type { ProposalData } from "@/lib/proposal-data";
import styles from "./Jaali.module.css";
import { JaaliSheet } from "./jaali-brand";
import { jaaliHardwareRows } from "./jaali-live";
import { useJaaliLang } from "./jaali-lang-context";

export function JaaliHardware({ data }: { data: ProposalData }) {
  const { copy } = useJaaliLang();
  const rows = jaaliHardwareRows(data);

  return (
    <JaaliSheet data={data} page="03 / 09" chapter={copy.spine.parts}>
      <p className={styles.kicker}>{copy.hardware.kicker}</p>
      <h1 className={styles.displayTitle}>{copy.hardware.title}</h1>
      <p className={styles.lead}>{copy.hardware.lead}</p>

      <div className={styles.millParts}>
        {rows.map((row, i) => (
          <article key={`${row.kind}-${row.title}-${i}`} className={styles.millPart}>
            <span className={styles.millPartNo}>{String(i + 1).padStart(2, "0")}</span>
            <span className={styles.millPartRole}>{row.role}</span>
            <span className={styles.millPartTitle}>{row.title}</span>
            <span className={styles.millPartSpec}>{row.detail}</span>
            {row.chips.length > 0 ? (
              <div className={styles.invMarks}>
                {row.chips.map((chip) => (
                  <span key={chip} className={styles.invMark}>
                    {chip}
                  </span>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </JaaliSheet>
  );
}

export default JaaliHardware;
