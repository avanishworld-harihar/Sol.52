"use client";

/**
 * Quantum Terms & Conditions — full Premium Luxe parity (2 A4 pages).
 * All points kept; Quantum Glass3D style + simple English.
 */

import type { ProposalData } from "@/lib/proposal-data";
import { formatInr, formatInrCompact } from "@/components/proposals/_shared/formatters";
import {
  QUANTUM_DEFAULT_BRAND,
  useQuantumBrand,
} from "./quantum-brand";
import styles from "./Quantum.module.css";

export type QuantumTermsProps = {
  data: ProposalData;
};

const GENERAL_TERMS: { label: string; text: string }[] = [
  {
    label: "Load Change",
    text: "DISCOM load change, or cable change from pole to meter and liaison — only if required — is in the customer's scope.",
  },
  {
    label: "Statutory Fees",
    text: "Government fees for net-metering, subsidy, and DISCOM approvals are paid directly by the client.",
  },
  {
    label: "Arrears",
    text: "If load increase is required, clear prior DISCOM bills/arrears before processing.",
  },
  {
    label: "Inverter Warranty",
    text: "Inverter warranty as per manufacturer (typically 8–10 years on string inverters).",
  },
  {
    label: "Module Warranty",
    text: "Product 15 years; performance ≥80% at year 30. Other parts: 1 year from commissioning.",
  },
  {
    label: "Warranty Scope",
    text: "Manufacturing defects only. Physical damage, misuse, or vandalism is not covered.",
  },
  {
    label: "Maintenance",
    text: "Routine module cleaning (recommended weekly) is in the customer's scope.",
  },
  {
    label: "Timeline",
    text: "Installation within 30–40 working days from advance, as per agreed PO / schedule.",
  },
  {
    label: "Governing Terms",
    text: "Terms not listed here are governed by mutual written agreement.",
  },
  {
    label: "Refunds",
    text: "If applicable: after 2.5% deduction on finalization amount plus documented expenses.",
  },
];

const DEFAULT_DOCS = [
  "Latest electricity bill (clear copy)",
  "PAN card copy",
  "Aadhaar card copy",
  "Ownership proof — tax receipt / sale deed",
  "Passport-size photograph",
  "Signed SLD (draft provided by us)",
];

const DEFAULT_AMC_OBJECTIVE =
  "AMC keeps generation checks and safety visits on schedule.";

const DEFAULT_AMC_INCLUDES = [
  "Periodic plant performance monitoring",
  "Routine preventive maintenance",
  "Emergency breakdown (within 48 working hours)",
  "OEM coordination for warranty support",
];

const DEFAULT_AMC_EXCLUDES = [
  "Physical damage, theft, or vandalism",
  "Module glass replacement from external impact",
  "DISCOM metering fees and government charges",
];

const CLIENT_SCOPE = [
  "Site security / watch and ward",
  "Insurance of plant (if desired)",
  "Stable internet for monitoring (if applicable)",
  "Water and auxiliary power for maintenance",
  "Regular module cleaning per OEM guidelines",
  "DISCOM / municipal letters when requested",
];

const DEFAULT_AMC_COMMERCIAL = [
  "When charged, fees are payable in advance (half-yearly).",
  "Minimum O&M: 2 years, extendable by mutual consent.",
];

const SAFETY_NOTES = [
  "Do not open ACDB / DCDB or inverter covers — trained technicians only.",
  "Keep lightning arrestor and earthing bonded; do not disconnect earth leads.",
  "Report isolation trips or burning smell immediately; do not reset repeatedly.",
];

function isAmcPlanLabel(s: string): boolean {
  return /\d+\s*-?\s*year\s*amc|amc\s*option/i.test(s);
}

function isExclusionNote(s: string): boolean {
  return /exclud|does not include|not covered|physical damage|third-party|misuse|theft|vandal|glass replacement/i.test(
    s
  );
}

function isCommercialNote(s: string): boolean {
  return /payable|charges|duration|force majeure|half-yearly|escalat|contract|extend/i.test(
    s
  );
}

function take<T>(arr: T[], n: number): T[] {
  return arr.slice(0, n);
}

