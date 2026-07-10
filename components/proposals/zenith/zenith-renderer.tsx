"use client";

/**
 * Zenith — Pearl print-ready proposal (5 pages).
 * No dark mode. Playfair titles (gold) · Inter tables · full data, no blank pages.
 */

import { useEffect, useState } from "react";
import type { ProposalData } from "@/lib/proposal-data";
import {
  formatInr,
  formatLifetimeBenefitInr,
} from "@/components/proposals/_shared/formatters";
import {
  PROPOSAL_BRANDING_UPDATED_EVENT,
  readProposalBrandingSettings,
} from "@/lib/proposal-branding-settings";
import styles from "./zenith.module.css";

export type ZenithProposalRendererProps = {
  data: ProposalData;
  installerLogoUrl?: string;
};

function warrantyClass(warranty: string): string {
  const years = Number((warranty.match(/(\d+)\s*(?:year|yr)/i)?.[1] ?? "").trim());
  if ((Number.isFinite(years) && years >= 25) || /25|30/.test(warranty)) {
    return styles.textEmerald;
  }
  return styles.textGold;
}

function BrandLockup({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    const last = parts[parts.length - 1]!;
    const first = parts.slice(0, -1).join(" ");
    return (
      <h1 className={styles.brand}>
        {first.toUpperCase()} <span className={styles.brandGold}>{last.toUpperCase()}</span>
      </h1>
    );
  }
  return <h1 className={styles.brand}>{name.toUpperCase()}</h1>;
}

function Placeholder({ children }: { children: string }) {
  return <p className={styles.placeholder}>{children}</p>;
}

/** Prefer engineering metrics; always show Size / Units / Coverage cards. */
function systemDesignCards(data: ProposalData) {
  const fromEng = data.engineering.metrics ?? [];
  const byLabel = (re: RegExp) =>
    fromEng.find((m) => re.test(m.label))?.value;

  const size =
    byLabel(/system\s*size|capacity|kw/i) ||
    (data.meta.systemKw > 0 ? `${data.meta.systemKw} kW` : "—");
  const units =
    byLabel(/annual|generation|units/i) ||
    (data.closing.annualUnits > 0
      ? `${data.closing.annualUnits.toLocaleString("en-IN")} units`
      : "—");
  const coverage = byLabel(/load|coverage/i) || "—";

  const extras = fromEng.filter(
    (m) =>
      !/system\s*size|capacity|^kw$|annual|generation|units|load|coverage/i.test(
        m.label
      )
  );

  return { size, units, coverage, extras };
}

