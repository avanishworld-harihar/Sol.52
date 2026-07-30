"use client";

/**
 * Quantum Telemetry — aerospace-style engineering HUD.
 * Data rings + structural PV→inverter→grid schematic (inline SVG only).
 */

import type { ProposalData } from "@/lib/proposal-data";
import styles from "./Quantum.module.css";

export type QuantumTelemetryProps = {
  data: ProposalData;
};

const PANEL_WATT = 580;
const SPECIFIC_YIELD = 1450; // kWh/kWp·yr — Central India reference

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

function DataRing({
  progress,
  size = 200,
  stroke = 10,
  track = "rgba(148,163,184,0.15)",
  accent = "#06b6d4",
}: {
  progress: number;
  size?: number;
  stroke?: number;
  track?: string;
  accent?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = clamp01(progress);
  const dash = c * p;
  const gap = c - dash;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={track}
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={accent}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${gap}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      {/* Tick marks */}
      {Array.from({ length: 24 }).map((_, i) => {
        const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
        const inner = r - stroke / 2 - 6;
        const outer = r - stroke / 2 - 2;
        return (
          <line
            key={i}
            x1={size / 2 + Math.cos(a) * inner}
            y1={size / 2 + Math.sin(a) * inner}
            x2={size / 2 + Math.cos(a) * outer}
            y2={size / 2 + Math.sin(a) * outer}
            stroke={i % 6 === 0 ? "#22d3ee" : "rgba(148,163,184,0.35)"}
            strokeWidth={i % 6 === 0 ? 1.4 : 0.8}
          />
        );
      })}
    </svg>
  );
}

/** Structural single-line diagram: Array → DCDB → Inverter → ACDB → Net Meter. */
function InterconnectionSchematic() {
  return (
    <svg
      viewBox="0 0 420 180"
      width="100%"
      height="100%"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <marker
          id="qArrow"
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <path d="M0 0 L6 3 L0 6 Z" fill="#06b6d4" />
        </marker>
      </defs>

      {/* Bus backbone */}
      <line
        x1="48"
        y1="90"
        x2="372"
        y2="90"
        stroke="rgba(6,182,212,0.35)"
        strokeWidth="1.5"
        strokeDasharray="3 3"
        markerEnd="url(#qArrow)"
      />

      {[
        { x: 40, label: "PV ARRAY", sub: "DC STRING" },
        { x: 120, label: "DCDB", sub: "SPD · FUSE" },
        { x: 200, label: "INVERTER", sub: "MPPT · GRID" },
        { x: 280, label: "ACDB", sub: "MCB · ELCB" },
        { x: 360, label: "NET METER", sub: "DISCOM" },
      ].map((node) => (
        <g key={node.label} transform={`translate(${node.x}, 90)`}>
          <rect
            x="-28"
            y="-28"
            width="56"
            height="56"
            rx="2"
            fill="rgba(6,182,212,0.08)"
            stroke="#06b6d4"
            strokeWidth="1.2"
          />
          <rect
            x="-24"
            y="-24"
            width="8"
            height="8"
            fill="none"
            stroke="rgba(34,211,238,0.5)"
            strokeWidth="0.8"
          />
          <rect
            x="16"
            y="16"
            width="8"
            height="8"
            fill="none"
            stroke="rgba(34,211,238,0.5)"
            strokeWidth="0.8"
          />
          <circle cx="0" cy="0" r="4" fill="#22d3ee" />
          <text
            y="44"
            textAnchor="middle"
            fill="#f8fafc"
            fontSize="8"
            fontFamily="Space Grotesk, sans-serif"
            fontWeight="600"
            letterSpacing="0.8"
          >
            {node.label}
          </text>
          <text
            y="56"
            textAnchor="middle"
            fill="#64748b"
            fontSize="6.5"
            fontFamily="JetBrains Mono, monospace"
            letterSpacing="0.6"
          >
            {node.sub}
          </text>
        </g>
      ))}

      {/* Earthing symbol */}
      <g transform="translate(200, 150)">
        <line x1="0" y1="-12" x2="0" y2="0" stroke="#94a3b8" strokeWidth="1" />
        <line x1="-12" y1="0" x2="12" y2="0" stroke="#94a3b8" strokeWidth="1.2" />
        <line x1="-8" y1="5" x2="8" y2="5" stroke="#94a3b8" strokeWidth="1" />
        <line x1="-4" y1="10" x2="4" y2="10" stroke="#94a3b8" strokeWidth="1" />
        <text
          y="22"
          textAnchor="middle"
          fill="#64748b"
          fontSize="6"
          fontFamily="JetBrains Mono, monospace"
          letterSpacing="1"
        >
          EQUIPOTENTIAL BOND
        </text>
      </g>
    </svg>
  );
}

