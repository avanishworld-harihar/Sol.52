"use client";

import type { ProposalData } from "@/lib/proposal-data";
import {
  formatInr,
  formatInrCompact,
  formatLifetimeBenefitInr,
} from "@/components/proposals/_shared/formatters";
import styles from "./Lumina.module.css";
import { luminaAnnualUnits } from "./lumina-live";

export function LuminaLedgerPage({ data }: { data: ProposalData }) {
  const gross = data.economics.grossInr;
  const subsidy = data.economics.subsidyInr;
  const net = data.economics.netInr;
  const showSubsidy = subsidy > 0;
  const payback = data.economics.paybackYears;
  const monthly = data.economics.monthlySavingsInr;
  const annualSave =
    data.closing.annualSavingsInr > 0
      ? data.closing.annualSavingsInr
      : monthly > 0
        ? monthly * 12
        : 0;
  const lifetime =
    data.closing.lifetimeWealthInr > 0
      ? data.closing.lifetimeWealthInr
      : data.economics.lifetimeProfitInr;
  const units = luminaAnnualUnits(data);
  const payments = (data.execution.payments ?? []).filter((p) => p.label?.trim()).slice(0, 3);

  return (
    <section className={styles.a4Lumina}>
      <div className={styles.contentArea} style={{ paddingTop: 36 }}>
        <div>
          <div className={styles.dateTag}>Capital summary</div>
          <h2 className={styles.sectionTitle}>Clear numbers. No surprises.</h2>
          <p className={styles.subText}>
            Line items below are the live economics on this proposal. Stage payments stay on
            gross; subsidy is credited later when it exists. Blank fields are not estimated.
          </p>
        </div>

        <div className={`${styles.cardGrid} ${styles.cardGridTwo}`} style={{ marginTop: 24 }}>
          <div className={styles.dataCard}>
            <span className={styles.cardLabel}>System cost</span>
            <span className={styles.cardValue}>{gross > 0 ? formatInrCompact(gross) : "—"}</span>
          </div>
          {showSubsidy ? (
            <div className={styles.dataCard}>
              <span className={styles.cardLabel}>Subsidy (later)</span>
              <span className={styles.cardValue}>{`− ${formatInrCompact(subsidy)}`}</span>
            </div>
          ) : null}
          <div className={`${styles.dataCard} ${styles.dataCardAccent}`}>
            <span className={`${styles.cardLabel} ${styles.cardLabelAccent}`}>
              {showSubsidy ? "Net outlay" : "Net outlay (= gross)"}
            </span>
            <span className={`${styles.cardValue} ${styles.cardValueAccent}`}>
              {showSubsidy
                ? net > 0
                  ? formatInrCompact(net)
                  : "—"
                : gross > 0
                  ? formatInrCompact(gross)
                  : "—"}
            </span>
          </div>
          <div className={styles.dataCard}>
            <span className={styles.cardLabel}>Year-1 yield</span>
            <span className={styles.cardValue}>
              {units > 0 ? `${units.toLocaleString("en-IN")} kWh` : "—"}
            </span>
          </div>
          <div className={styles.dataCard}>
            <span className={styles.cardLabel}>Simple payback</span>
            <span className={styles.cardValue}>{payback > 0 ? `${payback} yrs` : "—"}</span>
          </div>
          <div className={styles.dataCard}>
            <span className={styles.cardLabel}>Annual savings</span>
            <span className={styles.cardValue}>{annualSave > 0 ? formatInr(annualSave) : "—"}</span>
          </div>
          <div className={styles.dataCard}>
            <span className={styles.cardLabel}>25-year cumulative</span>
            <span className={styles.cardValue}>
              {lifetime > 0 ? formatLifetimeBenefitInr(lifetime) : "—"}
            </span>
          </div>
          {payments.map((p) => (
            <div key={p.label} className={styles.dataCard}>
              <span className={styles.cardLabel}>{p.label}</span>
              <span className={styles.cardValue}>{p.amountInr > 0 ? formatInr(p.amountInr) : "—"}</span>
            </div>
          ))}
        </div>

        <div className={styles.pageFooter}>Lumina · 02 / 03</div>
      </div>
    </section>
  );
}

export default LuminaLedgerPage;
