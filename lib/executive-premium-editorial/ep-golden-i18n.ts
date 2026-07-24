import type { ProposalLang } from "@/lib/proposal-i18n";

export type EpGoldenCopy = {
  toolbar: { preset: string; printPdf: string; langToggle: string };
  cover: {
    titleLine1: string;
    titleLine2: string;
    preparedFor: string;
    estateLocation: string;
    assetProfile: string;
  };
  bill: {
    tag: string;
    title: string;
    lead: string;
    summerBill: string;
    summerCaption: string;
    fixedLiability: string;
    fixedCaption: string;
    solarSavings: string;
    solarCaption: string;
    month: string;
    units: string;
    energy: string;
    fixed: string;
    duty: string;
    netBill: string;
    total: string;
    footnote: string;
  };
  requirement: {
    tag: string;
    title: string;
    lead: string;
    heroLabel: string;
    proposedSystem: string;
    unitsYear: string;
    estGen: string;
  };
  economics: {
    tag: string;
    title: string;
    lead: string;
    roiKicker: string;
    invest: string;
    monthlySave: string;
    recover: string;
    profit25: string;
    perMonth: string;
    roiFoot: (payback: string) => string;
    costBreakdown: string;
    totalSystemCost: string;
    totalSystemSub: string;
    subsidy: string;
    subsidySub: string;
    finalPay: string;
    finalPaySub: string;
    financing: string;
    plan: string;
    interest: string;
    emi: string;
    yearLoan: (years: number) => string;
    years: string;
  };
  generation: {
    tag: string;
    title: string;
    lead: string;
    unitsLabel: string;
    savingsLabel: string;
    peakLegend: string;
    otherLegend: string;
    savingsBasis: (rate: string) => string;
    insightTag: string;
    insightTitle: string;
    insightBody: string;
  };
  impact: {
    tag: string;
    title: string;
    lead: string;
    cards: Array<{
      headline: string;
      label: string;
      body: string;
      proof: (co2OrTrees: string) => string;
    }>;
  };
  engineering: {
    tag: string;
    title: string;
    lead: string;
    tiltKicker: (city: string) => string;
    standards: string;
    installProcess: string;
    installTag: string;
    installTitle: string;
    installLead: string;
  };
  bom: {
    tag: string;
    title: string;
    lead: string;
  };
  warranty: {
    tag: string;
    title: string;
    item: string;
    duration: string;
    by: string;
    coverage: string;
    claims: string;
    claimsBody: string;
    yourCare: string;
    yourCareBody: string;
    highlights: Array<{ label: string; unit: string }>;
  };
  execution: {
    tag: string;
    title: string;
    lead: string;
    paymentSchedule: string;
    bankDetails: string;
    beneficiary: string;
    accountNo: string;
    ifsc: string;
    upi: string;
    steps: Array<{ title: string; description: string }>;
    paymentLabels: [string, string, string, string];
  };
  terms: {
    tag: string;
    tagContinued: string;
    heading: string;
    general: string;
    documents: string;
    amcScope: string;
    clientScope: string;
    amcCost: string;
    regards: string;
  };
  closing: {
    congrats: (name?: string) => string;
    heroTitle: string;
    unitsYear: string;
    lifetimeWealth: string;
    reserveInstall: string;
    scanConnect: string;
    salesRep: string;
    nameSign: string;
    customerAccept: string;
    signDate: string;
  };
};

