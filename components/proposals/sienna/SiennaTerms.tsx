"use client";

import type { ProposalData } from "@/lib/proposal-data";
import styles from "./Sienna.module.css";
import { SiennaDocFooter, useSiennaBankDetails } from "./sienna-brand";
import { useSiennaLang } from "./sienna-lang-context";
import { buildSiennaTermsModel } from "./sienna-terms-copy";

function TermList({ items }: { items: string[] }) {
  return (
    <ul className={styles.termsList}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function TermsBankCallout({ data }: { data: ProposalData }) {
  const { copy } = useSiennaLang();
  const bank = useSiennaBankDetails(data);
  const accountName = bank.accountName;
  const accountNumber = bank.accountNumber;
  const ifsc = bank.ifsc;
  const upi = bank.upiId;
  const hasBank = Boolean(accountName || accountNumber || ifsc || upi);
  if (!hasBank) return null;

  const dash = "—";

  return (
    <aside className={styles.termsBankCallout} aria-label={copy.terms.bankTitle}>
      <p className={styles.termsBankIntro}>
        <strong>{copy.terms.bankTitle}:</strong> {copy.terms.bankIntro}
      </p>
      <dl className={styles.termsBankGrid}>
        <dt>{copy.terms.bankAccountName}</dt>
        <dd>{accountName || dash}</dd>
        <dt>{copy.terms.bankAcNo}</dt>
        <dd>{accountNumber || dash}</dd>
        <dt>{copy.terms.bankIfsc}</dt>
        <dd>{ifsc || dash}</dd>
        <dt>{copy.terms.bankUpi}</dt>
        <dd className={styles.termsBankUpi}>{upi || dash}</dd>
      </dl>
    </aside>
  );
}

export function SiennaTerms({ data }: { data: ProposalData }) {
  const { copy, lang } = useSiennaLang();
  const model = buildSiennaTermsModel(data, lang);

  return (
    <section className={`${styles.a4Sienna} ${styles.innerSheet}`}>
      <div className={styles.contentArea}>
        <div className={styles.dateTag}>{copy.terms.tag}</div>
        <h1 className={styles.clientTitle}>{copy.terms.title}</h1>
        <p className={styles.subText}>{copy.terms.lead}</p>

        <div className={styles.termsSplit}>
          <article className={`${styles.termsBlock} ${styles.termsBlockWide}`}>
            <h3>{copy.terms.general}</h3>
            <TermList items={model.general} />
          </article>
          <div className={styles.termsStack}>
            <article className={styles.termsBlock}>
              <h3>{copy.terms.documents}</h3>
              <TermList items={model.documents} />
            </article>
            <article className={styles.termsBlock}>
              <h3>{copy.terms.amcScope}</h3>
              <p className={styles.termsLead}>{model.amcObjective}</p>
              <TermList items={model.amcScope} />
            </article>
          </div>
        </div>
      </div>
      <SiennaDocFooter data={data} page="07 / 09" />
    </section>
  );
}

export function SiennaTermsContinued({ data }: { data: ProposalData }) {
  const { copy, lang } = useSiennaLang();
  const model = buildSiennaTermsModel(data, lang);

  return (
    <section className={`${styles.a4Sienna} ${styles.innerSheet}`}>
      <div className={styles.contentArea}>
        <div className={styles.dateTag}>{copy.terms.tag2}</div>
        <h1 className={styles.clientTitle}>{copy.terms.title2}</h1>
        <p className={styles.subText}>{copy.terms.lead2}</p>

        <div className={styles.termsEqual}>
          <article className={styles.termsBlock}>
            <h3>{copy.terms.clientScope}</h3>
            <TermList items={model.clientScope} />
          </article>
          <article className={styles.termsBlock}>
            <h3>{copy.terms.cost}</h3>
            <p className={styles.termsLead}>{model.amcCostParagraph}</p>
            <TermList items={model.amcTerms} />
          </article>
        </div>

        <TermsBankCallout data={data} />

        <div className={styles.termsSignoff}>
          <span>{copy.terms.regards}</span>
          <strong>{model.installerName || "—"}</strong>
        </div>
      </div>
      <SiennaDocFooter data={data} page="08 / 09" />
    </section>
  );
}

export default SiennaTerms;