function IrradianceProfile({ peakMonthIndex }: { peakMonthIndex: number }) {
  const months = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
  // Central India relative irradiance shape (normalized)
  const profile = [0.72, 0.8, 0.92, 0.98, 1, 0.88, 0.78, 0.8, 0.86, 0.9, 0.78, 0.7];
  const w = 280;
  const h = 88;
  const pad = 8;
  const barW = (w - pad * 2) / 12 - 4;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%" aria-hidden>
      {profile.map((v, i) => {
        const bh = v * (h - 28);
        const x = pad + i * ((w - pad * 2) / 12);
        const y = h - 18 - bh;
        const peak = i === peakMonthIndex;
        return (
          <g key={months[i]}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={bh}
              fill={peak ? "#22d3ee" : "rgba(6,182,212,0.35)"}
              rx="1"
            />
            <text
              x={x + barW / 2}
              y={h - 4}
              textAnchor="middle"
              fill="#64748b"
              fontSize="7"
              fontFamily="JetBrains Mono, monospace"
            >
              {months[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function QuantumTelemetry({ data }: QuantumTelemetryProps) {
  const brand = data.meta.brandName?.trim() || "Harihar Solar";
  const systemKw = Number(data.meta.systemKw) || 0;
  const moduleCount =
    systemKw > 0 ? Math.max(1, Math.round((systemKw * 1000) / PANEL_WATT)) : 0;
  const dcKw = moduleCount > 0 ? (moduleCount * PANEL_WATT) / 1000 : systemKw;
  const dcAcRatio = systemKw > 0 ? dcKw / systemKw : 1.1;

  const annualGen =
    data.closing.annualUnits > 0
      ? data.closing.annualUnits
      : systemKw > 0
        ? Math.round(systemKw * SPECIFIC_YIELD)
        : 0;

  const coveragePct =
    data.bill.solarSavingsPct > 0
      ? clamp01(data.bill.solarSavingsPct / 100)
      : annualGen > 0 && data.bill.totals.units > 0
        ? clamp01(annualGen / data.bill.totals.units)
        : 0.85;

  const tilt =
    typeof data.engineering.tiltDeg === "number" && data.engineering.tiltDeg > 0
      ? data.engineering.tiltDeg
      : 23;
  const city = data.engineering.cityLabel?.trim() || "Central India";

  const peakMonthIndex =
    data.bill.months.findIndex((m) => m.isSummerPeak) >= 0
      ? data.bill.months.findIndex((m) => m.isSummerPeak) % 12
      : 4;

  return (
    <section className={styles.a4Page}>
      <div className={styles.atmosphere} aria-hidden>
        <svg width="100%" height="100%" viewBox="0 0 210 297" preserveAspectRatio="none">
          <defs>
            <radialGradient id="qHudBloom" cx="20%" cy="20%" r="50%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="210" height="297" fill="#111827" />
          <rect width="210" height="297" fill="url(#qHudBloom)" />
        </svg>
      </div>

      <div className={styles.telemetryInner}>
        <header className={styles.telemetryHeader}>
          <div>
            <p className={styles.eyebrow}>Engineering Telemetry</p>
            <h2 className={styles.telemetryTitle}>
              Array Performance
              <br />
              Envelope
            </h2>
          </div>
          <div className={styles.telemetryStatus}>
            <span className={styles.telemetryStatusDot} />
            LINK ACTIVE · NET-METER PATH
          </div>
        </header>

        <div className={styles.hudGrid}>
          <div className={`${styles.glassPanel} ${styles.hudCell}`}>
            <div className={styles.hudCellLabel}>Load Offset Coefficient</div>
            <div className={styles.ringStage}>
              <DataRing progress={coveragePct} size={168} />
              <div className={styles.ringCenterReadout}>
                <span className={styles.ringValue}>
                  {Math.round(coveragePct * 100)}
                </span>
                <span className={styles.ringUnit}>% Bill Offset</span>
              </div>
            </div>
          </div>

          <div className={`${styles.glassPanel} ${styles.hudCell}`}>
            <div className={styles.hudCellLabel}>Irradiance Seasonality</div>
            <div className={styles.schematicWrap}>
              <IrradianceProfile peakMonthIndex={peakMonthIndex} />
            </div>
          </div>

          <div className={`${styles.glassPanel} ${styles.hudCell} ${styles.hudCellWide}`}>
            <div className={styles.hudCellLabel}>
              Interconnection Topology · PV → DCDB → Inverter → ACDB → Net Meter
            </div>
            <div className={styles.schematicWrap} style={{ minHeight: 120 }}>
              <InterconnectionSchematic />
            </div>
          </div>
        </div>

        <div className={styles.metricStrip}>
          <div className={styles.metricChip}>
            <span className={styles.metricChipLabel}>DC Nameplate</span>
            <span className={styles.metricChipValue}>
              {dcKw > 0 ? `${dcKw.toFixed(2)} kWp` : "—"}
            </span>
          </div>
          <div className={styles.metricChip}>
            <span className={styles.metricChipLabel}>DC/AC Ratio</span>
            <span className={styles.metricChipValue}>
              {systemKw > 0 ? dcAcRatio.toFixed(2) : "—"}
            </span>
          </div>
          <div className={styles.metricChip}>
            <span className={styles.metricChipLabel}>Array Tilt</span>
            <span className={styles.metricChipValue}>{tilt}°</span>
          </div>
          <div className={styles.metricChip}>
            <span className={styles.metricChipLabel}>Annual Yield</span>
            <span className={styles.metricChipValue}>
              {annualGen > 0
                ? `${annualGen.toLocaleString("en-IN")} kWh`
                : "—"}
            </span>
          </div>
        </div>

        <div className={styles.metricStrip} style={{ gridTemplateColumns: "1.4fr 1fr 1fr" }}>
          <div className={styles.metricChip}>
            <span className={styles.metricChipLabel}>Module Field</span>
            <span className={styles.metricChipValue}>
              {moduleCount > 0
                ? `${moduleCount} × ${PANEL_WATT}W mono PERC`
                : "Tier-1 mono PERC"}
            </span>
          </div>
          <div className={styles.metricChip}>
            <span className={styles.metricChipLabel}>Specific Yield</span>
            <span className={styles.metricChipValue}>{SPECIFIC_YIELD} kWh/kWp</span>
          </div>
          <div className={styles.metricChip}>
            <span className={styles.metricChipLabel}>Climate Zone</span>
            <span className={styles.metricChipValue}>{city}</span>
          </div>
        </div>

        <footer className={styles.pageFooter}>
          <span className={styles.pageFooterAccent}>{brand.toUpperCase()}</span>
          <span>02 / 03 · TELEMETRY</span>
        </footer>
      </div>
    </section>
  );
}

export default QuantumTelemetry;
