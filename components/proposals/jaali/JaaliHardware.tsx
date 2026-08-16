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

      <table className={styles.invTable}>
        <thead>
          <tr>
            <th>{copy.hardware.colNo}</th>
            <th>{copy.hardware.colPart}</th>
            <th>{copy.hardware.colSpec}</th>
            <th>{copy.hardware.colMark}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={`${row.kind}-${row.title}-${i}`}>
              <td className={styles.invNo}>{String(i + 1).padStart(2, "0")}</td>
              <td>
                <span className={styles.invRole}>{row.role}</span>
                <span className={styles.invTitle}>{row.title}</span>
              </td>
              <td className={styles.invSpec}>{row.detail}</td>
              <td>
                {row.chips.length > 0 ? (
                  <div className={styles.invMarks}>
                    {row.chips.map((chip) => (
                      <span key={chip} className={styles.invMark}>
                        {chip}
                      </span>
                    ))}
                  </div>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </JaaliSheet>
  );
}

export default JaaliHardware;
