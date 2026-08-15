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
  const { copy } = useLuminaLang();
  const gross = data.economics.grossInr;
  const subsidy = data.economics.subsidyInr;
  const net = data.economics.netInr;
  const showSubsidy = subsidy > 0;
  const payback = data.economics.paybackYears;
  const lifetime =
    data.closing.lifetimeWealthInr > 0
      ? data.closing.lifetimeWealthInr
      : data.economics.lifetimeProfitInr;
  const units = luminaAnnualUnits(data);
  const payments = (data.execution.payments ?? []).filter((p) => p.label?.trim()).slice(0, 3);
  const netValue = showSubsidy ? net : gross;

  return (
    <section className={`${styles.a4Lumina} ${styles.innerSheet}`}>
      <div className={styles.contentArea}>
        <div>
          <div className={styles.dateTag}>{copy.capital.tag}</div>
          <h2 className={styles.sectionTitle}>{copy.capital.title}</h2>
          <p className={styles.subText}>{copy.capital.lead}</p>
        </div>

        <div className={styles.capStack}>
          <div className={`${styles.capSection} ${styles.capSectionPay}`}>
            <div className={styles.capSectionHead}>
              <span className={styles.capKicker}>{copy.capital.pay}</span>
              <span className={styles.capHint}>{copy.capital.payHint}</span>
            </div>
            <div className={styles.capMetricGrid}>
              <Figure name={copy.capital.gross} value={gross > 0 ? formatInrCompact(gross) : "—"} />
              {showSubsidy ? (
                <Figure name={copy.capital.subsidyLater} value={`− ${formatInrCompact(subsidy)}`} />
              ) : (
                <Figure name={copy.capital.subsidyNone} value={copy.capital.noneOnFile} />
              )}
              <Figure
                name={showSubsidy ? copy.capital.netAfter : copy.capital.netSame}
                value={netValue > 0 ? formatInrCompact(netValue) : "—"}
                wide
              />
            </div>
          </div>

          {payments.length > 0 ? (
            <div className={`${styles.capSection} ${styles.capSectionPaySchedule}`}>
              <div className={styles.capSectionHead}>
                <span className={styles.capKicker}>{copy.capital.howPay}</span>
                <span className={styles.capHint}>{copy.capital.howPayHint}</span>
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

          <div className={`${styles.capSection} ${styles.capSectionSave}`}>
            <div className={styles.capSectionHead}>
              <span className={styles.capKicker}>{copy.capital.produce}</span>
              <span className={styles.capHint}>{copy.capital.produceHint}</span>
            </div>
            <div className={styles.capMetricGrid}>
              <Figure
                name={copy.capital.year1Gen}
                value={units > 0 ? units.toLocaleString("en-IN") : "—"}
                unit={units > 0 ? "kWh" : undefined}
              />
              <Figure
                name={copy.capital.payback}
                value={payback > 0 ? String(payback) : "—"}
                unit={payback > 0 ? copy.capital.years : undefined}
              />
              <Figure
                name={copy.capital.over25}
                value={lifetime > 0 ? formatLifetimeBenefitInr(lifetime) : "—"}
                save
                wide
              />
            </div>
          </div>
        </div>

        <LuminaDocFooter data={data} page="05 / 09" />
      </div>
    </section>
  );
}

export default LuminaLedgerPage;
