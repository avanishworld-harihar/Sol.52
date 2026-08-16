"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { formatInr, formatInrCompact } from "@/components/proposals/_shared/formatters";
import styles from "./Jaali.module.css";
import { JaaliSheet } from "./jaali-brand";
import { useJaaliLang } from "./jaali-lang-context";
import {
  jaaliAnnualSavings,
  jaaliBillMonths,
  jaaliMonthlyBill,
  jaaliMonthlySavings,
  jaaliYearlyBill,
} from "./jaali-live";

function money(value: number): string {
  if (!(value > 0)) return "—";
  return formatInr(value);
}

export function JaaliAudit({ data }: { data: ProposalData }) {
  const { copy } = useJaaliLang();
  const yearlyBill = jaaliYearlyBill(data);
  const monthlyBill = jaaliMonthlyBill(data);
  const monthlySave = jaaliMonthlySavings(data);
  const yearlySave = jaaliAnnualSavings(data);
  const coverPct = data.bill.solarSavingsPct;
  const months = jaaliBillMonths(data);
  const barHeights = months.map((m) => (m.barHeightPct > 0 ? m.barHeightPct : m.netInr));
  const maxBar = Math.max(...barHeights, 1);

  return (
    <JaaliSheet data={data} page="02 / 09" chapter={copy.spine.bill}>
      <div className={styles.billPage}>
        <p className={styles.kicker}>{copy.audit.kicker}</p>
        <h1 className={styles.displayTitle}>{copy.audit.title}</h1>
        <p className={styles.lead}>{copy.audit.lead}</p>

        <div className={styles.arcade}>
          <article className={styles.bay}>
            <span>{copy.audit.today}</span>
            <strong>{money(yearlyBill)}</strong>
            <p>
              {yearlyBill > 0
                ? copy.audit.todayHint(money(monthlyBill))
                : copy.audit.todayEmpty}
            </p>
          </article>
          <article className={`${styles.bay} ${styles.baySave}`}>
            <span>{copy.audit.keep}</span>
            <strong>{monthlySave > 0 ? `+${formatInr(monthlySave)}` : "—"}</strong>
            <p>
              {yearlySave > 0
                ? copy.audit.keepHint(money(yearlySave))
                : copy.audit.keepEmpty}
            </p>
          </article>
          <article className={`${styles.bay} ${styles.bayCover}`}>
            <span>{copy.audit.cover}</span>
            <strong>{coverPct > 0 ? `~${coverPct}%` : "—"}</strong>
            <p>
              {coverPct > 0
                ? monthlySave > 0
                  ? copy.audit.readSave(formatInr(monthlySave))
                  : copy.audit.keepHint(money(yearlySave))
                : copy.audit.coverEmpty}
            </p>
          </article>
        </div>

        {months.length > 0 ? (
          <div className={styles.billChart}>
            <p className={`${styles.kicker} ${styles.monthKicker}`}>{copy.audit.months}</p>
            <div className={styles.ribbon} role="img" aria-label={copy.audit.months}>
              {months.map((month, i) => {
                const pct = Math.max(8, Math.round((barHeights[i] / maxBar) * 100));
                return (
                  <div key={month.label} className={styles.ribbonCol}>
                    <div className={styles.ribbonNums}>
                      <span
                        className={`${styles.ribbonVal}${
                          month.isSummerPeak ? ` ${styles.ribbonValPeak}` : ""
                        }`}
                      >
                        {month.netInr > 0 ? formatInrCompact(month.netInr) : "—"}
                      </span>
                    </div>
                    <div className={styles.ribbonTrack}>
                      <div
                        className={`${styles.ribbonFill}${
                          month.isSummerPeak ? ` ${styles.ribbonFillPeak}` : ""
                        }`}
                        style={{ height: `${pct}%` }}
                      />
                    </div>
                    <span
                      className={`${styles.ribbonMonth}${
                        month.isSummerPeak ? ` ${styles.ribbonMonthPeak}` : ""
                      }`}
                    >
                      {month.label}
                    </span>
                    <span className={styles.ribbonSave}>
                      {month.units > 0 ? `${month.units} u` : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className={styles.billEmpty}>
            <strong>{copy.audit.months}</strong>
            <p>{copy.audit.monthsEmpty}</p>
          </div>
        )}
      </div>
    </JaaliSheet>
  );
}

export default JaaliAudit;