/** Page 1 — General terms + documents required. */
export function QuantumTermsPage1({ data }: QuantumTermsProps) {
  const docs = take(
    data.terms.documents.length > 0 ? data.terms.documents : DEFAULT_DOCS,
    6
  );

  return (
    <section className={`${styles.a4Page} ${styles.termsPage}`}>
      <div className={styles.pageHeader}>
        <span
          className={styles.cyanText}
          style={{ fontSize: "0.75rem", letterSpacing: "3px" }}
        >
          06 // TERMS &amp; CONDITIONS
        </span>
        <h2>Terms &amp; Conditions.</h2>
      </div>
      <p className={styles.termsIntro}>
        Please read these terms carefully. They cover warranties, documents,
        timelines, and what is in the customer&apos;s scope.
      </p>

      <div className={`${styles.glass3D} ${styles.termsBlock}`}>
        <span className={styles.termsSubhead}>01 · General terms</span>
        <ol className={styles.termsArticleList}>
          {GENERAL_TERMS.map((t, i) => (
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
        <span className={styles.termsSubhead}>02 · Documents required</span>
        <ol className={styles.termsNumberedList}>
          {docs.map((d, i) => (
            <li key={d.slice(0, 48)}>
              <span className={styles.termsListNum}>{i + 1}</span>
              <span>{d}</span>
            </li>
          ))}
        </ol>
      </div>

      <p className={styles.termsCounsel}>
        Keep copies ready before work starts — this avoids delays in subsidy and
        net-metering.
      </p>
    </section>
  );
}

/** Page 2 — Safety, client scope, AMC includes/excludes/cost. */
export function QuantumTermsPage2({ data }: QuantumTermsProps) {
  const brand = useQuantumBrand(data) || QUANTUM_DEFAULT_BRAND;
  const invoiceBase =
    data.economics.grossInr > 0
      ? data.economics.grossInr
      : data.economics.netInr;
  const invoiceRef =
    invoiceBase > 0
      ? `${formatInr(invoiceBase)} (${formatInrCompact(invoiceBase)})`
      : "invoice value";

  const amcObjective = data.terms.amcObjective?.trim() || DEFAULT_AMC_OBJECTIVE;

  const scopeRaw =
    data.terms.amcScope.length > 0 ? data.terms.amcScope : DEFAULT_AMC_INCLUDES;
  const planOptions = take(scopeRaw.filter(isAmcPlanLabel), 3);
  const includeItems = scopeRaw.filter(
    (s) =>
      !isAmcPlanLabel(s) &&
      !/^annual maintenance contract/i.test(s) &&
      !/^amc includes/i.test(s)
  );
  const amcIncludes = take(
    includeItems.length > 0 ? includeItems : DEFAULT_AMC_INCLUDES,
    4
  );

  const notesRaw =
    data.terms.amcTerms.length > 0
      ? data.terms.amcTerms
      : [...DEFAULT_AMC_EXCLUDES, ...DEFAULT_AMC_COMMERCIAL];
  const excludesFromNotes = notesRaw.filter(isExclusionNote);
  const commercialNotes = notesRaw.filter(
    (s) => !isExclusionNote(s) && isCommercialNote(s)
  );
  const amcExcludes = take(
    excludesFromNotes.length > 0 ? excludesFromNotes : DEFAULT_AMC_EXCLUDES,
    3
  );
  const amcCommercial = take(
    commercialNotes.length > 0 ? commercialNotes : DEFAULT_AMC_COMMERCIAL,
    2
  );

  return (
    <section className={`${styles.a4Page} ${styles.termsPage}`}>
      <div className={styles.pageHeader}>
        <span
          className={styles.cyanText}
          style={{ fontSize: "0.75rem", letterSpacing: "3px" }}
        >
          06 // TERMS &amp; CONDITIONS · CONT.
        </span>
        <h2>Safety, Scope &amp; AMC.</h2>
      </div>
      <p className={styles.termsIntro}>
        Safety rules, customer responsibilities, and annual maintenance details
        for this proposal.
      </p>

      <div className={styles.termsTwoCol}>
        <div className={`${styles.glass3D} ${styles.termsBlock}`}>
          <span className={styles.termsSubhead}>03 · Safety &amp; protection</span>
          <ul className={styles.termsBulletList}>
            {SAFETY_NOTES.map((s) => (
              <li key={s.slice(0, 40)}>{s}</li>
            ))}
          </ul>
        </div>

        <div className={`${styles.glass3D} ${styles.termsBlock}`}>
          <span className={styles.termsSubhead}>04 · Customer scope</span>
          <ol className={styles.termsNumberedList}>
            {take(CLIENT_SCOPE, 6).map((s, i) => (
              <li key={s.slice(0, 48)}>
                <span className={styles.termsListNum}>{i + 1}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className={`${styles.glass3D} ${styles.termsBlock}`}>
        <span className={styles.termsSubhead}>05 · Annual maintenance — scope</span>
        <p className={styles.termsPara}>{amcObjective}</p>

        {planOptions.length > 0 ? (
          <>
            <p className={styles.termsAmcLabel}>Available plans:</p>
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

        <p className={styles.termsAmcLabel}>AMC includes:</p>
        <ol className={styles.termsNumberedList}>
          {amcIncludes.map((s, i) => (
            <li key={`inc-${s.slice(0, 32)}`}>
              <span className={styles.termsListNum}>{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>

        <p className={styles.termsAmcLabel}>AMC does not include:</p>
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
        <span className={styles.termsSubhead}>06 · Cost of maintenance</span>
        <div className={styles.termsCostBox}>
          <p>Year 1: AMC / basic O&amp;M is included with the system as quoted.</p>
          <p>
            Year 2 onwards: charged as per mutual agreement
            {invoiceBase > 0 ? (
              <>
                {" "}
                (reference invoice: <strong>{invoiceRef}</strong>)
              </>
            ) : null}
            .
          </p>
        </div>
        {amcCommercial.length > 0 ? (
          <>
            <p className={styles.termsAmcLabel}>Payment notes:</p>
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
        <span>With regards,</span>
        <strong>{brand}</strong>
        <em>Your solar partner</em>
      </div>
    </section>
  );
}
