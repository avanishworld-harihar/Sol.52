"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { DrawingSheet } from "./DrawingSheet";
import styles from "./Field.module.css";
import {
  fieldDrawnBy,
  fieldLiveBom,
  fieldSheetDate,
  formatFieldKw,
  resolveFieldPanelSpec,
} from "./field-live";

export function ArchitecturePage({ data }: { data: ProposalData }) {
  const systemKw = Number(data.meta.systemKw) || 0;
  const { modules, watt, dcKwp, inverterItem } = resolveFieldPanelSpec(data);
  const bom = fieldLiveBom(data).slice(0, 6);
  const ac = formatFieldKw(systemKw, 1);
  const dc = dcKwp > 0 ? formatFieldKw(dcKwp) : "—";
  const inv = inverterItem?.brand?.trim() || inverterItem?.name?.trim() || "—";

  return (
    <DrawingSheet
      dwgNo="FE-03"
      sheetLabel="SYSTEM ARCHITECTURE — SLD"
      drawnBy={fieldDrawnBy(data)}
      date={fieldSheetDate(data.meta.generatedAt)}
    >
      <span className={styles.eyebrow}>Single-line schematic</span>
      <h2 className={styles.h2}>Power path from array to grid.</h2>

      <svg viewBox="0 0 640 128" className={styles.sld} role="img" aria-label="Single line diagram">
        <rect x="8" y="36" width="110" height="52" fill="none" stroke="#1B2A32" strokeWidth="1.6" />
        <text x="63" y="58" textAnchor="middle" fontSize="11" fontFamily="IBM Plex Mono, monospace" fill="#1B2A32">
          PV ARRAY
        </text>
        <text x="63" y="74" textAnchor="middle" fontSize="9" fontFamily="IBM Plex Mono, monospace" fill="#E1631F">
          {modules > 0 && watt > 0 ? `${modules}×${watt}W` : "—"}
        </text>
        <line x1="118" y1="62" x2="168" y2="62" stroke="#E1631F" strokeWidth="2.4" />
        <text x="143" y="54" textAnchor="middle" fontSize="9" fill="#E1631F" fontFamily="IBM Plex Mono, monospace">
          DC
        </text>
        <rect x="168" y="36" width="110" height="52" fill="none" stroke="#1B2A32" strokeWidth="1.6" />
        <text x="223" y="58" textAnchor="middle" fontSize="11" fontFamily="IBM Plex Mono, monospace">
          INVERTER
        </text>
        <text x="223" y="74" textAnchor="middle" fontSize="9" fill="#E1631F" fontFamily="IBM Plex Mono, monospace">
          {systemKw > 0 ? `${ac} kW` : "—"}
        </text>
        <line x1="278" y1="62" x2="328" y2="62" stroke="#1B2A32" strokeWidth="2.4" />
        <text x="303" y="54" textAnchor="middle" fontSize="9" fontFamily="IBM Plex Mono, monospace">
          AC
        </text>
        <rect x="328" y="18" width="110" height="40" fill="none" stroke="#1B2A32" strokeWidth="1.6" />
        <text x="383" y="42" textAnchor="middle" fontSize="11" fontFamily="IBM Plex Mono, monospace">
          HOME LOAD
        </text>
        <rect x="328" y="66" width="110" height="40" fill="none" stroke="#1B2A32" strokeWidth="1.6" />
        <text x="383" y="90" textAnchor="middle" fontSize="11" fontFamily="IBM Plex Mono, monospace">
          DISCOM GRID
        </text>
        <path d="M328 62 L318 62 L318 38 L328 38" fill="none" stroke="#1B2A32" strokeWidth="2" />
        <path d="M328 62 L318 62 L318 86 L328 86" fill="none" stroke="#1B2A32" strokeWidth="2" />
        <text x="520" y="42" fontSize="10" fontFamily="IBM Plex Mono, monospace" fill="#2E6B4C">
          PRIORITY
        </text>
        <text x="520" y="90" fontSize="10" fontFamily="IBM Plex Mono, monospace" fill="#E1631F">
          NET METER
        </text>
      </svg>

      <p className={styles.note} style={{ marginTop: 0 }}>
        DC harvest {dcKwp > 0 ? `${dc} kWp` : "—"} · inverter {inv} · AC{" "}
        {systemKw > 0 ? `${ac} kW` : "—"}.
      </p>

      <h2 className={styles.h2} style={{ marginTop: 10 }}>
        Component specification
      </h2>
      {bom.length === 0 ? (
        <p className={styles.note}>No BOM lines on this proposal.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Item</th>
              <th>Make</th>
              <th>Spec</th>
              <th>Warranty</th>
            </tr>
          </thead>
          <tbody>
            {bom.map((item) => (
              <tr key={`${item.name}-${item.brand}`}>
                <td>{item.name || "—"}</td>
                <td>{item.brand || "—"}</td>
                <td>{item.spec || "—"}</td>
                <td>{item.warranty || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </DrawingSheet>
  );
}

export default ArchitecturePage;
