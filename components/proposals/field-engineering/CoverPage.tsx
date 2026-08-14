"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { DrawingSheet } from "./DrawingSheet";
import styles from "./Field.module.css";
import {
  fieldAnnualUnits,
  fieldDocNo,
  fieldSheetMeta,
  formatFieldKw,
  resolveFieldPanelSpec,
} from "./field-live";

export function CoverPage({
  data,
  proposalId,
}: {
  data: ProposalData;
  proposalId?: string;
}) {
  const sheet = fieldSheetMeta(data);
  const systemKw = Number(data.meta.systemKw) || 0;
  const { modules, watt, dcKwp } = resolveFieldPanelSpec(data);
  const annual = fieldAnnualUnits(data);
  const site = data.meta.locationLine?.trim() || "—";
  const subsidy = data.economics.subsidyInr > 0;
  const ac = formatFieldKw(systemKw, 1);
  const arrayLabel =
    modules > 0 && watt > 0 ? `${modules} × ${watt}W` : modules > 0 ? `${modules} MOD` : "—";

  const specs = [
    { label: "System Size", value: systemKw > 0 ? ac : "—", unit: systemKw > 0 ? "kW" : "" },
    { label: "Panel Count", value: modules > 0 ? String(modules) : "—", unit: modules > 0 ? "nos" : "" },
    {
      label: "Est. Annual Yield",
      value: annual > 0 ? annual.toLocaleString("en-IN") : "—",
      unit: annual > 0 ? "kWh" : "",
    },
    { label: "Subsidy on file", value: subsidy ? "Yes" : "—", unit: "" },
  ];

  return (
    <DrawingSheet
      dwgNo="FE-01"
      sheetLabel="COVER / SYSTEM SPEC SHEET"
      pageOf="01 / 09"
      familyName={sheet.familyName}
      scale="—"
      date={sheet.date}
      preparedBy={sheet.preparedBy}
    >
      <div className={styles.eyebrow}>Residential Solar · Field Engineering Proposal</div>
      <h1 className={styles.h1}>
        Rooftop Solar
        <br />
        System Specification
      </h1>
      <p className={styles.bodyText} style={{ maxWidth: "85%" }}>
        Prepared for <strong style={{ color: "var(--eng-ink)" }}>{sheet.familyName}</strong>
        {site !== "—" ? `, ${site}` : ""}. This set documents the site survey,
        system design, performance simulation, and financial calculation behind
        the proposed installation — drawn the way engineers specify it, not the
        way a brochure would.
      </p>

      <div className={styles.specStrip}>
        {specs.map((item) => (
          <div key={item.label} className={styles.specCell}>
            <div className={styles.note} style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {item.label}
            </div>
            <div className={styles.callout} style={{ fontSize: "18px", marginTop: "2mm" }}>
              {item.value}{" "}
              {item.unit ? <span className={styles.unit}>{item.unit}</span> : null}
            </div>
          </div>
        ))}
      </div>

      <svg viewBox="0 0 400 200" className={styles.diagram} role="img" aria-label="Roof footprint schematic">
        <rect x="60" y="40" width="280" height="140" fill="none" className={styles.dimLine} strokeDasharray="3 2" />
        <rect x="90" y="65" width="100" height="55" fill="none" stroke="var(--eng-signal)" strokeWidth="1.4" />
        <text x="95" y="60" className={styles.dimText} fill="var(--eng-signal)">
          ARRAY ZONE — {arrayLabel}
        </text>
        <line x1="60" y1="30" x2="340" y2="30" className={styles.dimLine} />
        <text x="200" y="24" textAnchor="middle" className={styles.dimText}>
          ROOF FOOTPRINT · NTS
          {dcKwp > 0 ? ` · ${formatFieldKw(dcKwp)} kWp DC` : ""}
        </text>
        <g transform="translate(345,150)">
          <circle r="20" fill="none" className={styles.dimLine} />
          <line x1="0" y1="-20" x2="0" y2="20" className={styles.dimLine} />
          <line x1="-20" y1="0" x2="20" y2="0" className={styles.dimLine} />
          <text x="-4" y="-24" className={styles.dimText}>
            N
          </text>
        </g>
      </svg>

      <div className={`${styles.footRow} ${styles.note}`}>
        <span>
          Proposal ID:{" "}
          <span className={styles.mono}>
            {fieldDocNo(proposalId, data.meta.generatedAt)}
          </span>
        </span>
        <span>Prepared by {sheet.preparedBy}</span>
      </div>
    </DrawingSheet>
  );
}

export default CoverPage;
