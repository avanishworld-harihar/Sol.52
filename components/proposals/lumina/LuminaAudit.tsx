"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { formatInr, formatLifetimeBenefitInr } from "@/components/proposals/_shared/formatters";
import styles from "./Lumina.module.css";
import { luminaLifetime, luminaMonthlySavings, luminaYearlyBill } from "./lumina-live";

export function LuminaAudit({ data }: { data: ProposalData }) {
  const yearlyBill = luminaYearlyBill(data);
  const monthly = luminaMonthlySavings(data);
  const lifetime = luminaLifetime(data);

  return (
    <section className={styles.a4Lumina}>
      <div className={styles.contentArea}>
        <div className={styles.dateTag}>Financial intelligence</div>
        <h1 className={styles.clientTitle}>Energy Audit.</h1>
        <p className={styles.subText}>
          This page compares the current grid bill on file with the live savings on this
          proposal. Blank fields are not estimated.
        </p>

        <div className={styles.auditSplit}>
          <div className={styles.auditBox}>
            <div className={styles.auditTitle}>Current Grid Liability</div>
            <div className={styles.auditRow}>
              <span className={styles.auditMuted}>Grid reliance (today)</span>
              <span className={styles.auditVal}>100%</span>
            </div>
            <div className={styles.auditRow}>
              <span className={styles.auditMuted}>Tariff escalation risk</span>
              <span className={`${styles.auditVal} ${styles.auditRisk}`}>High</span>
            </div>
            <div className={styles.auditRow}>
              <span className={styles.auditMuted}>Est. annual grid cost</span>
              <span className={styles.auditVal}>
                {yearlyBill > 0 ? formatInr(yearlyBill) : "—"}
              </span>
            </div>
          </div>

          <div className={`${styles.auditBox} ${styles.auditBoxDark}`}>
            <div className={`${styles.auditTitle} ${styles.auditTitleDark}`}>Post-Solar Dividend</div>
            <div className={`${styles.auditRow} ${styles.auditRowDark}`}>
              <span className={styles.auditMutedDark}>Est. monthly savings</span>
            </div>
            <div className={`${styles.auditRow} ${styles.auditRowDark}`}>
              <span className={styles.highlightGreen}>
                {monthly > 0 ? `+${formatInr(monthly)}` : "—"}
              </span>
            </div>
            <div className={`${styles.auditRow} ${styles.auditRowDark}`}>
              <span className={styles.auditMutedDark}>25-year cumulative</span>
              <span className={`${styles.auditVal} ${styles.highlightGreen}`} style={{ fontSize: "1.15rem" }}>
                {lifetime > 0 ? formatLifetimeBenefitInr(lifetime) : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.pageFooter}>Lumina · 02 / 05</div>
    </section>
  );
}

export default LuminaAudit;
