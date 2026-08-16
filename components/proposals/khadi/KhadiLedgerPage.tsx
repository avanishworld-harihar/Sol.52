"use client";

import type { ProposalData } from "@/lib/proposal-data";
import {
  formatInr,
  formatInrCompact,
  formatLifetimeBenefitInr,
} from "@/components/proposals/_shared/formatters";
import styles from "./Khadi.module.css";
import { KhadiSheet } from "./khadi-brand";
import { useKhadiLang } from "./khadi-lang-context";
import { khadiAnnualUnits } from "./khadi-live";

export function KhadiLedgerPage({ data }: { data: ProposalData }) {
  const { copy } = useKhadiLang();
  const gross = data.economics.grossInr;
  const subsidy = data.economics.subsidyInr;
  const net = data.economics.netInr;
  const showSubsidy = subsidy > 0;
  const payback = data.economics.paybackYears;
  const lifetime =
    data.closing.lifetimeWealthInr > 0
      ? data.closing.lifetimeWealthInr
      : data.economics.lifetimeProfitInr;
  const units = khadiAnnualUnits(data);
  const payments = (data.execution.payments ?? []).filter((p) => p.label?.trim()).slice(0, 3);
  const netValue = showSubsidy ? net : gross;

  return (
    <KhadiSheet data={data} page="06 / 09" chapter={copy.spine.outlay}>
      <p className={styles.kicker}>{copy.capital.kicker}</p>
      <h2 className={styles.displayTitle}>{copy.capital.title}</h2>
      <p className={styles.lead}>{copy.capital.lead}</p>

      <div className={styles.outlayHero}>
        <span className={styles.outlayHeroLabel}>{copy.capital.youPay}</span>
        <div className={styles.outlayHeroValue}>
          {netValue > 0 ? formatInrCompact(netValue) : "—"}
        </div>
        <p className={styles.outlayHeroHint}>
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
        <div className={styles.rail}>
          <div className={styles.railHead}>
            {copy.capital.stages} · {copy.capital.stagesHint}
          </div>
          {payments.map((p, i) => (
            <div key={p.label} className={styles.railRow}>
              <span className={styles.railNo}>{i + 1}</span>
              <span className={styles.railLabel}>
                {p.label}
                {p.pctLabel ? ` · ${p.pctLabel}` : ""}
              </span>
              <span className={styles.railAmt}>
                {p.amountInr > 0 ? formatInr(p.amountInr) : "—"}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      <div className={styles.returnGrid}>
        <div className={styles.returnCell}>
          <span className={styles.returnName}>{copy.capital.year1}</span>
          <span className={styles.returnFig}>
            {units > 0 ? units.toLocaleString("en-IN") : "—"}
            {units > 0 ? <span className={styles.returnUnit}>kWh</span> : null}
          </span>
        </div>
        <div className={styles.returnCell}>
          <span className={styles.returnName}>{copy.capital.payback}</span>
          <span className={styles.returnFig}>
            {payback > 0 ? String(payback) : "—"}
            {payback > 0 ? (
              <span className={styles.returnUnit}>{copy.capital.years}</span>
            ) : null}
          </span>
        </div>
        <div className={styles.returnCell}>
          <span className={styles.returnName}>{copy.capital.over25}</span>
          <span className={styles.returnFig}>
            {lifetime > 0 ? formatLifetimeBenefitInr(lifetime) : "—"}
          </span>
        </div>
      </div>
    </KhadiSheet>
  );
}

export default KhadiLedgerPage;
