"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { DrawingSheet } from "./DrawingSheet";
import { GeneralNotes } from "./GeneralNotes";
import styles from "./Field.module.css";
import { fieldDrawingSheetProps } from "./field-live";

const DEFAULT_PHASES = [
  "Survey",
  "Approval",
  "Procurement",
  "Installation",
  "Commissioning",
  "Net-meter",
];

export function TimelinePage({
  data,
  proposalId,
}: {
  data: ProposalData;
  proposalId?: string;
}) {
  const steps = (data.execution.steps ?? []).filter((s) => s.title?.trim());
  const phases = steps.length > 0 ? steps.slice(0, 6).map((s) => s.title) : DEFAULT_PHASES;
  const payments = (data.execution.payments ?? []).filter((p) => p.label?.trim());
  const chartW = 480;
  const rowH = 22;
  const chartH = phases.length * rowH + 8;
  const barW = chartW - 130;

  return (
    <DrawingSheet
      {...fieldDrawingSheetProps({
        data,
        proposalId,
        dwgNo: "FE-08",
        sheetLabel: "INSTALLATION TIMELINE",
        page: 9,
      })}
    >
      <div className={styles.eyebrow}>Works Sequence</div>
      <h2 className={styles.h2}>
        Install phases <span className={styles.tag}>Gantt · schematic sequence, not a calendar</span>
      </h2>

      <svg
        viewBox={`0 0 ${chartW} ${chartH}`}
        className={styles.diagram}
        style={{ marginTop: 0 }}
        role="img"
        aria-label="Installation phase gantt"
      >
        {phases.map((title, i) => {
          const y = i * rowH + 4;
          const x = 120 + i * (barW / Math.max(phases.length, 1)) * 0.35;
          const w = barW * 0.45;
          return (
            <g key={`${title}-${i}`}>
              <text x="0" y={y + 12} className={styles.dimText}>
                {String(i + 1).padStart(2, "0")} {title}
              </text>
              <rect x={x} y={y + 4} width={w} height="12" fill="var(--eng-signal)" opacity="0.85" />
            </g>
          );
        })}
      </svg>

      {steps.length > 0 ? (
        <table className={styles.table} style={{ marginTop: "6mm" }}>
          <thead>
            <tr>
              <th>#</th>
              <th>Phase</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {steps.slice(0, 6).map((s, i) => (
              <tr key={`${s.num}-${s.title}`}>
                <td className={styles.mono}>{s.num || String(i + 1).padStart(2, "0")}</td>
                <td>{s.title}</td>
                <td className={styles.note}>{s.description || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className={styles.note} style={{ marginTop: "4mm" }}>
          Bars show the typical field sequence. Duration weeks are not invented when
          this proposal has no execution plan.
        </p>
      )}

      {payments.length > 0 ? (
        <table className={styles.table} style={{ marginTop: "6mm" }}>
          <thead>
            <tr>
              <th>Payment gate</th>
              <th>Linked ledger</th>
            </tr>
          </thead>
          <tbody>
            {payments.slice(0, 4).map((p) => (
              <tr key={p.label}>
                <td>
                  {p.label}
                  {p.pctLabel ? ` (${p.pctLabel})` : ""}
                </td>
                <td className={styles.note}>FE-06 gross milestone · FE-09 sign-off</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      <GeneralNotes
        extra={[
          "Install sequence aligns with payment gates on FE-06 when milestones exist.",
          "Calendar durations are not invented on this schematic Gantt.",
        ]}
      />
    </DrawingSheet>
  );
}

export default TimelinePage;
