"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { DrawingSheet } from "./DrawingSheet";
import { GeneralNotes } from "./GeneralNotes";
import styles from "./Field.module.css";
import {
  fieldDrawingSheetProps,
  fieldLiveBom,
  formatFieldKw,
  resolveFieldPanelSpec,
  resolveFieldStringing,
} from "./field-live";

const NODES = ["Solar Array", "DC Combiner", "Inverter", "AC Distribution", "Net Meter", "DISCOM Grid"];

export function ArchitecturePage({
  data,
  proposalId,
}: {
  data: ProposalData;
  proposalId?: string;
}) {
  const systemKw = Number(data.meta.systemKw) || 0;
  const { modules, watt, dcKwp } = resolveFieldPanelSpec(data);
  const bom = fieldLiveBom(data).slice(0, 6);
  const ac = formatFieldKw(systemKw, 1);
  const dc = dcKwp > 0 ? formatFieldKw(dcKwp) : "—";
  const stringing = resolveFieldStringing(data);

  return (
    <DrawingSheet
      {...fieldDrawingSheetProps({
        data,
        proposalId,
        dwgNo: "FE-04",
        sheetLabel: "SYSTEM ARCHITECTURE — SINGLE LINE",
        page: 5,
        scale: "NTS",
      })}
    >
      <div className={styles.eyebrow}>System Engineering</div>
      <h2 className={styles.h2}>
        Single-Line Diagram <span className={styles.tag}>DC → AC → Grid</span>
      </h2>

      <svg
        viewBox="0 0 580 160"
        className={styles.diagram}
        style={{ marginTop: 0 }}
        role="img"
        aria-label="Single line diagram"
      >
        <defs>
          <marker
            id="fe-sld-arrow"
            markerWidth="9"
            markerHeight="9"
            refX="7"
            refY="3.5"
            orient="auto"
          >
            <path d="M0,0 L7,3.5 L0,7 Z" fill="var(--eng-ink)" />
          </marker>
        </defs>
        {NODES.map((n, i) => (
          <g key={n}>
            <rect
              x={12 + i * 96}
              y="55"
              width="84"
              height="48"
              fill="#fff"
              stroke="var(--eng-ink)"
              strokeWidth="2"
            />
            <text
              x={54 + i * 96}
              y="82"
              textAnchor="middle"
              className={styles.dimText}
              fontSize="10"
              fontWeight="700"
            >
              {n.toUpperCase()}
            </text>
            {i < NODES.length - 1 ? (
              <line
                x1={96 + i * 96}
                y1="79"
                x2={110 + i * 96}
                y2="79"
                className={styles.dimLine}
                stroke="var(--eng-ink)"
                strokeWidth="1.6"
                markerEnd="url(#fe-sld-arrow)"
              />
            ) : null}
          </g>
        ))}
        <text x="12" y="128" className={styles.dimText} fill="var(--eng-signal)" fontWeight="700">
          DC SIDE
          {dcKwp > 0 ? ` · ${dc} kWp` : ""}
          {modules > 0 && watt > 0 ? ` · ${modules}×${watt}W` : ""}
        </text>
        <text x="300" y="128" className={styles.dimText} fill="var(--eng-signal)" fontWeight="700">
          AC SIDE{systemKw > 0 ? ` · ${ac} kW` : ""}
        </text>
      </svg>

      {stringing ? (
        <div className={styles.stringingBlock}>
          <h2 className={styles.h2} style={{ marginBottom: "3mm", fontSize: "15px" }}>
            DC stringing <span className={styles.tag}>MPPT allocation · live module count</span>
          </h2>
          <svg viewBox="0 0 520 72" className={styles.diagram} style={{ marginTop: 0 }} role="img">
            {stringing.tracks.map((t, i) => {
              const x = 12 + i * 160;
              return (
                <g key={t.track}>
                  <rect
                    x={x}
                    y="8"
                    width="140"
                    height="36"
                    fill="none"
                    stroke="var(--eng-signal)"
                    strokeWidth="1.6"
                  />
                  <text x={x + 8} y="24" className={styles.dimText} fontWeight="700">
                    MPPT {t.track}
                  </text>
                  <text x={x + 8} y="38" className={styles.dimText}>
                    {t.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      ) : null}

      {bom.length === 0 ? (
        <p className={styles.note} style={{ marginTop: "8mm" }}>
          No BOM lines on this proposal.
        </p>
      ) : (
        <table className={styles.table} style={{ marginTop: stringing ? "4mm" : "8mm" }}>
          <thead>
            <tr>
              <th>Component</th>
              <th>Specification</th>
              <th>Standard / Compliance</th>
            </tr>
          </thead>
          <tbody>
            {bom.map((c) => (
              <tr key={`${c.name}-${c.brand}`}>
                <td>{c.name || "—"}</td>
                <td className={styles.mono}>{c.spec || "—"}</td>
                <td className={styles.note}>
                  {[c.brand, c.warranty].filter(Boolean).join(" · ") || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <GeneralNotes
        extra={[
          stringing
            ? `String split assumes ${stringing.mpptCount} MPPT track(s) from inverter BOM — verify on site.`
            : "Stringing diagram appears when module count and inverter are on the BOM.",
          "Full compliance standards listed on FE-07 when on file.",
        ]}
      />
    </DrawingSheet>
  );
}

export default ArchitecturePage;
