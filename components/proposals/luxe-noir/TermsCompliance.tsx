"use client";

/**
 * Premium Luxe — Terms & Compliance (2 A4 pages).
 * Single-column only — no side-by-side columns / negative space.
 */

import type { ProposalData } from "@/lib/proposal-data";
import { formatLuxeInr, formatLuxeInrReadable } from "./luxe-format";
import { resolveLuxeVendorName } from "./luxe-vendor";
import { ExpertVerdict } from "./ExpertVerdict";
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
  "AMC keeps generation checks and safety visits on schedule for the contract period.";

const DEFAULT_AMC_INCLUDES = [
  "Periodic monitoring of plant performance and energy generation",
  "Routine preventive maintenance of plant and equipment",
  "Emergency breakdown attendance (within 48 working hours)",
  "OEM coordination for warranty support",
  "Inspection of DC/AC protection, earthing, and cable terminations",
];

const DEFAULT_AMC_EXCLUDES = [
  "Physical damage, third-party misuse, theft, or vandalism",
  "Module glass replacement due to external impact",
  "DISCOM metering fees and government charges",
];

const CLIENT_SCOPE = [
  "Site security, watch and ward",
  "Insurance of plant and equipment (if desired)",
  "Stable internet for remote monitoring (where applicable)",
  "Water and auxiliary power for maintenance on site",
  "Day-to-day visual checks and safe rooftop access",
  "Regular module cleaning as per manufacturer guidelines",
  "Keep roof drains clear; report inverter alerts promptly",
  "Provide DISCOM / municipal letters when requested",
];

const DEFAULT_AMC_COMMERCIAL = [
  "When charged, maintenance fees are payable in advance on a half-yearly basis.",
  "Minimum O&M duration: 2 years, extendable by mutual consent.",
  "Force majeure events will be informed to the client within one week.",
];

const SAFETY_NOTES = [
  "Do not open ACDB / DCDB or inverter covers — trained technicians only.",
  "Lightning arrestor and earthing must stay bonded; do not disconnect earth leads.",
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

export function TermsCompliancePage1({ data }: TermsComplianceProps) {
  const docs =
    data.terms.documents.length > 0 ? data.terms.documents : DEFAULT_DOCS;

  return (
    <section className={`${styles.a4Page} ${styles.termsPage} ${luxeDisplayFont.variable}`}>
      <header className={styles.termsHead}>
        <span className={styles.termsTag}>09 / TERMS & COMPLIANCE</span>
        <h2 className={styles.termsTitle}>Terms & Conditions</h2>
        <p className={styles.termsIntro}>
          Please read each point carefully before signing.
        </p>
      </header>

      <div className={styles.termsStack}>
        <section className={styles.termsSection}>
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
        </section>

        <section className={styles.termsSection}>
          <div className={styles.termsSubhead}>02 · Documents Required</div>
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

      <ExpertVerdict label="COMPLIANCE COUNSEL'S NOTE">
        Read each article before signing — warranties, fees, and your duties protect both
        sides if DISCOM timing or site conditions change.
      </ExpertVerdict>
    </section>
  );
}

export function TermsCompliancePage2({ data }: TermsComplianceProps) {
  const vendor = resolveLuxeVendorName(data) || "Solar Partner";
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
  const planOptions = scopeRaw.filter(isAmcPlanLabel);
  const includeItems = scopeRaw.filter(
    (s) =>
      !isAmcPlanLabel(s) &&
      !/^annual maintenance contract/i.test(s) &&
      !/^amc includes/i.test(s)
  );
  const amcIncludes =
    includeItems.length > 0 ? includeItems : DEFAULT_AMC_INCLUDES;

  const notesRaw =
    data.terms.amcTerms.length > 0 ? data.terms.amcTerms : [
      ...DEFAULT_AMC_EXCLUDES,
      ...DEFAULT_AMC_COMMERCIAL,
    ];
  const excludesFromNotes = notesRaw.filter(isExclusionNote);
  const commercialNotes = notesRaw.filter(
    (s) => !isExclusionNote(s) && isCommercialNote(s)
  );
  const amcExcludes =
    excludesFromNotes.length > 0 ? excludesFromNotes : DEFAULT_AMC_EXCLUDES;
  const amcCommercial =
    commercialNotes.length > 0 ? commercialNotes : DEFAULT_AMC_COMMERCIAL;

  return (
    <section className={`${styles.a4Page} ${styles.termsPage} ${luxeDisplayFont.variable}`}>
      <header className={styles.termsHead}>
        <span className={styles.termsTag}>10 / TERMS & COMPLIANCE (CONTD.)</span>
        <h2 className={styles.termsTitle}>Terms & Conditions</h2>
        <p className={styles.termsIntro}>
          Safety, your duties, AMC scope, and maintenance cost — one section after another.
        </p>
      </header>

      <div className={styles.termsStack}>
        <section className={styles.termsSection}>
          <div className={styles.termsSubhead}>03 · Safety & Protection</div>
          <ul className={styles.termsSafetyList}>
            {SAFETY_NOTES.map((s) => (
              <li key={s.slice(0, 40)}>{s}</li>
            ))}
          </ul>
        </section>

        <section className={styles.termsSection}>
          <div className={styles.termsSubhead}>04 · Client&apos;s Scope</div>
          <ol className={styles.termsNumberedList}>
            {CLIENT_SCOPE.map((s, i) => (
              <li key={s.slice(0, 48)}>
                <span className={styles.termsListNum}>{i + 1}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.termsSection}>
          <div className={styles.termsSubhead}>05 · Annual Maintenance — Scope</div>
          <p className={styles.termsPara}>{amcObjective}</p>

          {planOptions.length > 0 ? (
            <>
              <p className={styles.termsAmcIncludes}>Available plans:</p>
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

          <p className={styles.termsAmcIncludes}>AMC includes:</p>
          <ol className={styles.termsNumberedList}>
            {amcIncludes.map((s, i) => (
              <li key={`inc-${s.slice(0, 32)}`}>
                <span className={styles.termsListNum}>{i + 1}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>

          <p className={styles.termsAmcIncludes}>AMC does not include:</p>
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
          {amcCommercial.length > 0 ? (
            <>
              <p className={styles.termsAmcIncludes}>Payment & contract notes:</p>
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
          <span className={styles.termsRegards}>Regards,</span>
          <span className={styles.termsBrand}>{vendor.toUpperCase()}</span>
          <span className={styles.termsVendorTag}>Vendor</span>
        </div>
      </div>

      <ExpertVerdict label="O&M ADVISOR'S VERDICT">
        Year-1 AMC is included; from Year 2, budget about 2% of invoice with yearly
        increase — regular care protects both generation and warranty.
      </ExpertVerdict>
    </section>
  );
}
