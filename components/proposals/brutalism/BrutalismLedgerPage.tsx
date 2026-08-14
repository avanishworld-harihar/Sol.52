"use client";

import type { ProposalData } from "@/lib/proposal-data";
import {
  formatInr,
  formatInrCompact,
  formatLifetimeBenefitInr,
} from "@/components/proposals/_shared/formatters";
import styles from "./Brutalism.module.css";
import { brutalismAnnualUnits, brutalismBrand } from "./brutalism-live";

export function BrutalismLedgerPage({ data }: { data: ProposalData }) {
  const brand = brutalismBrand(data);
  const gross = data.economics.grossInr;
  const subsidy = data.economics.subsidyInr;
  const net = data.economics.netInr;
  const showSubsidy = subsidy > 0;
  const payback = data.economics.paybackYears;
  const monthly = data.economics.monthlySavingsInr;
  const annual =
    data.closing.annualSavingsInr > 0
      ? data.closing.annualSavingsInr
      : monthly > 0
        ? monthly * 12
        : 0;
  const lifetime =
    data.closing.lifetimeWealthInr > 0
      ? data.closing.lifetimeWealthInr
      : data.economics.lifetimeProfitInr;
  const units = brutalismAnnualUnits(data);
  const payments = (data.execution.payments ?? []).filter((p) => p.label?.trim()).slice(0, 3);

  return (
    <section className={styles.a4Brutalist}>
      <div className={styles.brutalHeader}>
        <div className={styles.brandBlock}>{brand}</div>
        <div className={styles.cautionBadge}>CAPITAL SCHEDULE</div>
      </div>

      <h1 className={styles.massiveTitle}>
        COST
        <br />
        STRUCTURE.
      </h1>

      <div className={styles.lede}>
        Live economics only. Stage payments remain on gross. Blank fields are not estimated.
      </div>

      <div className={styles.brutalGrid}>
        <div className={styles.brutalRow}>
          <div className={styles.brutalLabel}>SYSTEM COST</div>
          <div className={styles.brutalValue}>{gross > 0 ? formatInrCompact(gross) : "—"}</div>
        </div>
        {showSubsidy ? (
          <div className={styles.brutalRow}>
            <div className={styles.brutalLabel}>SUBSIDY</div>
            <div className={styles.brutalValue}>{`− ${formatInrCompact(subsidy)}`}</div>
          </div>
        ) : null}
        <div className={`${styles.brutalRow} ${styles.brutalRowAccent}`}>
          <div className={`${styles.brutalLabel} ${styles.brutalLabelAccent}`}>NET OUTLAY</div>
          <div className={styles.brutalValue}>
            {showSubsidy
              ? net > 0
                ? formatInrCompact(net)
                : "—"
              : gross > 0
                ? formatInrCompact(gross)
                : "—"}
          </div>
        </div>
        <div className={styles.brutalRow}>
          <div className={styles.brutalLabel}>YEAR-1 YIELD</div>
          <div className={styles.brutalValue}>
            {units > 0 ? `${units.toLocaleString("en-IN")} kWh` : "—"}
          </div>
        </div>
        <div className={styles.brutalRow}>
          <div className={styles.brutalLabel}>PAYBACK</div>
          <div className={styles.brutalValue}>{payback > 0 ? `${payback} YRS` : "—"}</div>
        </div>
        <div className={styles.brutalRow}>
          <div className={styles.brutalLabel}>ANNUAL SAVE</div>
          <div className={styles.brutalValue}>{annual > 0 ? formatInr(annual) : "—"}</div>
        </div>
        <div className={styles.brutalRow}>
          <div className={styles.brutalLabel}>25-YR TOTAL</div>
          <div className={styles.brutalValue}>
            {lifetime > 0 ? formatLifetimeBenefitInr(lifetime) : "—"}
          </div>
        </div>
        {payments.map((p) => (
          <div key={p.label} className={styles.brutalRow}>
            <div className={styles.brutalLabel}>{p.label}</div>
            <div className={styles.brutalValue}>
              {p.amountInr > 0 ? formatInr(p.amountInr) : "—"}
            </div>
          </div>
        ))}
      </div>

      <footer className={styles.pageFooter}>SHEET 02 / 03 · BRUTAL SPEC</footer>
    </section>
  );
}

export default BrutalismLedgerPage;
