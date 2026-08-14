"use client";

import type { ProposalData } from "@/lib/proposal-data";
import {
  formatInr,
  formatInrCompact,
  formatLifetimeBenefitInr,
} from "@/components/proposals/_shared/formatters";
import { CyanotypeBlueprintFrame } from "./CyanotypeBlueprintFrame";
import styles from "./Cyanotype.module.css";
import { cyanotypeAnnualUnits, cyanotypePanelLine } from "./cyanotype-live";

export function CyanotypeLedgerPage({ data }: { data: ProposalData }) {
  const gross = data.economics.grossInr;
  const subsidy = data.economics.subsidyInr;
  const net = data.economics.netInr;
  const showSubsidy = subsidy > 0;
  const payback = data.economics.paybackYears;
  const monthly = data.economics.monthlySavingsInr;
  const annual =
    data.closing.annualSavingsInr > 0
      ? data.closing.annualSavingsInr
      : monthly > 0
        ? monthly * 12
        : 0;
  const lifetime =
    data.closing.lifetimeWealthInr > 0
      ? data.closing.lifetimeWealthInr
      : data.economics.lifetimeProfitInr;
  const units = cyanotypeAnnualUnits(data);
  const panelLine = cyanotypePanelLine(data);
  const payments = (data.execution.payments ?? []).filter((p) => p.label?.trim());

  return (
    <CyanotypeBlueprintFrame>
      <div className={styles.dimensionLine}>
        <span className={styles.dimArrow}>|←</span>
        <span className={styles.dimText}>CAPITAL &amp; PERFORMANCE SCHEDULE</span>
        <span className={styles.dimArrow}>→|</span>
      </div>

      <h2 className={styles.sectionTitle}>Financial Draft</h2>
      <p className={styles.bodyCopy}>
        Live economics on this proposal — blank fields are not estimated. Stage payments remain on
        gross turnkey cost; subsidy is credited later when present.
      </p>

      <div className={styles.dataGrid}>
        <div className={styles.dataBox}>
          <span className={styles.dataBoxLabel}>SYSTEM COST (A)</span>
          <span className={styles.dataBoxValue}>{gross > 0 ? formatInrCompact(gross) : "—"}</span>
        </div>
        <div className={styles.dataBox}>
          <span className={styles.dataBoxLabel}>
            {showSubsidy ? "NET INVESTMENT (D)" : "NET INVESTMENT (= A)"}
          </span>
          <span className={styles.dataBoxValue}>
            {showSubsidy
              ? net > 0
                ? formatInrCompact(net)
                : "—"
              : gross > 0
                ? formatInrCompact(gross)
                : "—"}
          </span>
        </div>
        <div className={styles.dataBox}>
          <span className={styles.dataBoxLabel}>YEAR-1 YIELD (EST.)</span>
          <span className={`${styles.dataBoxValue} ${styles.dataBoxValueSm}`}>
            {units > 0 ? `${units.toLocaleString("en-IN")} kWh` : "—"}
          </span>
        </div>
        <div className={styles.dataBox}>
          <span className={styles.dataBoxLabel}>SIMPLE PAYBACK</span>
          <span className={`${styles.dataBoxValue} ${styles.dataBoxValueSm}`}>
            {payback > 0 ? `${payback} yrs` : "—"}
          </span>
        </div>
        <div className={styles.dataBox}>
          <span className={styles.dataBoxLabel}>ANNUAL SAVINGS</span>
          <span className={`${styles.dataBoxValue} ${styles.dataBoxValueSm}`}>
            {annual > 0 ? formatInr(annual) : "—"}
          </span>
        </div>
        <div className={styles.dataBox}>
          <span className={styles.dataBoxLabel}>25-YR CUMULATIVE</span>
          <span className={`${styles.dataBoxValue} ${styles.dataBoxValueSm}`}>
            {lifetime > 0 ? formatLifetimeBenefitInr(lifetime) : "—"}
          </span>
        </div>
      </div>

      {panelLine ? (
        <p className={styles.bodyCopy} style={{ marginTop: "5mm" }}>
          BOM panel line: <strong>{panelLine}</strong>
        </p>
      ) : null}

      {payments.length > 0 ? (
        <div className={`${styles.dataGrid} ${styles.dataGridSingle}`} style={{ marginTop: "4mm" }}>
          {payments.map((p) => (
            <div key={p.label} className={styles.dataBox}>
              <span className={styles.dataBoxLabel}>
                STAGE · {p.label}
                {p.pctLabel ? ` · ${p.pctLabel}` : ""}
              </span>
              <span className={`${styles.dataBoxValue} ${styles.dataBoxValueSm}`}>
                {p.amountInr > 0 ? formatInr(p.amountInr) : "—"}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      <footer className={styles.pageFooter}>CYANOTYPE ISSUE · SHEET 02 / 03</footer>
    </CyanotypeBlueprintFrame>
  );
}

export default CyanotypeLedgerPage;
