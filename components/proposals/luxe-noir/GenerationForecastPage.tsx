"use client";

/**
 * Premium Luxe — Monthly generation forecast (Canvas pattern)
 * + bill consumption bars when proposal is bill-based.
 */

import type { ProposalData } from "@/lib/proposal-data";
import type { PremiumProposalPptInput } from "@/lib/proposal-ppt";
import { isProposalBillAuditBacked } from "@/lib/proposal-bill-audit-eligibility";
import { formatLuxeInr, formatLuxeInrReadable } from "./luxe-format";
import { buildLuxeForecastMonths } from "./luxe-generation-forecast";
import { ExpertVerdict } from "./ExpertVerdict";
import { useLuxeLang } from "./luxe-lang-context";
import { luxeDisplayFont } from "./luxe-fonts";
import { LuxeHeaderBrand, LuxePageFooter } from "./luxe-brand";
import styles from "./luxe.module.css";

export type GenerationForecastPageProps = {
  data: ProposalData;
  generationUnits: number;
  brand?: string;
  pptInput?: PremiumProposalPptInput | null;
};

export function GenerationForecastPage({
  data,
  generationUnits,
  pptInput,
}: GenerationForecastPageProps) {
  const { copy, isHi } = useLuxeLang();

  const annualSavings =
    data.closing.annualSavingsInr > 0
      ? data.closing.annualSavingsInr
      : data.economics.monthlySavingsInr > 0
        ? data.economics.monthlySavingsInr * 12
        : 0;

  const billBased = Boolean(
    pptInput &&
      isProposalBillAuditBacked(pptInput) &&
      data.bill.months.some((m) => m.units > 0)
  );

  const months = buildLuxeForecastMonths({
    annualGenUnits: generationUnits,
    annualSavingsInr: annualSavings,
    billMonths: data.bill.months,
    includeBillSeries: billBased,
  });

  const savingPerUnit =
    generationUnits > 0 && annualSavings > 0
      ? annualSavings / generationUnits
      : 0;

  const genLabel =
    generationUnits > 0
      ? `${generationUnits.toLocaleString("en-IN")} ${
          isHi ? "यूनिट" : "units"
        }`
      : "—";

  return (
    <section
      className={`${styles.a4Page} ${styles.genForecastPage} ${luxeDisplayFont.variable}`}
    >
      <header className={styles.luxeHeaderBlock}>
        <div className={styles.luxeHeaderRow}>
          <div className={styles.luxeHeaderCopy}>
            <span className={styles.goldTag}>{copy.gen.tag}</span>
            <h2 className={styles.luxeHeadline}>{copy.gen.title}</h2>
          </div>
          <LuxeHeaderBrand />
        </div>
      </header>

      <p className={styles.genForecastLead}>
        {billBased ? copy.gen.leadBill : copy.gen.lead}
      </p>

      <div className={styles.genForecastKpis}>
        <div className={styles.genForecastKpi}>
          <span>{copy.gen.annualGen}</span>
          <strong className={styles.luxeNum}>{genLabel}</strong>
          <em>{copy.gen.annualGenHint}</em>
        </div>
        <div className={`${styles.genForecastKpi} ${styles.genForecastKpiAccent}`}>
          <span>{copy.gen.annualSavings}</span>
          <strong className={styles.luxeNum}>
            {annualSavings > 0 ? formatLuxeInr(annualSavings) : "—"}
          </strong>
          <em>
            {annualSavings > 0
              ? `${copy.gen.about} ${formatLuxeInrReadable(Math.round(annualSavings / 12))}${copy.gen.perMonth}`
              : copy.gen.year1Hint}
          </em>
        </div>
      </div>

      <div className={styles.genForecast}>
        <div className={styles.genForecastHead}>
          <span>{copy.gen.chartHead}</span>
          {billBased ? (
            <div className={styles.genForecastLegendInline}>
              <span className={styles.genLegendGen}>
                <i /> {copy.gen.legendGen}
              </span>
              <span className={styles.genLegendBill}>
                <i /> {copy.gen.legendBill}
              </span>
            </div>
          ) : (
            <span className={styles.genForecastHeadHint}>{copy.gen.chartHint}</span>
          )}
        </div>

        <div
          className={styles.genForecastBars}
          role="img"
          aria-label={
            billBased
              ? "Monthly generation and bill units"
              : "Monthly generation"
          }
        >
          {months.map((m) => (
            <div
              key={m.label}
              className={`${styles.genMonthCol}${
                m.isPeak ? ` ${styles.genMonthPeak}` : ""
              }`}
            >
              <span className={styles.genMonthUnits}>
                {m.genUnits > 0 ? m.genUnits.toLocaleString("en-IN") : "—"}
              </span>
              {billBased ? (
                <span className={styles.genMonthBillUnits}>
                  {m.billUnits != null && m.billUnits > 0
                    ? m.billUnits.toLocaleString("en-IN")
                    : "·"}
                </span>
              ) : null}
              <div
                className={`${styles.genBarTrack}${
                  billBased ? ` ${styles.genBarTrackDual}` : ""
                }`}
              >
                <div
                  className={styles.genBarFill}
                  style={
                    { "--gen-bar-pct": m.genBarPct } as React.CSSProperties
                  }
                  title={`${copy.gen.legendGen}: ${m.genUnits}`}
                />
                {billBased ? (
                  <div
                    className={styles.genBarFillBill}
                    style={
                      {
                        "--bill-bar-pct":
                          m.billBarPct > 0 ? m.billBarPct : 4,
                        opacity: m.billBarPct > 0 ? 1 : 0.25,
                      } as React.CSSProperties
                    }
                    title={
                      m.billUnits != null && m.billUnits > 0
                        ? `${copy.gen.legendBill}: ${m.billUnits}`
                        : copy.gen.noBillMonth
                    }
                  />
                ) : null}
              </div>
              <span className={styles.genMonthLabel}>{m.label}</span>
              <span className={styles.genMonthSave}>
                {m.savingsInr > 0
                  ? `₹${Math.round(m.savingsInr / 1000)}k`
                  : "—"}
              </span>
            </div>
          ))}
        </div>

        <div className={styles.genForecastLegend}>
          <span>{copy.gen.unitsLabel}</span>
          <span>{copy.gen.savingsLabel}</span>
        </div>
        {savingPerUnit > 0 ? (
          <p className={styles.genSavingsBasis}>
            {copy.gen.savingsBasis(savingPerUnit.toFixed(2))}
          </p>
        ) : null}
        {billBased ? (
          <p className={styles.genBillNote}>{copy.gen.billNote}</p>
        ) : null}
      </div>

      <ExpertVerdict label={copy.gen.verdictLabel}>
        {billBased ? copy.gen.verdictBill : copy.gen.verdict}
      </ExpertVerdict>

      <LuxePageFooter pageLabel="07 / 12" />
    </section>
  );
}

export default GenerationForecastPage;
