"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { formatInrCompact } from "@/components/proposals/_shared/formatters";
import { CyanotypeBlueprintFrame } from "./CyanotypeBlueprintFrame";
import styles from "./Cyanotype.module.css";
import {
  cyanotypeBrand,
  cyanotypeNetInvestment,
  formatCyanotypeKw,
} from "./cyanotype-live";

export function CyanotypeCover({ data }: { data: ProposalData }) {
  const customer = data.meta.customerName?.trim() || "—";
  const systemKw = Number(data.meta.systemKw) || 0;
  const net = cyanotypeNetInvestment(data);
  const brand = cyanotypeBrand(data);
  const showSubsidy = data.economics.subsidyInr > 0;

  return (
    <CyanotypeBlueprintFrame>
      <div className={styles.stamp}>
        <span>{brand.toUpperCase()}</span>
        <span className={styles.stampDivider}>ARCHITECTURAL DRAFT</span>
      </div>

      <div className={styles.dimensionLine}>
        <span className={styles.dimArrow}>|←</span>
        <span className={styles.dimText}>PROJECT INFRASTRUCTURE : {customer}</span>
        <span className={styles.dimArrow}>→|</span>
      </div>

      <h1 className={styles.blueprintTitle}>
        ROOFTOP
        <br />
        ELEVATION
      </h1>

      <div className={styles.dataGrid}>
        <div className={styles.dataBox}>
          <span className={styles.dataBoxLabel}>ENG_PARAM: SYSTEM ENGINE</span>
          <span className={styles.dataBoxValue}>
            {systemKw > 0 ? `${formatCyanotypeKw(systemKw)} kW` : "—"}
          </span>
        </div>
        <div className={styles.dataBox}>
          <span className={styles.dataBoxLabel}>
            {showSubsidy ? "CAPITAL_REQUIREMENT (NET)" : "CAPITAL_REQUIREMENT (GROSS)"}
          </span>
          <span className={styles.dataBoxValue}>{net > 0 ? formatInrCompact(net) : "—"}</span>
        </div>
      </div>

      <footer className={styles.pageFooter}>CYANOTYPE ISSUE · SHEET 01 / 03</footer>
    </CyanotypeBlueprintFrame>
  );
}

export default CyanotypeCover;
