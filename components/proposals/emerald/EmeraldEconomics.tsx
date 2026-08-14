"use client";

/**
 * Emerald Signature — investment summary + EMI (payments stay on gross).
 */

import type { ProposalData } from "@/lib/proposal-data";
import {
  formatInr,
  formatInrCompact,
  formatLifetimeBenefitInr,
} from "@/components/proposals/_shared/formatters";
import styles from "./Emerald.module.css";
import { useEmeraldLang } from "./emerald-lang-context";

export type EmeraldEconomicsProps = {
  data: ProposalData;
  folio: string;
  selectedTenureYears?: number | null;
};

export function EmeraldEconomics({
  data,
  folio,
  selectedTenureYears,
}: EmeraldEconomicsProps) {
  const { copy } = useEmeraldLang();
  const gross = data.economics.grossInr;
  const subsidy = data.economics.subsidyInr;
  const net = data.economics.netInr;
  const showSubsidy = subsidy > 0;
  const lifetime =
    data.closing.lifetimeWealthInr > 0
      ? data.closing.lifetimeWealthInr
      : data.economics.lifetimeProfitInr;
  const payback = data.economics.paybackYears;
  const monthly = data.economics.monthlySavingsInr;
  const ratePct =
    data.economics.interestRatePct && data.economics.interestRatePct > 0
      ? data.economics.interestRatePct
      : 0;
  const emiRows = (data.economics.emiRows ?? [])
    .slice(0, 3)
    .filter((r) => r.monthlyEmiInr > 0);
  const rateLabel =
    ratePct > 0
      ? Number.isInteger(ratePct)
        ? String(ratePct)
        : ratePct.toFixed(1)
      : "";

  return (
    <section className={styles.a4Page}>
      <div className={styles.sidebar}>
        <span className={styles.folioNum}>{folio}</span>
        <div>
          <span className={styles.goldEyebrow}>{copy.common.section(folio)}</span>
          <h3 className={styles.sidebarTitle}>
            {copy.econ.sidebarTitle[0]}
            <br />
            {copy.econ.sidebarTitle[1]}
          </h3>
          <p className={styles.sidebarBlurb}>{copy.econ.sidebarBlurb}</p>
        </div>
      </div>

      <div className={styles.contentArea}>
        <h2 className={styles.pageHeader}>{copy.econ.pageHeader}</h2>

        <div className={styles.ledgerBond}>
          <div className={styles.bondHeader}>
            <span className={styles.bondTitle}>
              {showSubsidy ? copy.econ.netCost : copy.econ.projectCost}
            </span>
            <span className={styles.bondCode}>{copy.econ.breakdown}</span>
          </div>

          {showSubsidy ? (
            <div className={styles.bondMath}>
              <div className={styles.mathBlock}>
                <span className={styles.mathLabel}>{copy.econ.gross}</span>
                <span className={styles.mathValue}>
                  {gross > 0 ? formatInrCompact(gross) : "—"}
                </span>
              </div>
              <span className={styles.mathOperator}>-</span>
              <div className={styles.mathBlock}>
                <span className={styles.mathLabel}>{copy.econ.subsidy}</span>
                <span className={`${styles.mathValue} ${styles.mathValueSubsidy}`}>
                  {formatInrCompact(subsidy)}
                </span>
              </div>
              <span className={styles.mathOperator}>=</span>
              <div className={styles.mathBlock}>
                <span className={styles.mathLabel}>{copy.econ.youPay}</span>
                <span className={`${styles.mathValue} ${styles.mathValueNet}`}>
                  {net > 0 ? formatInrCompact(net) : "—"}
                </span>
              </div>
            </div>
          ) : (
            <div className={styles.bondMath}>
              <div className={styles.mathBlock}>
                <span className={styles.mathLabel}>{copy.econ.gross}</span>
                <span className={`${styles.mathValue} ${styles.mathValueNet}`}>
                  {gross > 0 ? formatInrCompact(gross) : "—"}
                </span>
              </div>
            </div>
          )}
          {showSubsidy ? (
            <p className={styles.subsidyNote}>{copy.econ.subsidyNote}</p>
          ) : null}
        </div>

        <div className={styles.econMetricRow}>
          <div className={styles.econMetric}>
            <span className={styles.econRule} />
            <span
              className={styles.goldEyebrow}
              style={{ marginBottom: "5px" }}
            >
              {copy.econ.lifetime}
            </span>
            <span className={styles.econMetricValue}>
              {lifetime > 0 ? formatLifetimeBenefitInr(lifetime) : "—"}
            </span>
            <span className={styles.econMetricHint}>{copy.econ.lifetimeHint}</span>
          </div>

          <div className={styles.econMetric}>
            <span className={styles.econRule} />
            <span
              className={styles.goldEyebrow}
              style={{ marginBottom: "5px" }}
            >
              {copy.econ.payback}
            </span>
            <span className={styles.econMetricValue}>
              {payback > 0
                ? `${payback.toFixed(1)} ${copy.common.years}`
                : "—"}
            </span>
            <span className={styles.econMetricHint}>{copy.econ.paybackHint}</span>
          </div>
        </div>

        {emiRows.length > 0 ? (
          <div className={styles.emiBlock}>
            <div className={styles.emiHead}>
              <span className={styles.goldEyebrow} style={{ marginBottom: 0 }}>
                {copy.econ.financeTitle}
              </span>
              <p className={styles.emiLead}>{copy.econ.financeLead(rateLabel)}</p>
            </div>
            <div className={styles.emiGrid}>
              {emiRows.map((row) => {
                const yearsMatch = row.tenureLabel.match(/(\d+)/);
                const years = yearsMatch ? Number(yearsMatch[1]) : 0;
                const selected =
                  selectedTenureYears != null &&
                  years === selectedTenureYears;
                const covers = monthly > 0 && monthly >= row.monthlyEmiInr;
                return (
                  <article
                    key={row.tenureLabel}
                    className={`${styles.emiCard}${
                      selected ? ` ${styles.emiCardSelected}` : ""
                    }`}
                  >
                    <span className={styles.emiTenure}>
                      {years > 0
                        ? copy.econ.tenureLoan(years)
                        : row.tenureLabel}
                    </span>
                    <strong className={styles.emiValue}>
                      {formatInr(row.monthlyEmiInr)}
                    </strong>
                    <span className={styles.emiUnit}>{copy.econ.emiUnit}</span>
                    {row.interestPaidInr > 0 ? (
                      <span className={styles.emiNote}>
                        {copy.econ.interestTotal(
                          formatInrCompact(row.interestPaidInr)
                        )}
                      </span>
                    ) : null}
                    {selected ? (
                      <span className={styles.emiBadge}>
                        {copy.econ.emiSelected}
                      </span>
                    ) : monthly > 0 ? (
                      <span
                        className={
                          covers ? styles.emiCover : styles.emiShort
                        }
                      >
                        {covers
                          ? copy.econ.savingsCoverEmi
                          : copy.econ.emiAboveSavings}
                      </span>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default EmeraldEconomics;
