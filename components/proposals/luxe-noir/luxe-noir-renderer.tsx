"use client";

/**
 * Premium Luxe (noir) — dark cinematic residential proposal.
 * Preset id: residential_luxe_noir · Atelier (residential_premium_luxe) stays separate.
 */

import type { ProposalData } from "@/lib/proposal-data";
import { formatInr } from "@/components/proposals/_shared/formatters";
import { EngineeringTelemetry } from "./EngineeringTelemetry";
import { luxeDisplayFont } from "./luxe-fonts";
import styles from "./luxe-noir-shell.module.css";

export type LuxeNoirRendererProps = {
  data: ProposalData;
};

export function LuxeNoirRenderer({ data }: LuxeNoirRendererProps) {
  if (!data) {
    return <div className={styles.loading}>Loading Premium Luxe…</div>;
  }

  const brand = data.meta.brandName?.trim() || "Harihar Solar";
  const client = data.meta.customerName?.trim() || "Valued Customer";
  const location =
    data.meta.locationLine && data.meta.locationLine !== "—"
      ? data.meta.locationLine
      : "Madhya Pradesh";
  const systemKw = Number(data.meta.systemKw) || 0;
  const net = data.economics.netInr;
  const savings =
    data.closing.annualSavingsInr > 0
      ? data.closing.annualSavingsInr
      : data.economics.monthlySavingsInr * 12;
  const contact =
    data.closing.contactLine?.trim() || "Harihar Solar · +91-99933 22267";

  return (
    <div className={`${styles.root} ${luxeDisplayFont.variable}`}>
      <header className={styles.cover}>
        <p className={styles.eyebrow}>{brand}</p>
        <h1 className={styles.coverTitle}>Premium Luxe</h1>
        <p className={styles.coverSub}>
          Precision solar architecture — engineered for peak yield and lasting value.
        </p>
        <div className={styles.coverMeta}>
          <span>Prepared for {client}</span>
          <span className={styles.dot} aria-hidden>
            ·
          </span>
          <span>{location}</span>
          {systemKw > 0 ? (
            <>
              <span className={styles.dot} aria-hidden>
                ·
              </span>
              <span>{systemKw} kW system</span>
            </>
          ) : null}
        </div>
      </header>

      <EngineeringTelemetry data={data} />

      <section className={styles.economics}>
        <p className={styles.eyebrow}>Investment snapshot</p>
        <h2 className={styles.sectionTitle}>Clarity on capital.</h2>
        <div className={styles.econGrid}>
          <div className={styles.econCard}>
            <span className={styles.econLabel}>You pay</span>
            <strong className={styles.econValue}>{net > 0 ? formatInr(net) : "—"}</strong>
            <span className={styles.econHint}>After subsidy (if applicable)</span>
          </div>
          <div className={styles.econCard}>
            <span className={styles.econLabel}>Est. annual savings</span>
            <strong className={styles.econValue}>
              {savings > 0 ? formatInr(savings) : "—"}
            </strong>
            <span className={styles.econHint}>Bill reduction trajectory</span>
          </div>
          <div className={styles.econCard}>
            <span className={styles.econLabel}>Payback</span>
            <strong className={styles.econValue}>
              {data.economics.paybackYears > 0
                ? `${data.economics.paybackYears.toFixed(1)} yrs`
                : "—"}
            </strong>
            <span className={styles.econHint}>Until the system pays for itself</span>
          </div>
        </div>
      </section>

      <footer className={styles.closing}>
        <p className={styles.eyebrow}>Next step</p>
        <h2 className={styles.sectionTitle}>Ready when you are.</h2>
        <p className={styles.closingBody}>
          We will lock design, DISCOM paperwork, and installation schedule around your roof —
          with the same engineering discipline you see above.
        </p>
        <p className={styles.contact}>{contact}</p>
      </footer>
    </div>
  );
}

export default LuxeNoirRenderer;
