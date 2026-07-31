"use client";

/**
 * Quantum Terms & Conditions — full Premium Luxe parity (2 A4 pages).
 * EN / Hindi via quantum-copy. Quantum Glass3D style.
 */

import type { ProposalData } from "@/lib/proposal-data";
import { formatInr, formatInrCompact } from "@/components/proposals/_shared/formatters";
import {
  QUANTUM_DEFAULT_BRAND,
  useQuantumBrand,
} from "./quantum-brand";
import { useQuantumLang } from "./quantum-lang-context";
import styles from "./Quantum.module.css";

export type QuantumTermsProps = {
  data: ProposalData;
};

function isAmcPlanLabel(s: string): boolean {
  return /\d+\s*-?\s*year\s*amc|amc\s*option/i.test(s);
}

function isExclusionNote(s: string): boolean {
  return /exclud|does not include|not covered|physical damage|third-party|misuse|theft|vandal|glass replacement|शारीरिक|चोरी|तोड़फोड़|शामिल नहीं/i.test(
    s
  );
}

function isCommercialNote(s: string): boolean {
  return /payable|charges|duration|force majeure|half-yearly|escalat|contract|extend|अग्रिम|अर्धवार्षिक|बढ़ाया/i.test(
    s
  );
}

function take<T>(arr: T[], n: number): T[] {
  return arr.slice(0, n);
}

