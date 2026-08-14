"use client";

import type { ProposalData } from "@/lib/proposal-data";
import styles from "./Brutalism.module.css";
import { brutalismBrand, formatBrutalismKw } from "./brutalism-live";

export function BrutalismClosingPage({ data }: { data: ProposalData }) {
  const brand = brutalismBrand(data);
  const customer = data.meta.customerName?.trim() || "—";
  const systemKw = Number(data.meta.systemKw) || 0;
  const installer = data.closing.installerName?.trim() || brand;
  const contact = data.closing.contactLine?.trim() || "—";
  const terms = (data.terms.conditions ?? []).filter((t) => t.trim()).slice(0, 3);

  return (
    <section className={styles.a4Brutalist}>
      <div className={styles.brutalHeader}>
        <div className={styles.brandBlock}>{brand}</div>
        <div className={styles.cautionBadge}>ACCEPTANCE BLOCK</div>
      </div>

      <h1 className={styles.massiveTitle}>
        SIGN
        <br />
        OFF.
      </h1>

      <div className={styles.lede}>
        {customer} is invited to accept this brutal spec as the commercial plant
        {systemKw > 0 ? ` (${formatBrutalismKw(systemKw)} kW AC)` : ""}.
      </div>

      <div className={styles.brutalGrid}>
        {terms.length > 0 ? (
          <div className={styles.brutalRow}>
            <div className={styles.brutalLabel}>TERMS</div>
            <div className={styles.brutalValue} style={{ fontSize: "1rem", fontWeight: 700 }}>
              {terms.join(" · ")}
            </div>
          </div>
        ) : null}
        <div className={styles.brutalRow}>
          <div className={styles.brutalLabel}>CLIENT</div>
          <div className={styles.brutalValue}>{customer}</div>
        </div>
        <div className={`${styles.brutalRow} ${styles.brutalRowAccent}`}>
          <div className={`${styles.brutalLabel} ${styles.brutalLabelAccent}`}>ISSUER</div>
          <div className={styles.brutalValue}>{installer}</div>
        </div>
        <div className={styles.brutalRow}>
          <div className={styles.brutalLabel}>CONTACT</div>
          <div className={styles.brutalValue} style={{ fontSize: "1.2rem" }}>
            {contact}
          </div>
        </div>
      </div>

      <footer className={styles.pageFooter}>SHEET 03 / 03 · END OF SPEC</footer>
    </section>
  );
}

export default BrutalismClosingPage;
