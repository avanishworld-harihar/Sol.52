"use client";

/**
 * Premium Luxe — Terms & Compliance (2 A4 pages).
 * Single-column · density capped so content stays inside A4 (no overlap / clip).
 */

import type { ProposalData } from "@/lib/proposal-data";
import { formatLuxeInr, formatLuxeInrReadable } from "./luxe-format";
import { ExpertVerdict } from "./ExpertVerdict";
import { useLuxeLang } from "./luxe-lang-context";
import { luxeDisplayFont } from "./luxe-fonts";
import { LuxeHeaderBrand, LuxePageFooter, useLuxeBrand } from "./luxe-brand";
import styles from "./luxe.module.css";

export type TermsComplianceProps = {
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

export function TermsCompliancePage1({ data }: TermsComplianceProps) {
  const { copy } = useLuxeLang();
  const docs = take(
    data.terms.documents.length > 0 ? data.terms.documents : DEFAULT_DOCS,
    6
  );

  return (
    <section
      className={`${styles.a4Page} ${styles.termsPage} ${styles.termsPageRoomy} ${luxeDisplayFont.variable}`}
    >
      <header className={styles.termsHead}>
        <div className={styles.luxeHeaderRow}>
          <div className={styles.luxeHeaderCopy}>
            <span className={styles.termsTag}>{copy.terms.tag1}</span>
            <h2 className={styles.termsTitle}>{copy.terms.title}</h2>
          </div>
          <LuxeHeaderBrand />
        </div>
        <p className={styles.termsIntro}>{copy.terms.intro1}</p>
      </header>

      <div className={styles.termsStack}>
        <section className={styles.termsSection}>
          <div className={styles.termsSubhead}>{copy.terms.general}</div>
          <ol className={styles.termsArticleList}>
            {GENERAL_TERMS.map((t, i) => (
              <li key={t.label} className={styles.termsArticle}>
                <span className={styles.termsArticleNum}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <strong className={styles.termsArticleLabel}>{t.label}</strong>
                  <p className={styles.termsArticleBody}>{t.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.termsSection}>
          <div className={styles.termsSubhead}>{copy.terms.documents}</div>
          <ol className={styles.termsNumberedList}>
            {docs.map((d, i) => (
              <li key={d.slice(0, 48)}>
                <span className={styles.termsListNum}>{i + 1}</span>
                <span>{d}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <ExpertVerdict label={copy.terms.counselLabel}>{copy.terms.counsel}</ExpertVerdict>

      <LuxePageFooter pageLabel="10 / 12" />
    </section>
  );
}

export function TermsCompliancePage2({ data }: TermsComplianceProps) {
  const { copy, isHi } = useLuxeLang();
  const brand = useLuxeBrand();
  const vendor = brand.vendorName;
  const invoiceBase =
    data.economics.grossInr > 0
      ? data.economics.grossInr
      : data.economics.netInr;
  const invoiceRef =
    invoiceBase > 0
      ? `${formatLuxeInr(invoiceBase)} (${formatLuxeInrReadable(invoiceBase)})`
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
    <section
      className={`${styles.a4Page} ${styles.termsPage} ${styles.termsPageDense} ${luxeDisplayFont.variable}`}
    >
      <header className={styles.termsHead}>
        <div className={styles.luxeHeaderRow}>
          <div className={styles.luxeHeaderCopy}>
            <span className={styles.termsTag}>{copy.terms.tag2}</span>
            <h2 className={styles.termsTitle}>{copy.terms.title}</h2>
          </div>
          <LuxeHeaderBrand />
        </div>
        <p className={styles.termsIntro}>{copy.terms.intro2}</p>
      </header>

      <div className={styles.termsStack}>
        <section className={styles.termsSection}>
          <div className={styles.termsSubhead}>{copy.terms.safety}</div>
          <ul className={styles.termsSafetyList}>
            {SAFETY_NOTES.map((s) => (
              <li key={s.slice(0, 40)}>{s}</li>
            ))}
          </ul>
        </section>

        <section className={styles.termsSection}>
          <div className={styles.termsSubhead}>{copy.terms.clientScope}</div>
          <ol className={styles.termsNumberedList}>
            {take(CLIENT_SCOPE, 6).map((s, i) => (
              <li key={s.slice(0, 48)}>
                <span className={styles.termsListNum}>{i + 1}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.termsSection}>
          <div className={styles.termsSubhead}>{copy.terms.amcScope}</div>
          <p className={styles.termsPara}>{amcObjective}</p>

          {planOptions.length > 0 ? (
            <>
              <p className={styles.termsAmcIncludes}>{copy.terms.availablePlans}</p>
              <ol className={styles.termsNumberedList}>
                {planOptions.map((s, i) => (
                  <li key={`plan-${s.slice(0, 32)}`}>
                    <span className={styles.termsListNum}>{i + 1}</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            </>
          ) : null}

          <p className={styles.termsAmcIncludes}>{copy.terms.amcIncludes}</p>
          <ol className={styles.termsNumberedList}>
            {amcIncludes.map((s, i) => (
              <li key={`inc-${s.slice(0, 32)}`}>
                <span className={styles.termsListNum}>{i + 1}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>

          <p className={styles.termsAmcIncludes}>{copy.terms.amcExcludes}</p>
          <ol className={styles.termsNumberedList}>
            {amcExcludes.map((s, i) => (
              <li key={`exc-${s.slice(0, 32)}`}>
                <span className={styles.termsListNum}>{i + 1}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.termsSection}>
          <div className={styles.termsSubhead}>{copy.terms.amcCost}</div>
          <div className={styles.termsCostBox}>
            <p>{copy.terms.year1Included}</p>
            <p>
              {copy.terms.year2Onwards}
              {invoiceBase > 0 ? (
                <>
                  {" "}
                  (<span className={styles.luxeNum}>{invoiceRef}</span>)
                </>
              ) : null}
            </p>
          </div>
          {amcCommercial.length > 0 ? (
            <>
              <p className={styles.termsAmcIncludes}>{copy.terms.paymentNotes}</p>
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
        </section>

        <div className={styles.termsSignoff}>
          <span className={styles.termsRegards}>{copy.terms.regards}</span>
          <span className={styles.termsBrand}>{vendor.toUpperCase()}</span>
          <span className={styles.termsVendorTag}>{copy.terms.vendorTag}</span>
        </div>
      </div>

      <ExpertVerdict label={copy.terms.omLabel}>{copy.terms.om}</ExpertVerdict>

      <LuxePageFooter pageLabel="11 / 12" />
    </section>
  );
}
