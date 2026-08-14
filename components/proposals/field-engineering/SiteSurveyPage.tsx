"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { DrawingSheet } from "./DrawingSheet";
import styles from "./Field.module.css";
import { fieldSheetMeta, resolveFieldPanelSpec } from "./field-live";

function roofGrid(count: number): { cols: number; rows: number; shown: number } {
  const shown = count > 0 ? Math.min(count, 12) : 0;
  if (shown <= 0) return { cols: 3, rows: 4, shown: 0 };
  const cols = shown <= 3 ? shown : 3;
  const rows = Math.ceil(shown / cols);
  return { cols, rows, shown };
}

export function SiteSurveyPage({ data }: { data: ProposalData }) {
  const sheet = fieldSheetMeta(data);
  const { modules, watt, structureItem } = resolveFieldPanelSpec(data);
  const { cols, rows, shown } = roofGrid(modules);
  const extra = modules > shown ? modules - shown : 0;
  const tilt = Number(data.engineering.tiltDeg);
  const tiltLabel = Number.isFinite(tilt) && tilt > 0 ? `${Math.round(tilt)}°` : "—";
  const roofType =
    structureItem?.spec?.trim() ||
    structureItem?.name?.trim() ||
    "—";
  const arrayLabel =
    modules > 0 && watt > 0 ? `${modules} × ${watt}W` : modules > 0 ? `${modules} MOD` : "—";
  const site = data.meta.locationLine?.trim() || "—";
  const tiltNote = data.engineering.tiltNote?.trim() || "";

  return (
    <DrawingSheet
      dwgNo="FE-03"
      sheetLabel="SITE SURVEY & ROOF SCHEMATIC"
      pageOf="03 / 09"
      familyName={sheet.familyName}
      scale="NTS"
      date={sheet.date}
      preparedBy={sheet.preparedBy}
    >
      <div className={styles.eyebrow}>Site Engineering Assessment</div>
      <h2 className={styles.h2}>
        Roof Survey <span className={styles.tag}>schematic · NTS · live BOM count</span>
      </h2>

      <svg viewBox="0 0 500 280" className={styles.diagram} style={{ marginTop: 0 }} role="img" aria-label="Dimensioned roof schematic">
        <defs>
          <marker id="fe-survey-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="var(--eng-ink-soft)" />
          </marker>
        </defs>
        <rect x="90" y="50" width="300" height="170" fill="none" stroke="var(--eng-ink)" strokeWidth="1.5" />
        {shown === 0
          ? null
          : Array.from({ length: shown }).map((_, i) => {
              const col = i % cols;
              const row = Math.floor(i / cols);
              return (
                <rect
                  key={`${row}-${col}-${i}`}
                  x={120 + col * 80}
                  y={70 + row * (140 / Math.max(rows, 1))}
                  width="70"
                  height={140 / Math.max(rows, 1) - 8}
                  fill="none"
                  stroke="var(--eng-signal)"
                  strokeWidth="1"
                />
              );
            })}
        <line
          x1="90"
          y1="235"
          x2="390"
          y2="235"
          className={styles.dimLine}
          markerStart="url(#fe-survey-arrow)"
          markerEnd="url(#fe-survey-arrow)"
        />
        <text x="240" y="252" textAnchor="middle" className={styles.dimText}>
          ARRAY {arrayLabel}
          {extra > 0 ? `  (+${extra} not drawn)` : ""}
        </text>
        <line
          x1="415"
          y1="50"
          x2="415"
          y2="220"
          className={styles.dimLine}
          markerStart="url(#fe-survey-arrow)"
          markerEnd="url(#fe-survey-arrow)"
        />
        <text x="428" y="140" className={styles.dimText} transform="rotate(90 428 140)">
          NTS
        </text>
        {tiltLabel !== "—" ? (
          <>
            <path d="M300,70 L360,30" className={styles.leaderLine} markerEnd="url(#fe-survey-arrow)" />
            <text x="362" y="26" className={styles.dimText} fill="var(--eng-signal)">
              TILT {tiltLabel}
            </text>
          </>
        ) : null}
      </svg>

      <table className={styles.table} style={{ marginTop: "6mm" }}>
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Recorded value</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Site</td>
            <td className={styles.mono}>{site}</td>
            <td className={styles.note}>From proposal record</td>
          </tr>
          <tr>
            <td>Roof / structure</td>
            <td className={styles.mono}>{roofType}</td>
            <td className={styles.note}>{structureItem ? "BOM line" : "Not on file"}</td>
          </tr>
          <tr>
            <td>Array</td>
            <td className={styles.mono}>{arrayLabel}</td>
            <td className={styles.note}>Live module count × Wp</td>
          </tr>
          <tr>
            <td>Tilt angle</td>
            <td className={styles.mono}>{tiltLabel}</td>
            <td className={styles.note}>{tiltNote || "Only if recorded"}</td>
          </tr>
        </tbody>
      </table>
      <p className={styles.note} style={{ marginTop: "4mm" }}>
        Roof metres and azimuth are not invented. Dimension lines mark the
        drawing, not a measured span, unless a site survey is on the proposal.
      </p>
    </DrawingSheet>
  );
}

export default SiteSurveyPage;
