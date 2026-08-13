"use client";

/**
 * Quantum Telemetry — Luxe-style engineering: Roof Array Plan + metrics + architecture.
 * Schematic illustration only — not Design Studio / live SLD.
 */

import type { ProposalData } from "@/lib/proposal-data";
import {
  QUANTUM_PANEL_WATT,
  QUANTUM_SPECIFIC_YIELD,
  quantumDcAcRatio,
  quantumDcKwp,
  quantumModuleCount,
  quantumStringLabel,
  quantumStringSizes,
} from "./quantum-brand";
import { QuantumAtmosphere } from "./QuantumAtmosphere";
import {
  IconAcdb,
  IconDcdb,
  IconInv,
  IconMeter,
  IconPv,
} from "./QuantumArchIcons";
import { QuantumRoofArray } from "./QuantumRoofArray";
import { useQuantumLang } from "./quantum-lang-context";
import styles from "./Quantum.module.css";

export type QuantumTelemetryProps = {
  data: ProposalData;
};

const LOCK_AC_KW = 3;
const LOCK_DC_KWP = 3.48;
const LOCK_DC_AC = 1.16;
const SQFT_PER_PANEL = 24;

const ARCH_ICONS = [IconPv, IconDcdb, IconInv, IconAcdb, IconMeter] as const;
const ARCH_CODES = ["PV", "DCDB", "INV", "ACDB", "GRID"] as const;

function FlowArrow() {
  return (
    <span className={styles.engFlowArrow} aria-hidden>
      <svg width="20" height="12" viewBox="0 0 20 12">
        <path
          d="M0 6h14M11 2l7 4-7 4"
          fill="none"
          stroke="#06B6D4"
          strokeWidth="1.5"
        />
      </svg>
    </span>
  );
}

export function QuantumTelemetry({ data }: QuantumTelemetryProps) {
  const { copy } = useQuantumLang();
  const systemKw = Number(data.meta.systemKw) || LOCK_AC_KW;
  const moduleCount = quantumModuleCount(systemKw) || 6;
  const dcKwp =
    systemKw === LOCK_AC_KW
      ? LOCK_DC_KWP
      : quantumDcKwp(moduleCount) || LOCK_DC_KWP;
  const dcAc =
    systemKw === LOCK_AC_KW
      ? LOCK_DC_AC
      : Number(quantumDcAcRatio(dcKwp, systemKw).toFixed(2)) || LOCK_DC_AC;

  const tilt = data.engineering.tiltDeg ?? 20;
  const city =
    data.engineering.cityLabel?.trim() ||
    data.meta.locationLine?.split(",")[0]?.trim() ||
    "Satna";
  const roofSqft = Math.round(moduleCount * SQFT_PER_PANEL);
  const stringSizes = quantumStringSizes(moduleCount);
  const stringLabel = quantumStringLabel(stringSizes);
  const annualUnits =
    data.closing.annualUnits > 0
      ? data.closing.annualUnits
      : Math.round(systemKw * QUANTUM_SPECIFIC_YIELD);
  const specificYield =
    systemKw > 0 ? Math.round(annualUnits / systemKw) : QUANTUM_SPECIFIC_YIELD;
  const acLabel = systemKw % 1 ? systemKw.toFixed(1) : String(systemKw);
  const standards =
    data.engineering.standards.length > 0
      ? data.engineering.standards.slice(0, 4).join(" · ")
      : copy.eng.standardsFallback;

  const archSubs = [
    `${moduleCount}×${QUANTUM_PANEL_WATT} Wp`,
    copy.eng.archSubsStatic[0],
    `${acLabel} kW`,
    copy.eng.archSubsStatic[1],
    copy.eng.archSubsStatic[2],
  ];

  return (
    <section className={`${styles.a4Page} ${styles.telemetryPage}`}>
      <QuantumAtmosphere variant="engineering" />

      <div className={styles.pageStack}>
        <div className={styles.pageHeader}>
          <span
            className={styles.cyanText}
            style={{ fontSize: "0.75rem", letterSpacing: "3px" }}
          >
            {copy.eng.eyebrow}
          </span>
          <h2 className={styles.telemetryHeadline}>{copy.eng.title}</h2>
        </div>

        <div className={styles.engLayout}>
          <div className={`${styles.glass3D} ${styles.engPanelFlush}`}>
            <span className={styles.engPanelTitle}>{copy.eng.roofPlan}</span>
            <QuantumRoofArray
              modules={moduleCount}
              dcKwp={dcKwp}
              tilt={tilt}
              panelWatt={QUANTUM_PANEL_WATT}
              stringLabel={stringLabel}
            />
          </div>

          <div className={styles.glass3D}>
            <span className={styles.engPanelTitle}>{copy.eng.metrics}</span>
            <div className={styles.engMetricList}>
              <div className={styles.engMetricRow}>
                <span>{copy.eng.location}</span>
                <strong>{city}</strong>
                <small>{copy.eng.locationNote}</small>
              </div>
              <div className={styles.engMetricRow}>
                <span>{copy.eng.roofArea}</span>
                <strong>~{roofSqft} sq ft</strong>
                <small>
                  {copy.eng.roofAreaNote(moduleCount, SQFT_PER_PANEL)}
                </small>
              </div>
              <div className={styles.engMetricRow}>
                <span>{copy.eng.stringLayout}</span>
                <strong>
                  {stringLabel} @ {QUANTUM_PANEL_WATT} Wp
                </strong>
                <small>{copy.eng.stringNote}</small>
              </div>
              <div className={styles.engMetricRow}>
                <span>{copy.eng.yearlyOutput}</span>
                <strong>{specificYield.toLocaleString("en-IN")} kWh/kW</strong>
                <small>
                  {copy.eng.yearlyNote(annualUnits.toLocaleString("en-IN"))}
                </small>
              </div>
            </div>

            <div className={styles.engChipRow}>
              <div className={styles.engChip}>
                <em>{copy.eng.chipDc}</em>
                <strong>{dcKwp.toFixed(2)} kWp</strong>
              </div>
              <div className={styles.engChip}>
                <em>{copy.eng.chipAc}</em>
                <strong>{acLabel} kW</strong>
              </div>
              <div className={styles.engChip}>
                <em>{copy.eng.chipDcAc}</em>
                <strong>{dcAc.toFixed(2)}</strong>
              </div>
              <div className={styles.engChip}>
                <em>{copy.eng.chipTilt}</em>
                <strong>{tilt.toFixed(0)}°</strong>
              </div>
            </div>
          </div>
        </div>

        <div className={`${styles.glass3D} ${styles.engArchPanel}`}>
          <span className={styles.engPanelTitle}>{copy.eng.architecture}</span>
          <p className={styles.engArchLead}>{copy.eng.archLead}</p>
          <div className={styles.engArchTrack}>
            {ARCH_CODES.map((code, i) => {
              const Icon = ARCH_ICONS[i]!;
              return (
                <div key={code} className={styles.engArchNodeSlot}>
                  {i > 0 ? <FlowArrow /> : null}
                  <div className={styles.engArchNode}>
                    <Icon />
                    <span className={styles.engArchCode}>{code}</span>
                    <strong>{copy.eng.archNames[i]}</strong>
                    <em>{archSubs[i]}</em>
                  </div>
                </div>
              );
            })}
          </div>
          <div className={styles.engPrStrip}>
            <span>{copy.eng.prStrip}</span>
            <span className={styles.engStandards}>{standards}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default QuantumTelemetry;
