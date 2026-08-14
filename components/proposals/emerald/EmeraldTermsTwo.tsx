"use client";

/**
 * Emerald Signature — Legal Framework Part II (warranty, yield, jurisdiction).
 */

import type { ProposalData } from "@/lib/proposal-data";
import { useEmeraldBrand } from "./emerald-brand";
import styles from "./Emerald.module.css";

export type EmeraldTermsTwoProps = {
  data: ProposalData;
};

function highlightYears(
  rows: ProposalData["warranty"]["highlights"],
  test: RegExp,
  fallback: string
): string {
  const hit = rows.find((h) => test.test(h.label));
  return hit?.value || fallback;
}

function jurisdictionLine(data: ProposalData): string {
  const loc =
    data.meta.locationLine?.trim() ||
    data.closing.address?.trim() ||
    "";
  if (loc) {
    return `Both parties irrevocably agree that the courts having jurisdiction over ${loc} shall have exclusive jurisdiction to settle any dispute or claim that arises out of this project deployment.`;
  }
  return "Both parties irrevocably agree that the courts of India shall have exclusive jurisdiction to settle any dispute or claim that arises out of this project deployment.";
}

export function EmeraldTermsTwo({ data }: EmeraldTermsTwoProps) {
  const brand = useEmeraldBrand(data);
  const panelYrs = highlightYears(
    data.warranty.highlights,
    /panel|module|pv/i,
    "30"
  );
  const inverterYrs = highlightYears(
    data.warranty.highlights,
    /inverter/i,
    "10"
  );
  const workYrs = highlightYears(
    data.warranty.highlights,
    /work|install/i,
    "5"
  );

  return (
    <section className={styles.a4Page}>
      <div className={styles.sidebar}>
        <span className={styles.folioNum}>09</span>
        <div>
          <span className={styles.goldEyebrow}>SECTION SEVEN</span>
          <h3 className={styles.sidebarTitle}>
            Legal
            <br />
            Framework.
          </h3>
          <p className={styles.sidebarBlurb}>
            Standard terms of deployment, commercial agreements, and operational
            liabilities (Part II).
          </p>
        </div>
      </div>

      <div className={styles.contentArea}>
        <h2 className={`${styles.pageHeader} ${styles.pageHeaderGhost}`}>
          Continuation
        </h2>

        <div className={styles.legalGrid}>
          <div className={styles.legalClause}>
            <span className={styles.clauseNum}>05</span>
            <div className={styles.clauseBody}>
              <span className={styles.clauseTitle}>
                Hardware Warranties & Maintenance
              </span>
              <p className={styles.clauseText}>
                Product warranties (e.g., {panelYrs}-year linear performance for
                PV modules, {inverterYrs}-year for inverters) are provided
                directly by the respective Original Equipment Manufacturers
                (OEMs). {brand} provides a comprehensive {workYrs}-year
                workmanship warranty on the installation framework. Regular
                cleaning of panels is the responsibility of the client unless a
                separate Annual Maintenance Contract (AMC) is executed.
              </p>
            </div>
          </div>

          <div className={styles.legalClause}>
            <span className={styles.clauseNum}>06</span>
            <div className={styles.clauseBody}>
              <span className={styles.clauseTitle}>
                Yield Estimates & Shadowing
              </span>
              <p className={styles.clauseText}>
                Annual generation figures (Units/kWh) and financial return
                estimates provided in this document are simulated using
                historical meteorological data. Actual generation may vary due
                to unprecedented weather conditions, heavy soiling, or new
                shadow-casting structures built in the vicinity
                post-installation.
              </p>
            </div>
          </div>

          <div className={styles.legalClause}>
            <span className={styles.clauseNum}>07</span>
            <div className={styles.clauseBody}>
              <span className={styles.clauseTitle}>Force Majeure</span>
              <p className={styles.clauseText}>
                {brand} shall not be held liable for any failure or delay in
                fulfilling its obligations if such delay is caused by events
                beyond reasonable control, including but not limited to acts of
                God, extreme weather events (cyclones, earthquakes), pandemics,
                sudden statutory lockdowns, or severe national supply chain
                disruptions.
              </p>
            </div>
          </div>

          <div className={styles.legalClause}>
            <span className={styles.clauseNum}>08</span>
            <div className={styles.clauseBody}>
              <span className={styles.clauseTitle}>
                Governing Law & Jurisdiction
              </span>
              <p className={styles.clauseText}>
                This agreement and any dispute or claim arising out of or in
                connection with it shall be governed by and construed in
                accordance with the laws of India. {jurisdictionLine(data)}
              </p>
            </div>
          </div>
        </div>

        <div className={styles.legalEnd}>
          END OF DOCUMENT • {brand} • SOL.52 ARCHITECTURE
        </div>
      </div>
    </section>
  );
}

export default EmeraldTermsTwo;
