"use client";

/**
 * Premium Luxe — Terms & Compliance (2 A4 pages).
 * Numbered articles, dark readable body, clear section blocks.
 */

import type { ProposalData } from "@/lib/proposal-data";
import { formatLuxeInr, formatLuxeInrReadable } from "./luxe-format";
import { luxeDisplayFont } from "./luxe-fonts";
import styles from "./luxe.module.css";

export type TermsComplianceProps = {
  data: ProposalData;
};

const GENERAL_TERMS: { label: string; text: string }[] = [
  {
    label: "Load Change",
    text: "DISCOM / state electricity board load change, or cable change from pole to meter and its liaison — only if required — will be in the customer's scope.",
  },
  {
    label: "Statutory Fees",
    text: "All government statutory fees, regulatory charges, and legal costs relating to net-metering, subsidy (PM Surya Ghar / state schemes), DISCOM approvals, or any official application shall be borne and paid directly by the client.",
  },
  {
    label: "Arrears",
    text: "If sanctioned / connected load increase is required, all prior DISCOM bills and arrears must be cleared before processing; delay from uncleared dues remains the client's responsibility.",
  },
  {
    label: "Inverter Warranty",
    text: "Inverter warranty is as per manufacturer (typically 8–10 years on string inverters).",
  },
  {
    label: "Module Warranty",
    text: "Product warranty: 15 years; performance warranty: ≥80% at end of 30 years. Overall system parts not listed above: 1 year from commissioning.",
  },
  {
    label: "Warranty Scope",
    text: "Manufacturing defects only. Physical damage, misuse, or vandalism is not covered.",
  },
  {
    label: "Maintenance",
    text: "Routine module cleaning (recommended weekly) is in the customer's scope — it directly affects generation.",
  },
  {
    label: "Timeline",
    text: "Installation completed within 30–40 working days from advance payment as per agreed PO / schedule.",
  },
  {
    label: "Governing Terms",
    text: "Any terms not expressly mentioned herein shall be governed by mutual written agreement.",
  },
  {
    label: "Refunds",
    text: "If applicable, processed after 2.5% deduction on project finalization amount plus documented expenses already incurred.",
  },
];

const DEFAULT_DOCS = [
  "Latest electricity bill (clear copy)",
  "Copy of PAN card",
  "Copy of Aadhaar card (legible, both sides if applicable)",
  "Ownership proof — property tax receipt / sale deed / municipal record",
  "Passport-size photograph of applicant",
  "Single-line diagram (SLD) — draft provided by us; signed copy required from customer",
];

const DEFAULT_AMC_OBJECTIVE =
  "Annual Maintenance Services maintain the performance ratio and general upkeep of the rooftop SPV plant throughout the contract period.";

const DEFAULT_AMC_SCOPE = [
  "Daily / periodic monitoring of plant performance and energy generation",
  "Routine preventive maintenance of plant and equipment",
  "Emergency breakdown attendance (response within 48 working hours)",
  "Coordination with OEMs for warranty support and defect rectification",
  "Periodic inspection of DC & AC protection, earthing, and cable terminations",
];

const CLIENT_SCOPE = [
  "Site security, watch and ward",
  "Insurance of plant and equipment (if desired)",
  "Stable internet connection at site for remote monitoring (where applicable)",
  "Water and auxiliary power for maintenance activities, as needed on site",
  "Day-to-day visual checks and safe access to the rooftop",
  "Regular module cleaning as per manufacturer guidelines",
  "Keeping roof drains clear and reporting abnormal inverter alerts promptly",
  "Providing DISCOM / municipal coordination letters when requested",
];

const DEFAULT_AMC_TERMS = [
  "Maintenance charges, when applicable, are payable in advance on a half-yearly basis.",
  "Minimum O&M contract duration: 2 years, extendable in blocks of 2 years by mutual consent (up to 25 years from commissioning).",
  "We are not liable for module or equipment loss due to theft, stand damage, or vandalism.",
  "Standard force majeure provisions apply; service deficiencies during such events shall be communicated to the client within one week of occurrence.",
  "AMC excludes module glass replacement due to external impact and DISCOM metering fees.",
];

const SAFETY_NOTES = [
  "Do not open ACDB / DCDB or inverter covers — trained technicians only.",
  "Lightning arrestor and earthing must remain bonded; do not disconnect earth leads.",
  "Report isolation trips or burning smell immediately; do not reset repeatedly.",
];

