"use client";

/**
 * Premium Luxe — Terms & Compliance (2 A4 pages).
 * Layout mirrors the reference T&C sheets; dark #0a0a0a + gold #D4AF37.
 */

import type { ProposalData } from "@/lib/proposal-data";
import { formatInr } from "@/components/proposals/_shared/formatters";
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
    text: "If an increase in sanctioned load or connected load is required for the solar connection, the client shall ensure that all prior electricity bills, outstanding dues, and arrears with the DISCOM are fully cleared before processing; any delay or rejection arising from uncleared dues shall remain the client's responsibility.",
  },
  {
    label: "Inverter Warranty",
    text: "Inverter warranty is as per manufacturer (typically 8–10 years on string inverters).",
  },
  {
    label: "Module Warranty",
    text: "Solar PV module product warranty: 15 years; performance warranty: ≥80% rated output at end of 30 years (manufacturer). Warranty on overall system and parts not specified above: 1 year from date of commissioning.",
  },
  {
    label: "Warranty Scope",
    text: "Warranty applies to manufacturing defects only. Physical damage, misuse, or vandalism is not covered.",
  },
  {
    label: "Maintenance",
    text: "Routine cleaning of modules (recommended weekly) is in the customer's scope — it directly affects generation performance.",
  },
  {
    label: "Timeline",
    text: "Installation shall be completed within 30–40 working days from receipt of advance payment as per the agreed purchase order / payment schedule.",
  },
  {
    label: "Governing Terms",
    text: "Any terms not expressly mentioned herein shall be governed by mutual written agreement between both parties.",
  },
  {
    label: "Refunds",
    text: "Refunds, if applicable, shall be processed after a 2.5% deduction on the project finalization amount plus documented expenses already incurred.",
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
  "The objective of Annual Maintenance Services is to maintain the performance ratio and general upkeep of the rooftop SPV plant throughout the contract period.";

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
];

const DEFAULT_AMC_TERMS = [
  "Maintenance charges, when applicable, are payable in advance on a half-yearly basis.",
  "Minimum O&M contract duration: 2 years, extendable in blocks of 2 years by mutual consent (up to 25 years from commissioning).",
  "We are not liable for module or equipment loss due to theft, stand damage, or vandalism.",
  "Standard force majeure provisions apply; service deficiencies during such events shall be communicated to the client within one week of occurrence.",
];

export function TermsCompliancePage1({ data }: TermsComplianceProps) {
  const docs =
    data.terms.documents.length > 0 ? data.terms.documents : DEFAULT_DOCS;
  const amcObjective = data.terms.amcObjective?.trim() || DEFAULT_AMC_OBJECTIVE;
  const amcScopeRaw =
    data.terms.amcScope.length > 0 ? data.terms.amcScope : DEFAULT_AMC_SCOPE;
  const amcScope = amcScopeRaw.filter(
    (s) => !/^annual maintenance contract/i.test(s) && !/^amc includes/i.test(s)
  );

  return (
    <section className={`${styles.a4Page} ${styles.termsPage} ${luxeDisplayFont.variable}`}>
      <header className={styles.termsHead}>
        <span className={styles.termsTag}>09 / TERMS & COMPLIANCE</span>
        <h2 className={styles.termsTitle}>Terms & Conditions</h2>
      </header>

      <div className={styles.termsGrid}>
        <div>
          <div className={styles.termsSubhead}>General Terms</div>
          <ul className={styles.termsDiamondList}>
            {GENERAL_TERMS.map((t) => (
              <li key={t.label}>
                <strong>{t.label}:</strong> {t.text}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className={styles.termsSubhead}>Documents Required</div>
          <ul className={styles.termsDotList}>
            {docs.map((d) => (
              <li key={d.slice(0, 48)}>{d}</li>
            ))}
          </ul>

          <div className={styles.termsSubhead} style={{ marginTop: "1.25rem" }}>
            Annual Maintenance — Scope
          </div>
          <p className={styles.termsPara}>{amcObjective}</p>
          <p className={styles.termsAmcIncludes}>AMC Includes:</p>
          <ul className={styles.termsDiamondList}>
            {amcScope.map((s) => (
              <li key={s.slice(0, 48)}>{s}</li>
            ))}
          </ul>
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
  const invoiceRef = invoiceBase > 0 ? formatInr(invoiceBase) : "invoice value";
  const amcTerms =
    data.terms.amcTerms.length > 0 ? data.terms.amcTerms : DEFAULT_AMC_TERMS;

  return (
    <section className={`${styles.a4Page} ${styles.termsPage} ${luxeDisplayFont.variable}`}>
      <header className={styles.termsHead}>
        <span className={styles.termsTag}>10 / TERMS & COMPLIANCE (CONTD.)</span>
        <h2 className={styles.termsTitle}>Terms & Conditions</h2>
      </header>

      <div className={styles.termsGrid}>
        <div>
          <div className={styles.termsSubhead}>Client&apos;s Scope</div>
          <ul className={styles.termsDotList}>
            {CLIENT_SCOPE.map((s) => (
              <li key={s.slice(0, 48)}>{s}</li>
            ))}
          </ul>
        </div>

        <div>
          <div className={styles.termsSubhead}>Cost of Maintenance</div>
          <p className={styles.termsPara}>
            First 1 year AMC is included in the quoted price. From Year 2 onwards, annual
            maintenance may be charged at 2% of invoice value ({invoiceRef}) with 5%
            year-on-year escalation, subject to a signed O&amp;M agreement.
          </p>
          <ul className={styles.termsDiamondList}>
            {amcTerms.map((t) => (
              <li key={t.slice(0, 48)}>{t}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className={styles.termsSignoff}>
        <span className={styles.termsRegards}>Regards,</span>
        <span className={styles.termsBrand}>{brand.toUpperCase()}</span>
      </div>
    </section>
  );
}