const EN: EpGoldenCopy = {
  toolbar: { preset: "Executive Premium · Golden", printPdf: "Print / PDF", langToggle: "हिन्दी" },
  cover: {
    titleLine1: "Personalized Energy",
    titleLine2: "Masterplan.",
    preparedFor: "Prepared Exclusively For",
    estateLocation: "Estate Location",
    assetProfile: "Asset Profile",
  },
  bill: {
    tag: "01 / Electrical Audit",
    title: "Your Energy Audit.",
    lead: "A clear breakdown of what you paid for electricity last year based on your MP Smart Billing usage.",
    summerBill: "The Summer Bill",
    summerCaption: "Paid in 4 months (Apr-Jul)",
    fixedLiability: "Fixed Liability",
    fixedCaption: "Mandatory baseline cost",
    solarSavings: "Solar Savings",
    solarCaption: "Estimated bill reduction",
    month: "Month",
    units: "Units",
    energy: "Energy (₹)",
    fixed: "Fixed (₹)",
    duty: "Duty (₹)",
    netBill: "Net Bill (₹)",
    total: "Total",
    footnote: "*(Subsidy) adjusted before Net Bill",
  },
  requirement: {
    tag: "01 / System Design",
    title: "Your power requirement",
    lead: "Based on your stated monthly consumption and proposed system size.",
    heroLabel: "How much of your use this system covers",
    proposedSystem: "Proposed system",
    unitsYear: "Units / year",
    estGen: "Estimated generation",
  },
  economics: {
    tag: "02 / Capital Allocation",
    title: "Your Investment.",
    lead: "See how your rooftop pays you back — then keeps earning for 25 years.",
    roiKicker: "Your return journey",
    invest: "Invest",
    monthlySave: "Monthly Save",
    recover: "Recover",
    profit25: "25 Year Profit",
    perMonth: "/ month",
    roiFoot: (payback) =>
      `Invest once · save every month · recover in ${payback} years · profit for decades.`,
    costBreakdown: "Cost breakdown",
    totalSystemCost: "Total System Cost",
    totalSystemSub: "Includes premium panels, inverter, and full installation.",
    subsidy: "PM Surya Ghar Subsidy",
    subsidySub: "Government discount applied directly to your project.",
    finalPay: "Final Amount You Pay",
    finalPaySub: "Your total out-of-pocket cost.",
    financing: "Financing Options",
    plan: "Plan",
    interest: "Interest",
    emi: "EMI",
    yearLoan: (y) => `${y} Year Loan`,
    years: "Years",
  },
  generation: {
    tag: "03 / Seasonal Generation",
    title: "Monthly generation forecast.",
    lead: "Jan–Dec estimated units and savings — summer vs monsoon at a glance.",
    unitsLabel: "Est. units",
    savingsLabel: "Est. savings",
    peakLegend: "Peak summer (Apr–Jun)",
    otherLegend: "Other months",
    savingsBasis: (rate) =>
      `Estimated savings = monthly units × ₹${rate}/unit effective saving rate. Fixed charges excluded.`,
    insightTag: "Expert insight",
    insightTitle: "Why seasonal variation matters",
    insightBody:
      "Generation uses a regional irradiance profile. Higher summer output often aligns with peak bill months — that overlap drives most of the savings.",
  },
  impact: {
    tag: "04 / Ecological Retention",
    title: "A Gift Beyond Electricity.",
    lead: "Solar is not only a bill saver — it is cleaner air, greener land, and a safer planet for the next generation.",
    cards: [
      {
        headline: "Your children will breathe cleaner air.",
        label: "Tons CO₂ avoided",
        body: "Every unit from your roof is power without chimney smoke — cleaner skies for the family you are building for.",
        proof: (n) => `${n} tons of coal smoke never burned for your home.`,
      },
      {
        headline: "Equivalent to planting an entire mini forest.",
        label: "Tree equivalent",
        body: "Nature would need a small woodland to do what your solar system achieves quietly, year after year.",
        proof: (n) => `${n} trees worth of natural carbon absorption — on your rooftop.`,
      },
    ],
  },
  engineering: {
    tag: "05 / Engineering Design",
    title: "Design & Performance.",
    lead: "Engineering parameters for your rooftop system — site latitude, tilt angle, and Indian standards compliance.",
    tiltKicker: (city) => `Panel tilt — ${city}`,
    standards: "Standards compliance",
    installProcess: "Installation process",
    installTag: "05 / Engineering Design",
    installTitle: "Installation Process.",
    installLead: "From site survey to go-live — every step handled for your rooftop system.",
  },
  bom: {
    tag: "06 / Hardware Intelligence",
    title: "System Parts.",
    lead: "Tier-1 components with full engineering specification — make, standards, and warranty as quoted for your system.",
  },
  warranty: {
    tag: "07 / Warranty & Assurance",
    title: "Warranty Matrix.",
    item: "Item",
    duration: "Duration",
    by: "By",
    coverage: "Coverage",
    claims: "Claims:",
    claimsBody:
      "Contact our service desk for manufacturer defects. Physical damage, vandalism, or misuse is excluded.",
    yourCare: "Your care:",
    yourCareBody:
      "Routine panel cleaning, safe roof access, and internet for remote monitoring where applicable.",
    highlights: [
      { label: "Power output ≥80%", unit: "Years" },
      { label: "Module product warranty", unit: "Years" },
      { label: "Mounting structure", unit: "Years" },
      { label: "Service & support", unit: "Yr AMC" },
    ],
  },
  execution: {
    tag: "08 / Execution & Settlement",
    title: "Installation Process.",
    lead: "We handle all the paperwork and hard work so you can simply enjoy free electricity.",
    paymentSchedule: "Payment Schedule",
    bankDetails: "Secure Routing Details",
    beneficiary: "Beneficiary",
    accountNo: "Account No.",
    ifsc: "IFSC Code",
    upi: "Express UPI Payment",
    steps: [
      { title: "Get Started", description: "We apply for your electricity board permission and state subsidy." },
      { title: "Material Delivery", description: "All solar panels and heavy components arrive safely at your home." },
      { title: "Rooftop Fitting", description: "Our expert engineers complete the rooftop fitting, wiring, and testing." },
      { title: "Go Live", description: "The net-meter is installed, and your home achieves energy independence." },
    ],
    paymentLabels: ["Booking", "Material", "Install", "Go Live"],
  },
  terms: {
    tag: "09 / Terms & Compliance",
    tagContinued: "09 / Terms & Compliance (Contd.)",
    heading: "Terms & Conditions",
    general: "General Terms",
    documents: "Documents Required",
    amcScope: "Annual Maintenance — Scope",
    clientScope: "Client's Scope",
    amcCost: "Cost of Maintenance",
    regards: "Regards,",
  },
  closing: {
    congrats: (name) => (name ? `Congratulations, ${name}` : "Congratulations"),
    heroTitle: "Your family is now ready to generate",
    unitsYear: "Units Every Year",
    lifetimeWealth: "Lifetime Wealth Created",
    reserveInstall: "Reserve Installation",
    scanConnect: "Scan to connect",
    salesRep: "Sales Representative",
    nameSign: "Name & Signature",
    customerAccept: "Customer Acceptance",
    signDate: "Signature & Date",
  },
};

