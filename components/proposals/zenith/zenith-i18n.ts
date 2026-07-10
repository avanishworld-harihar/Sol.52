/**
 * Zenith brochure copy — EN / HI. Independent of Golden i18n.
 */

import type { ProposalLang } from "@/lib/proposal-i18n";

export type ZenithCopy = {
  toolbar: { preset: string; printPdf: string; langToggle: string };
  hero: {
    title: string;
    sub: (lifetime: string, customer: string) => string;
  };
  bill: { title: string; lead: string; yearly: string; offset: string; summer: string };
  investment: {
    title: string;
    lead: string;
    gross: string;
    subsidy: string;
    net: string;
    monthly: string;
    payback: string;
    lifetime: string;
    emiTitle: string;
    tenure: string;
    emi: string;
    interest: string;
  };
  impact: { title: string; co2: string; trees: string; annual: string };
  engineering: { title: string; leadFallback: string };
  assurance: {
    title: string;
    lead: string;
    item: string;
    spec: string;
    warranty: string;
    empty: string;
  };
  execution: {
    title: string;
    lead: string;
    paymentTitle: string;
    bank: string;
  };
  terms: { title: string; documents: string };
  closing: {
    title: string;
    prepared: (customer: string, brand: string) => string;
    annualUnits: string;
    wealth: string;
    whatsapp: string;
    scanPay: string;
  };
};

const EN: ZenithCopy = {
  toolbar: {
    preset: "Zenith Luxury",
    printPdf: "Print / PDF",
    langToggle: "हिन्दी",
  },
  hero: {
    title: "Energy Independent.",
    sub: (lifetime, customer) =>
      `Generating your own power for 25 years. Saving you ${lifetime} starting today — curated for ${customer}.`,
  },
  bill: {
    title: "Bill Intelligence",
    lead: "Your annual electricity pattern — and where summer quietly takes the most.",
    yearly: "Yearly bill",
    offset: "Solar offset",
    summer: "Summer share",
  },
  investment: {
    title: "Investment Ledger",
    lead: "Capital, subsidy, payback, and the wealth your roof can compound.",
    gross: "Gross cost",
    subsidy: "Subsidy",
    net: "Net payable",
    monthly: "Monthly savings",
    payback: "Payback",
    lifetime: "Lifetime benefit",
    emiTitle: "Financing options",
    tenure: "Tenure",
    emi: "Monthly EMI",
    interest: "Interest",
  },
  impact: {
    title: "Environmental Impact",
    co2: "CO₂ avoided",
    trees: "Trees equivalent",
    annual: "Annual savings",
  },
  engineering: {
    title: "Engineering Brief",
    leadFallback: "Site-tuned metrics for generation, tilt, and compliance.",
  },
  assurance: {
    title: "Engineering & Assurance",
    lead: "Tier-1 specifications and warranty in one clear ledger.",
    item: "Item",
    spec: "Spec",
    warranty: "Warranty",
    empty: "Component list will appear once the system configuration is complete.",
  },
  execution: {
    title: "Execution & Settlement",
    lead: "From survey to commissioning — with a clear capital schedule.",
    paymentTitle: "Payment schedule",
    bank: "Bank details",
  },
  terms: {
    title: "Terms & Compliance",
    documents: "Documents required",
  },
  closing: {
    title: "Ready when you are.",
    prepared: (customer, brand) => `Prepared for ${customer} by ${brand}.`,
    annualUnits: "Annual units",
    wealth: "Lifetime wealth",
    whatsapp: "Chat on WhatsApp",
    scanPay: "Scan to pay",
  },
};

const HI: ZenithCopy = {
  toolbar: {
    preset: "Zenith Luxury",
    printPdf: "प्रिंट / PDF",
    langToggle: "English",
  },
  hero: {
    title: "ऊर्जा स्वतंत्र।",
    sub: (lifetime, customer) =>
      `25 वर्षों तक अपनी बिजली बनाएँ। आज से ${lifetime} की बचत — ${customer} के लिए तैयार।`,
  },
  bill: {
    title: "बिल इंटेलिजेंस",
    lead: "आपका वार्षिक बिजली पैटर्न — और गर्मी जहाँ सबसे ज़्यादा खर्च लेती है।",
    yearly: "वार्षिक बिल",
    offset: "सोलर ऑफसेट",
    summer: "गर्मी का हिस्सा",
  },
  investment: {
    title: "निवेश लेजर",
    lead: "पूँजी, सब्सिडी, पेबैक और छत से बनने वाली संपत्ति।",
    gross: "कुल लागत",
    subsidy: "सब्सिडी",
    net: "नेट देय",
    monthly: "मासिक बचत",
    payback: "पेबैक",
    lifetime: "आजीवन लाभ",
    emiTitle: "वित्त विकल्प",
    tenure: "अवधि",
    emi: "मासिक EMI",
    interest: "ब्याज",
  },
  impact: {
    title: "पर्यावरण प्रभाव",
    co2: "CO₂ बचाव",
    trees: "पेड़ों के बराबर",
    annual: "वार्षिक बचत",
  },
  engineering: {
    title: "इंजीनियरिंग ब्रीफ",
    leadFallback: "जनरेशन, झुकाव और मानकों के लिए साइट-अनुकूल मेट्रिक्स।",
  },
  assurance: {
    title: "इंजीनियरिंग व आश्वासन",
    lead: "Tier-1 स्पेसिफिकेशन और वारंटी — एक साफ़ लेजर में।",
    item: "आइटम",
    spec: "स्पेक",
    warranty: "वारंटी",
    empty: "सिस्टम कॉन्फ़िगरेशन पूरा होने पर कंपोनेंट सूची दिखेगी।",
  },
  execution: {
    title: "निष्पादन व निपटान",
    lead: "सर्वे से कमीशनिंग तक — स्पष्ट पूँजी अनुसूची के साथ।",
    paymentTitle: "भुगतान अनुसूची",
    bank: "बैंक विवरण",
  },
  terms: {
    title: "नियम व अनुपालन",
    documents: "आवश्यक दस्तावेज़",
  },
  closing: {
    title: "जब आप तैयार हों।",
    prepared: (customer, brand) => `${customer} के लिए ${brand} द्वारा तैयार।`,
    annualUnits: "वार्षिक यूनिट",
    wealth: "आजीवन संपत्ति",
    whatsapp: "WhatsApp पर बात करें",
    scanPay: "पेमेंट के लिए स्कैन करें",
  },
};

export function zenithCopy(lang: ProposalLang = "en"): ZenithCopy {
  return lang === "hi" ? HI : EN;
}
