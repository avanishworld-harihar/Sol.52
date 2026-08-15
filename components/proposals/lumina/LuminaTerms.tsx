"use client";

import type { ProposalData } from "@/lib/proposal-data";
import styles from "./Lumina.module.css";
import { LuminaDocFooter } from "./lumina-brand";
import { buildLuminaTermsModel } from "./lumina-terms-copy";

function TermList({ items }: { items: string[] }) {
  return (
    <ul className={styles.termsList}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function LuminaTerms({ data }: { data: ProposalData }) {
  const model = buildLuminaTermsModel(data);

  return (
    <section className={styles.a4Lumina}>
      <div className={styles.contentArea}>
        <div className={styles.dateTag}>Terms & compliance</div>
        <h1 className={styles.clientTitle}>Terms & Conditions.</h1>
        <p className={styles.subText}>
          General terms, documents needed for net-metering, and what annual maintenance covers.
        </p>

        <div className={styles.termsSplit}>
          <article className={`${styles.termsBlock} ${styles.termsBlockWide}`}>
            <h3>General terms</h3>
            <TermList items={model.general} />
          </article>
          <div className={styles.termsStack}>
            <article className={styles.termsBlock}>
              <h3>Documents required</h3>
              <TermList items={model.documents} />
            </article>
            <article className={styles.termsBlock}>
              <h3>Annual maintenance — scope</h3>
              <p className={styles.termsLead}>{model.amcObjective}</p>
              <TermList items={model.amcScope} />
            </article>
          </div>
        </div>
      </div>
      <LuminaDocFooter data={data} page="06 / 08" />
    </section>
  );
}

export function LuminaTermsContinued({ data }: { data: ProposalData }) {
  const model = buildLuminaTermsModel(data);

  return (
    <section className={styles.a4Lumina}>
      <div className={styles.contentArea}>
        <div className={styles.dateTag}>Terms & compliance · continued</div>
        <h1 className={styles.clientTitle}>Maintenance & client scope.</h1>
        <p className={styles.subText}>
          What we cover under AMC, what stays with you, and how later-year maintenance is charged.
        </p>

        <div className={styles.termsEqual}>
          <article className={styles.termsBlock}>
            <h3>Client&apos;s scope</h3>
            <TermList items={model.clientScope} />
          </article>
          <article className={styles.termsBlock}>
            <h3>Cost of maintenance</h3>
            <p className={styles.termsLead}>{model.amcCostParagraph}</p>
            <TermList items={model.amcTerms} />
          </article>
        </div>

        <div className={styles.termsSignoff}>
          <span>Regards,</span>
          <strong>{model.installerName || "—"}</strong>
        </div>
      </div>
      <LuminaDocFooter data={data} page="07 / 08" />
    </section>
  );
}

export default LuminaTerms;
