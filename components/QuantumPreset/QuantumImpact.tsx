"use client";

/**
 * Quantum Environment — clear clean-energy impact story.
 * Glanceable metrics + simple visuals (not Design Studio / SLD).
 */

import type { ProposalData } from "@/lib/proposal-data";
import { QUANTUM_SPECIFIC_YIELD } from "./quantum-brand";
import styles from "./Quantum.module.css";

export type QuantumImpactProps = {
  data: ProposalData;
};

function formatTrees(n: number): string {
  if (!(n > 0)) return "—";
  if (n >= 1000) {
    const k = n / 1000;
    return `${Number.isInteger(k) ? k : k.toFixed(1)}k+`;
  }
  return Math.round(n).toLocaleString("en-IN");
}

function IconCo2() {
  return (
    <svg viewBox="0 0 64 48" className={styles.impactIcon} aria-hidden>
      <ellipse cx="32" cy="40" rx="18" ry="3" fill="rgba(16,185,129,0.15)" />
      <rect x="10" y="18" width="36" height="16" rx="3" fill="#0c1a16" stroke="#10B981" strokeWidth="1.3" />
      <path d="M16 18 L22 10 H34 L40 18" fill="#122820" stroke="#10B981" strokeWidth="1.1" />
      <circle cx="18" cy="34" r="5" fill="#061210" stroke="#34D399" strokeWidth="1.1" />
      <circle cx="38" cy="34" r="5" fill="#061210" stroke="#34D399" strokeWidth="1.1" />
      <circle cx="52" cy="16" r="9" fill="#0a1a14" stroke="#10B981" strokeWidth="1.2" />
      <text x="52" y="19.5" textAnchor="middle" fill="#6EE7B7" fontSize="7" fontWeight="700">
        CO₂
      </text>
      <path d="M48 22 L56 10" stroke="#34D399" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function IconTrees() {
  return (
    <svg viewBox="0 0 64 48" className={styles.impactIcon} aria-hidden>
      <ellipse cx="32" cy="42" rx="16" ry="2.5" fill="rgba(16,185,129,0.15)" />
      <path d="M22 40 V34" stroke="#334155" strokeWidth="2.2" strokeLinecap="round" />
      <path
        d="M22 34 C14 34 12 26 16 20 C12 20 12 12 18 12 C20 6 28 6 30 12 C36 12 36 20 30 20 C34 26 28 34 22 34 Z"
        fill="rgba(16,185,129,0.35)"
        stroke="#10B981"
        strokeWidth="1.1"
      />
      <path d="M40 40 V30" stroke="#334155" strokeWidth="2.6" strokeLinecap="round" />
      <path
        d="M40 30 C28 30 24 20 28 12 C20 12 20 4 30 4 C32 0 48 0 50 4 C58 4 58 12 50 12 C54 20 50 30 40 30 Z"
        fill="rgba(16,185,129,0.5)"
        stroke="#34D399"
        strokeWidth="1.2"
      />
    </svg>
  );
}

function IconUnits() {
  return (
    <svg viewBox="0 0 64 48" className={styles.impactIcon} aria-hidden>
      <circle cx="48" cy="14" r="7" fill="rgba(16,185,129,0.35)" stroke="#10B981" strokeWidth="1.2" />
      {[0, 45, 90, 135].map((deg) => {
        const a = (deg * Math.PI) / 180;
        return (
          <line
            key={deg}
            x1={48 + Math.cos(a) * 9}
            y1={14 + Math.sin(a) * 9}
            x2={48 + Math.cos(a) * 12}
            y2={14 + Math.sin(a) * 12}
            stroke="#34D399"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        );
      })}
      <path
        d="M8 30 L28 16 L48 30 V42 H8 Z"
        fill="#0c1a16"
        stroke="#10B981"
        strokeWidth="1.2"
      />
      <rect x="18" y="24" width="10" height="7" fill="#122820" stroke="#34D399" strokeWidth="0.8" transform="rotate(-18 23 27.5)" />
      <rect x="28" y="22" width="10" height="7" fill="#122820" stroke="#34D399" strokeWidth="0.8" transform="rotate(-18 33 25.5)" />
      <rect x="26" y="32" width="8" height="10" fill="none" stroke="#64748b" strokeWidth="1" />
    </svg>
  );
}

export function QuantumImpact({ data }: QuantumImpactProps) {
  const co2 = data.impact.co2Tons > 0 ? data.impact.co2Tons : 0;
  const trees = data.impact.treesEquivalent > 0 ? data.impact.treesEquivalent : 0;
  const systemKw = Number(data.meta.systemKw) || 3;
  const annualUnits =
    data.closing.annualUnits > 0
      ? data.closing.annualUnits
      : Math.round(systemKw * QUANTUM_SPECIFIC_YIELD);

  const co2Label =
    co2 > 0
      ? co2 >= 10
        ? String(Math.round(co2))
        : co2.toFixed(1)
      : "—";

  const carsOff =
    co2 > 0 ? Math.max(1, Math.round(co2 / 4.6)) : 0; /* ~4.6 t CO₂/car/yr rough */

  const yearBars = [1, 2, 3, 4, 5].map((y) => ({
    year: `Y${y}`,
    units: annualUnits > 0 ? annualUnits * y : 0,
  }));
  const maxCum = yearBars[4]?.units || 1;

  return (
    <section className={`${styles.a4Page} ${styles.impactPage}`}>
      <div className={styles.impactGlow} aria-hidden />

      <div className={styles.pageHeader}>
        <span className={styles.impactEyebrow}>04 // ENVIRONMENT</span>
        <h2 className={styles.impactTitle}>Clean Energy Impact.</h2>
      </div>

      <p className={styles.impactLead}>
        Your solar plant makes clean power at home — less grid power, less carbon,
        and a greener footprint for 25 years.
      </p>

      <div className={styles.impactMetricGrid}>
        <div className={`${styles.glass3D} ${styles.impactCard}`}>
          <IconCo2 />
          <span className={styles.impactNum}>{co2Label}</span>
          <span className={styles.impactMetricLabel}>Tonnes CO₂ avoided</span>
          <span className={styles.impactMetricSub}>Over system life</span>
        </div>
        <div className={`${styles.glass3D} ${styles.impactCard}`}>
          <IconTrees />
          <span className={styles.impactNum}>{formatTrees(trees)}</span>
          <span className={styles.impactMetricLabel}>Trees equivalent</span>
          <span className={styles.impactMetricSub}>Same carbon benefit</span>
        </div>
        <div className={`${styles.glass3D} ${styles.impactCard}`}>
          <IconUnits />
          <span className={styles.impactNum}>
            {annualUnits > 0 ? annualUnits.toLocaleString("en-IN") : "—"}
          </span>
          <span className={styles.impactMetricLabel}>Clean units / year</span>
          <span className={styles.impactMetricSub}>Estimated generation</span>
        </div>
      </div>

      <div className={styles.impactBottomGrid}>
        <div className={`${styles.glass3D} ${styles.impactEquivCard}`}>
          <span className={styles.impactPanelTitle}>In simple words</span>
          <div className={styles.impactEquivList}>
            <div className={styles.impactEquivRow}>
              <span>Carbon cut</span>
              <strong>
                {co2 > 0 ? `${co2Label} tonnes CO₂` : "—"}
              </strong>
            </div>
            <div className={styles.impactEquivRow}>
              <span>Like planting</span>
              <strong>{trees > 0 ? `${formatTrees(trees)} trees` : "—"}</strong>
            </div>
            <div className={styles.impactEquivRow}>
              <span>Like taking cars off road</span>
              <strong>
                {carsOff > 0 ? `~${carsOff.toLocaleString("en-IN")} cars / year` : "—"}
              </strong>
            </div>
            <div className={styles.impactEquivRow}>
              <span>Plant size</span>
              <strong>{systemKw} kW rooftop solar</strong>
            </div>
          </div>
        </div>

        <div className={`${styles.glass3D} ${styles.impactChartCard}`}>
          <span className={styles.impactPanelTitle}>Clean units over 5 years</span>
          <p className={styles.impactChartSub}>
            Cumulative generation if the plant runs as estimated each year.
          </p>
          <div className={styles.impactBars}>
            {yearBars.map((b) => (
              <div key={b.year} className={styles.impactBarCol}>
                <span className={styles.impactBarVal}>
                  {b.units > 0
                    ? b.units >= 1000
                      ? `${(b.units / 1000).toFixed(b.units >= 10000 ? 0 : 1)}k`
                      : String(b.units)
                    : "—"}
                </span>
                <div className={styles.impactBarTrack}>
                  <div
                    className={styles.impactBarFill}
                    style={{
                      height: `${b.units > 0 ? Math.max(12, (b.units / maxCum) * 100) : 8}%`,
                    }}
                  />
                </div>
                <span className={styles.impactBarLabel}>{b.year}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.impactFooterNote}>
        Clean home power · lower carbon · greener choice for your family
      </div>
    </section>
  );
}

export default QuantumImpact;
