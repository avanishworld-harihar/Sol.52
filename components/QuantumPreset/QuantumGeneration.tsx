"use client";

/**
 * Quantum — monthly generation forecast.
 * Bill-based proposals also show consumption unit bars beside generation.
 */

import type { ProposalData } from "@/lib/proposal-data";
import type { PremiumProposalPptInput } from "@/lib/proposal-ppt";
import { isProposalBillAuditBacked } from "@/lib/proposal-bill-audit-eligibility";
import { formatInr, formatInrCompact } from "@/components/proposals/_shared/formatters";
import { QUANTUM_SPECIFIC_YIELD } from "./quantum-brand";
import { buildQuantumForecastMonths } from "./quantum-generation-forecast";
import { QuantumAtmosphere } from "./QuantumAtmosphere";
import { QuantumGrowBar } from "./quantum-motion";
import { useQuantumLang } from "./quantum-lang-context";
import styles from "./Quantum.module.css";

export type QuantumGenerationProps = {
  data: ProposalData;
  pptInput?: PremiumProposalPptInput | null;
};

export function QuantumGeneration({ data, pptInput }: QuantumGenerationProps) {
  const { copy } = useQuantumLang();
  const systemKw = Number(data.meta.systemKw) || 0;
  const annualGen =
    data.closing.annualUnits > 0
      ? data.closing.annualUnits
      : systemKw > 0
        ? Math.round(systemKw * QUANTUM_SPECIFIC_YIELD)
        : 0;
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

  const months = buildQuantumForecastMonths({
    annualGenUnits: annualGen,
    annualSavingsInr: annualSavings,
    billMonths: data.bill.months,
    includeBillSeries: billBased,
    monthLabels: copy.gen.months,
  });

  const savingPerUnit =
    annualGen > 0 && annualSavings > 0 ? annualSavings / annualGen : 0;

  const genLabel =
    annualGen > 0
      ? `${annualGen.toLocaleString("en-IN")} ${copy.gen.unitsWord}`
      : "—";

  return (
    <section className={`${styles.a4Page} ${styles.genPage}`}>
      <QuantumAtmosphere variant="finance" />

      <div className={styles.pageStack}>
        <div className={styles.pageHeader}>
          <span
            className={styles.cyanText}
            style={{ fontSize: "0.75rem", letterSpacing: "3px" }}
          >
            {copy.gen.eyebrow}
          </span>
          <h2>{copy.gen.title}</h2>
        </div>

        <p className={styles.genLead}>
          {billBased ? copy.gen.leadBill : copy.gen.lead}
        </p>

        <div className={styles.genKpis}>
          <div className={`${styles.glass3D} ${styles.genKpi}`}>
            <span className={styles.label}>{copy.gen.annualGen}</span>
            <strong className={styles.valueMedium}>{genLabel}</strong>
            <em>{copy.gen.annualGenHint}</em>
          </div>
          <div className={`${styles.glass3D} ${styles.genKpi}`}>
            <span className={styles.label}>{copy.gen.annualSavings}</span>
            <strong className={styles.valueMedium}>
              {annualSavings > 0 ? formatInr(annualSavings) : "—"}
            </strong>
            <em>
              {annualSavings > 0
                ? `${copy.gen.about} ${formatInrCompact(Math.round(annualSavings / 12))}${copy.gen.perMonth}`
                : copy.gen.year1Hint}
            </em>
          </div>
        </div>

        <div className={`${styles.glass3D} ${styles.genChartCard}`}>
          <div className={styles.genChartHead}>
            <span>{copy.gen.chartHead}</span>
            {billBased ? (
              <div className={styles.genLegendInline}>
                <span className={styles.genLegendGen}>
                  <i /> {copy.gen.legendGen}
                </span>
                <span className={styles.genLegendBill}>
                  <i /> {copy.gen.legendBill}
                </span>
              </div>
            ) : (
              <span className={styles.genChartHint}>{copy.gen.chartHint}</span>
            )}
          </div>

          <div
            className={styles.genBars}
            role="img"
            aria-label={
              billBased
                ? copy.gen.ariaBoth
                : copy.gen.ariaGen
            }
          >
            {months.map((m, i) => (
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
                  <QuantumGrowBar
                    className={styles.genBarFill}
                    heightPct={Math.max(8, m.genBarPct)}
                    delay={0.03 * i}
                  />
                  {billBased ? (
                    <QuantumGrowBar
                      className={styles.genBarFillBill}
                      heightPct={Math.max(
                        6,
                        m.billBarPct > 0 ? m.billBarPct : 4
                      )}
                      delay={0.03 * i + 0.04}
                      style={{ opacity: m.billBarPct > 0 ? 1 : 0.25 }}
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

          <div className={styles.genChartFoot}>
            <span>{copy.gen.unitsLabel}</span>
            <span>{copy.gen.savingsLabel}</span>
          </div>
          {savingPerUnit > 0 ? (
            <p className={styles.genNote}>
              {copy.gen.savingsBasis(savingPerUnit.toFixed(2))}
            </p>
          ) : null}
          {billBased ? (
            <p className={styles.genNote}>{copy.gen.billNote}</p>
          ) : null}
        </div>

        <div className={`${styles.glass3D} ${styles.genVerdict}`}>
          <span className={styles.label}>{copy.gen.verdictLabel}</span>
          <p>{billBased ? copy.gen.verdictBill : copy.gen.verdict}</p>
        </div>
      </div>
    </section>
  );
}

export default QuantumGeneration;
