"use client";

import type { ProposalData } from "@/lib/proposal-data";
import {
  formatInr,
  formatInrCompact,
  formatLifetimeBenefitInr,
} from "@/components/proposals/_shared/formatters";
import styles from "./Lumina.module.css";
import { luminaAnnualUnits } from "./lumina-live";

function Figure({
  name,
  value,
  unit,
  save,
  wide,
}: {
  name: string;
  value: string;
  unit?: string;
  save?: boolean;
  wide?: boolean;
}) {
  return (
    <div className={`${styles.capMetric} ${wide ? styles.capMetricWide : ""}`}>
      <span className={styles.capName}>{name}</span>
      <div>
        <span className={`${styles.capFigure} ${save ? styles.capFigureSave : ""}`}>{value}</span>
        {unit ? (
          <span className={`${styles.capUnit} ${save ? styles.capUnitSave : ""}`}>{unit}</span>
        ) : null}
      </div>
    </div>
  );
}

export function LuminaLedgerPage({ data }: { data: ProposalData }) {
  const gross = data.economics.grossInr;
  const subsidy = data.economics.subsidyInr;
  const net = data.economics.netInr;
  const showSubsidy = subsidy > 0;
  const payback = data.economics.paybackYears;
  const monthly = data.economics.monthlySavingsInr;
  const annualSave =
    data.closing.annualSavingsInr > 0
      ? data.closing.annualSavingsInr
      : monthly > 0
        ? monthly * 12
        : 0;
  const lifetime =
    data.closing.lifetimeWealthInr > 0
      ? data.closing.lifetimeWealthInr
      : data.economics.lifetimeProfitInr;
  const units = luminaAnnualUnits(data);
  const payments = (data.execution.payments ?? []).filter((p) => p.label?.trim()).slice(0, 3);
  const netValue = showSubsidy ? net : gross;

  return (
    <section className={styles.a4Lumina}>
      <div className={styles.contentArea}>
        <div>
          <div className={styles.dateTag}>Capital summary</div>
          <h2 className={styles.sectionTitle}>What you pay. What you get.</h2>
          <p className={styles.subText}>
            Four blocks, four meanings. Stage payments stay on gross; subsidy is credited later
            when it exists. Blank fields are not estimated.
          </p>
        </div>

        <div className={styles.capStack}>
          <div className={`${styles.capSection} ${styles.capSectionPay}`}>
            <div className={styles.capSectionHead}>
              <span className={styles.capKicker}>1 · You pay</span>
              <span className={styles.capHint}>Investment to install the plant</span>
            </div>
            <div className={styles.capMetricGrid}>
              <Figure name="System cost (gross)" value={gross > 0 ? formatInrCompact(gross) : "—"} />
              {showSubsidy ? (
                <Figure name="Subsidy (credited later)" value={`− ${formatInrCompact(subsidy)}`} />
              ) : (
                <Figure name="Subsidy on this quote" value="None on file" />
              )}
              <Figure
                name={showSubsidy ? "Net outlay after subsidy" : "Net outlay (same as gross)"}
                value={netValue > 0 ? formatInrCompact(netValue) : "—"}
                wide
              />
            </div>
          </div>

          <div className={`${styles.capSection} ${styles.capSectionGet}`}>
            <div className={styles.capSectionHead}>
              <span className={styles.capKicker}>2 · The plant produces</span>
              <span className={styles.capHint}>Energy and recovery time — not rupees</span>
            </div>
            <div className={styles.capMetricGrid}>
              <Figure
                name="Year-1 generation"
                value={units > 0 ? units.toLocaleString("en-IN") : "—"}
                unit={units > 0 ? "kWh" : undefined}
              />
              <Figure
                name="Simple payback"
                value={payback > 0 ? String(payback) : "—"}
                unit={payback > 0 ? "years" : undefined}
              />
            </div>
          </div>

          <div className={`${styles.capSection} ${styles.capSectionSave}`}>
            <div className={styles.capSectionHead}>
              <span className={styles.capKicker}>3 · You save</span>
              <span className={styles.capHint}>Bill money that stays with you</span>
            </div>
            <div className={styles.capMetricGrid}>
              <Figure
                name="Every year (est.)"
                value={annualSave > 0 ? `+${formatInr(annualSave)}` : "—"}
                save
              />
              <Figure
                name="Over 25 years (est.)"
                value={lifetime > 0 ? formatLifetimeBenefitInr(lifetime) : "—"}
                save
              />
            </div>
          </div>

          {payments.length > 0 ? (
            <div className={`${styles.capSection} ${styles.capSectionPaySchedule}`}>
              <div className={styles.capSectionHead}>
                <span className={styles.capKicker}>4 · How you pay</span>
                <span className={styles.capHint}>Stage schedule on gross cost</span>
              </div>
              <div className={styles.payList}>
                {payments.map((p, i) => (
                  <div key={p.label} className={styles.payRow}>
                    <span className={styles.payStep}>{i + 1}</span>
                    <span className={styles.payLabel}>
                      {p.label}
                      {p.pctLabel ? ` · ${p.pctLabel}` : ""}
                    </span>
                    <span className={styles.payAmt}>
                      {p.amountInr > 0 ? formatInr(p.amountInr) : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className={styles.pageFooter}>04 / 07</div>
      </div>
    </section>
  );
}

export default LuminaLedgerPage;
