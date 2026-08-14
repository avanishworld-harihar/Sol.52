"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { DrawingSheet } from "./DrawingSheet";
import { GeneralNotes } from "./GeneralNotes";
import styles from "./Field.module.css";
import { fieldDrawingSheetProps, resolveFieldPanelSpec } from "./field-live";

function roofGrid(count: number): { cols: number; shown: number } {
  const shown = count > 0 ? Math.min(count, 12) : 0;
  if (shown <= 0) return { cols: 3, shown: 0 };
  const cols = shown <= 3 ? shown : 3;
  return { cols, shown };
}

export function SiteSurveyPage({
  data,
  proposalId,
  siteImages,
}: {
  data: ProposalData;
  proposalId?: string;
  siteImages?: string[];
}) {
  const { modules, watt, structureItem } = resolveFieldPanelSpec(data);
  const { cols, shown } = roofGrid(modules);
  const extra = modules > shown ? modules - shown : 0;
  const tilt = Number(data.engineering.tiltDeg);
  const tiltLabel = Number.isFinite(tilt) && tilt > 0 ? `${Math.round(tilt)}°` : "—";
  const roofType = structureItem?.spec?.trim() || structureItem?.name?.trim() || "—";
  const arrayLabel =
    modules > 0 && watt > 0 ? `${modules} × ${watt}W` : modules > 0 ? `${modules} MOD` : "—";
  const site = data.meta.locationLine?.trim() || "—";
  const tiltNote = data.engineering.tiltNote?.trim() || "";
  const city = data.engineering.cityLabel?.trim() || "";
  const photos = (siteImages ?? []).filter(Boolean).slice(0, 2);

  return (
    <DrawingSheet
      {...fieldDrawingSheetProps({
        data,
        proposalId,
        dwgNo: "FE-03",
        sheetLabel: "SITE SURVEY & ROOF SCHEMATIC",
        page: 4,
        scale: "NTS",
      })}
    >
      <div className={styles.eyebrow}>Site Engineering Assessment</div>
      <h2 className={styles.h2}>
        Roof Survey <span className={styles.tag}>as measured on site visit</span>
      </h2>

      <svg
        viewBox="0 0 520 280"
        className={styles.diagram}
        style={{ marginTop: 0 }}
        role="img"
        aria-label="Dimensioned roof schematic"
      >
        <defs>
          <marker
            id="fe-survey-arrow"
            markerWidth="9"
            markerHeight="9"
            refX="7"
            refY="3.5"
            orient="auto"
          >
            <path d="M0,0 L7,3.5 L0,7 Z" fill="var(--eng-ink)" />
          </marker>
        </defs>

        <rect
          x="95"
          y="55"
          width="310"
          height="175"
          fill="none"
          stroke="var(--eng-ink)"
          strokeWidth="2"
        />

        {shown === 0
          ? null
          : Array.from({ length: shown }).map((_, i) => {
              const col = i % cols;
              const row = Math.floor(i / cols);
              return (
                <rect
                  key={`${row}-${col}-${i}`}
                  x={128 + col * 62}
                  y={78 + row * 34}
                  width="56"
                  height="28"
                  fill="none"
                  stroke="var(--eng-signal)"
                  strokeWidth="1.6"
                />
              );
            })}

        <line
          x1="95"
          y1="245"
          x2="405"
          y2="245"
          className={styles.dimLine}
          markerStart="url(#fe-survey-arrow)"
          markerEnd="url(#fe-survey-arrow)"
        />
        <text x="205" y="264" className={styles.dimText}>
          ARRAY {arrayLabel}
          {extra > 0 ? `  (+${extra} not drawn)` : ""}
        </text>

        <line
          x1="430"
          y1="55"
          x2="430"
          y2="230"
          className={styles.dimLine}
          markerStart="url(#fe-survey-arrow)"
          markerEnd="url(#fe-survey-arrow)"
        />
        <text x="443" y="145" className={styles.dimText} transform="rotate(90 443 145)">
          NTS
        </text>

        {tiltLabel !== "—" ? (
          <>
            <path
              d="M320,78 L390,32"
              className={styles.leaderLine}
              markerEnd="url(#fe-survey-arrow)"
            />
            <text x="392" y="28" className={styles.dimText} fill="var(--eng-signal)" fontWeight="700">
              TILT {tiltLabel}
            </text>
          </>
        ) : null}
      </svg>

      {photos.length > 0 ? (
        <div className={styles.photoAnnex}>
          {photos.map((src, i) => (
            <figure key={src} className={styles.photoFrame}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Site survey photo ${i + 1}`} />
              <figcaption className={styles.photoCaption}>
                Survey photo {i + 1} — roof / array zone
              </figcaption>
            </figure>
          ))}
        </div>
      ) : null}

      <table className={styles.table} style={{ marginTop: photos.length > 0 ? "4mm" : "6mm" }}>
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Measured Value</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Site</td>
            <td className={styles.mono}>{site}</td>
            <td className={styles.note}>{city || "From proposal record"}</td>
          </tr>
          <tr>
            <td>Roof Type</td>
            <td className={styles.mono}>{roofType}</td>
            <td className={styles.note}>{structureItem ? "BOM line" : "Not on file"}</td>
          </tr>
          <tr>
            <td>Array</td>
            <td className={styles.mono}>{arrayLabel}</td>
            <td className={styles.note}>Live module count × Wp</td>
          </tr>
          <tr>
            <td>Tilt Angle</td>
            <td className={styles.mono}>{tiltLabel}</td>
            <td className={styles.note}>{tiltNote || "Only if recorded"}</td>
          </tr>
          <tr>
            <td>Survey photos</td>
            <td className={styles.mono}>{photos.length > 0 ? `${photos.length} on file` : "—"}</td>
            <td className={styles.note}>Evidence annex when uploaded</td>
          </tr>
        </tbody>
      </table>

      <GeneralNotes
        extra={[
          "Photo annex shows uploaded site images only — not stock photography.",
          "Azimuth and measured roof spans are not invented on this sheet.",
        ]}
      />
    </DrawingSheet>
  );
}

export default SiteSurveyPage;
