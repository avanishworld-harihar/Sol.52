"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { formatInr, formatInrCompact } from "@/components/proposals/_shared/formatters";
import styles from "./Sienna.module.css";
import { SiennaDocFooter } from "./sienna-brand";
import { useSiennaLang } from "./sienna-lang-context";
import {
  siennaAnnualSavings,
  siennaBillMonths,
  siennaMonthlyBill,
  siennaMonthlySavings,
  siennaYearlyBill,
} from "./sienna-live";

function money(value: number, compact = false): string {
  if (!(value > 0)) return "—";
  return compact ? formatInrCompact(value) : formatInr(value);
}

export function SiennaAudit({ data }: { data: ProposalData }) {
  const { copy } = useSiennaLang();
  const yearlyBill = siennaYearlyBill(data);
  const monthlyBill = siennaMonthlyBill(data);
  const monthlySave = siennaMonthlySavings(data);
  const yearlySave = siennaAnnualSavings(data);
  const coverPct = data.bill.solarSavingsPct;
  const months = siennaBillMonths(data);
  const barHeights = months.map((m) => (m.barHeightPct > 0 ? m.barHeightPct : m.netInr));
  const maxBar = Math.max(...barHeights, 1);

  return (
    <section className={`${styles.a4Sienna} ${styles.innerSheet}`}>
      <div className={styles.contentArea}>
        <div className={styles.dateTag}>{copy.audit.tag}</div>
        <h1 className={styles.clientTitle}>{copy.audit.title}</h1>
        <p className={styles.subText}>{copy.audit.lead}</p>

        <div className={styles.auditStory}>
          <article className={styles.auditStep}>
            <span className={styles.auditStepNum}>1</span>
            <span className={styles.auditStepKicker}>{copy.audit.step1}</span>
            <strong className={styles.auditStepValue}>{money(yearlyBill)}</strong>
            <span className={styles.auditStepHint}>
              {yearlyBill > 0
                ? copy.audit.step1Hint(money(monthlyBill))
                : copy.audit.step1Empty}
            </span>
          </article>

          <article className={`${styles.auditStep} ${styles.auditStepSave}`}>
            <span className={styles.auditStepNum}>2</span>
            <span className={styles.auditStepKicker}>{copy.audit.step2}</span>
            <strong className={`${styles.auditStepValue} ${styles.auditStepValueSave}`}>
              {monthlySave > 0 ? `+${formatInr(monthlySave)}` : "—"}
            </strong>
            <span className={styles.auditStepHint}>
              {yearlySave > 0
                ? copy.audit.step2Hint(money(yearlySave))
                : copy.audit.step2Empty}
            </span>
          </article>

          <article className={`${styles.auditStep} ${styles.auditStepSubsidy}`}>
            <span className={styles.auditStepNum}>3</span>
            <span className={styles.auditStepKicker}>{copy.audit.step3}</span>
            <strong className={`${styles.auditStepValue} ${styles.auditStepValueSubsidy}`}>
              {coverPct > 0 ? `~${coverPct}%` : "—"}
            </strong>
            <span className={styles.auditStepHint}>
              {coverPct > 0 ? copy.audit.step3Hint : copy.audit.step3Empty}
            </span>
          </article>
        </div>

        {months.length > 0 ? (
          <div className={styles.auditMonthBlock}>
            <div className={styles.auditMonthHead}>{copy.audit.monthsOnBill}</div>
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
          <p className={styles.auditPlain}>{copy.audit.monthsEmpty}</p>
        )}

        <p className={styles.auditPlain}>
          {monthlySave > 0
            ? copy.audit.readSave(formatInr(monthlySave))
            : copy.audit.readEmpty}
        </p>
      </div>
      <SiennaDocFooter data={data} page="02 / 09" />
    </section>
  );
}

export default SiennaAudit;
