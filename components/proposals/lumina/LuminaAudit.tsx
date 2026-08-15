"use client";

import type { ProposalData } from "@/lib/proposal-data";
import {
  formatInr,
  formatInrCompact,
  formatLifetimeBenefitInr,
} from "@/components/proposals/_shared/formatters";
import styles from "./Lumina.module.css";
import { LuminaDocFooter } from "./lumina-brand";
import { useLuminaLang } from "./lumina-lang-context";
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
  const { copy } = useLuminaLang();
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
    <section className={`${styles.a4Lumina} ${styles.innerSheet}`}>
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
                ? copy.audit.step2Hint(
                    money(yearlySave),
                    coverPct > 0 ? copy.audit.step2Cover(coverPct) : ""
                  )
                : copy.audit.step2Empty}
            </span>
          </article>

          <article className={`${styles.auditStep} ${styles.auditStepSubsidy}`}>
            <span className={styles.auditStepNum}>3</span>
            <span className={styles.auditStepKicker}>{copy.audit.step3}</span>
            <strong className={`${styles.auditStepValue} ${styles.auditStepValueSubsidy}`}>
              {subsidy > 0 ? `− ${formatInrCompact(subsidy)}` : copy.audit.noneOnFile}
            </strong>
            <span className={styles.auditStepHint}>
              {subsidy > 0 ? copy.audit.step3HintYes : copy.audit.step3HintNo}
            </span>
          </article>
        </div>

        {subsidy > 0 ? (
          <div className={styles.auditSubsidyBar}>
            <div>
              <span className={styles.auditSubsidyKicker}>{copy.audit.plantAfterSubsidy}</span>
              <strong>{net > 0 ? formatInr(net) : "—"}</strong>
            </div>
            <span className={styles.auditSubsidyNote}>
              {gross > 0
                ? copy.audit.grossSubsidy(formatInrCompact(gross), formatInrCompact(subsidy))
                : copy.audit.fromProposal}
            </span>
          </div>
        ) : null}

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
          <div className={styles.auditChips}>
            <div className={styles.auditChip}>
              <span>{copy.audit.year1Saving}</span>
              <strong>{money(yearlySave)}</strong>
            </div>
            <div className={styles.auditChip}>
              <span>{copy.audit.year25}</span>
              <strong>{lifetime > 0 ? formatLifetimeBenefitInr(lifetime) : "—"}</strong>
            </div>
            <div className={styles.auditChip}>
              <span>{copy.audit.payback}</span>
              <strong>{payback > 0 ? `${payback} ${copy.audit.yr}` : "—"}</strong>
            </div>
          </div>
        )}

        <p className={styles.auditPlain}>
          {monthlySave > 0 && subsidy > 0
            ? copy.audit.readBoth(formatInr(monthlySave), formatInrCompact(subsidy))
            : monthlySave > 0
              ? copy.audit.readSave(formatInr(monthlySave))
              : copy.audit.readEmpty}
        </p>
      </div>
      <LuminaDocFooter data={data} page="02 / 09" />
    </section>
  );
}

export default LuminaAudit;
