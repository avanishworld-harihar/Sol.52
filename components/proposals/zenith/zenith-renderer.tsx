"use client";

/**
 * Zenith — ProposalData-native isolated preset.
 * All UI maps from `data`; styles scoped under CSS Modules root `.presetZenith`.
 */

import type { ProposalData } from "@/lib/proposal-data";
import {
  formatInr,
  formatLifetimeBenefitInr,
} from "@/components/proposals/_shared/formatters";
import styles from "./zenith.module.css";

export type ZenithProposalRendererProps = {
  data: ProposalData;
};

function hasBom(data: ProposalData): boolean {
  return Array.isArray(data.bom) && data.bom.length > 0;
}

function hasImpact(data: ProposalData): boolean {
  const trees = data.impact?.treesEquivalent ?? 0;
  const co2 = data.impact?.co2Tons ?? 0;
  return trees > 0 || co2 > 0;
}

function EmptyState({ message }: { message: string }) {
  return <p className={styles.emptyState}>{message}</p>;
}

export function ZenithProposalRenderer({ data }: ZenithProposalRendererProps) {
  const meta = data.meta;
  const economics = data.economics;
  const bill = data.bill;
  const showBill = Boolean(bill?.hasData && bill.months?.length);
  const showBom = hasBom(data);
  const showImpact = hasImpact(data);

  return (
    <div className={styles.presetZenith}>
      {/* Cover */}
      <header className={styles.header}>
        <p className={styles.kicker}>Zenith · Masterplan</p>
        <h1 className={styles.title}>{meta.brandName || "Solar Partner"}</h1>
        <p className={styles.subtitle}>
          Proposal for {meta.customerName || "Valued Customer"}
          {meta.locationLine && meta.locationLine !== "—"
            ? ` · ${meta.locationLine}`
            : ""}
        </p>
        <p className={styles.assetLine}>{meta.assetProfileLine}</p>
      </header>

      {/* Wealth hero */}
      <section className={styles.hero} aria-label="Economics">
        <p className={styles.heroLabel}>25-year wealth</p>
        <p className={styles.heroValue}>
          {economics.lifetimeProfitInr > 0
            ? formatLifetimeBenefitInr(economics.lifetimeProfitInr)
            : "—"}
        </p>
        <div className={styles.statRow}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>System</span>
            <span className={styles.statValue}>{meta.systemKw || "—"} kW</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Net investment</span>
            <span className={styles.statValue}>
              {economics.netInr > 0 ? formatInr(economics.netInr) : "—"}
            </span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Payback</span>
            <span className={styles.statValue}>
              {economics.paybackYears > 0 ? `${economics.paybackYears} yrs` : "—"}
            </span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Monthly savings</span>
            <span className={styles.statValue}>
              {economics.monthlySavingsInr > 0
                ? formatInr(economics.monthlySavingsInr)
                : "—"}
            </span>
          </div>
        </div>
      </section>

      {/* Bill */}
      <section className={styles.section} aria-label="Bill intelligence">
        <h2 className={styles.sectionTitle}>Bill intelligence</h2>
        {showBill ? (
          <>
            <p className={styles.sectionLead}>
              Annual bill {formatInr(bill.yearlyBillInr)} · Solar offset{" "}
              {bill.solarSavingsPct}%
            </p>
            <div className={styles.billGrid}>
              {bill.months.map((m) => (
                <div
                  key={m.label}
                  className={
                    m.isSummerPeak ? styles.billCellPeak : styles.billCell
                  }
                >
                  <span className={styles.billMonth}>{m.label}</span>
                  <span className={styles.billAmount}>{formatInr(m.netInr)}</span>
                  <div
                    className={styles.billBar}
                    style={{ height: `${m.barHeightPct}%` }}
                    aria-hidden
                  />
                </div>
              ))}
            </div>
          </>
        ) : (
          <EmptyState message="Bill data not available yet — requirement-based sizing in use." />
        )}
      </section>

      {/* Impact */}
      <section className={styles.section} aria-label="Impact">
        <h2 className={styles.sectionTitle}>Carbon legacy</h2>
        {showImpact ? (
          <div className={styles.impactRow}>
            <div>
              <p className={styles.impactValue}>
                {(data.impact.treesEquivalent ?? 0).toLocaleString("en-IN")}
              </p>
              <p className={styles.impactLabel}>Trees equivalent</p>
            </div>
            <div>
              <p className={styles.impactValue}>
                {(data.impact.co2Tons ?? 0).toLocaleString("en-IN")}
              </p>
              <p className={styles.impactLabel}>Tonnes CO₂ offset</p>
            </div>
          </div>
        ) : (
          <EmptyState message="Impact metrics will appear once generation data is calculated." />
        )}
      </section>

      {/* BOM */}
      <section className={styles.section} aria-label="Bill of materials">
        <h2 className={styles.sectionTitle}>System architecture</h2>
        {showBom ? (
          <ul className={styles.bomList}>
            {data.bom.map((row, i) => (
              <li key={`${row.name}-${i}`} className={styles.bomRow}>
                <div>
                  <p className={styles.bomName}>{row.name}</p>
                  {row.brand ? (
                    <p className={styles.bomBrand}>{row.brand}</p>
                  ) : null}
                </div>
                <div className={styles.bomRight}>
                  <p className={styles.bomSpec}>{row.spec || "—"}</p>
                  <p className={styles.bomWar}>{row.warranty || "—"}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState message="Component list pending — BOM will populate from system configuration." />
        )}
      </section>

      {/* Engineering */}
      <section className={styles.section} aria-label="Engineering">
        <h2 className={styles.sectionTitle}>Design parameters</h2>
        {data.engineering.metrics.length > 0 ? (
          <div className={styles.metricGrid}>
            {data.engineering.metrics.map((m) => (
              <div key={m.label} className={styles.metric}>
                <span className={styles.metricLabel}>{m.label}</span>
                <span className={styles.metricValue}>{m.value}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="Engineering metrics not populated yet." />
        )}
      </section>

      {/* Closing */}
      <footer className={styles.footer}>
        <p className={styles.footerQuote}>Welcome to the future of energy.</p>
        <p className={styles.footerMeta}>
          {data.closing.installerName}
          {data.closing.contactLine ? ` · ${data.closing.contactLine}` : ""}
        </p>
      </footer>
    </div>
  );
}

export default ZenithProposalRenderer;