export function ZenithProposalRenderer({
  data,
  installerLogoUrl,
}: ZenithProposalRendererProps) {
  const [logoUrl, setLogoUrl] = useState<string | undefined>(() => {
    return data?.meta.brandLogoUrl?.trim() || installerLogoUrl?.trim() || undefined;
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
  const customer = data.meta.customerName?.trim() || "Valued Customer";
  const location =
    data.meta.locationLine && data.meta.locationLine !== "—"
      ? data.meta.locationLine
      : "";
  const eco = data.economics;
  const bom = Array.isArray(data.bom) ? data.bom : [];
  const execution = data.execution;
  const terms = data.terms;
  const design = systemDesignCards(data);
  const annualGen =
    data.closing.annualUnits > 0
      ? `${data.closing.annualUnits.toLocaleString("en-IN")} units / yr`
      : design.units;

  return (
    <div className={styles.presetZenith}>
      {/* ── Page 1: Hero ─────────────────────────────────────────────────── */}
      <section className={`${styles.page} ${styles.hero}`}>
        <div className={styles.heroBrandRow}>
          {logoUrl ? (
            <img src={logoUrl} alt={brand} className={styles.logo} />
          ) : null}
          <BrandLockup name={brand} />
        </div>

        <p className={styles.heroText}>Your home, energy independent.</p>
        <p className={styles.heroPrepared}>Prepared for</p>
        <p className={styles.heroCustomer}>{customer}</p>

        <div className={styles.heroMetrics}>
          <div className={styles.metricCard}>
            <p className={styles.metricLabel}>System size</p>
            <p className={styles.metricValue}>
              {data.meta.systemKw > 0 ? `${data.meta.systemKw} kW` : "—"}
            </p>
            {location ? <p className={styles.metricHint}>{location}</p> : null}
          </div>
          <div className={styles.metricCard}>
            <p className={styles.metricLabel}>Annual generation</p>
            <p className={styles.metricValue}>{annualGen}</p>
          </div>
          <div className={styles.metricCard}>
            <p className={styles.metricLabel}>Asset profile</p>
            <p className={styles.metricValue} style={{ fontSize: "1rem" }}>
              {data.meta.assetProfileLine || "Residential rooftop"}
            </p>
          </div>
        </div>
      </section>

      {/* ── Page 2: Investment Ledger + Financing ─────────────────────────── */}
      <section className={styles.page}>
        <h2 className={styles.title}>Investment Ledger</h2>
        <div className={styles.goldRule} aria-hidden />
        <p className={styles.lead}>
          Capital, subsidy, payback, and the lifetime benefit of your rooftop system.
        </p>

        <div className={styles.grid}>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Gross cost</p>
            <p className={styles.statValue}>
              {eco.grossInr > 0 ? formatInr(eco.grossInr) : "—"}
            </p>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Subsidy</p>
            <p className={styles.statValue}>
              {eco.subsidyInr > 0 ? formatInr(eco.subsidyInr) : "—"}
            </p>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Net payable</p>
            <p className={styles.statValue}>
              {eco.netInr > 0 ? formatInr(eco.netInr) : "—"}
            </p>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Monthly savings</p>
            <p className={styles.statValue}>
              {eco.monthlySavingsInr > 0 ? formatInr(eco.monthlySavingsInr) : "—"}
            </p>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Payback</p>
            <p className={styles.statValue}>
              {eco.paybackYears > 0 ? `${eco.paybackYears.toFixed(1)} Yrs` : "—"}
            </p>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Lifetime benefit</p>
            <p className={`${styles.statValue} ${styles.statValueGold}`}>
              {eco.lifetimeProfitInr > 0
                ? formatLifetimeBenefitInr(eco.lifetimeProfitInr)
                : "—"}
            </p>
          </div>
        </div>

        <h3 className={styles.subtitle}>Financing options</h3>
        {eco.emiRows.length > 0 ? (
          <table className={styles.table}>
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
                  <td className={styles.itemName}>{row.tenureLabel}</td>
                  <td>{formatInr(row.monthlyEmiInr)}</td>
                  <td className={styles.specCell}>{formatInr(row.interestPaidInr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Placeholder>
            Financing options will appear once loan tenures are configured for this
            proposal.
          </Placeholder>
        )}
      </section>

      {/* ── Page 3: System Design + Engineering & Assurance ───────────────── */}
      <section className={styles.page}>
        <h2 className={styles.title}>Engineering & Assurance</h2>
        <div className={styles.goldRule} aria-hidden />
        <p className={styles.lead}>
          System design metrics and a unified Tier-1 component ledger with warranty.
        </p>

        <h3 className={styles.subtitle}>System design</h3>
        <div className={styles.designGrid}>
          <div className={styles.metricCard}>
            <p className={styles.metricLabel}>System size</p>
            <p className={styles.metricValue}>{design.size}</p>
          </div>
          <div className={styles.metricCard}>
            <p className={styles.metricLabel}>Annual units</p>
            <p className={styles.metricValue}>{design.units}</p>
          </div>
          <div className={styles.metricCard}>
            <p className={styles.metricLabel}>Load coverage</p>
            <p className={styles.metricValue}>{design.coverage}</p>
          </div>
          {design.extras.map((m) => (
            <div key={m.label} className={styles.metricCard}>
              <p className={styles.metricLabel}>{m.label}</p>
              <p className={styles.metricValue}>{m.value}</p>
            </div>
          ))}
        </div>

        {data.engineering.standards.length > 0 ? (
          <p className={styles.standards}>
            Standards · {data.engineering.standards.join(" · ")}
          </p>
        ) : null}

        <h3 className={styles.subtitle}>Component & warranty ledger</h3>
        {bom.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Item</th>
                <th scope="col">Spec</th>
                <th scope="col">Warranty</th>
              </tr>
            </thead>
            <tbody>
              {bom.map((item, i) => (
                <tr key={`${item.name}-${i}`}>
                  <td>
                    <span className={styles.itemName}>{item.name}</span>
                    {item.brand ? (
                      <span className={styles.itemBrand}>{item.brand}</span>
                    ) : null}
                  </td>
                  <td className={styles.specCell}>{item.spec || "—"}</td>
                  <td className={warrantyClass(item.warranty || "")}>
                    {item.warranty || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Placeholder>
            Bill of materials will appear once modules, inverter, and structure are
            selected.
          </Placeholder>
        )}
      </section>

      {/* ── Page 4: Execution & Settlement ────────────────────────────────── */}
      <section className={styles.page}>
        <h2 className={styles.title}>Execution & Settlement</h2>
        <div className={styles.goldRule} aria-hidden />
        <p className={styles.lead}>
          Installation process from survey to go-live, with a clear payment schedule.
        </p>

        <h3 className={styles.subtitle}>Installation process</h3>
        {execution.steps.length > 0 ? (
          <ol className={styles.stepList}>
            {execution.steps.map((s) => (
              <li key={s.num} className={styles.stepItem}>
                <span className={styles.stepNum}>{s.num}</span>
                <div>
                  <p className={styles.stepTitle}>{s.title}</p>
                  <p className={styles.stepDesc}>{s.description}</p>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <Placeholder>
            Installation process steps will appear once the project plan is set.
          </Placeholder>
        )}

        <h3 className={styles.subtitle}>Payment schedule</h3>
        {execution.payments.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Milestone</th>
                <th scope="col">Share</th>
                <th scope="col">Amount</th>
              </tr>
            </thead>
            <tbody>
              {execution.payments.map((p) => (
                <tr key={p.label}>
                  <td className={p.isTotal ? styles.itemName : undefined}>{p.label}</td>
                  <td>{p.pctLabel}</td>
                  <td className={p.isTotal ? styles.textGold : undefined}>
                    {formatInr(p.amountInr)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Placeholder>
            Payment milestones will appear once the commercial schedule is confirmed.
          </Placeholder>
        )}

        {(execution.bank.accountNumber || execution.bank.upiId || execution.bank.company) && (
          <div className={styles.bankBlock}>
            <p className={styles.bankLabel}>Bank details</p>
            {execution.bank.company ? (
              <p className={styles.bankLine}>{execution.bank.company}</p>
            ) : null}
            {execution.bank.accountNumber ? (
              <p className={styles.bankLine}>A/C {execution.bank.accountNumber}</p>
            ) : null}
            {execution.bank.ifsc ? (
              <p className={styles.bankLine}>IFSC {execution.bank.ifsc}</p>
            ) : null}
            {execution.bank.upiId ? (
              <p className={styles.bankLine}>UPI {execution.bank.upiId}</p>
            ) : null}
          </div>
        )}
      </section>

      {/* ── Page 5: Terms & Compliance ────────────────────────────────────── */}
      <section className={styles.page}>
        <h2 className={styles.title}>Terms & Compliance</h2>
        <div className={styles.goldRule} aria-hidden />
        <p className={styles.lead}>
          General terms, documents required for processing, and optional AMC scope.
        </p>

        <h3 className={styles.subtitle}>General terms</h3>
        {terms.conditions.length > 0 ? (
          <ul className={styles.bulletList}>
            {terms.conditions.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        ) : (
          <Placeholder>General terms will appear once the proposal pack is finalized.</Placeholder>
        )}

        <h3 className={styles.subtitle}>Documents required</h3>
        {terms.documents.length > 0 ? (
          <ul className={styles.bulletList}>
            {terms.documents.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        ) : (
          <Placeholder>
            Document checklist will appear once compliance requirements are set.
          </Placeholder>
        )}

        <h3 className={styles.subtitle}>AMC scope</h3>
        {terms.amcObjective ? <p className={styles.lead}>{terms.amcObjective}</p> : null}
        {terms.amcScope.length > 0 ? (
          <ul className={styles.bulletList}>
            {terms.amcScope.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        ) : (
          <Placeholder>AMC options will appear once maintenance plans are configured.</Placeholder>
        )}
        {terms.amcTerms.length > 0 ? (
          <ul className={styles.bulletList}>
            {terms.amcTerms.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}

export default ZenithProposalRenderer;