export function TermsCompliancePage1({ data }: TermsComplianceProps) {
  const docs =
    data.terms.documents.length > 0 ? data.terms.documents : DEFAULT_DOCS;

  return (
    <section className={`${styles.a4Page} ${styles.termsPage} ${luxeDisplayFont.variable}`}>
      <header className={styles.termsHead}>
        <span className={styles.termsTag}>09 / TERMS & COMPLIANCE</span>
        <h2 className={styles.termsTitle}>Terms & Conditions</h2>
        <p className={styles.termsIntro}>
          Binding commercial and warranty conditions for this rooftop solar proposal.
          Please read each article carefully before signing.
        </p>
      </header>

      <div className={styles.termsGridFill}>
        <div className={styles.termsCol}>
          <div className={styles.termsSection}>
            <div className={styles.termsSubhead}>01 · General Terms</div>
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
          </div>
        </div>

        <div className={styles.termsCol}>
          <div className={styles.termsSection}>
            <div className={styles.termsSubhead}>02 · Documents Required</div>
            <ol className={styles.termsNumberedList}>
              {docs.map((d, i) => (
                <li key={d.slice(0, 48)}>
                  <span className={styles.termsListNum}>{i + 1}</span>
                  <span>{d}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className={styles.termsSection}>
            <div className={styles.termsSubhead}>03 · Safety & Protection</div>
            <ul className={styles.termsSafetyList}>
              {SAFETY_NOTES.map((s) => (
                <li key={s.slice(0, 40)}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export function TermsCompliancePage2({ data }: TermsComplianceProps) {
  const brand = data.meta.brandName?.trim() || "Harihar Solar";
  const invoiceBase =
    data.economics.grossInr > 0
      ? data.economics.grossInr
      : data.economics.netInr;
  const invoiceRef =
    invoiceBase > 0
      ? `${formatLuxeInr(invoiceBase)} (${formatLuxeInrReadable(invoiceBase)})`
      : "invoice value";
  const amcObjective = data.terms.amcObjective?.trim() || DEFAULT_AMC_OBJECTIVE;
  const amcScopeRaw =
    data.terms.amcScope.length > 0 ? data.terms.amcScope : DEFAULT_AMC_SCOPE;
  const amcScope = amcScopeRaw.filter(
    (s) => !/^annual maintenance contract/i.test(s) && !/^amc includes/i.test(s)
  );
  const amcTerms =
    data.terms.amcTerms.length > 0 ? data.terms.amcTerms : DEFAULT_AMC_TERMS;

  return (
    <section className={`${styles.a4Page} ${styles.termsPage} ${luxeDisplayFont.variable}`}>
      <header className={styles.termsHead}>
        <span className={styles.termsTag}>10 / TERMS & COMPLIANCE (CONTD.)</span>
        <h2 className={styles.termsTitle}>Terms & Conditions</h2>
        <p className={styles.termsIntro}>
          Client responsibilities, AMC scope, and maintenance cost structure.
        </p>
      </header>

      <div className={styles.termsGridFill}>
        <div className={styles.termsCol}>
          <div className={styles.termsSection}>
            <div className={styles.termsSubhead}>04 · Client&apos;s Scope</div>
            <ol className={styles.termsNumberedList}>
              {CLIENT_SCOPE.map((s, i) => (
                <li key={s.slice(0, 48)}>
                  <span className={styles.termsListNum}>{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className={styles.termsSection}>
            <div className={styles.termsSubhead}>05 · Annual Maintenance — Scope</div>
            <p className={styles.termsPara}>{amcObjective}</p>
            <p className={styles.termsAmcIncludes}>AMC includes:</p>
            <ol className={styles.termsNumberedList}>
              {amcScope.map((s, i) => (
                <li key={s.slice(0, 48)}>
                  <span className={styles.termsListNum}>{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className={styles.termsCol}>
          <div className={styles.termsSection}>
            <div className={styles.termsSubhead}>06 · Cost of Maintenance</div>
            <div className={styles.termsCostBox}>
              <p>
                First <strong>1 year AMC</strong> is included in the quoted price.
              </p>
              <p>
                From Year 2 onwards, annual maintenance may be charged at{" "}
                <strong>2% of invoice value</strong>{" "}
                <span className={styles.luxeNum}>{invoiceRef}</span> with{" "}
                <strong>5% year-on-year escalation</strong>, subject to a signed O&amp;M
                agreement.
              </p>
            </div>
            <ol className={styles.termsArticleList}>
              {amcTerms.map((t, i) => (
                <li key={t.slice(0, 48)} className={styles.termsArticle}>
                  <span className={styles.termsArticleNum}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className={styles.termsArticleBody}>{t}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className={styles.termsSignoff}>
            <span className={styles.termsRegards}>Regards,</span>
            <span className={styles.termsBrand}>{brand.toUpperCase()}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
