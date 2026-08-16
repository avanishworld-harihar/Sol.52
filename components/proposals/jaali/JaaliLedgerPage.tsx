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
  const netValue = showSubsidy ? net : gross;

  return (
    <JaaliSheet data={data} page="06 / 09" chapter={copy.spine.outlay}>
      <div className={styles.outlayPage}>
        <p className={styles.kicker}>{copy.capital.kicker}</p>
        <h1 className={styles.displayTitle}>{copy.capital.title}</h1>
        <p className={styles.lead}>{copy.capital.lead}</p>

        <div className={styles.payHero}>
          <span className={styles.payHeroLabel}>{copy.capital.youPay}</span>
          <strong className={styles.payHeroVal}>
            {netValue > 0 ? formatInrCompact(netValue) : "—"}
          </strong>
          <p className={styles.payHeroHint}>
            {showSubsidy ? copy.capital.netHint : copy.capital.netSameHint}
          </p>
        </div>

        <div className={styles.outlayPair}>
          <div className={styles.outlayCell}>
            <span className={styles.outlayName}>{copy.capital.gross}</span>
            <span className={styles.outlayFig}>
              {gross > 0 ? formatInrCompact(gross) : "—"}
            </span>
          </div>
          <div className={styles.outlayCell}>
            <span className={styles.outlayName}>{copy.capital.subsidy}</span>
            <span className={styles.outlayFig}>
              {showSubsidy ? `− ${formatInrCompact(subsidy)}` : copy.capital.subsidyNone}
            </span>
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
