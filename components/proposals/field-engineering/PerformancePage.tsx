"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { DrawingSheet } from "./DrawingSheet";
import styles from "./Field.module.css";
import { buildFieldForecastMonths } from "./field-forecast";
import {
  fieldAnnualUnits,
  fieldMetric,
  fieldSheetMeta,
  formatFieldKw,
  resolveFieldPanelSpec,
} from "./field-live";

export function PerformancePage({ data }: { data: ProposalData }) {
  const sheet = fieldSheetMeta(data);
  const annual = fieldAnnualUnits(data);
  const monthly = buildFieldForecastMonths(annual);
  const max = Math.max(...monthly.map((d) => d.val), 1);
  const chartW = 500;
  const chartH = 190;
  const barW = 30;
  const gap = 12;
  const pr = fieldMetric(data, /performance|pr\b/i);
  const { dcKwp, modules, watt } = resolveFieldPanelSpec(data);
  const specific =
    annual > 0 && dcKwp > 0 ? Math.round(annual / dcKwp).toLocaleString("en-IN") : "—";
  const tilt = Number(data.engineering.tiltDeg);
  const tiltNote =
    Number.isFinite(tilt) && tilt > 0 ? `${Math.round(tilt)}° tilt` : "tilt not on file";

  return (
    <DrawingSheet
      dwgNo="FE-05"
      sheetLabel="PERFORMANCE SIMULATION"
      pageOf="05 / 09"
      familyName={sheet.familyName}
      scale="—"
      date={sheet.date}
      preparedBy={sheet.preparedBy}
    >
      <div className={styles.eyebrow}>Generation Modelling</div>
      <h2 className={styles.h2}>
        Simulated Monthly Yield{" "}
        <span className={styles.tag}>seasonal share on this proposal’s year-1 units</span>
      </h2>

      <svg viewBox={`0 0 ${chartW} ${chartH + 50}`} className={styles.diagram} style={{ marginTop: 0 }}>
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1="0"
            x2={chartW}
            y1={chartH - f * chartH}
            y2={chartH - f * chartH}
            stroke="var(--eng-grid)"
            strokeWidth="1.4"
          />
        ))}
        {monthly.map((d, i) => {
          const h = annual > 0 ? (d.val / max) * (chartH - 16) : 8;
          const x = i * (barW + gap);
          return (
            <g key={d.m}>
              <rect
                x={x}
                y={chartH - h}
                width={barW}
                height={h}
                fill="var(--eng-signal)"
              />
              <text
                x={x + barW / 2}
                y={chartH - h - 6}
                textAnchor="middle"
                className={styles.dimText}
                fontSize="10"
                fontWeight="700"
              >
                {annual > 0 ? d.val : "—"}
              </text>
              <text
                x={x + barW / 2}
                y={chartH + 20}
                textAnchor="middle"
                className={styles.dimText}
                fontSize="10"
              >
                {d.m.toUpperCase()}
              </text>
            </g>
          );
        })}
      </svg>

      <div className={styles.spec3}>
        {[
          {
            label: "Annual Yield (Sim.)",
            value: annual > 0 ? annual.toLocaleString("en-IN") : "—",
            unit: annual > 0 ? "kWh" : "",
          },
          { label: "Performance Ratio", value: pr || "—", unit: "" },
          {
            label: "Specific Yield",
            value: specific,
            unit: specific !== "—" ? "kWh/kWp" : "",
          },
        ].map((item) => (
          <div key={item.label} className={styles.specCell}>
            <div className={styles.specLabel}>{item.label}</div>
            <div className={styles.callout} style={{ fontSize: "18px" }}>
              {item.value} {item.unit ? <span className={styles.unit}>{item.unit}</span> : null}
            </div>
          </div>
        ))}
      </div>

      <p className={styles.note} style={{ marginTop: "6mm" }}>
        Simulation basis:{" "}
        {modules > 0 && watt > 0 ? `${modules} × ${watt}W modules` : "module count from BOM"}
        {dcKwp > 0 ? `, ${formatFieldKw(dcKwp)} kWp DC` : ""}, {tiltNote}. Actual generation
        varies with weather and grid availability. PR is shown only when it exists on the
        engineering record.
      </p>
    </DrawingSheet>
  );
}

export default PerformancePage;