const HI: EpGoldenCopy = {
  toolbar: { preset: "Executive Premium · Golden", printPdf: "प्रिंट / PDF", langToggle: "English" },
  cover: {
    titleLine1: "व्यक्तिगत ऊर्जा",
    titleLine2: "मास्टरप्लान।",
    preparedFor: "विशेष रूप से तैयार",
    estateLocation: "स्थान",
    assetProfile: "सिस्टम प्रोफ़ाइल",
  },
  bill: {
    tag: "01 / बिजली ऑडिट",
    title: "आपका ऊर्जा ऑडिट।",
    lead: "MP Smart Billing उपयोग के आधार पर पिछले वर्ष बिजली पर खर्च का स्पष्ट विवरण।",
    summerBill: "गर्मी का बिल",
    summerCaption: "4 महीनों में (अप्रैल–जुलाई)",
    fixedLiability: "फिक्स्ड लायबिलिटी",
    fixedCaption: "अनिवार्य आधार लागत",
    solarSavings: "Solar बचत",
    solarCaption: "अनुमानित बिल में कमी",
    month: "माह",
    units: "Units",
    energy: "Energy (₹)",
    fixed: "Fixed (₹)",
    duty: "Duty (₹)",
    netBill: "Net Bill (₹)",
    total: "कुल",
    footnote: "*(Subsidy) Net Bill से पहले समायोजित",
  },
  requirement: {
    tag: "01 / System Design",
    title: "आपकी बिजली आवश्यकता",
    lead: "आपके बताए मासिक उपयोग और प्रस्तावित system size के आधार पर।",
    heroLabel: "यह system आपकी खपत का कितना हिस्सा कवर करता है",
    proposedSystem: "प्रस्तावित system",
    unitsYear: "Units / वर्ष",
    estGen: "अनुमानित generation",
  },
  economics: {
    tag: "02 / पूंजी आवंटन",
    title: "आपका निवेश।",
    lead: "देखें कि आपकी छत कैसे पैसा वापस करती है — और 25 वर्षों तक कमाती रहती है।",
    roiKicker: "आपकी वापसी यात्रा",
    invest: "निवेश",
    monthlySave: "मासिक बचत",
    recover: "वसूली",
    profit25: "25 वर्ष लाभ",
    perMonth: "/ माह",
    roiFoot: (payback) =>
      `एक बार निवेश · हर माह बचत · ${payback} वर्षों में वसूली · दशकों तक लाभ।`,
    costBreakdown: "लागत विवरण",
    totalSystemCost: "कुल System Cost",
    totalSystemSub: "Premium panels, inverter और पूर्ण installation शामिल।",
    subsidy: "PM Surya Ghar Subsidy",
    subsidySub: "सरकारी छूट सीधे आपके प्रोजेक्ट पर लागू।",
    finalPay: "आपकी अंतिम राशि",
    finalPaySub: "आपकी कुल जेब से लागत।",
    financing: "Financing विकल्प",
    plan: "Plan",
    interest: "Interest",
    emi: "EMI",
    yearLoan: (y) => `${y} Year Loan`,
    years: "वर्ष",
  },
  generation: {
    tag: "03 / मौसमी उत्पादन",
    title: "मासिक उत्पादन पूर्वानुमान।",
    lead: "जनवरी–दिसंबर अनुमानित यूनिट और बचत — गर्मी/मानसून का अंतर साफ़ दिखे।",
    unitsLabel: "अनुमानित यूनिट",
    savingsLabel: "अनुमानित बचत",
    peakLegend: "पीक गर्मी (अप्रैल–जून)",
    otherLegend: "अन्य महीने",
    savingsBasis: (rate) =>
      `अनुमानित बचत = मासिक यूनिट × ₹${rate}/यूनिट प्रभावी बचत दर। फिक्स्ड चार्ज शामिल नहीं हैं।`,
    insightTag: "एक्सपर्ट इनसाइट",
    insightTitle: "मौसमी भिन्नता क्यों मायने रखती है",
    insightBody:
      "उत्पादन स्थानीय विकिरण प्रोफ़ाइल पर आधारित अनुमान है। गर्मी में ऊँचा उत्पादन अक्सर ऊँचे बिल महीनों से मेल खाता है — बचत का मुख्य इंजन।",
  },
  impact: {
    tag: "04 / पर्यावरण संरक्षण",
    title: "बिजली से परे एक उपहार।",
    lead: "Solar केवल बिल बचाने वाला नहीं — यह स्वच्छ हवा, हरित भूमि और अगली पीढ़ी के लिए सुरक्षित ग्रह है।",
    cards: [
      {
        headline: "आपके बच्चे स्वच्छ हवा में साँस लेंगे।",
        label: "टन CO₂ से बचाव",
        body: "छत से हर unit बिना धुएँ की बिजली है — जिस परिवार के लिए आप बना रहे हैं, उनके लिए स्वच्छ आकाश।",
        proof: (n) => `आपके घर के लिए ${n} टन कोयले का धुआँ कभी नहीं जलेगा।`,
      },
      {
        headline: "एक पूरे छोटे वन लगाने के बराबर।",
        label: "पेड़ समकक्ष",
        body: "प्रकृति को वही करने के लिए एक छोटा वन चाहिए होगा जो आपका solar system चुपचाप, वर्ष दर वर्ष करता है।",
        proof: (n) => `आपकी छत पर ${n} पेड़ों जितना कार्बन अवशोषण।`,
      },
    ],
  },
  engineering: {
    tag: "05 / Engineering Design",
    title: "Design और Performance।",
    lead: "आपके rooftop system के engineering पैरामीटर — site latitude, tilt angle और Indian standards compliance।",
    tiltKicker: (city) => `Panel tilt — ${city}`,
    standards: "Standards compliance",
    installProcess: "Installation प्रक्रिया",
    installTag: "05 / Engineering Design",
    installTitle: "Installation Process।",
    installLead: "Site survey से go-live तक — आपके rooftop system का हर step handle किया जाता है।",
  },
  bom: {
    tag: "06 / Hardware Intelligence",
    title: "System Parts।",
    lead: "Tier-1 components पूर्ण engineering specification के साथ — make, standards और warranty जैसा quoted।",
  },
  warranty: {
    tag: "07 / Warranty और Assurance",
    title: "Warranty Matrix।",
    item: "Item",
    duration: "अवधि",
    by: "द्वारा",
    coverage: "Coverage",
    claims: "Claims:",
    claimsBody:
      "Manufacturer defects के लिए हमारे service desk से संपर्क करें। Physical damage, vandalism या misuse शामिल नहीं।",
    yourCare: "आपकी देखभाल:",
    yourCareBody:
      "नियमित panel cleaning, सुरक्षित roof access और remote monitoring के लिए internet जहाँ लागू हो।",
    highlights: [
      { label: "Power output ≥80%", unit: "वर्ष" },
      { label: "Module product warranty", unit: "वर्ष" },
      { label: "Mounting structure", unit: "वर्ष" },
      { label: "Service और support", unit: "वर्ष AMC" },
    ],
  },
  execution: {
    tag: "08 / Execution और Settlement",
    title: "Installation प्रक्रिया।",
    lead: "सारा कागज़ी काम और मेहनत हम संभालते हैं — आप बस मुफ्त बिजली का आनंद लें।",
    paymentSchedule: "भुगतान अनुसूची",
    bankDetails: "सुरक्षित बैंक विवरण",
    beneficiary: "लाभार्थी",
    accountNo: "Account No.",
    ifsc: "IFSC Code",
    upi: "Express UPI Payment",
    steps: [
      { title: "शुरुआत", description: "हम आपके electricity board permission और state subsidy के लिए आवेदन करते हैं।" },
      { title: "Material Delivery", description: "सभी solar panels और भारी components सुरक्षित आपके घर पहुँचते हैं।" },
      { title: "Rooftop Fitting", description: "हमारे expert engineers rooftop fitting, wiring और testing पूरी करते हैं।" },
      { title: "Go Live", description: "Net-meter लगता है और आपका घर energy independence प्राप्त करता है।" },
    ],
    paymentLabels: ["बुकिंग", "Material", "Install", "Go Live"],
  },
  terms: {
    tag: "09 / Terms और Compliance",
    tagContinued: "09 / Terms और Compliance (जारी)",
    heading: "Terms और Conditions",
    general: "सामान्य शर्तें",
    documents: "आवश्यक दस्तावेज़",
    amcScope: "Annual Maintenance — Scope",
    clientScope: "ग्राहक का दायरा",
    amcCost: "Maintenance की लागत",
    regards: "सादर,",
  },
  closing: {
    congrats: (name) => (name ? `बधाई हो, ${name}` : "बधाई हो"),
    heroTitle: "आपका परिवार अब generate करने के लिए तैयार है",
    unitsYear: "Units हर वर्ष",
    lifetimeWealth: "जीवनभर बनाई गई संपत्ति",
    reserveInstall: "Installation बुक करें",
    scanConnect: "जुड़ने के लिए scan करें",
    salesRep: "Sales Representative",
    nameSign: "नाम और हस्ताक्षर",
    customerAccept: "ग्राहक स्वीकृति",
    signDate: "हस्ताक्षर और तिथि",
  },
};

const COPIES: Record<ProposalLang, EpGoldenCopy> = { en: EN, hi: HI };

export function epGoldenCopy(lang: ProposalLang = "en"): EpGoldenCopy {
  return COPIES[lang] ?? EN;
}
