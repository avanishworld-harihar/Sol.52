"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { DrawingSheet } from "./DrawingSheet";
import styles from "./Field.module.css";
import {
  fieldAnnualUnits,
  fieldDocNo,
  fieldDrawingSheetProps,
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
  const sizeKw = dcKwp > 0 ? dcKwp : systemKw;
  const sizeUnit = dcKwp > 0 ? "kWp" : systemKw > 0 ? "kW" : "";
  const arrayLabel =
    modules > 0 && watt > 0 ? `${modules} × ${watt}W` : modules > 0 ? `${modules} MOD` : "—";

  const specs = [
    {
      label: "System Size",
      value: sizeKw > 0 ? formatFieldKw(sizeKw, 1) : "—",
      unit: sizeUnit,
    },
    {
      label: "Panel Count",
      value: modules > 0 ? String(modules) : "—",
      unit: modules > 0 ? "nos" : "",
    },
    {
      label: "Est. Annual Yield",
      value: annual > 0 ? annual.toLocaleString("en-IN") : "—",
      unit: annual > 0 ? "kWh" : "",
    },
    { label: "Subsidy Eligible", value: subsidy ? "Yes" : "—", unit: "" },
  ];

  return (
    <DrawingSheet
      {...fieldDrawingSheetProps({
        data,
        proposalId,
        dwgNo: "FE-01",
        sheetLabel: "COVER / SYSTEM SPEC SHEET",
        page: 2,
      })}
    >
      <div className={styles.eyebrow}>Residential Solar · Field Engineering Proposal</div>
      <h1 className={styles.h1}>
        Rooftop Solar
        <br />
        System Specification
      </h1>
      <p className={styles.bodyText} style={{ maxWidth: "88%" }}>
        Prepared for <strong style={{ color: "var(--eng-ink)" }}>{sheet.familyName}</strong>
        {site !== "—" ? `, ${site}` : ""}. This set documents the site survey, system
        design, performance simulation, and financial calculation behind your
        proposed installation — drawn up the way our engineers actually specify
        it, not the way a brochure would.
      </p>

      <div className={styles.specStrip}>
        {specs.map((item) => (
          <div key={item.label} className={styles.specCell}>
            <div className={styles.specLabel}>{item.label}</div>
            <div className={styles.callout} style={{ fontSize: "21px" }}>
              {item.value}{" "}
              {item.unit ? <span className={styles.unit}>{item.unit}</span> : null}
            </div>
          </div>
        ))}
      </div>

      <svg
        viewBox="0 0 400 230"
        className={styles.diagram}
        style={{ marginTop: "14mm" }}
        role="img"
        aria-label="Roof footprint schematic"
      >
        <rect
          x="55"
          y="45"
          width="290"
          height="145"
          fill="none"
          className={styles.dimLine}
          strokeDasharray="4 3"
        />
        <rect
          x="90"
          y="70"
          width="110"
          height="60"
          fill="none"
          stroke="var(--eng-signal)"
          strokeWidth="2"
        />
        <text x="90" y="63" className={styles.dimText} fill="var(--eng-signal)" fontWeight="700">
          ARRAY ZONE — {arrayLabel}
        </text>
        <line x1="55" y1="32" x2="345" y2="32" className={styles.dimLine} />
        <text x="150" y="24" className={styles.dimText}>
          ROOF FOOTPRINT — NTS
          {dcKwp > 0 ? ` · ${formatFieldKw(dcKwp)} kWp DC` : ""}
        </text>
        <g transform="translate(345,160)">
          <circle r="22" fill="none" className={styles.dimLine} />
          <line x1="0" y1="-22" x2="0" y2="22" className={styles.dimLine} />
          <line x1="-22" y1="0" x2="22" y2="0" className={styles.dimLine} />
          <text x="-5" y="-27" className={styles.dimText} fontWeight="700">
            N
          </text>
        </g>
      </svg>

      <div className={`${styles.footRow} ${styles.note}`}>
        <span>
          Proposal ID:{" "}
          <span className={styles.mono} style={{ fontWeight: 600 }}>
            {fieldDocNo(proposalId, data.meta.generatedAt)}
          </span>
        </span>
        <span>Prepared by {sheet.preparedBy}</span>
      </div>
    </DrawingSheet>
  );
}

export default CoverPage;
