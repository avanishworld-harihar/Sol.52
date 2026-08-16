"use client";

import type { ProposalData } from "@/lib/proposal-data";
import styles from "./Khadi.module.css";
import { KhadiSheet } from "./khadi-brand";
import { khadiHardwareRows } from "./khadi-live";
import { useKhadiLang } from "./khadi-lang-context";

export function KhadiHardware({ data }: { data: ProposalData }) {
  const { copy } = useKhadiLang();
  const rows = khadiHardwareRows(data);

  return (
    <KhadiSheet data={data} page="03 / 09" chapter={copy.spine.parts}>
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
    </KhadiSheet>
  );
}

export default KhadiHardware;
