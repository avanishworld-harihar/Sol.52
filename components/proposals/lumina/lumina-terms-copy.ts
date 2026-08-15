/**
 * Terms copy — same legal content as Golden, kept local so Lumina
 * does not import locked executive-premium-editorial modules.
 * AMC years and invoice value stay live from this proposal.
 */

import type { ProposalData } from "@/lib/proposal-data";
import { formatInr } from "@/components/proposals/_shared/formatters";

export type LuminaTermsModel = {
  installerName: string;
  general: string[];
  documents: string[];
  amcObjective: string;
  amcScope: string[];
  clientScope: string[];
  amcCostParagraph: string;
  amcTerms: string[];
};

const GENERAL: string[] = [
  "DISCOM / state electricity board load change, or cable change from pole to meter and its liaison — only if required — will be in the customer's scope.",
  "All government statutory fees, regulatory charges, and legal costs relating to net-metering, subsidy (PM Surya Ghar / state schemes), DISCOM approvals, or any official application shall be borne and paid directly by the client.",
  "If an increase in sanctioned load or connected load is required for the solar connection, the client shall ensure that all prior electricity bills, outstanding dues, and arrears with the DISCOM are fully cleared before processing; any delay or rejection arising from uncleared dues shall remain the client's responsibility.",
  "Inverter warranty is as per manufacturer (typically 8–10 years on string inverters).",
  "Solar PV module product warranty: 15 years; performance warranty: ≥80% rated output at end of 30 years (manufacturer). Warranty on overall system and parts not specified above: 1 year from date of commissioning.",
  "Warranty applies to manufacturing defects only. Physical damage, misuse, or vandalism is not covered.",
  "Routine cleaning of modules (recommended weekly) is in the customer's scope — it directly affects generation performance.",
  "Installation shall be completed within 30–40 working days from receipt of advance payment as per the agreed purchase order / payment schedule.",
  "Any terms not expressly mentioned herein shall be governed by mutual written agreement between both parties.",
  "Refunds, if applicable, shall be processed after a 2.5% deduction on the project finalization amount plus documented expenses already incurred.",
];

const DOCUMENTS: string[] = [
  "Latest electricity bill (clear copy)",
  "Copy of PAN card",
  "Copy of Aadhaar card (legible, both sides if applicable)",
  "Ownership proof — property tax receipt / sale deed / municipal record",
  "Passport-size photograph of applicant",
  "Single-line diagram (SLD) — draft provided by us; signed copy required from customer",
];

const AMC_SCOPE: string[] = [
  "Annual Maintenance Contract (AMC) covering:",
  "Daily / periodic monitoring of plant performance and energy generation",
  "Routine preventive maintenance of plant and equipment",
  "Emergency breakdown attendance (response within 48 working hours)",
  "Coordination with OEMs for warranty support and defect rectification",
  "Periodic inspection of DC & AC protection, earthing, and cable terminations",
];

const CLIENT_SCOPE: string[] = [
  "Site security, watch and ward",
  "Insurance of plant and equipment (if desired)",
  "Stable internet connection at site for remote monitoring (where applicable)",
  "Water and auxiliary power for maintenance activities, as needed on site",
  "Day-to-day visual checks and safe access to the rooftop",
  "Regular module cleaning as per manufacturer guidelines",
];

const AMC_TERMS: string[] = [
  "Maintenance charges, when applicable, are payable in advance on a half-yearly basis.",
  "Minimum O&M contract duration: 2 years, extendable in blocks of 2 years by mutual consent (up to 25 years from commissioning).",
  "We are not liable for module or equipment loss due to theft, stand damage, or vandalism.",
  "Standard force majeure provisions apply; service deficiencies during such events shall be communicated to the client within one week of occurrence.",
];

function freeAmcYears(data: ProposalData): 1 | 5 | 10 {
  const fromHighlight = (data.warranty.highlights ?? []).find((h) =>
    /amc|maintenance/i.test(`${h.label} ${h.unit}`)
  );
  const n = Number(fromHighlight?.value);
  if (n === 5 || n === 10) return n;
  return 1;
}

export function buildLuminaTermsModel(data: ProposalData): LuminaTermsModel {
  const years = freeAmcYears(data);
  const gross = data.economics.grossInr > 0 ? Math.round(data.economics.grossInr) : 0;
  const invoice = gross > 0 ? formatInr(gross) : "the invoice value";
  const installer =
    data.closing.installerName?.trim() || data.meta.brandName?.trim() || "";

  return {
    installerName: installer,
    general: GENERAL,
    documents: DOCUMENTS,
    amcObjective:
      "The objective of Annual Maintenance Services is to maintain the performance ratio and general upkeep of the rooftop SPV plant throughout the contract period.",
    amcScope: AMC_SCOPE,
    clientScope: CLIENT_SCOPE,
    amcCostParagraph: `First ${years} year${years > 1 ? "s" : ""} AMC is included in the quoted price. From Year ${years + 1} onwards, annual maintenance may be charged at 2% of invoice value (${invoice}) with 5% year-on-year escalation, subject to a signed O&M agreement.`,
    amcTerms: AMC_TERMS,
  };
}
