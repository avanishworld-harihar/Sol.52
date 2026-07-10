"use client";

/**
 * Zenith Luxury — full brochure from ProposalData.
 * Design language: Midnight Onyx · Pearl · Champagne Gold · Playfair + Inter.
 * Content mirrors Golden coverage; structure stays Zenith.
 */

import { useEffect, useState } from "react";
import type { ProposalData } from "@/lib/proposal-data";
import {
  formatInr,
  formatInrCompact,
  formatLifetimeBenefitInr,
} from "@/components/proposals/_shared/formatters";
import {
  PROPOSAL_BRANDING_UPDATED_EVENT,
  readProposalBrandingSettings,
} from "@/lib/proposal-branding-settings";
import { TechnicalSpecs } from "@/components/proposals/zenith/pages/TechnicalSpecs";
import { WarrantyMatrix } from "@/components/proposals/zenith/pages/WarrantyMatrix";
import { Execution } from "@/components/proposals/zenith/pages/Execution";
import { TermsCompliance } from "@/components/proposals/zenith/pages/TermsCompliance";
import styles from "./zenith.module.css";

export type ZenithProposalRendererProps = {
  data: ProposalData;
  /** Fallback when ppt logo is not yet on ProposalData.meta */
  installerLogoUrl?: string;
};

function warrantyClass(warranty: string): string {
  const years = Number((warranty.match(/(\d+)\s*(?:year|yr)/i)?.[1] ?? "").trim());
  if (Number.isFinite(years) && years >= 25) return styles.textEmerald;
  return styles.textGold;
}

function PageHeader({ title, lead }: { title: string; lead?: string }) {
  return (
    <>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <div className={styles.goldRule} aria-hidden />
      {lead ? <p className={styles.sectionLead}>{lead}</p> : null}
    </>
  );
}

