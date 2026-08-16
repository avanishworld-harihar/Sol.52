"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { formatInr } from "@/components/proposals/_shared/formatters";
import styles from "./Sienna.module.css";
import { SiennaSheet } from "./sienna-brand";
import { useSiennaLang } from "./sienna-lang-context";
import {
  siennaAnnualSavings,
  siennaBillMonths,
  siennaMonthlyBill,
  siennaMonthlySavings,
  siennaYearlyBill,
} from "./sienna-live";

function money(value: number): string {
  if (!(value > 0)) return "—";
  return formatInr(value);
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
    <SiennaSheet data={data} page="02 / 09" chapter={copy.spine.bill}>
      <p className={styles.kicker}>{copy.audit.kicker}</p>
      <h1 className={styles.displayTitle}>{copy.audit.title}</h1>
      <p className={styles.lead}>{copy.audit.lead}</p>

      <div className={styles.auditTwin}>
        <article className={styles.auditPane}>
          <span className={styles.auditPaneLabel}>{copy.audit.today}</span>
          <strong className={styles.auditPaneValue}>{money(yearlyBill)}</strong>
          <span className={styles.auditPaneHint}>
            {yearlyBill > 0 ? copy.audit.todayHint(money(monthlyBill)) : copy.audit.todayEmpty}
          </span>
        </article>
        <article className={`${styles.auditPane} ${styles.auditPaneKeep}`}>
          <span className={styles.auditPaneLabel}>{copy.audit.keep}</span>
          <strong className={styles.auditPaneValue}>
            {monthlySave > 0 ? `+${formatInr(monthlySave)}` : "—"}
          </strong>
          <span className={styles.auditPaneHint}>
            {yearlySave > 0 ? copy.audit.keepHint(money(yearlySave)) : copy.audit.keepEmpty}
          </span>
        </article>
      </div>

      <div className={styles.auditCover}>
        <div className={styles.auditCoverLabel}>{copy.audit.cover}</div>
        <div className={styles.auditCoverValue}>
          {coverPct > 0 ? `~${coverPct}%` : "—"}
        </div>
        {coverPct > 0 ? null : <p className={styles.note}>{copy.audit.coverEmpty}</p>}
      </div>

      {months.length > 0 ? (
        <div>
          <p className={`${styles.kicker} ${styles.monthKicker}`}>
            {copy.audit.months}
          </p>
          <div className={styles.monthRail}>
            {months.map((month, i) => (
              <div key={month.label} className={styles.monthTick}>
                <div className={styles.monthStem}>
                  <div
                    className={`${styles.monthFill}${
                      month.isSummerPeak ? ` ${styles.monthFillPeak}` : ""
                    }`}
                    style={{
                      height: `${Math.max(8, Math.round((barHeights[i] / maxBar) * 100))}%`,
                    }}
                  />
                </div>
                <span className={styles.monthLbl}>{month.label}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className={styles.note}>{copy.audit.monthsEmpty}</p>
      )}

      <p className={styles.note}>
        {monthlySave > 0
          ? copy.audit.readSave(formatInr(monthlySave))
          : copy.audit.readEmpty}
      </p>
    </SiennaSheet>
  );
}

export default SiennaAudit;
