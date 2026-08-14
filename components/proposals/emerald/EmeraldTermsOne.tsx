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
            Legal
            <br />
            Framework.
          </h3>
          <p className={styles.sidebarBlurb}>
            Standard terms of deployment, commercial agreements, and operational
            liabilities (Part I).
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
                Commercial Validity & Pricing
              </span>
              <p className={styles.clauseText}>
                The commercial values stated in this proposal are valid for a
                period of 30 days from the date of issue. Final system sizing
                and exact pricing are subject to a detailed physical site survey
                and load-bearing assessment of the deployment area. Any
                structural modifications required on the roof will be billed at
                actuals.
              </p>
            </div>
          </div>

          <div className={styles.legalClause}>
            <span className={styles.clauseNum}>02</span>
            <div className={styles.clauseBody}>
              <span className={styles.clauseTitle}>
                Subsidy & Government Approvals
              </span>
              <p className={styles.clauseText}>
                Any subsidy mentioned (e.g., PM Surya Ghar Muft Bijli Yojana) is
                an estimate based on current central/state policies. {brand} acts
                as an implementation partner and facilitator. The final
                disbursement of the subsidy amount is strictly at the discretion
                of the Ministry of New and Renewable Energy (MNRE) and the
                respective nodal agencies. {brand} is not liable for delays in
                portal approvals or subsidy credits.
              </p>
            </div>
          </div>

          <div className={styles.legalClause}>
            <span className={styles.clauseNum}>03</span>
            <div className={styles.clauseBody}>
              <span className={styles.clauseTitle}>
                Payment Milestones & Default
              </span>
              <p className={styles.clauseText}>
                Project execution is strictly tethered to the approved milestone
                schedule. Delay in clearance of material or installation
                advances beyond 7 working days will result in a corresponding
                pause in procurement and deployment. All hardware remains the
                exclusive property of {brand} until the final 100% payment is
                cleared by the client.
              </p>
            </div>
          </div>

          <div className={styles.legalClause}>
            <span className={styles.clauseNum}>04</span>
            <div className={styles.clauseBody}>
              <span className={styles.clauseTitle}>
                Net Metering & Grid Connectivity
              </span>
              <p className={styles.clauseText}>
                The timeline for net meter installation and grid synchronization
                is heavily dependent on the local utility provider (DISCOM).
                While {brand} will prepare and submit all necessary technical
                documentation and liaise with authorities, statutory delays
                caused by the DISCOM&apos;s testing or meter availability are
                outside our operational control.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default EmeraldTermsOne;