export function ZenithProposalRenderer({
  data,
  installerLogoUrl,
}: ZenithProposalRendererProps) {
  const [logoUrl, setLogoUrl] = useState<string | undefined>(() => {
    return (
      data?.meta.brandLogoUrl?.trim() ||
      installerLogoUrl?.trim() ||
      undefined
    );
  });

  useEffect(() => {
    const sync = () => {
      const fromData = data?.meta.brandLogoUrl?.trim() ?? "";
      const fromProp = installerLogoUrl?.trim() ?? "";
      const fromLocal = readProposalBrandingSettings().installerLogoUrl?.trim() ?? "";
      setLogoUrl(fromData || fromProp || fromLocal || undefined);
    };
    sync();
    window.addEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, sync);
    return () => window.removeEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, sync);
  }, [data?.meta.brandLogoUrl, installerLogoUrl]);

  if (!data) {
    return <div className={styles.loading}>Loading Proposal...</div>;
  }

  const brand = data.meta.brandName?.trim() || "Harihar Solar";
  const customer = data.meta.customerName?.trim() || "your home";
  const lifetime =
    data.economics.lifetimeProfitInr > 0
      ? formatLifetimeBenefitInr(data.economics.lifetimeProfitInr)
      : "long-term wealth";
  const bom = Array.isArray(data.bom) ? data.bom : [];

  const eco = data.economics;
  const bill = data.bill;
  const eng = data.engineering;
  const warranty = data.warranty;
  const execution = data.execution;
  const terms = data.terms;
  const closing = data.closing;
  const impact = data.impact;

  return (
    <div className={styles.shell}>
      <div className={styles.presetZenith}>
        {/* 1 — COVER */}
        <section className={styles.cover}>
          <div className={styles.coverBrand}>
            {logoUrl ? (
              <img src={logoUrl} alt={brand} className={styles.coverLogo} />
            ) : (
              <p className={styles.brand}>{brand}</p>
            )}
          </div>
          <h1 className={styles.heroTitle}>Your home, energy independent.</h1>
          <p className={styles.heroSub}>
            Generating your own power for 25 years. Saving you {lifetime} starting
            today
            {customer && customer !== "Valued Customer" ? ` — curated for ${customer}` : ""}.
          </p>
          {(data.meta.systemKw > 0 || data.meta.locationLine) && (
            <p className={styles.coverMeta}>
              {data.meta.systemKw > 0 ? `${data.meta.systemKw} kW` : null}
              {data.meta.systemKw > 0 && data.meta.locationLine ? " · " : null}
              {data.meta.locationLine && data.meta.locationLine !== "—"
                ? data.meta.locationLine
                : null}
            </p>
          )}
          {data.meta.assetProfileLine ? (
            <p className={styles.coverAsset}>{data.meta.assetProfileLine}</p>
          ) : null}
        </section>

        {/* 2 — BILL or REQUIREMENT */}
        {bill.hasData && bill.months.length > 0 ? (
          <section className={styles.contentPage}>
            <PageHeader
              title="Bill intelligence"
              lead="Your annual electricity pattern — and where summer quietly takes the most."
            />
            <div className={styles.statRow}>
              <div className={styles.statCard}>
                <p className={styles.statLabel}>Yearly bill</p>
                <p className={styles.statValue}>{formatInrCompact(bill.yearlyBillInr)}</p>
              </div>
              <div className={styles.statCard}>
                <p className={styles.statLabel}>Solar offset</p>
                <p className={styles.statValue}>{Math.round(bill.solarSavingsPct)}%</p>
              </div>
              <div className={styles.statCard}>
                <p className={styles.statLabel}>Summer share</p>
                <p className={styles.statValue}>{Math.round(bill.summerTrapPct)}%</p>
              </div>
            </div>
            <div className={styles.barChart} aria-hidden>
              {bill.months.map((m) => (
                <div key={m.label} className={styles.barCol}>
                  <div
                    className={`${styles.bar} ${m.isSummerPeak ? styles.barPeak : ""}`}
                    style={{ height: `${Math.max(8, m.barHeightPct)}%` }}
                  />
                  <span className={styles.barLabel}>{m.label}</span>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className={styles.contentPage}>
            <PageHeader
              title="System requirement"
              lead="Sized to your declared load — generation, coverage, and asset profile."
            />
            <div className={styles.statRow}>
              <div className={styles.statCard}>
                <p className={styles.statLabel}>System size</p>
                <p className={styles.statValue}>{data.meta.systemKw || "—"} kW</p>
              </div>
              <div className={styles.statCard}>
                <p className={styles.statLabel}>Annual units</p>
                <p className={styles.statValue}>
                  {closing.annualUnits > 0
                    ? closing.annualUnits.toLocaleString("en-IN")
                    : "—"}
                </p>
              </div>
              <div className={styles.statCard}>
                <p className={styles.statLabel}>Profile</p>
                <p className={styles.statValueSm}>{data.meta.assetProfileLine || "—"}</p>
              </div>
            </div>
          </section>
        )}

        {/* 3 — ECONOMICS */}
        <section className={styles.contentPage}>
          <PageHeader
            title="Investment ledger"
            lead="Capital, subsidy, payback, and the wealth your roof can compound."
          />
          <div className={styles.ledgerGrid}>
            <div className={styles.ledgerItem}>
              <span className={styles.ledgerLabel}>Gross system</span>
              <span className={styles.ledgerValue}>{formatInr(eco.grossInr)}</span>
            </div>
            <div className={styles.ledgerItem}>
              <span className={styles.ledgerLabel}>PM Surya Ghar subsidy</span>
              <span className={styles.ledgerValue}>{formatInr(eco.subsidyInr)}</span>
            </div>
            <div className={styles.ledgerItem}>
              <span className={styles.ledgerLabel}>Net payable</span>
              <span className={`${styles.ledgerValue} ${styles.ledgerEmph}`}>
                {formatInr(eco.netInr)}
              </span>
            </div>
            <div className={styles.ledgerItem}>
              <span className={styles.ledgerLabel}>Monthly savings</span>
              <span className={styles.ledgerValue}>{formatInr(eco.monthlySavingsInr)}</span>
            </div>
            <div className={styles.ledgerItem}>
              <span className={styles.ledgerLabel}>Payback</span>
              <span className={styles.ledgerValue}>
                {eco.paybackYears > 0 ? `${eco.paybackYears.toFixed(1)} yrs` : "—"}
              </span>
            </div>
            <div className={styles.ledgerItem}>
              <span className={styles.ledgerLabel}>Lifetime benefit</span>
              <span className={`${styles.ledgerValue} ${styles.textGold}`}>
                {formatLifetimeBenefitInr(eco.lifetimeProfitInr)}
              </span>
            </div>
          </div>
          {eco.emiRows.length > 0 ? (
            <>
              <h3 className={styles.subTitle}>Financing options</h3>
              <table className={styles.bomTable}>
                <thead>
                  <tr>
                    <th scope="col">Tenure</th>
                    <th scope="col">Monthly EMI</th>
                    <th scope="col">Interest</th>
                  </tr>
                </thead>
                <tbody>
                  {eco.emiRows.map((row) => (
                    <tr key={row.tenureLabel}>
                      <td className={styles.bomName}>{row.tenureLabel}</td>
                      <td>{formatInr(row.monthlyEmiInr)}</td>
                      <td className={styles.bomSpec}>{formatInr(row.interestPaidInr)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : null}
        </section>

        {/* 4 — IMPACT */}
        <section className={styles.contentPage}>
          <PageHeader
            title="Environmental impact"
            lead="Clean generation measured in carbon avoided and trees equivalent."
          />
          <div className={styles.statRow}>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>CO₂ avoided</p>
              <p className={styles.statValue}>
                {impact.co2Tons > 0 ? `${impact.co2Tons.toFixed(0)} t` : "—"}
              </p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Trees equivalent</p>
              <p className={styles.statValue}>
                {impact.treesEquivalent > 0
                  ? impact.treesEquivalent.toLocaleString("en-IN")
                  : "—"}
              </p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Annual savings</p>
              <p className={styles.statValue}>
                {closing.annualSavingsInr > 0
                  ? formatInrCompact(closing.annualSavingsInr)
                  : "—"}
              </p>
            </div>
          </div>
        </section>

        {/* 5 — ENGINEERING */}
        {eng.metrics.length > 0 ? (
          <section className={styles.contentPage}>
            <PageHeader
              title="Engineering brief"
              lead={
                eng.tiltNote ||
                "Site-tuned metrics for generation, tilt, and compliance standards."
              }
            />
            <div className={styles.metricGrid}>
              {eng.metrics.map((m) => (
                <div key={m.label} className={styles.metricCard}>
                  <p className={styles.metricLabel}>{m.label}</p>
                  <p className={styles.metricValue}>{m.value}</p>
                </div>
              ))}
            </div>
            {eng.standards.length > 0 ? (
              <p className={styles.standards}>
                Standards · {eng.standards.join(" · ")}
              </p>
            ) : null}
          </section>
        ) : null}

        {/* 6 — TECHNICAL ARCHITECTURE (grid cards) */}
        <TechnicalSpecs bom={bom} />

        {/* 7 — BOM */}
        <section className={styles.contentPage}>
          <PageHeader title="Tier-1 Engineering" />
          {bom.length > 0 ? (
            <table className={styles.bomTable}>
              <thead>
                <tr>
                  <th scope="col">Component</th>
                  <th scope="col">Specification</th>
                  <th scope="col">Warranty</th>
                </tr>
              </thead>
              <tbody>
                {bom.map((item, i) => (
                  <tr key={`${item.name}-${i}`}>
                    <td>
                      <span className={styles.bomName}>{item.name}</span>
                      {item.brand ? (
                        <span className={styles.bomBrand}>{item.brand}</span>
                      ) : null}
                    </td>
                    <td className={styles.bomSpec}>{item.spec || "—"}</td>
                    <td className={warrantyClass(item.warranty || "")}>
                      {item.warranty || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className={styles.emptyState}>
              Component list pending — BOM will populate from system configuration.
            </p>
          )}
        </section>

        {/* 8 — WARRANTY MATRIX */}
        <WarrantyMatrix warranty={warranty} />

        {/* 9 — EXECUTION & SETTLEMENT */}
        <Execution execution={execution} />

        {/* 10 — TERMS & COMPLIANCE */}
        <TermsCompliance terms={terms} />

        {/* 11 — CLOSING */}
        <section className={`${styles.contentPage} ${styles.closingPage}`}>
          <h2 className={styles.sectionTitle}>Ready when you are.</h2>
          <div className={styles.goldRule} aria-hidden />
          <p className={styles.sectionLead}>
            Prepared for {closing.customerName || customer} by{" "}
            {closing.installerName || brand}.
          </p>
          <div className={styles.statRow}>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Annual units</p>
              <p className={styles.statValue}>
                {closing.annualUnits > 0
                  ? closing.annualUnits.toLocaleString("en-IN")
                  : "—"}
              </p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Lifetime wealth</p>
              <p className={`${styles.statValue} ${styles.textGold}`}>
                {formatLifetimeBenefitInr(closing.lifetimeWealthInr || eco.lifetimeProfitInr)}
              </p>
            </div>
          </div>
          {closing.contactLine ? (
            <p className={styles.closingContact}>{closing.contactLine}</p>
          ) : null}
        </section>
      </div>
    </div>
  );
}

export default ZenithProposalRenderer;
