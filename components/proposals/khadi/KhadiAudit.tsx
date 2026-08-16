"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { formatInr } from "@/components/proposals/_shared/formatters";
import styles from "./Khadi.module.css";
import { KhadiSheet } from "./khadi-brand";
import { useKhadiLang } from "./khadi-lang-context";
import {
  khadiAnnualSavings,
  khadiBillMonths,
  khadiMonthlyBill,
  khadiMonthlySavings,
  khadiYearlyBill,
} from "./khadi-live";

function money(value: number): string {
  if (!(value > 0)) return "—";
  return formatInr(value);
}

export function KhadiAudit({ data }: { data: ProposalData }) {
  const { copy } = useKhadiLang();
  const yearlyBill = khadiYearlyBill(data);
  const monthlyBill = khadiMonthlyBill(data);
  const monthlySave = khadiMonthlySavings(data);
  const yearlySave = khadiAnnualSavings(data);
  const coverPct = data.bill.solarSavingsPct;
  const months = khadiBillMonths(data);
  const barHeights = months.map((m) => (m.barHeightPct > 0 ? m.barHeightPct : m.netInr));
  const maxBar = Math.max(...barHeights, 1);

  return (
    <KhadiSheet data={data} page="02 / 09" chapter={copy.spine.bill}>
      <div className={styles.mill}>
        <aside className={styles.millSelvage}>
          <p className={styles.kicker}>{copy.audit.kicker}</p>
          <h1 className={styles.displayTitle}>{copy.audit.title}</h1>
          <p className={styles.lead}>{copy.audit.lead}</p>
          <div className={styles.millCoin}>
            <span>{copy.audit.cover}</span>
            <strong>{coverPct > 0 ? `~${coverPct}%` : "—"}</strong>
          </div>
          <p className={styles.millCaption}>
            {monthlySave > 0
              ? copy.audit.readSave(formatInr(monthlySave))
              : copy.audit.readEmpty}
          </p>
        </aside>

        <div className={styles.millWork}>
          <div className={styles.millOverlap}>
            <article className={styles.millStrip}>
              <span>{copy.audit.today}</span>
              <strong>{money(yearlyBill)}</strong>
              <p>
                {yearlyBill > 0
                  ? copy.audit.todayHint(money(monthlyBill))
                  : copy.audit.todayEmpty}
              </p>
            </article>
            <article className={styles.millKeep}>
              <span>{copy.audit.keep}</span>
              <strong>{monthlySave > 0 ? `+${formatInr(monthlySave)}` : "—"}</strong>
              <p>
                {yearlySave > 0
                  ? copy.audit.keepHint(money(yearlySave))
                  : copy.audit.keepEmpty}
              </p>
            </article>
          </div>

          {months.length > 0 ? (
            <div className={styles.millMonths} aria-label={copy.audit.months}>
              {months.map((month, i) => (
                <div
                  key={month.label}
                  className={`${styles.millMonth}${
                    month.isSummerPeak ? ` ${styles.millMonthPeak}` : ""
                  }`}
                >
                  <span className={styles.millMonthLbl}>{month.label}</span>
                  <div
                    className={styles.millDye}
                    style={{
                      width: `${Math.max(18, Math.round((barHeights[i] / maxBar) * 100))}%`,
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.note}>{copy.audit.monthsEmpty}</p>
          )}
        </div>
      </div>
    </KhadiSheet>
  );
}

export default KhadiAudit;
