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
      <div className={styles.mill}>
        <aside className={styles.millSelvage}>
          <p className={styles.kicker}>{copy.capital.kicker}</p>
          <h2 className={styles.displayTitle}>{copy.capital.title}</h2>
          <p className={styles.lead}>{copy.capital.lead}</p>

          <div className={styles.millTicket}>
            <span className={styles.millTicketLabel}>{copy.capital.youPay}</span>
            <div className={styles.millTicketVal}>
              {netValue > 0 ? formatInrCompact(netValue) : "—"}
            </div>
            <p className={styles.millTicketHint}>
              {showSubsidy ? copy.capital.netHint : copy.capital.netSameHint}
            </p>
            <div className={styles.millSeals}>
              <div className={styles.millSeal}>
                <span>{copy.capital.gross}</span>
                <strong>{gross > 0 ? formatInrCompact(gross) : "—"}</strong>
              </div>
              <div className={styles.millSeal}>
                <span>{copy.capital.subsidy}</span>
                <strong>
                  {showSubsidy ? `− ${formatInrCompact(subsidy)}` : copy.capital.subsidyNone}
                </strong>
              </div>
            </div>
          </div>
        </aside>

        <div className={styles.millWork}>
          {payments.length > 0 ? (
            <div className={styles.millReceipt}>
              <h3>
                {copy.capital.stages} · {copy.capital.stagesHint}
              </h3>
              {payments.map((p) => (
                <div key={p.label} className={styles.millCut}>
                  <span>
                    {p.label}
                    {p.pctLabel ? ` · ${p.pctLabel}` : ""}
                  </span>
                  <strong>{p.amountInr > 0 ? formatInr(p.amountInr) : "—"}</strong>
                </div>
              ))}
            </div>
          ) : null}

          <div className={styles.millCoins}>
            <div className={styles.millCoin}>
              <span>{copy.capital.year1}</span>
              <strong>
                {units > 0 ? units.toLocaleString("en-IN") : "—"}
              </strong>
            </div>
            <div className={styles.millCoin}>
              <span>{copy.capital.payback}</span>
              <strong>
                {payback > 0 ? `${payback}` : "—"}
                {payback > 0 ? (
                  <span className={styles.returnUnit}> {copy.capital.years}</span>
                ) : null}
              </strong>
            </div>
            <div className={`${styles.millCoin} ${styles.millCoinKeep}`}>
              <span>{copy.capital.over25}</span>
              <strong>{lifetime > 0 ? formatLifetimeBenefitInr(lifetime) : "—"}</strong>
            </div>
          </div>
        </div>
      </div>
    </JaaliSheet>
  );
}

export default JaaliLedgerPage;
