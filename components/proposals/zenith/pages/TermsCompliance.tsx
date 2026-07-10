import type { ProposalData } from "@/lib/proposal-data";
import styles from "../zenith.module.css";

type Props = {
  terms: ProposalData["terms"];
};

/** Terms, documents & AMC — Pearl page. */
export function TermsCompliance({ terms }: Props) {
  const conditions = terms?.conditions ?? [];
  const documents = terms?.documents ?? [];
  const amcScope = terms?.amcScope ?? [];
  const amcTerms = terms?.amcTerms ?? [];
  if (conditions.length === 0 && documents.length === 0 && amcScope.length === 0) {
    return null;
  }

  return (
    <section className={styles.contentPage}>
      <h2 className={styles.sectionTitle}>Terms & Compliance</h2>
      <div className={styles.goldRule} aria-hidden />
      <p className={styles.sectionLead}>
        Proposal validity, documentation checklist, and optional AMC coverage.
      </p>

      {conditions.length > 0 ? (
        <ul className={styles.bulletList}>
          {conditions.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      ) : null}

      {documents.length > 0 ? (
        <>
          <h3 className={styles.subTitle}>Documents required</h3>
          <ul className={styles.bulletList}>
            {documents.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </>
      ) : null}

      {amcScope.length > 0 ? (
        <>
          <h3 className={styles.subTitle}>AMC scope</h3>
          {terms.amcObjective ? (
            <p className={styles.sectionLead}>{terms.amcObjective}</p>
          ) : null}
          <ul className={styles.bulletList}>
            {amcScope.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
          {amcTerms.length > 0 ? (
            <ul className={styles.bulletList}>
              {amcTerms.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
