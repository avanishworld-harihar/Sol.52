"use client";

/**
 * Emerald Signature — Terms & Conditions (single folio).
 */

import type { ProposalData } from "@/lib/proposal-data";
import { useEmeraldBrand } from "./emerald-brand";
import { emeraldWarranty } from "./emerald-live";
import { useEmeraldLang } from "./emerald-lang-context";
import styles from "./Emerald.module.css";

export type EmeraldTermsOneProps = {
  data: ProposalData;
  folio: string;
};

export function EmeraldTermsOne({ data, folio }: EmeraldTermsOneProps) {
  const { copy } = useEmeraldLang();
  const liveBrand = useEmeraldBrand(data);
  const brand = liveBrand || copy.common.installerFallback;
  const panelYrs = emeraldWarranty(data, /panel|module|pv/i);
  const inverterYrs = emeraldWarranty(data, /inverter/i);
  const workYrs = emeraldWarranty(data, /work|install/i);
  const venue =
    data.meta.locationLine?.trim() || data.closing.address?.trim() || "";

  const clauses = [
    { num: "01", title: copy.terms.c1Title, text: copy.terms.c1 },
    { num: "02", title: copy.terms.c2Title, text: copy.terms.c2(brand) },
    { num: "03", title: copy.terms.c3Title, text: copy.terms.c3(brand) },
    { num: "04", title: copy.terms.c4Title, text: copy.terms.c4(brand) },
    {
      num: "05",
      title: copy.terms.c5Title,
      text: copy.terms.c5(brand, panelYrs, inverterYrs, workYrs),
    },
    { num: "06", title: copy.terms.c6Title, text: copy.terms.c6 },
    { num: "07", title: copy.terms.c7Title, text: copy.terms.c7(brand) },
    {
      num: "08",
      title: copy.terms.c8Title,
      text: venue
        ? `${copy.terms.c8Lead} ${copy.terms.courtsLoc(venue)}`
        : `${copy.terms.c8Lead} ${copy.terms.courtsIndia}`,
    },
  ];

  return (
    <section className={`${styles.a4Page} ${styles.legalPage}`}>
      <div className={styles.sidebar}>
        <span className={styles.folioNum}>{folio}</span>
        <div>
          <span className={styles.goldEyebrow}>{copy.common.section(folio)}</span>
          <h3 className={styles.sidebarTitle}>
            {copy.terms.sidebarTitle[0]}
            <br />
            {copy.terms.sidebarTitle[1]}
          </h3>
          <p className={styles.sidebarBlurb}>{copy.terms.sidebarBlurb}</p>
        </div>
      </div>

      <div className={styles.contentArea}>
        <h2 className={styles.pageHeader}>{copy.terms.pageHeader}</h2>

        <div className={styles.legalGrid}>
          {clauses.map((clause) => (
            <div key={clause.num} className={styles.legalClause}>
              <span className={styles.clauseNum}>{clause.num}</span>
              <div className={styles.clauseBody}>
                <span className={styles.clauseTitle}>{clause.title}</span>
                <p className={styles.clauseText}>{clause.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.legalEnd}>{copy.terms.end(brand)}</div>
      </div>
    </section>
  );
}

export default EmeraldTermsOne;
