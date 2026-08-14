"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { formatInr, formatInrCompact, formatLifetimeBenefitInr } from "@/components/proposals/_shared/formatters";
import styles from "./WallStreet.module.css";
import { WallStreetMasthead } from "./WallStreetMasthead";

function LedgerLine({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className={styles.ledgerRow}>
      <span className={styles.ledgerLabel}>{label}</span>
      <div className={styles.ledgerDots} />
      <span className={`${styles.ledgerValue} ${positive ? styles.positive : ""}`}>{value}</span>
    </div>
  );
}

export function WallStreetLedgerPage({ data }: { data: ProposalData }) {
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
  const payments = (data.execution.payments ?? []).filter((p) => p.label?.trim());

  return (
    <section className={styles.a4Newspaper}>
      <WallStreetMasthead data={data} />

      <h2 className={styles.sectionHead}>Capital Markets Desk · Full Ledger</h2>
      <p className={styles.subHeadline} style={{ marginBottom: "6mm" }}>
        Line items below are the live economics on this proposal. Blank fields are not
        estimated.
      </p>

      <div className={styles.ledgerContainer} style={{ marginTop: 0 }}>
        <span className={styles.ledgerKicker}>Investment · Ref. A / B / D</span>
        <LedgerLine label="System Cost (Turnkey) · A" value={gross > 0 ? formatInr(gross) : "—"} />
        {showSubsidy ? (
          <LedgerLine
            label="Subsidy (credited later) · B"
            value={`− ${formatInr(subsidy)}`}
          />
        ) : null}
        <LedgerLine
          label={showSubsidy ? "Net Investment · D" : "Net Investment · D (= A)"}
          value={
            showSubsidy
              ? net > 0
                ? formatInr(net)
                : "—"
              : gross > 0
                ? formatInr(gross)
                : "—"
          }
        />
      </div>

      <div className={styles.ledgerContainer}>
        <span className={styles.ledgerKicker}>Cash-flow · D ÷ annual savings</span>
        <LedgerLine
          label="Est. Annual Bill Savings"
          value={annual > 0 ? formatInr(annual) : "—"}
          positive={annual > 0}
        />
        <LedgerLine
          label="Simple Payback Period"
          value={payback > 0 ? `${payback} years` : "—"}
        />
        <LedgerLine
          label="25-Year Cumulative Savings (est.)"
          value={lifetime > 0 ? formatLifetimeBenefitInr(lifetime) : "—"}
          positive={lifetime > 0}
        />
      </div>

      {payments.length > 0 ? (
        <div className={styles.ledgerContainer}>
          <span className={styles.ledgerKicker}>Stage payments · on gross (A)</span>
          {payments.map((p) => (
            <LedgerLine
              key={p.label}
              label={`${p.label}${p.pctLabel ? ` · ${p.pctLabel}` : ""}`}
              value={p.amountInr > 0 ? formatInr(p.amountInr) : "—"}
            />
          ))}
        </div>
      ) : null}

      <footer className={styles.pageFooter}>SOL.52 SYSTEM · NOT FOR REDISTRIBUTION</footer>
    </section>
  );
}

export default WallStreetLedgerPage;