/** Page 1 — General terms + documents required. */
export function QuantumTermsPage1({ data }: QuantumTermsProps) {
  const { copy } = useQuantumLang();
  const docs = take(
    data.terms.documents.length > 0
      ? data.terms.documents
      : copy.terms.defaultDocs,
    6
  );

  return (
    <section className={`${styles.a4Page} ${styles.termsPage}`}>
      <div className={styles.pageHeader}>
        <span
          className={styles.cyanText}
          style={{ fontSize: "0.75rem", letterSpacing: "3px" }}
        >
          {copy.terms.eyebrow}
        </span>
        <h2>{copy.terms.title}</h2>
      </div>
      <p className={styles.termsIntro}>{copy.terms.intro1}</p>

      <div className={`${styles.glass3D} ${styles.termsBlock}`}>
        <span className={styles.termsSubhead}>{copy.terms.general}</span>
        <ol className={styles.termsArticleList}>
          {copy.terms.generalTerms.map((t, i) => (
            <li key={t.label} className={styles.termsArticle}>
              <span className={styles.termsArticleNum}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <strong>{t.label}</strong>
                <p>{t.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className={`${styles.glass3D} ${styles.termsBlock}`}>
        <span className={styles.termsSubhead}>{copy.terms.docs}</span>
        <ol className={styles.termsNumberedList}>
          {docs.map((d, i) => (
            <li key={d.slice(0, 48)}>
              <span className={styles.termsListNum}>{i + 1}</span>
              <span>{d}</span>
            </li>
          ))}
        </ol>
      </div>

      <p className={styles.termsCounsel}>{copy.terms.counsel}</p>
    </section>
  );
}

/** Page 2 — Safety, client scope, AMC includes/excludes/cost. */
export function QuantumTermsPage2({ data }: QuantumTermsProps) {
  const { copy } = useQuantumLang();
  const brand = useQuantumBrand(data) || QUANTUM_DEFAULT_BRAND;
  const invoiceBase =
    data.economics.grossInr > 0
      ? data.economics.grossInr
      : data.economics.netInr;
  const invoiceRef =
    invoiceBase > 0
      ? `${formatInr(invoiceBase)} (${formatInrCompact(invoiceBase)})`
      : copy.terms.invoiceValue;

  const amcObjective =
    data.terms.amcObjective?.trim() || copy.terms.amcObjective;

  const scopeRaw =
    data.terms.amcScope.length > 0
      ? data.terms.amcScope
      : copy.terms.amcIncludesList;
  const planOptions = take(scopeRaw.filter(isAmcPlanLabel), 3);
  const includeItems = scopeRaw.filter(
    (s) =>
      !isAmcPlanLabel(s) &&
      !/^annual maintenance contract/i.test(s) &&
      !/^amc includes/i.test(s)
  );
  const amcIncludes = take(
    includeItems.length > 0 ? includeItems : copy.terms.amcIncludesList,
    4
  );

  const notesRaw =
    data.terms.amcTerms.length > 0
      ? data.terms.amcTerms
      : [...copy.terms.amcExcludesList, ...copy.terms.amcCommercial];
  const excludesFromNotes = notesRaw.filter(isExclusionNote);
  const commercialNotes = notesRaw.filter(
    (s) => !isExclusionNote(s) && isCommercialNote(s)
  );
  const amcExcludes = take(
    excludesFromNotes.length > 0
      ? excludesFromNotes
      : copy.terms.amcExcludesList,
    3
  );
  const amcCommercial = take(
    commercialNotes.length > 0
      ? commercialNotes
      : copy.terms.amcCommercial,
    2
  );

  return (
    <section className={`${styles.a4Page} ${styles.termsPage}`}>
      <div className={styles.pageHeader}>
        <span
          className={styles.cyanText}
          style={{ fontSize: "0.75rem", letterSpacing: "3px" }}
        >
          {copy.terms.eyebrowCont}
        </span>
        <h2>{copy.terms.title2}</h2>
      </div>
      <p className={styles.termsIntro}>{copy.terms.intro2}</p>

      <div className={styles.termsTwoCol}>
        <div className={`${styles.glass3D} ${styles.termsBlock}`}>
          <span className={styles.termsSubhead}>{copy.terms.safety}</span>
          <ul className={styles.termsBulletList}>
            {copy.terms.safetyNotes.map((s) => (
              <li key={s.slice(0, 40)}>{s}</li>
            ))}
          </ul>
        </div>

        <div className={`${styles.glass3D} ${styles.termsBlock}`}>
          <span className={styles.termsSubhead}>{copy.terms.clientScope}</span>
          <ol className={styles.termsNumberedList}>
            {take(copy.terms.clientScopeList, 6).map((s, i) => (
              <li key={s.slice(0, 48)}>
                <span className={styles.termsListNum}>{i + 1}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className={`${styles.glass3D} ${styles.termsBlock}`}>
        <span className={styles.termsSubhead}>{copy.terms.amcScope}</span>
        <p className={styles.termsPara}>{amcObjective}</p>

        {planOptions.length > 0 ? (
          <>
            <p className={styles.termsAmcLabel}>{copy.terms.availablePlans}</p>
            <ol className={styles.termsNumberedList}>
              {planOptions.map((s) => (
                <li key={`plan-${s.slice(0, 32)}`}>
                  <span className={styles.termsListNum}>•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </>
        ) : null}

        <p className={styles.termsAmcLabel}>{copy.terms.amcIncludes}</p>
        <ol className={styles.termsNumberedList}>
          {amcIncludes.map((s, i) => (
            <li key={`inc-${s.slice(0, 32)}`}>
              <span className={styles.termsListNum}>{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>

        <p className={styles.termsAmcLabel}>{copy.terms.amcExcludes}</p>
        <ol className={styles.termsNumberedList}>
          {amcExcludes.map((s, i) => (
            <li key={`exc-${s.slice(0, 32)}`}>
              <span className={styles.termsListNum}>{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className={`${styles.glass3D} ${styles.termsBlock}`}>
        <span className={styles.termsSubhead}>{copy.terms.amcCost}</span>
        <div className={styles.termsCostBox}>
          <p>{copy.terms.year1}</p>
          <p>
            {copy.terms.year2}
            {invoiceBase > 0 ? (
              <>
                {" "}
                ({copy.terms.refInvoice} <strong>{invoiceRef}</strong>)
              </>
            ) : null}
            .
          </p>
        </div>
        {amcCommercial.length > 0 ? (
          <>
            <p className={styles.termsAmcLabel}>{copy.terms.paymentNotes}</p>
            <ol className={styles.termsNumberedList}>
              {amcCommercial.map((t, i) => (
                <li key={`com-${t.slice(0, 32)}`}>
                  <span className={styles.termsListNum}>{i + 1}</span>
                  <span>{t}</span>
                </li>
              ))}
            </ol>
          </>
        ) : null}
      </div>

      <div className={styles.termsSignoff}>
        <span>{copy.terms.regards}</span>
        <strong>{brand}</strong>
        <em>{copy.terms.partner}</em>
      </div>
    </section>
  );
}
