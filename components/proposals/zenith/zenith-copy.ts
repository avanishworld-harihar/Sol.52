/**
 * Zenith — EN / Hindi UI copy (static labels only).
 */

export type ZenithLang = "en" | "hi";

export function getZenithCopy(lang: ZenithLang) {
  const hi = lang === "hi";
  return {
    print: {
      downloadPdf: hi ? "PDF डाउनलोड" : "Download PDF",
      langEn: "EN",
      langHi: "हिंदी",
    },
    cover: {
      hero: hi
        ? "आपका घर, ऊर्जा स्वतंत्र।"
        : "Your home, energy independent.",
      subPrefix: hi
        ? "25 वर्षों तक अपनी बिजली खुद बनाएँ"
        : "Generating your own power for 25 years",
      subSaving: (amt: string) =>
        hi ? ` — बचत ${amt}` : ` — saving you ${amt}`,
      preparedFor: hi ? "के लिए तैयार" : "Prepared for",
    },
    pages: {
      bill: hi ? "बिल इंटेलिजेंस" : "Bill Intelligence",
      billLead: hi
        ? "आपका वार्षिक बिजली पैटर्न — और गर्मी कहाँ ज़्यादा लेती है।"
        : "Your annual electricity pattern — and where summer quietly takes the most.",
      requirement: hi ? "सिस्टम आवश्यकता" : "System Requirement",
      requirementLead: hi
        ? "आपके लोड के अनुसार क्षमता, उत्पादन और कवरेज।"
        : "Sized to your declared load — generation, coverage, and asset profile.",
      investment: hi ? "निवेश लेजर" : "Investment Ledger",
      investmentLead: hi
        ? "पूँजी, सब्सिडी, पेबैक और आजीवन लाभ।"
        : "Capital, subsidy, payback, and lifetime benefit.",
      financing: hi ? "वित्तपोषण" : "Financing",
      financingLead: hi
        ? "बैंक टेन्योर विकल्प — मासिक EMI और ब्याज।"
        : "Bank tenure options with monthly EMI and total interest.",
      impact: hi ? "पारिस्थितिक प्रभाव" : "Ecological Impact",
      impactLead: hi
        ? "कार्बन बचत और पेड़ों के समकक्ष स्वच्छ उत्पादन।"
        : "Clean generation measured in carbon avoided and trees equivalent.",
      engineering: hi ? "इंजीनियरिंग ब्रीफ" : "Engineering Brief",
      engineeringLead: hi
        ? "उत्पादन, झुकाव और अनुपालन मेट्रिक्स।"
        : "Site-tuned metrics for generation, tilt, and compliance.",
      phases: hi ? "डिज़ाइन और स्थापना चरण" : "Design & install phases",
      assurance: hi ? "इंजीनियरिंग और आश्वासन" : "Engineering & Assurance",
      assuranceLead: hi
        ? "टियर-1 सामग्री — ब्रांड, स्पेक, वारंटी।"
        : "Tier-1 bill of materials — brand, spec, warranty, and technical points.",
      warranty: hi ? "वारंटी मैट्रिक्स" : "Warranty Matrix",
      warrantyLead: hi
        ? "निर्माता और कार्यकुशलता कवरेज।"
        : "Manufacturer and workmanship coverages for your rooftop system.",
      execution: hi ? "निष्पादन और निपटान" : "Execution & Settlement",
      executionLead: hi
        ? "साइट सर्वे से गो-लाइव तक पूरी यात्रा।"
        : "From site survey to go-live — the full installation journey.",
      payment: hi ? "भुगतान अनुसूची" : "Payment Schedule",
      paymentLead: hi
        ? "माइलस्टोन-आधारित पूँजी अनुसूची और बैंक विवरण।"
        : "Milestone-based capital schedule with bank settlement details.",
      terms: hi ? "नियम और अनुपालन" : "Terms & Compliance",
      termsLead: hi
        ? "सामान्य शर्तें, दस्तावेज़, AMC — फिर स्पष्ट समापन।"
        : "General terms, documents, AMC — then a clear close.",
      generalTerms: hi ? "सामान्य शर्तें" : "General terms",
      documents: hi ? "आवश्यक दस्तावेज़" : "Documents required",
      amcScope: hi ? "AMC दायरा" : "AMC scope",
      ready: hi ? "जब आप तैयार हों" : "Ready when you are",
      preparedBy: (customer: string, brand: string) =>
        hi
          ? `${customer} के लिए तैयार · ${brand}`
          : `Prepared for ${customer} by ${brand}.`,
      bankDetails: hi ? "बैंक विवरण" : "Bank details",
      standards: hi ? "मानक" : "Standards",
    },
    labels: {
      capacity: hi ? "क्षमता" : "Capacity",
      annualGen: hi ? "वार्षिक उत्पादन" : "Annual generation",
      loadCoverage: hi ? "लोड कवरेज" : "Load coverage",
      assetProfile: hi ? "एसेट प्रोफ़ाइल" : "Asset profile",
      yearlyBill: hi ? "वार्षिक बिल" : "Yearly bill",
      summerShare: hi ? "गर्मी हिस्सा" : "Summer share",
      solarOffset: hi ? "सोलर ऑफ़सेट" : "Solar offset",
      fixedCharges: hi ? "फिक्स्ड चार्ज" : "Fixed charges",
      totalUnits: hi ? "कुल यूनिट" : "Total units",
      totalNet: hi ? "कुल नेट" : "Total net",
      grossCost: hi ? "सकल लागत" : "Gross cost",
      subsidy: hi ? "पीएम सूर्य घर सब्सिडी" : "PM Surya Ghar subsidy",
      netPayable: hi ? "नेट देय" : "Net payable",
      monthlySavings: hi ? "मासिक बचत" : "Monthly savings",
      payback: hi ? "पेबैक" : "Payback",
      lifetimeBenefit: hi ? "आजीवन लाभ" : "Lifetime benefit",
      interestPaid: hi ? "ब्याज भुगतान" : "Interest paid",
      co2: hi ? "CO₂ बचत" : "CO₂ avoided",
      trees: hi ? "पेड़ समकक्ष" : "Trees equivalent",
      annualSavings: hi ? "वार्षिक बचत" : "Annual savings",
      annualUnits: hi ? "वार्षिक यूनिट" : "Annual units",
      lifetimeWealth: hi ? "आजीवन संपत्ति" : "Lifetime wealth",
      scan: hi ? "स्कैन करें" : "Scan to connect",
    },
  };
}
