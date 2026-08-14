"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { DrawingSheet } from "./DrawingSheet";
import styles from "./Field.module.css";
import { fieldDrawnBy, fieldSheetDate, resolveFieldPanelSpec } from "./field-live";

function roofGrid(count: number): { cols: number; rows: number; shown: number } {
  const shown = count > 0 ? Math.min(count, 16) : 0;
  if (shown <= 0) return { cols: 4, rows: 2, shown: 0 };
  const cols = shown <= 4 ? shown : shown <= 8 ? 4 : 4;
  const rows = Math.ceil(shown / cols);
  return { cols, rows, shown };
}

export function SiteSurveyPage({ data }: { data: ProposalData }) {
  const { modules, watt } = resolveFieldPanelSpec(data);
  const { cols, rows, shown } = roofGrid(modules);
  const extra = modules > shown ? modules - shown : 0;
  const tilt = Number(data.engineering.tiltDeg);
  const tiltLabel =
    Number.isFinite(tilt) && tilt > 0 ? `${Math.round(tilt)}°` : "—";
  const site = data.meta.locationLine?.trim() || "—";

  const originX = 70;
  const originY = 36;
  const cellW = 48;
  const cellH = 26;
  const pad = 18;
  const boxW = cols * cellW + pad * 2;
  const boxH = Math.max(rows, 2) * cellH + pad * 2;

  return (
    <DrawingSheet
      dwgNo="FE-02"
      sheetLabel="SITE SURVEY — ROOF PLAN"
      drawnBy={fieldDrawnBy(data)}
      date={fieldSheetDate(data.meta.generatedAt)}
      scale="NTS"
    >
      <span className={styles.eyebrow}>Plan · schematic</span>
      <h2 className={styles.h2}>Dimensioned array on the surveyed roof.</h2>
      <p className={styles.lede}>
        Layout is schematic (not to scale). Module count and wattage are from
        this proposal BOM — roof metres are not invented.
      </p>

      <svg
        viewBox={`0 0 520 ${Math.max(boxH + 70, 210)}`}
        className={styles.surveySvg}
        role="img"
        aria-label="Schematic roof plan with array"
      >
        <rect
          x={originX}
          y={originY}
          width={boxW}
          height={boxH}
          fill="none"
          stroke="#1B2A32"
          strokeWidth="1.6"
        />
        <text x={originX + boxW / 2} y={originY - 8} textAnchor="middle" fill="#E1631F" fontSize="10" fontFamily="IBM Plex Mono, monospace">
          ARRAY ENVELOPE
        </text>
        {shown === 0
          ? [
              <text
                key="empty"
                x={originX + boxW / 2}
                y={originY + boxH / 2}
                textAnchor="middle"
                fill="#1B2A32"
                fontSize="11"
                fontFamily="IBM Plex Mono, monospace"
              >
                ARRAY COUNT NOT ON FILE
              </text>,
            ]
          : Array.from({ length: shown }).map((_, i) => {
              const c = i % cols;
              const r = Math.floor(i / cols);
              return (
                <rect
                  key={i}
                  x={originX + pad + c * cellW + 3}
                  y={originY + pad + r * cellH + 2}
                  width={cellW - 8}
                  height={cellH - 6}
                  fill="#1B2A32"
                  stroke="#E1631F"
                  strokeWidth="0.8"
                />
              );
            })}
        <line
          x1={originX}
          y1={originY + boxH + 16}
          x2={originX + boxW}
          y2={originY + boxH + 16}
          stroke="#E1631F"
          strokeWidth="1.2"
        />
        <text
          x={originX + boxW / 2}
          y={originY + boxH + 30}
          textAnchor="middle"
          fill="#E1631F"
          fontSize="10"
          fontFamily="IBM Plex Mono, monospace"
        >
          {modules > 0 ? `${modules} MOD` : "— MOD"}
          {watt > 0 ? ` × ${watt} Wp` : ""}
          {extra > 0 ? `  (+${extra} not drawn)` : ""}
        </text>
        <g transform="translate(30, 40)">
          <circle cx="0" cy="0" r="14" fill="none" stroke="#1B2A32" />
          <path d="M0 10 L0 -10 L-4 -4 M0 -10 L4 -4" fill="none" stroke="#E1631F" strokeWidth="1.4" />
          <text x="0" y="-18" textAnchor="middle" fontSize="9" fontFamily="IBM Plex Mono, monospace" fill="#1B2A32">
            N
          </text>
        </g>
      </svg>

      <div className={styles.metaGrid}>
        <div className={styles.metaCell}>
          <span>Site</span>
          <strong>{site}</strong>
        </div>
        <div className={styles.metaCell}>
          <span>Array tilt</span>
          <strong>{tiltLabel}</strong>
        </div>
      </div>
      <p className={styles.note}>
        North arrow is a drawing convention. Azimuth is not claimed unless
        recorded on the proposal.
      </p>
    </DrawingSheet>
  );
}

export default SiteSurveyPage;
