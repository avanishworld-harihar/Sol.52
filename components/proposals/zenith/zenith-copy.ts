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
      sub: hi
        ? "आपकी छत के लिए तैयार सौर प्रस्ताव — अगले 25 वर्षों तक स्वच्छ बिजली।"
        : "A solar proposal shaped for your rooftop — clean power for the next 25 years.",
      preparedFor: hi ? "के लिए तैयार" : "Prepared for",
      proposalLabel: hi ? "सौर प्रस्ताव" : "Solar proposal",
    },
    closing: {
      tag: hi ? "अगला कदम" : "Let's begin",
      title: hi ? "आपकी छत तैयार है।" : "Your rooftop is ready.",
      body: hi
        ? "कॉल या मैसेज करें — सर्वे, डिज़ाइन और गो-लाइव तक हम साथ हैं।"
        : "Call or message when you are ready. We handle survey, design, and go-live with you.",
      contact: hi ? "संपर्क" : "Contact",
    },
    terms: {
      validityHint: hi
        ? "नीचे शर्तें साफ़ क्रम में दी गई हैं — हर बिंदु अलग संख्या के साथ।"
        : "Terms below are numbered so each point is easy to read.",
      docHint: hi
        ? "स्थापना शुरू करने से पहले ये दस्तावेज़ तैयार रखें।"
        : "Keep these documents ready before installation begins.",
      amcHint: hi
        ? "AMC में क्या शामिल है — और क्या नहीं।"
        : "What AMC includes — and what it does not.",
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
      investment: hi ? "आपका निवेश" : "Your investment",
      investmentLead: hi
        ? "सकल लागत में से सब्सिडी घटाकर नेट निवेश — फिर बचत और पेबैक।"
        : "Gross cost minus subsidy equals what you pay — then savings and payback.",
      equationNote: hi
        ? "सरकारी सब्सिडी सकल लागत से घटाई जाती है।"
        : "Government subsidy is subtracted from gross cost.",
      youPay: hi ? "आप चुकाएँगे" : "You pay",
      outcomes: hi ? "लाभ का सार" : "What you gain",
      monthlyEmi: hi ? "मासिक EMI" : "Monthly EMI",
      tenure: hi ? "अवधि" : "Tenure",
      component: hi ? "घटक" : "Component",
      brandSpec: hi ? "ब्रांड / स्पेक" : "Brand / Spec",
      coverage: hi ? "कवरेज" : "Coverage",
      milestone: hi ? "माइलस्टोन" : "Milestone",
      amount: hi ? "राशि" : "Amount",
      minus: "−",
      equals: "=",
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
      assurance: hi ? "सिस्टम पार्ट्स" : "System Parts",
      assuranceLead: hi
        ? "टियर-1 सामग्री — ब्रांड, स्पेक, वारंटी।"
        : "Tier-1 bill of materials — brand, spec, warranty, and technical points.",
      warranty: hi ? "वारंटी मैट्रिक्स" : "Warranty Matrix",
      warrantyLead: hi
        ? "निर्माता और कार्यकुशलता कवरेज — अवधि और कवरेज एक नज़र में।"
        : "Manufacturer and workmanship coverages — duration and coverage at a glance.",
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
      subsidy: hi ? "सब्सिडी (−)" : "Subsidy (−)",
      netPayable: hi ? "नेट निवेश" : "Net investment",
      monthlySavings: hi ? "मासिक बचत" : "Monthly savings",
      payback: hi ? "पेबैक" : "Payback",
      lifetimeBenefit: hi ? "आजीवन लाभ" : "Lifetime benefit",
      interestPaid: hi ? "कुल ब्याज" : "Total interest",
      co2: hi ? "CO₂ बचत" : "CO₂ avoided",
      trees: hi ? "पेड़ समकक्ष" : "Trees equivalent",
      annualSavings: hi ? "वार्षिक बचत" : "Annual savings",
      annualUnits: hi ? "वार्षिक यूनिट" : "Annual units",
      lifetimeWealth: hi ? "आजीवन संपत्ति" : "Lifetime wealth",
      scan: hi ? "स्कैन करें" : "Scan to connect",
      warranty: hi ? "वारंटी" : "Warranty",
    },
  };
}
