import type { ProposalDeckSummary } from "@/lib/proposal-ppt";
import type { EditorialTermsModel } from "@/lib/executive-premium-editorial/types";
import { fmtInr } from "@/lib/executive-premium-editorial/format";

export function buildEditorialTermsModel(
  summary: ProposalDeckSummary,
  installerName: string
): EditorialTermsModel {
  const brand = installerName.trim() || summary.installer.trim() || "Harihar Solar";
  const freeAmcYears = summary.amcSelectedYears ?? 1;
  const invoiceRef = fmtInr(summary.grossSystemCost);

  return {
    installer_name: brand,
    terms_conditions: [
      "DISCOM / state electricity board load change, or cable change from pole to meter and its liaison — only if required — will be in the customer's scope.",
      "Inverter warranty is as per manufacturer (typically 8–10 years on string inverters).",
      "Solar PV module performance warranty: ≥80% rated output at end of 25 years (manufacturer). Warranty on overall system and parts not specified above: 1 year from date of commissioning.",
      "Warranty applies to manufacturing defects only. Physical damage, misuse, or vandalism is not covered.",
      "Routine cleaning of modules (recommended weekly) is in the customer's scope — it directly affects generation performance.",
      "Installation shall be completed within 30–40 working days from receipt of advance payment as per the agreed purchase order / payment schedule.",
      "Any terms not expressly mentioned herein shall be governed by mutual written agreement between both parties.",
      "Refunds, if applicable, shall be processed after a 2.5% deduction on the project finalization amount plus documented expenses already incurred.",
    ],
    documents_required: [
      "Latest electricity bill (clear copy)",
      "Copy of PAN card",
      "Copy of Aadhaar card (legible, both sides if applicable)",
      "Ownership proof — property tax receipt / sale deed / municipal record",
      "Passport-size photograph of applicant",
      "Single-line diagram (SLD) — draft provided by us; signed copy required from customer",
    ],
    amc_objective:
      "The objective of Annual Maintenance Services is to maintain the performance ratio and general upkeep of the rooftop SPV plant throughout the contract period.",
    amc_scope: [
      "Annual Maintenance Contract (AMC) covering:",
      "Daily / periodic monitoring of plant performance and energy generation",
      "Routine preventive maintenance of plant and equipment",
      "Emergency breakdown attendance (response within 48 working hours)",
      "Coordination with OEMs for warranty support and defect rectification",
      "Periodic inspection of DC & AC protection, earthing, and cable terminations",
    ],
    client_scope: [
      "Site security, watch and ward",
      "Insurance of plant and equipment (if desired)",
      "Stable internet connection at site for remote monitoring (where applicable)",
      "Water and auxiliary power for maintenance activities, as needed on site",
      "Day-to-day visual checks and safe access to the rooftop",
      "Regular module cleaning as per manufacturer guidelines",
    ],
    amc_cost_paragraph: `First ${freeAmcYears} year${freeAmcYears > 1 ? "s" : ""} AMC is included in the quoted price. From Year ${freeAmcYears + 1} onwards, annual maintenance may be charged at 2% of invoice value (₹${invoiceRef}) with 5% year-on-year escalation, subject to a signed O&M agreement.`,
    amc_terms: [
      "Maintenance charges, when applicable, are payable in advance on a half-yearly basis.",
      "Minimum O&M contract duration: 2 years, extendable in blocks of 2 years by mutual consent (up to 25 years from commissioning).",
      "We are not liable for module or equipment loss due to theft, stand damage, or vandalism.",
      "Standard force majeure provisions apply; service deficiencies during such events shall be communicated to the client within one week of occurrence.",
    ],
  };
}
