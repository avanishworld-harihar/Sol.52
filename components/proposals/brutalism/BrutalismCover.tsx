"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { formatInrCompact } from "@/components/proposals/_shared/formatters";
import styles from "./Brutalism.module.css";
import {
  brutalismBrand,
  brutalismDcKwp,
  brutalismNetInvestment,
  formatBrutalismKw,
} from "./brutalism-live";

export function BrutalismCover({ data }: { data: ProposalData }) {
  const brand = brutalismBrand(data);
  const systemKw = Number(data.meta.systemKw) || 0;
  const dc = brutalismDcKwp(data);
  const net = brutalismNetInvestment(data);
  const showSubsidy = data.economics.subsidyInr > 0;

  return (
    <section className={styles.a4Brutalist}>
      <div className={styles.brutalHeader}>
        <div className={styles.brandBlock}>{brand}</div>
        <div className={styles.cautionBadge}>SOL.52 DEPLOYMENT SPEC</div>
      </div>

      <h1 className={styles.massiveTitle}>
        POWER
        <br />
        INFRASTRUCTURE.
      </h1>

      <div className={styles.lede}>
        Heavy-duty photovoltaic generation asset engineered for lifetime grid independence.
      </div>

      <div className={styles.brutalGrid}>
        <div className={styles.brutalRow}>
          <div className={styles.brutalLabel}>AC CAPACITY</div>
          <div className={styles.brutalValue}>
            {systemKw > 0 ? `${formatBrutalismKw(systemKw)} KILOWATTS` : "—"}
          </div>
        </div>
        <div className={styles.brutalRow}>
          <div className={styles.brutalLabel}>DC ARRAY</div>
          <div className={styles.brutalValue}>
            {dc > 0 ? `${formatBrutalismKw(dc)} kWp` : "—"}
          </div>
        </div>
        <div className={`${styles.brutalRow} ${styles.brutalRowAccent}`}>
          <div className={`${styles.brutalLabel} ${styles.brutalLabelAccent}`}>
            {showSubsidy ? "NET CAPEX" : "GROSS CAPEX"}
          </div>
          <div className={styles.brutalValue}>{net > 0 ? formatInrCompact(net) : "—"}</div>
        </div>
      </div>

      <footer className={styles.pageFooter}>SHEET 01 / 03 · BRUTAL SPEC</footer>
    </section>
  );
}

export default BrutalismCover;
