"use client";

import type { ProposalData } from "@/lib/proposal-data";
import styles from "./Khadi.module.css";
import { KhadiSheet, useKhadiBankDetails } from "./khadi-brand";
import { useKhadiLang } from "./khadi-lang-context";
import { buildKhadiTermsModel } from "./khadi-terms-copy";

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
  const { copy } = useKhadiLang();
  const bank = useKhadiBankDetails(data);
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

export function KhadiTerms({ data }: { data: ProposalData }) {
  const { copy, lang } = useKhadiLang();
  const model = buildKhadiTermsModel(data, lang);

  return (
    <KhadiSheet data={data} page="07 / 09" chapter={copy.spine.terms}>
      <p className={styles.kicker}>{copy.terms.kicker}</p>
      <h1 className={styles.displayTitle}>{copy.terms.title}</h1>
      <p className={styles.lead}>{copy.terms.lead}</p>

      <div className={styles.millTerms}>
        <article className={styles.millCol}>
          <h3>{copy.terms.general}</h3>
          <TermList items={model.general} />
        </article>
        <div className={styles.millCol}>
          <h3>{copy.terms.documents}</h3>
          <TermList items={model.documents} />
          <h3 className={styles.millStackHead}>{copy.terms.amcScope}</h3>
          <p className={styles.clauseLead}>{model.amcObjective}</p>
          <TermList items={model.amcScope} />
        </div>
      </div>
    </KhadiSheet>
  );
}

export function KhadiTermsContinued({ data }: { data: ProposalData }) {
  const { copy, lang } = useKhadiLang();
  const model = buildKhadiTermsModel(data, lang);

  return (
    <KhadiSheet data={data} page="08 / 09" chapter={copy.spine.terms2}>
      <p className={styles.kicker}>{copy.terms.kicker2}</p>
      <h1 className={styles.displayTitle}>{copy.terms.title2}</h1>
      <p className={styles.lead}>{copy.terms.lead2}</p>

      <div className={styles.millTerms}>
        <article className={styles.millCol}>
          <h3>{copy.terms.clientScope}</h3>
          <TermList items={model.clientScope} />
        </article>
        <article className={styles.millCol}>
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
    </KhadiSheet>
  );
}

export default KhadiTerms;
