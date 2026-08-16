"use client";

import type { ProposalData } from "@/lib/proposal-data";
import styles from "./Sienna.module.css";
import { SiennaSheet, useSiennaBankDetails } from "./sienna-brand";
import { useSiennaLang } from "./sienna-lang-context";
import { buildSiennaTermsModel } from "./sienna-terms-copy";

function TermList({ items }: { items: string[] }) {
  return (
    <ul className={styles.clauseList}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function TermsBankPlate({ data }: { data: ProposalData }) {
  const { copy } = useSiennaLang();
  const bank = useSiennaBankDetails(data);
  const hasBank = Boolean(
    bank.accountName || bank.accountNumber || bank.ifsc || bank.upiId
  );
  if (!hasBank) return null;
  const dash = "—";

  return (
    <aside className={styles.bankPlate} aria-label={copy.terms.bankTitle}>
      <p>
        <strong>{copy.terms.bankTitle}.</strong> {copy.terms.bankIntro}
      </p>
      <dl className={styles.bankGrid}>
        <dt>{copy.terms.bankAccountName}</dt>
        <dd>{bank.accountName || dash}</dd>
        <dt>{copy.terms.bankAcNo}</dt>
        <dd>{bank.accountNumber || dash}</dd>
        <dt>{copy.terms.bankIfsc}</dt>
        <dd>{bank.ifsc || dash}</dd>
        <dt>{copy.terms.bankUpi}</dt>
        <dd>{bank.upiId || dash}</dd>
      </dl>
    </aside>
  );
}

export function SiennaTerms({ data }: { data: ProposalData }) {
  const { copy, lang } = useSiennaLang();
  const model = buildSiennaTermsModel(data, lang);

  return (
    <SiennaSheet data={data} page="07 / 09" chapter={copy.spine.terms}>
      <p className={styles.kicker}>{copy.terms.kicker}</p>
      <h1 className={styles.displayTitle}>{copy.terms.title}</h1>
      <p className={styles.lead}>{copy.terms.lead}</p>

      <div className={styles.clauseGrid}>
        <article className={styles.clause}>
          <h3>{copy.terms.general}</h3>
          <TermList items={model.general} />
        </article>
        <div>
          <article className={styles.clause}>
            <h3>{copy.terms.documents}</h3>
            <TermList items={model.documents} />
          </article>
          <article className={`${styles.clause} ${styles.clauseStacked}`}>
            <h3>{copy.terms.amcScope}</h3>
            <p className={styles.clauseLead}>{model.amcObjective}</p>
            <TermList items={model.amcScope} />
          </article>
        </div>
      </div>
    </SiennaSheet>
  );
}

export function SiennaTermsContinued({ data }: { data: ProposalData }) {
  const { copy, lang } = useSiennaLang();
  const model = buildSiennaTermsModel(data, lang);

  return (
    <SiennaSheet data={data} page="08 / 09" chapter={copy.spine.terms2}>
      <p className={styles.kicker}>{copy.terms.kicker2}</p>
      <h1 className={styles.displayTitle}>{copy.terms.title2}</h1>
      <p className={styles.lead}>{copy.terms.lead2}</p>

      <div className={`${styles.clauseGrid} ${styles.clauseEqual}`}>
        <article className={styles.clause}>
          <h3>{copy.terms.clientScope}</h3>
          <TermList items={model.clientScope} />
        </article>
        <article className={styles.clause}>
          <h3>{copy.terms.cost}</h3>
          <p className={styles.clauseLead}>{model.amcCostParagraph}</p>
          <TermList items={model.amcTerms} />
        </article>
      </div>

      <TermsBankPlate data={data} />

      <div className={styles.signoff}>
        <span>{copy.terms.regards}</span>
        <strong>{model.installerName || "—"}</strong>
      </div>
    </SiennaSheet>
  );
}

export default SiennaTerms;
