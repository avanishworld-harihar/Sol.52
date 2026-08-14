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
    return `Both sides agree that courts in ${loc} will handle any dispute from this project.`;
  }
  return "Both sides agree that courts in India will handle any dispute from this project.";
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
            Terms
            <br />
            &amp; Conditions.
          </h3>
          <p className={styles.sidebarBlurb}>
            Warranty, generation estimates, and governing law (Part 2).
          </p>
        </div>
      </div>

      <div className={styles.contentArea}>
        <h2 className={`${styles.pageHeader} ${styles.pageHeaderGhost}`}>
          Terms (continued)
        </h2>

        <div className={styles.legalGrid}>
          <div className={styles.legalClause}>
            <span className={styles.clauseNum}>05</span>
            <div className={styles.clauseBody}>
              <span className={styles.clauseTitle}>
                Warranties and maintenance
              </span>
              <p className={styles.clauseText}>
                Product warranties (for example, {panelYrs}-year linear
                performance for panels and {inverterYrs}-year for inverters)
                come from the manufacturers. {brand} gives a {workYrs}-year
                workmanship warranty on the installation. You must clean the
                panels unless you take a separate AMC.
              </p>
            </div>
          </div>

          <div className={styles.legalClause}>
            <span className={styles.clauseNum}>06</span>
            <div className={styles.clauseBody}>
              <span className={styles.clauseTitle}>
                Generation estimates and shadows
              </span>
              <p className={styles.clauseText}>
                Yearly units and savings in this proposal are estimates based on
                past weather data. Actual generation can change due to weather,
                dirty panels, or new shadows after installation.
              </p>
            </div>
          </div>

          <div className={styles.legalClause}>
            <span className={styles.clauseNum}>07</span>
            <div className={styles.clauseBody}>
              <span className={styles.clauseTitle}>
                Events outside our control
              </span>
              <p className={styles.clauseText}>
                {brand} is not responsible for delay caused by events outside
                our control, such as natural disasters, extreme weather,
                pandemics, lockdowns, or major supply shortages.
              </p>
            </div>
          </div>

          <div className={styles.legalClause}>
            <span className={styles.clauseNum}>08</span>
            <div className={styles.clauseBody}>
              <span className={styles.clauseTitle}>
                Governing law
              </span>
              <p className={styles.clauseText}>
                This agreement follows the laws of India. {jurisdictionLine(data)}
              </p>
            </div>
          </div>
        </div>

        <div className={styles.legalEnd}>
          END OF DOCUMENT • {brand}
        </div>
      </div>
    </section>
  );
}

export default EmeraldTermsTwo;
