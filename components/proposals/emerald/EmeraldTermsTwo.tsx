"use client";

/**
 * Emerald Signature — Legal Framework Part II (warranty, yield, jurisdiction).
 */

import type { ProposalData } from "@/lib/proposal-data";
import { useEmeraldBrand } from "./emerald-brand";
import { useEmeraldLang } from "./emerald-lang-context";
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

export function EmeraldTermsTwo({ data }: EmeraldTermsTwoProps) {
  const { copy } = useEmeraldLang();
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
          <span className={styles.goldEyebrow}>{copy.terms.eyebrow}</span>
          <h3 className={styles.sidebarTitle}>
            {copy.terms.sidebarTitle[0]}
            <br />
            {copy.terms.sidebarTitle[1]}
          </h3>
          <p className={styles.sidebarBlurb}>{copy.terms.sidebarBlurb2}</p>
        </div>
      </div>

      <div className={styles.contentArea}>
        <h2 className={`${styles.pageHeader} ${styles.pageHeaderGhost}`}>
          {copy.terms.continued}
        </h2>

        <div className={styles.legalGrid}>
          <div className={styles.legalClause}>
            <span className={styles.clauseNum}>05</span>
            <div className={styles.clauseBody}>
              <span className={styles.clauseTitle}>{copy.terms.c5Title}</span>
              <p className={styles.clauseText}>
                {copy.terms.c5(brand, panelYrs, inverterYrs, workYrs)}
              </p>
            </div>
          </div>

          <div className={styles.legalClause}>
            <span className={styles.clauseNum}>06</span>
            <div className={styles.clauseBody}>
              <span className={styles.clauseTitle}>{copy.terms.c6Title}</span>
              <p className={styles.clauseText}>{copy.terms.c6}</p>
            </div>
          </div>

          <div className={styles.legalClause}>
            <span className={styles.clauseNum}>07</span>
            <div className={styles.clauseBody}>
              <span className={styles.clauseTitle}>{copy.terms.c7Title}</span>
              <p className={styles.clauseText}>{copy.terms.c7(brand)}</p>
            </div>
          </div>

          <div className={styles.legalClause}>
            <span className={styles.clauseNum}>08</span>
            <div className={styles.clauseBody}>
              <span className={styles.clauseTitle}>{copy.terms.c8Title}</span>
              <p className={styles.clauseText}>
                {copy.terms.c8Lead}{" "}
                {data.meta.locationLine?.trim() || data.closing.address?.trim()
                  ? copy.terms.courtsLoc(
                      data.meta.locationLine?.trim() ||
                        data.closing.address?.trim() ||
                        ""
                    )
                  : copy.terms.courtsIndia}
              </p>
            </div>
          </div>
        </div>

        <div className={styles.legalEnd}>
          {copy.terms.end(brand)}
        </div>
      </div>
    </section>
  );
}

export default EmeraldTermsTwo;
