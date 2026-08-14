"use client";

/**
 * Emerald Signature — Legal Framework Part I (commercials, subsidy, payments).
 */

import type { ProposalData } from "@/lib/proposal-data";
import { useEmeraldBrand } from "./emerald-brand";
import styles from "./Emerald.module.css";

export type EmeraldTermsOneProps = {
  data: ProposalData;
};

export function EmeraldTermsOne({ data }: EmeraldTermsOneProps) {
  const brand = useEmeraldBrand(data);

  return (
    <section className={styles.a4Page}>
      <div className={styles.sidebar}>
        <span className={styles.folioNum}>08</span>
        <div>
          <span className={styles.goldEyebrow}>SECTION SEVEN</span>
          <h3 className={styles.sidebarTitle}>
            Terms
            <br />
            &amp; Conditions.
          </h3>
          <p className={styles.sidebarBlurb}>
            Price, subsidy, payments, and net metering (Part 1).
          </p>
        </div>
      </div>

      <div className={styles.contentArea}>
        <h2 className={styles.pageHeader}>Terms & Conditions</h2>

        <div className={styles.legalGrid}>
          <div className={styles.legalClause}>
            <span className={styles.clauseNum}>01</span>
            <div className={styles.clauseBody}>
              <span className={styles.clauseTitle}>
                Price and validity
              </span>
              <p className={styles.clauseText}>
                Prices in this proposal are valid for 30 days from the date of
                issue. Final system size and price depend on a site survey and a
                check of the roof&apos;s load capacity. Any extra roof work needed
                will be charged at actual cost.
              </p>
            </div>
          </div>

          <div className={styles.legalClause}>
            <span className={styles.clauseNum}>02</span>
            <div className={styles.clauseBody}>
              <span className={styles.clauseTitle}>
                Subsidy and government approvals
              </span>
              <p className={styles.clauseText}>
                Any subsidy shown (for example, PM Surya Ghar Muft Bijli Yojana)
                is an estimate based on current government rules. {brand} helps
                with the application. The final subsidy amount and payment are
                decided by MNRE and the local agencies. {brand} is not
                responsible for delays in portal approval or subsidy credit.
              </p>
            </div>
          </div>

          <div className={styles.legalClause}>
            <span className={styles.clauseNum}>03</span>
            <div className={styles.clauseBody}>
              <span className={styles.clauseTitle}>
                Payments
              </span>
              <p className={styles.clauseText}>
                Work follows the agreed payment stages. If a payment is late by
                more than 7 working days, buying and installation will pause.
                All equipment stays with {brand} until the full amount is paid.
              </p>
            </div>
          </div>

          <div className={styles.legalClause}>
            <span className={styles.clauseNum}>04</span>
            <div className={styles.clauseBody}>
              <span className={styles.clauseTitle}>
                Net metering and grid connection
              </span>
              <p className={styles.clauseText}>
                The time needed for net meter installation and grid connection
                depends on your local DISCOM. {brand} will file the papers and
                follow up. Delays from DISCOM testing or meter availability are
                outside our control.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default EmeraldTermsOne;
