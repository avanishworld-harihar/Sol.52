"use client";

import type { ProposalData } from "@/lib/proposal-data";
import {
  formatInr,
  formatInrCompact,
  formatLifetimeBenefitInr,
} from "@/components/proposals/_shared/formatters";
import styles from "./Lumina.module.css";
import {
  luminaAnnualSavings,
  luminaBillMonths,
  luminaLifetime,
  luminaMonthlyBill,
  luminaMonthlySavings,
  luminaYearlyBill,
} from "./lumina-live";

function money(value: number, compact = false): string {
  if (!(value > 0)) return "—";
  return compact ? formatInrCompact(value) : formatInr(value);
}

export function LuminaAudit({ data }: { data: ProposalData }) {
  const yearlyBill = luminaYearlyBill(data);
  const monthlyBill = luminaMonthlyBill(data);
  const monthlySave = luminaMonthlySavings(data);
  const yearlySave = luminaAnnualSavings(data);
  const lifetime = luminaLifetime(data);
  const subsidy = data.economics.subsidyInr > 0 ? Math.round(data.economics.subsidyInr) : 0;
  const gross = data.economics.grossInr > 0 ? Math.round(data.economics.grossInr) : 0;
  const net =
    subsidy > 0 && data.economics.netInr > 0
      ? Math.round(data.economics.netInr)
      : gross;
  const payback = data.economics.paybackYears;
  const coverPct = data.bill.solarSavingsPct;
  const months = luminaBillMonths(data);
  const barHeights = months.map((m) => (m.barHeightPct > 0 ? m.barHeightPct : m.netInr));
  const maxBar = Math.max(...barHeights, 1);

  return (
    <section className={styles.a4Lumina}>
      <div className={styles.contentArea}>
        <div className={styles.dateTag}>Bill vs solar</div>
        <h1 className={styles.clientTitle}>What you pay today.</h1>
        <p className={styles.subText}>
          Three live numbers: the grid bill on file, the monthly saving on this proposal, and
          the subsidy credited on the plant. Empty fields stay blank — they are not guessed.
        </p>

        <div className={styles.auditStory}>
          <article className={styles.auditStep}>
            <span className={styles.auditStepNum}>1</span>
            <span className={styles.auditStepKicker}>Today — grid bill</span>
            <strong className={styles.auditStepValue}>{money(yearlyBill)}</strong>
            <span className={styles.auditStepHint}>
              {yearlyBill > 0
                ? `About ${money(monthlyBill)} each month on the bill on file.`
                : "No yearly bill is on this proposal yet."}
            </span>
          </article>

          <article className={`${styles.auditStep} ${styles.auditStepSave}`}>
            <span className={styles.auditStepNum}>2</span>
            <span className={styles.auditStepKicker}>After solar — you keep</span>
            <strong className={`${styles.auditStepValue} ${styles.auditStepValueSave}`}>
              {monthlySave > 0 ? `+${formatInr(monthlySave)}` : "—"}
            </strong>
            <span className={styles.auditStepHint}>
              {yearlySave > 0
                ? `${money(yearlySave)} in year 1${
                    coverPct > 0 ? ` · ~${coverPct}% of the bill` : ""
                  }.`
                : "Monthly saving is not on this proposal yet."}
            </span>
          </article>

          <article className={`${styles.auditStep} ${styles.auditStepSubsidy}`}>
            <span className={styles.auditStepNum}>3</span>
            <span className={styles.auditStepKicker}>Subsidy on this plant</span>
            <strong className={`${styles.auditStepValue} ${styles.auditStepValueSubsidy}`}>
              {subsidy > 0 ? `− ${formatInrCompact(subsidy)}` : "None on file"}
            </strong>
            <span className={styles.auditStepHint}>
              {subsidy > 0
                ? "Credited later. It cuts plant cost, not the monthly bill."
                : "No subsidy amount is saved on this quote."}
            </span>
          </article>
        </div>

        {subsidy > 0 ? (
          <div className={styles.auditSubsidyBar}>
            <div>
              <span className={styles.auditSubsidyKicker}>Plant cost after subsidy</span>
              <strong>{net > 0 ? formatInr(net) : "—"}</strong>
            </div>
            <span className={styles.auditSubsidyNote}>
              {gross > 0 ? `Gross ${formatInrCompact(gross)} − subsidy ${formatInrCompact(subsidy)}` : "From this proposal"}
            </span>
          </div>
        ) : null}

        {months.length > 0 ? (
          <div className={styles.auditMonthBlock}>
            <div className={styles.auditMonthHead}>Months on the bill</div>
            <div
              className={styles.auditMonthChart}
              style={{ gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))` }}
            >
              {months.map((month, i) => (
                  <div key={month.label} className={styles.auditMonthCol}>
                    <div className={styles.auditMonthTrack}>
                      <div
                        className={`${styles.auditMonthFill}${
                          month.isSummerPeak ? ` ${styles.auditMonthFillPeak}` : ""
                        }`}
                        style={{
                          height: `${Math.max(8, Math.round((barHeights[i] / maxBar) * 100))}%`,
                        }}
                      />
                    </div>
                    <span className={styles.auditMonthLbl}>{month.label}</span>
                  </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.auditChips}>
            <div className={styles.auditChip}>
              <span>Year-1 saving</span>
              <strong>{money(yearlySave)}</strong>
            </div>
            <div className={styles.auditChip}>
              <span>25-year total</span>
              <strong>{lifetime > 0 ? formatLifetimeBenefitInr(lifetime) : "—"}</strong>
            </div>
            <div className={styles.auditChip}>
              <span>Payback</span>
              <strong>{payback > 0 ? `${payback} yr` : "—"}</strong>
            </div>
          </div>
        )}

        <p className={styles.auditPlain}>
          {monthlySave > 0 && subsidy > 0
            ? `Read it this way: the bill drops by about ${formatInr(monthlySave)} a month. The subsidy of ${formatInrCompact(subsidy)} is a one-time credit on the plant, shown again on the capital page.`
            : monthlySave > 0
              ? `Read it this way: after solar you keep about ${formatInr(monthlySave)} a month on this proposal. Subsidy appears here only when an amount is on the quote.`
              : "When a bill and subsidy are saved on the proposal, they will fill these three boxes."}
        </p>
      </div>
      <div className={styles.pageFooter}>02 / 07</div>
    </section>
  );
}

export default LuminaAudit;
