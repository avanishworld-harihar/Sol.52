"use client";

/**
 * Emerald Signature — Legal Framework Part I (commercials, subsidy, payments).
 */

import type { ProposalData } from "@/lib/proposal-data";
import { useEmeraldBrand } from "./emerald-brand";
import { useEmeraldLang } from "./emerald-lang-context";
import styles from "./Emerald.module.css";

export type EmeraldTermsOneProps = {
  data: ProposalData;
};

export function EmeraldTermsOne({ data }: EmeraldTermsOneProps) {
  const { copy } = useEmeraldLang();
  const brand = useEmeraldBrand(data);

  return (
    <section className={styles.a4Page}>
      <div className={styles.sidebar}>
        <span className={styles.folioNum}>08</span>
        <div>
          <span className={styles.goldEyebrow}>{copy.terms.eyebrow}</span>
          <h3 className={styles.sidebarTitle}>
            {copy.terms.sidebarTitle[0]}
            <br />
            {copy.terms.sidebarTitle[1]}
          </h3>
          <p className={styles.sidebarBlurb}>{copy.terms.sidebarBlurb1}</p>
        </div>
      </div>

      <div className={styles.contentArea}>
        <h2 className={styles.pageHeader}>{copy.terms.pageHeader}</h2>

        <div className={styles.legalGrid}>
          <div className={styles.legalClause}>
            <span className={styles.clauseNum}>01</span>
            <div className={styles.clauseBody}>
              <span className={styles.clauseTitle}>{copy.terms.c1Title}</span>
              <p className={styles.clauseText}>{copy.terms.c1}</p>
            </div>
          </div>

          <div className={styles.legalClause}>
            <span className={styles.clauseNum}>02</span>
            <div className={styles.clauseBody}>
              <span className={styles.clauseTitle}>{copy.terms.c2Title}</span>
              <p className={styles.clauseText}>{copy.terms.c2(brand)}</p>
            </div>
          </div>

          <div className={styles.legalClause}>
            <span className={styles.clauseNum}>03</span>
            <div className={styles.clauseBody}>
              <span className={styles.clauseTitle}>{copy.terms.c3Title}</span>
              <p className={styles.clauseText}>{copy.terms.c3(brand)}</p>
            </div>
          </div>

          <div className={styles.legalClause}>
            <span className={styles.clauseNum}>04</span>
            <div className={styles.clauseBody}>
              <span className={styles.clauseTitle}>{copy.terms.c4Title}</span>
              <p className={styles.clauseText}>{copy.terms.c4(brand)}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default EmeraldTermsOne;
