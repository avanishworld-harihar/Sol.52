"use client";

import type { ProposalData } from "@/lib/proposal-data";
import {
  formatInr,
  formatInrCompact,
  formatLifetimeBenefitInr,
} from "@/components/proposals/_shared/formatters";
import styles from "./Jaali.module.css";
import { JaaliSheet } from "./jaali-brand";
import { useJaaliLang } from "./jaali-lang-context";
import { jaaliAnnualUnits } from "./jaali-live";

export function JaaliLedgerPage({ data }: { data: ProposalData }) {
  const { copy } = useJaaliLang();
  const gross = data.economics.grossInr;
  const subsidy = data.economics.subsidyInr;
  const net = data.economics.netInr;
  const showSubsidy = subsidy > 0;
  const payback = data.economics.paybackYears;
  const lifetime =
    data.closing.lifetimeWealthInr > 0
      ? data.closing.lifetimeWealthInr
      : data.economics.lifetimeProfitInr;
  const units = jaaliAnnualUnits(data);
  const payments = (data.execution.payments ?? []).filter((p) => p.label?.trim()).slice(0, 3);
  const netValue =
    showSubsidy && net > 0 ? net : showSubsidy && gross > subsidy ? gross - subsidy : gross;

  const money = (value: number) => (value > 0 ? formatInrCompact(value) : "—");

  return (
    <JaaliSheet data={data} page="06 / 09" chapter={copy.spine.outlay}>
      <div className={styles.outlayPage}>
        <p className={styles.kicker}>{copy.capital.kicker}</p>
        <h1 className={styles.displayTitle}>{copy.capital.title}</h1>
        <p className={styles.lead}>{copy.capital.lead}</p>

        <div
          className={styles.costEq}
          aria-label={`${copy.capital.gross} ${copy.capital.minus} ${copy.capital.subsidy} ${copy.capital.equals} ${copy.capital.youPay}`}
        >
          <div className={styles.costTerm}>
            <span>{copy.capital.gross}</span>
            <strong>{money(gross)}</strong>
          </div>
          <span className={styles.costOp} aria-hidden>
            {copy.capital.minus}
          </span>
          <div className={`${styles.costTerm} ${showSubsidy ? styles.costCut : ""}`}>
            <span>{copy.capital.subsidy}</span>
            <strong>{showSubsidy ? money(subsidy) : "—"}</strong>
            {!showSubsidy ? <p>{copy.capital.subsidyNone}</p> : null}
          </div>
          <span className={styles.costOp} aria-hidden>
            {copy.capital.equals}
          </span>
          <div className={`${styles.costTerm} ${styles.costNet}`}>
            <span>{copy.capital.youPay}</span>
            <strong>{money(netValue)}</strong>
            <p>{showSubsidy ? copy.capital.netHint : copy.capital.netSameHint}</p>
          </div>
        </div>

        {payments.length > 0 ? (
          <div className={styles.ghat}>
            <p className={styles.ghatHead}>
              {copy.capital.stages} · {copy.capital.stagesHint}
            </p>
            {payments.map((p, i) => (
              <div key={p.label} className={styles.ghatRow}>
                <span className={styles.ghatNo}>{String(i + 1).padStart(2, "0")}</span>
                <span className={styles.ghatLabel}>
                  {p.label}
                  {p.pctLabel ? ` · ${p.pctLabel}` : ""}
                </span>
                <strong className={styles.ghatAmt}>
                  {p.amountInr > 0 ? formatInr(p.amountInr) : "—"}
                </strong>
              </div>
            ))}
          </div>
        ) : null}

        <div className={styles.returnGrid}>
          <div className={styles.returnCell}>
            <span className={styles.returnName}>{copy.capital.year1}</span>
            <span className={styles.returnFig}>
              {units > 0 ? units.toLocaleString("en-IN") : "—"}
            </span>
          </div>
          <div className={styles.returnCell}>
            <span className={styles.returnName}>{copy.capital.payback}</span>
            <span className={styles.returnFig}>
              {payback > 0 ? `${payback}` : "—"}
              {payback > 0 ? (
                <span className={styles.returnUnit}> {copy.capital.years}</span>
              ) : null}
            </span>
          </div>
          <div className={`${styles.returnCell} ${styles.returnKeep}`}>
            <span className={styles.returnName}>{copy.capital.over25}</span>
            <span className={styles.returnFig}>
              {lifetime > 0 ? formatLifetimeBenefitInr(lifetime) : "—"}
            </span>
          </div>
        </div>
      </div>
    </JaaliSheet>
  );
}

export default JaaliLedgerPage;
