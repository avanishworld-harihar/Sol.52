import type { VoltaicLang } from "./voltaic-copy";

export type VoltaicTermsCopy = {
  conditions: string[];
  documents: string[];
  amcObjective: string;
  amcScope: string[];
  clientScope: string[];
  amcCost: string;
  amcTerms: string[];
};

function fmtInvoice(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "";
  return Math.round(n).toLocaleString("en-IN");
}

export function buildVoltaicTermsCopy(
  lang: VoltaicLang,
  amcYears: number,
  invoiceInr: number
): VoltaicTermsCopy {
  const years = Number.isFinite(amcYears) && amcYears > 0 ? Math.round(amcYears) : 1;
  const invoiceRef = fmtInvoice(invoiceInr);
  const invoiceBit = invoiceRef ? ` (₹${invoiceRef})` : "";
  const hi = lang === "hi";
  const yearWord = years > 1 ? "s" : "";

  return {
    conditions: hi
      ? [
          "DISCOM / state electricity board load change, या pole से meter तक cable change — केवल यदि आवश्यक हो — customer के scope में होगा।",
          "Net-metering, subsidy (PM Surya Ghar / state schemes), DISCOM approvals या किसी official application से संबंधित सभी government statutory fees, regulatory charges और legal costs client द्वारा सीधे वहन किए जाएँगे।",
          "Solar connection के लिए sanctioned load या connected load में वृद्धि आवश्यक हो तो client सुनिश्चित करेगा कि DISCOM के सभी पिछले bills, outstanding dues और arrears पूरी तरह clear हों; uncleared dues से होने वाली delay या rejection client की जिम्मेदारी रहेगी।",
          "Inverter warranty manufacturer के अनुसार (string inverters पर आमतौर पर 8–10 years)।",
          "Solar PV module product warranty: 15 years; performance warranty: 30 years के अंत में ≥80% rated output (manufacturer)। ऊपर निर्दिष्ट नहीं parts पर overall system warranty: commissioning date से 1 year।",
          "Warranty केवल manufacturing defects पर लागू। Physical damage, misuse या vandalism covered नहीं।",
          "Modules की नियमित cleaning (साप्ताहिक अनुशंसित) customer के scope में — generation performance पर सीधा प्रभाव।",
          "Agreed purchase order / payment schedule के अनुसार advance payment प्राप्त होने के 30–40 working days में installation पूर्ण होगी।",
          "यहाँ स्पष्ट रूप से उल्लिखित नहीं terms दोनों पक्षों के बीच mutual written agreement से govern होंगी।",
          "Refunds, यदि लागू हों, project finalization amount पर 2.5% deduction और documented expenses घटाकर process होंगे।",
        ]
      : [
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
        ],
    documents: hi
      ? [
          "नवीनतम electricity bill (स्पष्ट copy)",
          "PAN card की copy",
          "Aadhaar card की copy (पठनीय, दोनों पक्ष यदि लागू)",
          "Ownership proof — property tax receipt / sale deed / municipal record",
          "आवेदक का passport-size photograph",
          "Single-line diagram (SLD) — draft हम देते हैं; customer से signed copy आवश्यक",
        ]
      : [
          "Latest electricity bill (clear copy)",
          "Copy of PAN card",
          "Copy of Aadhaar card (legible, both sides if applicable)",
          "Ownership proof — property tax receipt / sale deed / municipal record",
          "Passport-size photograph of applicant",
          "Single-line diagram (SLD) — draft provided by us; signed copy required from customer",
        ],
    amcObjective: hi
      ? "Annual Maintenance Services का उद्देश्य contract period में rooftop SPV plant के performance ratio और general upkeep को बनाए रखना है।"
      : "The objective of Annual Maintenance Services is to maintain the performance ratio and general upkeep of the rooftop SPV plant throughout the contract period.",
    amcScope: hi
      ? [
          "Annual Maintenance Contract (AMC) शामिल:",
          "Plant performance और energy generation की daily / periodic monitoring",
          "Plant और equipment का routine preventive maintenance",
          "Emergency breakdown attendance (48 working hours में response)",
          "Warranty support और defect rectification के लिए OEMs के साथ coordination",
          "DC और AC protection, earthing और cable terminations की periodic inspection",
        ]
      : [
          "Annual Maintenance Contract (AMC) covering:",
          "Daily / periodic monitoring of plant performance and energy generation",
          "Routine preventive maintenance of plant and equipment",
          "Emergency breakdown attendance (response within 48 working hours)",
          "Coordination with OEMs for warranty support and defect rectification",
          "Periodic inspection of DC & AC protection, earthing, and cable terminations",
        ],
    clientScope: hi
      ? [
          "Site security, watch और ward",
          "Plant और equipment का insurance (यदि चाहें)",
          "Remote monitoring के लिए site पर stable internet connection (जहाँ लागू)",
          "Maintenance activities के लिए water और auxiliary power, site पर आवश्यकतानुसार",
          "दैनिक visual checks और rooftop तक safe access",
          "Manufacturer guidelines के अनुसार regular module cleaning",
        ]
      : [
          "Site security, watch and ward",
          "Insurance of plant and equipment (if desired)",
          "Stable internet connection at site for remote monitoring (where applicable)",
          "Water and auxiliary power for maintenance activities, as needed on site",
          "Day-to-day visual checks and safe access to the rooftop",
          "Regular module cleaning as per manufacturer guidelines",
        ],
    amcCost: hi
      ? `पहले ${years} year${yearWord} का AMC quoted price में शामिल। Year ${years + 1} से annual maintenance invoice value${invoiceBit} का 2% पर charge हो सकता है, 5% year-on-year escalation के साथ, signed O&M agreement के अधीन।`
      : `First ${years} year${yearWord} AMC is included in the quoted price. From Year ${years + 1} onwards, annual maintenance may be charged at 2% of invoice value${invoiceBit} with 5% year-on-year escalation, subject to a signed O&M agreement.`,
    amcTerms: hi
      ? [
          "Maintenance charges, जब लागू हों, half-yearly advance में payable।",
          "Minimum O&M contract duration: 2 years, mutual consent से 2-year blocks में extendable (commissioning से 25 years तक)।",
          "Theft, stand damage या vandalism से module/equipment loss के लिए हम liable नहीं।",
          "Standard force majeure provisions लागू; ऐसी घटनाओं के दौरान service deficiencies एक सप्ताह में client को सूचित की जाएँगी।",
        ]
      : [
          "Maintenance charges, when applicable, are payable in advance on a half-yearly basis.",
          "Minimum O&M contract duration: 2 years, extendable in blocks of 2 years by mutual consent (up to 25 years from commissioning).",
          "We are not liable for module or equipment loss due to theft, stand damage, or vandalism.",
          "Standard force majeure provisions apply; service deficiencies during such events shall be communicated to the client within one week of occurrence.",
        ],
  };
}
