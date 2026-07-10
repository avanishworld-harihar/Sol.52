"use client";

/**
 * Zenith Luxury — cover + architecture cards + Tier-1 BOM editorial.
 * Root: CSS Modules `.presetZenith`
 */

import type { ProposalData } from "@/lib/proposal-data";
import { formatLifetimeBenefitInr } from "@/components/proposals/_shared/formatters";
import styles from "./zenith.module.css";

export type ZenithProposalRendererProps = {
  data: ProposalData;
};

/** Emerald (#10B981) for ≥ 25 years; Champagne Gold (#C5A059) otherwise. */
function warrantyClass(warranty: string): string {
  const years = Number((warranty.match(/(\d+)\s*(?:year|yr)/i)?.[1] ?? "").trim());
  if (Number.isFinite(years) && years >= 25) return styles.textEmerald;
  return styles.textGold;
}

export function ZenithProposalRenderer({ data }: ZenithProposalRendererProps) {
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
  const archCards = bom.filter(
    (item) => Array.isArray(item.technicalPoints) && item.technicalPoints.length > 0
  );

  return (
    <div className={styles.presetZenith}>
      {/* COVER PAGE */}
      <section className={styles.cover}>
        <p className={styles.brand}>{brand}</p>
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
      </section>

      {/* TECHNICAL ARCHITECTURE */}
      {archCards.length > 0 ? (
        <section className={styles.contentPage}>
          <h2 className={styles.sectionTitle}>Technical architecture</h2>
          <div className={styles.goldRule} aria-hidden />
          <p className={styles.sectionLead}>
            Tier-1 components selected for longevity, monitoring clarity, and
            quiet rooftop performance.
          </p>
          <div className={styles.archGrid}>
            {archCards.map((item, i) => (
              <article key={`arch-${item.name}-${i}`} className={styles.archCard}>
                <p className={styles.archLabel}>{item.brand || "Component"}</p>
                <h2 className={styles.archTitle}>{item.name}</h2>
                {item.spec ? <p className={styles.archSpec}>{item.spec}</p> : null}
                <ul className={styles.archPoints}>
                  {item.technicalPoints!.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {/* BOM PAGE */}
      <section className={styles.contentPage}>
        <h2 className={styles.sectionTitle}>Tier-1 Engineering</h2>
        <div className={styles.goldRule} aria-hidden />

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
    </div>
  );
}

export default ZenithProposalRenderer;
