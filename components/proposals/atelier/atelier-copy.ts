/**
 * Atelier (Premium Luxe) — EN / Hindi UI copy
 * Dynamic data (names, amounts, location) stays outside this file.
 */

export type AtelierLang = "en" | "hi";

export type AtelierJourneyStep = {
  num: string;
  title: string;
  desc: string;
};

export type AtelierWarrantyCard = {
  years: string;
  label: string;
  sub: string;
};

export type AtelierPayment = {
  label: string;
  pctLabel: string;
};

export function getAtelierCopy(lang: AtelierLang) {
  const hi = lang === "hi";

  return {
    print: {
      downloadPdf: hi ? "PDF डाउनलोड" : "Download PDF",
      langEn: "EN",
      langHi: "हिंदी",
    },

    fallbacks: {
      valuedCustomer: hi ? "सम्मानित ग्राहक" : "Valued Customer",
    },

    durations: {
      survey: hi ? "1 दिन" : "1 Day",
      design: hi ? "2 दिन" : "2 Days",
      approvals: hi ? "7 दिन" : "7 Days",
      material: hi ? "3 दिन" : "3 Days",
      install: hi ? "2 दिन" : "2 Days",
      commission: hi ? "3 दिन" : "3 Days",
      default: hi ? "2–3 दिन" : "2–3 Days",
    },

    investGrade: {
      exceptional: hi ? "असाधारण रिटर्न" : "Exceptional Return",
      veryHigh: hi ? "बहुत उच्च रिटर्न" : "Very High Return",
      high: hi ? "उच्च रिटर्न" : "High Return",
      aboveAvg: hi ? "औसत से अधिक रिटर्न" : "Above Average Return",
    },

    engMetricLabels: {
      dcCapacity: hi ? "डीसी क्षमता" : "DC Capacity",
      acCapacity: hi ? "एसी क्षमता" : "AC Capacity",
      performanceRatio: hi ? "परफॉर्मेंस रेशियो" : "Performance Ratio",
      specificYield: hi ? "विशिष्ट यील्ड" : "Specific Yield",
      peakSunHours: hi ? "पीक सन आवर्स" : "Peak Sun Hours",
      panelTilt: (city: string) =>
        hi ? `पैनल झुकाव (${city})` : `Panel Tilt (${city})`,
      peakSunValue: hi ? "5 घंटे / दिन" : "5 hrs / day",
    },

    warrantyFallback: [
      {
        years: "30",
        label: hi ? "पैनल परफॉर्मेंस" : "Panel Performance",
        sub: hi ? "वर्ष 30 पर ≥80%" : "≥80% at year 30",
      },
      {
        years: "15",
        label: hi ? "उत्पाद वारंटी" : "Product Warranty",
        sub: hi ? "निर्माण दोष" : "Manufacturing defects",
      },
      {
        years: "10",
        label: hi ? "माउंटिंग संरचना" : "Mounting Structure",
        sub: hi ? "जंग व संरचनात्मक अखंडता" : "Corrosion & integrity",
      },
      {
        years: "1",
        label: hi ? "निःशुल्क एएमसी" : "Free AMC",
        sub: hi ? "पूर्ण सेवा व सहायता" : "Full service & support",
      },
    ] as AtelierWarrantyCard[],

    journeyFallback: [
      {
        num: "01",
        title: hi ? "साइट सर्वे" : "Site Survey",
        desc: hi
          ? "छत मूल्यांकन, छाया व लोड जाँच"
          : "Roof assessment, shading & load check",
      },
      {
        num: "02",
        title: hi ? "डिज़ाइन व एसएलडी" : "Design & SLD",
        desc: hi
          ? "इंजीनियरिंग ड्रॉइंग व डायग्राम"
          : "Engineering drawings & diagram",
      },
      {
        num: "03",
        title: hi ? "अनुमोदन" : "Approvals",
        desc: hi
          ? "डिस्कॉम + पीएम सूर्य घर कागजी प्रक्रिया"
          : "DISCOM + PM Surya Ghar paperwork",
      },
      {
        num: "04",
        title: hi ? "सामग्री डिलीवरी" : "Material Delivery",
        desc: hi
          ? "टियर-1 घटक साइट पर"
          : "Tier-1 components to site",
      },
      {
        num: "05",
        title: hi ? "स्थापना" : "Installation",
        desc: hi
          ? "संरचना, मॉड्यूल, इन्वर्टर व विद्युत"
          : "Structure, modules, inverter & electrical",
      },
      {
        num: "06",
        title: hi ? "कमीशनिंग" : "Commissioning",
        desc: hi
          ? "नेट मीटर, ग्रिड सिंक व हैंडओवर"
          : "Net meter, grid sync & handover",
      },
    ] as AtelierJourneyStep[],

    paymentsFallback: [
      { label: hi ? "बुकिंग एडवांस" : "Booking Advance", pctLabel: "25%" },
      {
        label: hi ? "सामग्री खरीद" : "Material Procurement",
        pctLabel: "50%",
      },
      { label: hi ? "स्थापना" : "Installation", pctLabel: "20%" },
      { label: hi ? "कमीशनिंग" : "Commissioning", pctLabel: "5%" },
    ] as AtelierPayment[],

    generalTerms: hi
      ? [
          "डिस्कॉम / राज्य विद्युत बोर्ड लोड परिवर्तन, या पोल से मीटर तक केबल परिवर्तन व उसकी लायसनिंग — केवल यदि आवश्यक हो — ग्राहक के दायरे में होगा।",
          "नेट-मीटरिंग, सब्सिडी (पीएम सूर्य घर / राज्य योजनाएँ), डिस्कॉम अनुमोदन या किसी भी आधिकारिक आवेदन से संबंधित सभी सरकारी वैधानिक शुल्क, नियामक प्रभार व कानूनी लागत ग्राहक द्वारा सीधे वहन व भुगतान की जाएगी।",
          "यदि सौर कनेक्शन के लिए स्वीकृत लोड या कनेक्टेड लोड बढ़ाने की आवश्यकता हो, तो ग्राहक सुनिश्चित करेगा कि डिस्कॉम के सभी पूर्व बिजली बिल, बकाया व बकाया राशि पूरी तरह चुका दी गई हो; बकाया के कारण होने वाली देरी या अस्वीकृति ग्राहक की जिम्मेदारी रहेगी।",
          "इन्वर्टर वारंटी निर्माता के अनुसार है (स्ट्रिंग इन्वर्टर पर सामान्यतः 8–10 वर्ष)।",
          "सौर पीवी मॉड्यूल उत्पाद वारंटी: 15 वर्ष; परफॉर्मेंस वारंटी: 30 वर्ष के अंत में ≥80% रेटेड आउटपुट (निर्माता)। ऊपर निर्दिष्ट न किए गए समग्र सिस्टम व भागों पर वारंटी: कमीशनिंग तिथि से 1 वर्ष।",
          "वारंटी केवल निर्माण दोषों पर लागू होती है। भौतिक क्षति, दुरुपयोग या तोड़फोड़ कवर नहीं है।",
          "मॉड्यूल की नियमित सफाई (साप्ताहिक अनुशंसित) ग्राहक के दायरे में है — यह सीधे उत्पादन प्रदर्शन को प्रभावित करती है।",
          "स्थापना, सहमत खरीद आदेश / भुगतान अनुसूची के अनुसार एडवांस भुगतान प्राप्त होने के 30–40 कार्य दिवसों में पूर्ण की जाएगी।",
          "यहाँ स्पष्ट रूप से उल्लेखित न की गई कोई भी शर्त दोनों पक्षों के आपसी लिखित समझौते से शासित होगी।",
          "यदि लागू हो, तो रिफंड परियोजना फाइनल राशि पर 2.5% कटौती तथा पहले से हुए दस्तावेज़ी खर्चों के बाद प्रोसेस किया जाएगा।",
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

    docs: hi
      ? [
          "नवीनतम बिजली बिल (स्पष्ट प्रति)",
          "पैन कार्ड की प्रति",
          "आधार कार्ड की प्रति (पठनीय, यदि लागू हो तो दोनों ओर)",
          "स्वामित्व प्रमाण — संपत्ति कर रसीद / विक्रय विलेख / नगरपालिका रिकॉर्ड",
          "आवेदक का पासपोर्ट आकार का फोटो",
          "सिंगल-लाइन डायग्राम (एसएलडी) — हमारे द्वारा ड्राफ्ट; ग्राहक से हस्ताक्षरित प्रति आवश्यक",
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
      ? "वार्षिक रखरखाव सेवाओं का उद्देश्य अनुबंध अवधि भर छत के एसपीवी प्लांट का परफॉर्मेंस रेशियो बनाए रखना और सामान्य रखरखाव सुनिश्चित करना है।"
      : "The objective of Annual Maintenance Services is to maintain the performance ratio and general upkeep of the rooftop SPV plant throughout the contract period.",

    amcScope: hi
      ? [
          "वार्षिक रखरखाव अनुबंध (एएमसी) में शामिल:",
          "प्लांट प्रदर्शन व ऊर्जा उत्पादन की दैनिक / आवधिक निगरानी",
          "प्लांट व उपकरण का नियमित निवारक रखरखाव",
          "आपातकालीन ब्रेकडाउन उपस्थिति (48 कार्य घंटों में प्रतिक्रिया)",
          "वारंटी सहायता व दोष सुधार के लिए ओईएम समन्वय",
          "डीसी व एसी सुरक्षा, अर्थिंग व केबल टर्मिनेशन का आवधिक निरीक्षण",
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
          "साइट सुरक्षा, चौकीदारी व निगरानी",
          "प्लांट व उपकरण का बीमा (यदि वांछित हो)",
          "रिमोट मॉनिटरिंग के लिए साइट पर स्थिर इंटरनेट (जहाँ लागू हो)",
          "रखरखाव गतिविधियों के लिए पानी व सहायक बिजली, आवश्यकतानुसार साइट पर",
          "दैनिक दृश्य जाँच व छत तक सुरक्षित पहुँच",
          "निर्माता दिशानिर्देशों के अनुसार नियमित मॉड्यूल सफाई",
        ]
      : [
          "Site security, watch and ward",
          "Insurance of plant and equipment (if desired)",
          "Stable internet connection at site for remote monitoring (where applicable)",
          "Water and auxiliary power for maintenance activities, as needed on site",
          "Day-to-day visual checks and safe access to the rooftop",
          "Regular module cleaning as per manufacturer guidelines",
        ],

    amcCostParagraph: (invoiceRef: string) =>
      hi
        ? `पहले 1 वर्ष की एएमसी उद्धृत मूल्य में शामिल है। वर्ष 2 से वार्षिक रखरखाव इनवॉइस मूल्य (${invoiceRef}) का 2% तथा 5% वार्षिक वृद्धि पर लिया जा सकता है, हस्ताक्षरित ओएंडएम समझौते के अधीन।`
        : `First 1 year AMC is included in the quoted price. From Year 2 onwards, annual maintenance may be charged at 2% of invoice value (${invoiceRef}) with 5% year-on-year escalation, subject to a signed O&M agreement.`,

    amcTerms: hi
      ? [
          "लागू होने पर रखरखाव शुल्क अग्रिम रूप से अर्धवार्षिक आधार पर देय हैं।",
          "न्यूनतम ओएंडएम अनुबंध अवधि: 2 वर्ष, आपसी सहमति से 2 वर्ष के ब्लॉकों में विस्तार योग्य (कमीशनिंग से 25 वर्ष तक)।",
          "चोरी, स्टैंड क्षति या तोड़फोड़ से मॉड्यूल या उपकरण हानि के लिए हम उत्तरदायी नहीं हैं।",
          "मानक फोर्स मेज्योर प्रावधान लागू होते हैं; ऐसी घटनाओं के दौरान सेवा कमी की सूचना ग्राहक को घटना के एक सप्ताह के भीतर दी जाएगी।",
        ]
      : [
          "Maintenance charges, when applicable, are payable in advance on a half-yearly basis.",
          "Minimum O&M contract duration: 2 years, extendable in blocks of 2 years by mutual consent (up to 25 years from commissioning).",
          "We are not liable for module or equipment loss due to theft, stand damage, or vandalism.",
          "Standard force majeure provisions apply; service deficiencies during such events shall be communicated to the client within one week of occurrence.",
        ],

    cover: {
      docType: hi ? "निवेश ब्लूप्रिंट" : "INVESTMENT BLUEPRINT",
      preparedFor: hi ? "के लिए तैयार" : "PREPARED FOR",
      wealthTag: hi ? "25-वर्ष का सृजित धन" : "25-YEAR WEALTH CREATED",
      wealthSub: hi
        ? "आपकी छत एक धन इंजन बन जाती है"
        : "Your roof becomes a wealth engine",
      savingsMonth: hi ? "बचत / माह" : "Savings / Month",
      fullPayback: hi ? "पूर्ण पेबैक" : "Full Payback",
      systemSize: hi ? "सिस्टम आकार" : "System Size",
      yrs: hi ? "वर्ष" : "Yrs",
    },

    impact: {
      tag: hi ? "02 — आपका प्रभाव" : "02 — YOUR IMPACT",
      title: hi
        ? "आपकी छत दुनिया को क्या वापस देती है"
        : "What Your Roof Gives Back to the World",
      lead: hi
        ? "आंकड़ों से पहले — देखें कि आपका सिस्टम ग्रह के लिए क्या करता है।"
        : "Before the numbers — here is what your system does for the planet.",
      tons: hi ? "टन" : "TONS",
      trees: hi ? "वृक्ष" : "TREES",
      co2Label: hi ? "आजीवन CO₂ ऑफसेट" : "Lifetime CO₂ Offset",
      co2Sub: (yrs: string | number) =>
        hi
          ? `पेट्रोल कार को सड़क से ${yrs} वर्षों के लिए हटाने के समकक्ष।`
          : `Equivalent to removing a petrol car from the road for ${yrs} years.`,
      ecoLabel: hi
        ? "पारिस्थितिक समकक्ष रोपण"
        : "Ecological Equivalent Planted",
      ecoSub: hi
        ? "आपका छत पारिस्थितिकी तंत्र ग्रह के लिए हर दिन चुपचाप काम करता है।"
        : "Your rooftop ecosystem works silently for the planet, every single day.",
      yearN: (n: number) => (hi ? `वर्ष ${n}` : `Year ${n}`),
      tonsCo2: (tons: number) =>
        hi ? `${tons}ट CO₂` : `${tons}T CO₂`,
      tagline: hi
        ? "आपकी छत द्वारा उत्पन्न सौर ऊर्जा की हर इकाई जलवायु कार्रवाई का सीधा कार्य है।"
        : "Every unit of solar energy your roof generates is a direct act of climate action.",
    },

    finance: {
      tag: hi ? "03 — मासिक अर्थशास्त्र" : "03 — MONTHLY ECONOMICS",
      title: hi
        ? "आप ऊर्जा नहीं बदल रहे। आप अर्थशास्त्र बदल रहे हैं।"
        : "You Are Not Switching Energy. You Are Switching Economics.",
      lead: hi
        ? "असली सवाल सरल है: हर महीने आपकी जेब से क्या निकलता है?"
        : "The real question is simple: what leaves your pocket every month?",
      todayTag: hi ? "आज — सौर के बिना" : "TODAY — WITHOUT SOLAR",
      todayLabel: hi ? "मासिक बिजली बिल" : "Monthly Electricity Bill",
      todayNote: hi
        ? "हर साल ~6% बढ़ता है। आप ऐसी ऊर्जा के लिए भुगतान करते हैं जिसका स्वामित्व कभी नहीं मिलता — और बिल केवल बढ़ता जाता है।"
        : "Rises ~6% every year. You pay for energy you never own — and the bill only goes up.",
      tomorrowTag: hi ? "कल — सौर के साथ" : "TOMORROW — WITH SOLAR",
      tomorrowLabel: hi
        ? "समकक्ष मासिक लागत"
        : "Equivalent Monthly Cost",
      tomorrowNote: hi
        ? "5 वर्षों के लिए निश्चित (ऋण), फिर शून्य। ऊर्जा लागत जो आप हमेशा नियंत्रित करते हैं।"
        : "Fixed for 5 years (loan), then ZERO. Energy costs you control forever.",
      profitTag: hi
        ? "तत्काल मासिक लाभ"
        : "IMMEDIATE MONTHLY PROFIT",
      profitLabel: hi
        ? "दिन 1 से शुद्ध मासिक लाभ"
        : "Net Monthly Gain from Day 1",
      profitNote: hi
        ? "यह वह पैसा है जो हर महीने आपकी जेब में रहता है, तुरंत शुरू होकर।"
        : "This is money that stays in your pocket every single month, starting immediately.",
      trajectoryTag: hi
        ? "पहले 10 वर्ष — मासिक बिल तुलना"
        : "FIRST 10 YEARS — MONTHLY BILL COMPARISON",
      yr: (y: number) => (hi ? `वर्ष ${y}` : `YR ${y}`),
      legendWithout: hi
        ? "बिना सौर का बिल (~6%/वर्ष बढ़ता)"
        : "Bill Without Solar (rising ~6%/yr)",
      legendWith: hi
        ? "सौर के साथ बिल (सपाट, फिर लगभग शून्य)"
        : "Bill With Solar (flat, then near-zero)",
      legendGap: hi ? "मासिक बचत अंतर" : "Monthly Savings Gap",
      grossCost: hi ? "सकल लागत" : "GROSS COST",
      subsidy: hi ? "पीएम सूर्य घर सब्सिडी" : "PM SURYA GHAR SUBSIDY",
      netInvestment: hi ? "आपका शुद्ध निवेश" : "YOUR NET INVESTMENT",
    },

    wealth: {
      tag: hi ? "04 — धन प्रक्षेपण" : "04 — WEALTH PROJECTION",
      title: hi
        ? "25 वर्षों में आपकी बचत कैसे बढ़ती है"
        : "Where Your Savings Compound Over 25 Years",
      lead: hi
        ? "मासिक लाभ जुड़ते हैं। यहाँ पूरा दीर्घकालिक चित्र है — इस प्रस्ताव में एकमात्र स्थान जहाँ हम 25-वर्ष रिटर्न प्रोजेक्ट करते हैं।"
        : "Monthly gains add up. Here is the full long-term picture — the only place in this proposal where we project 25-year returns.",
      phase1: hi ? "चरण 1" : "Phase 1",
      investment: hi ? "निवेश" : "Investment",
      year0To: (n: number) =>
        hi ? `वर्ष 0 → ${n}` : `Year 0 → ${n}`,
      phase1Note: hi
        ? "मासिक सौर लागत आपके बिजली बिल की भरपाई करती है जबकि आप 5 वर्षों में सिस्टम चुकाते हैं।"
        : "Monthly solar cost offsets your electricity bill while you repay the system over 5 years.",
      milestone: hi ? "मील का पत्थर" : "Milestone",
      payback: hi ? "पेबैक" : "Payback",
      yearAt: (v: string) => (hi ? `वर्ष ${v}` : `Year ${v}`),
      paybackNote: hi
        ? "सिस्टम पूरी तरह चुका। यहाँ से उत्पन्न हर इकाई 100% शुद्ध लाभ है।"
        : "System fully paid back. Every unit generated from here on is 100% pure profit.",
      phase2: hi ? "चरण 2" : "Phase 2",
      passiveIncome: hi ? "निष्क्रिय आय" : "Passive Income",
      yearRange: (from: number) =>
        hi ? `वर्ष ${from} → 25` : `Year ${from} → 25`,
      passiveWealth: (amt: string) =>
        hi
          ? `${amt} शुद्ध निष्क्रिय धन में।`
          : `${amt} in pure passive wealth.`,
      pureWealth: hi ? "शुद्ध धन सृजन।" : "Pure wealth creation.",
      zeroEnergy: hi
        ? "शून्य ऊर्जा लागत। अधिकतम रिटर्न।"
        : "Zero energy cost. Maximum returns.",
      chartNote: hi
        ? "वर्तमान उत्पादन स्तर पर 25 वर्षों में संचयी बिजली बिल बचत।"
        : "Cumulative electricity bill savings over 25 years at current generation levels.",
      withoutSolar: hi ? "बिना सौर" : "Without solar",
      paidToGrid: hi
        ? "25 वर्षों में ग्रिड को भुगतान"
        : "paid to grid over 25 yrs",
      yrShort: (y: number) => (hi ? `वर्ष ${y}` : `YR ${y}`),
      scoreTag: hi
        ? "सौर निवेश स्कोर"
        : "SOLAR INVESTMENT SCORE",
      paybackLabel: hi ? "पेबैक" : "Payback",
      annualRoi: hi ? "वार्षिक आरओआई" : "Annual ROI",
      yrsShort: hi ? "वर्ष" : "yrs",
      basis: hi ? "आधार:" : "Basis:",
      basisText: (pb: string) =>
        hi
          ? `ग्रेड उद्योग बेंचमार्क (5–7 वर्ष) के मुकाबले पेबैक अवधि से निकाला गया। आपका ${pb}-वर्ष पेबैक भारत में छत सौर निवेशों की शीर्ष श्रेणी में आता है।`
          : `Grade derived from payback period vs. industry benchmark (5–7 yrs). Your ${pb}-yr payback ranks in the top tier of rooftop solar investments in India.`,
      totalWealthTag: hi
        ? "वर्ष 25 पर कुल धन"
        : "TOTAL WEALTH AT YEAR 25",
      returnsNote: (inv: string, mult: string) =>
        hi
          ? `आपका ₹${inv} निवेश 25 वर्षों में ${mult} रिटर्न उत्पन्न करता है।`
          : `Your ₹${inv} investment generates ${mult} returns over 25 years.`,
    },

    gen: {
      tag: hi ? "05 — उत्पादन प्रमाण" : "05 — GENERATION PROOF",
      title: (units: string) =>
        hi
          ? `हम ${units} यूनिट / वर्ष की गणना कैसे करते हैं`
          : `How We Calculate ${units} Units / Year`,
      pvgis: hi ? "पीवीजीआईएस पद्धति" : "PVGIS METHODOLOGY",
      systemCapacity: hi ? "सिस्टम क्षमता" : "System Capacity",
      sunHours: hi ? "सन आवर्स/दिन" : "Sun Hours/Day",
      perfRatio: hi ? "परफॉर्मेंस रेशियो" : "Performance Ratio",
      daysYear: hi ? "दिन/वर्ष" : "Days/Year",
      unitsYear: hi ? "यूनिट/वर्ष" : "Units/Year",
      solarResource: (city: string) =>
        hi ? `सौर संसाधन — ${city}` : `SOLAR RESOURCE — ${city}`,
      globalHoriz: hi ? "वैश्विक क्षैतिज" : "Global Horizontal",
      optimalIncl: hi ? "इष्टतम झुकाव" : "Optimal Inclination",
      annualIrrad: hi ? "वार्षिक विकिरण" : "Annual Irradiance",
      dataSource: hi ? "डेटा स्रोत" : "Data Source",
      tiltLabel: (tilt: number) =>
        hi ? `${tilt}° झुकाव` : `${tilt}° tilt`,
      barTag: (city: string) =>
        hi
          ? `अनुमानित उत्पादन बनाम शहर क्षमता — ${city}`
          : `ESTIMATED GENERATION vs. CITY POTENTIAL — ${city}`,
      ourEstimate: hi ? "हमारा सिस्टम अनुमान" : "Our System Estimate",
      gridAvg: (city: string) =>
        hi ? `${city} ग्रिड औसत` : `${city} Grid Average`,
      theoreticalMax: hi
        ? "सैद्धांतिक अधिकतम (पीआर 85%)"
        : "Theoretical Max (PR 85%)",
      units: hi ? "यूनिट" : "units",
      expertTag: hi ? "विशेषज्ञ अंतर्दृष्टि" : "EXPERT INSIGHT",
      expertBody: (
        size: string,
        bill: string,
        billUnits: string,
        gen: string,
        city: string
      ) =>
        hi
          ? `क्यों ${size}? आपका वर्तमान बिल ${bill}/माह लगभग ${billUnits} यूनिट/वर्ष से मेल खाता है। ${size} सिस्टम ${gen} यूनिट/वर्ष उत्पन्न करता है — ${city} में गर्मी के चरम महीनों में भी लगभग 100% ऑफसेट प्राप्त करता है।`
          : `Why ${size}? Your current bill of ${bill}/month maps to ~${billUnits} units/year. A ${size} system produces ${gen} units/year — achieving near-100% offset even during peak summer months in ${city}.`,
      compliance: hi ? "अनुपालन:" : "Compliance:",
      noteLabel: hi ? "नोट:" : "Note:",
      noteBody: hi
        ? "वास्तविक उत्पादन मौसम, धूल जमाव, आसपास की संरचनाओं की छाया व पैनल सफाई आवृत्ति से भिन्न होता है। ऊपर के आंकड़े मानक परीक्षण स्थितियों में मॉडल किए गए अनुमान हैं, गारंटी नहीं।"
        : "Actual generation varies with weather conditions, dust accumulation, shading from nearby structures, and panel cleaning frequency. Figures above represent modelled estimates under standard test conditions, not a guarantee.",
    },

    hw: {
      tag: hi ? "06 — हार्डवेयर विश्वास" : "06 — HARDWARE TRUST",
      title: hi
        ? "टियर-1 घटक। शून्य समझौता।"
        : "Tier-1 Components. Zero Compromise.",
      panels: hi ? "सौर पैनल" : "SOLAR PANELS",
      inverter: hi ? "स्ट्रिंग इन्वर्टर" : "STRING INVERTER",
      structure: hi ? "माउंटिंग संरचना" : "MOUNTING STRUCTURE",
      protection: hi ? "सुरक्षा व सुरक्षा" : "PROTECTION & SAFETY",
      warrantyPanel: hi
        ? "30 वर्ष परफॉर्मेंस"
        : "30 Years Performance",
      warrantyInverter: hi ? "10 वर्ष वारंटी" : "10 Years Warranty",
      warrantyStructure: hi
        ? "10 वर्ष संरचनात्मक"
        : "10 Years Structural",
      warrantyProtection: hi ? "5 वर्ष" : "5 Years",
      whyPanel: (city: string) =>
        hi
          ? `टॉपकॉन एन-टाइप सेल 22%+ मॉड्यूल दक्षता देते हैं — ${city} की गर्मी में मानक पॉली पैनलों से 8% तक अधिक यील्ड।`
          : `TOPCon N-type cells deliver 22%+ module efficiency — up to 8% higher yield than standard poly panels in ${city}'s summer heat.`,
      whyInverter: hi
        ? "बीईई 5-स्टार, आईपी65 वेदरप्रूफ। ड्यूअल एमपीपीटी आंशिक छाया में भी बिना छाया वाले स्ट्रिंग का आउटपुट नहीं खोता।"
        : "BEE 5-star, IP65 weatherproof. Dual MPPT handles partial shading without losing output from unshaded strings.",
      whyStructure: hi
        ? "150 किमी/घंटा पवन-लोड रेटेड जीआई संरचना, भारतीय छत हवा व मानसून के लिए विशेष रूप से इंजीनियर।"
        : "150 km/h wind-load rated GI structure, engineered specifically for Indian rooftop wind and monsoon conditions.",
      whyProtection: hi
        ? "एमसीबी/एमसीसीबी सुरक्षा, सर्ज प्रोटेक्शन डिवाइस व कॉपर अर्थिंग — ग्रिड फॉल्ट व बिजली से पूर्ण सिस्टम सुरक्षा।"
        : "MCB/MCCB protection, surge protection device & copper earthing — full-system safety against grid faults and lightning.",
      viewDatasheet: hi ? "डेटाशीट देखें" : "View Datasheet",
      yrs: hi ? "वर्ष" : "YRS",
    },

    trust: {
      tag: (brand: string) =>
        hi ? `07 — क्यों ${brand}` : `07 — WHY ${brand}`,
      title: hi
        ? "क्योंकि आपकी छत को केवल सर्वोत्तम पैनल नहीं, सर्वोत्तम टीम चाहिए।"
        : "Because Your Rooftop Deserves the Best Team, Not Just the Best Panel.",
      cards: [
        {
          num: "500+",
          label: hi ? "पूर्ण स्थापनाएँ" : "Installations Completed",
          note: hi
            ? "मध्य प्रदेश व पड़ोसी राज्यों में"
            : "Across Madhya Pradesh & neighbouring states",
        },
        {
          num: "100%",
          label: hi ? "प्रमाणित इंजीनियर" : "Certified Engineers",
          note: hi
            ? "एमएनआरई-एम्पैनल्ड डिज़ाइन व इंस्टॉल टीम"
            : "MNRE-empanelled design & install team",
        },
        {
          num: hi ? "स्थानीय" : "Local",
          label: hi ? "ऑन-ग्राउंड सेवा" : "On-Ground Service",
          note: hi
            ? "कोई कॉल सेंटर नहीं — आपका इंस्टॉलर आपका पड़ोसी है"
            : "No call centres — your installer is your neighbour",
        },
        {
          num: hi ? "48 घं" : "48 Hr",
          label: hi ? "सहायता प्रतिक्रिया" : "Support Response",
          note: hi
            ? "किसी भी दोष पर 2 कार्य दिवसों में उपस्थिति"
            : "Any fault attended within 2 working days",
        },
        {
          num: "100%",
          label: hi ? "सब्सिडी सहायता" : "Subsidy Assistance",
          note: hi
            ? "एंड-टू-एंड पीएम सूर्य घर कागजी प्रक्रिया, आपके लिए"
            : "End-to-end PM Surya Ghar paperwork, done for you",
        },
        {
          num: hi ? "25 वर्ष" : "25 Yr",
          label: hi
            ? "परफॉर्मेंस प्रतिबद्धता"
            : "Performance Commitment",
          note: hi
            ? "हमारे द्वारा स्थापित हर पैनल के पीछे हम खड़े हैं"
            : "We stand behind every panel we install",
        },
      ],
      quote: hi
        ? "“हम केवल सौर सिस्टम नहीं बेचते — हम 25-वर्ष के संबंध इंजीनियर करते हैं। हर स्थापना एक स्थानीय टीम द्वारा समर्थित है जो पहुँच योग्य, जवाबदेह है और स्थापना दिन के बहुत बाद भी आपके सिस्टम के प्रदर्शन में निवेशित है।”"
        : "“We don't just sell solar systems — we engineer 25-year relationships. Every installation is backed by a local team that's reachable, accountable, and invested in your system's performance long after installation day.”",
      quoteAttr: (brand: string) =>
        hi
          ? `— ${brand} इंजीनियरिंग टीम`
          : `— ${brand} Engineering Team`,
    },

    roof: {
      tag: hi ? "08 — छत बुद्धिमत्ता" : "08 — ROOF INTELLIGENCE",
      title: hi
        ? "आपकी छत, अधिकतम यील्ड के लिए इंजीनियर"
        : "Your Roof, Engineered for Maximum Yield",
      compassNote: (city: string) =>
        hi
          ? `${city} के लिए दक्षिण-मुखी अभिविन्यास अनुकूलित`
          : `South-facing orientation optimized for ${city}`,
      panelLayout: (n: number) =>
        hi
          ? `पैनल लेआउट — ${n} मॉड्यूल`
          : `PANEL LAYOUT — ${n} MODULES`,
      planCaption: (n: number, wp: number, tilt: number) =>
        hi
          ? `${n} मॉड्यूल · ${wp} Wp · दक्षिण मुख · ${tilt}° झुकाव`
          : `${n} modules · ${wp} Wp · South face · ${tilt}° tilt`,
      sunPathLabel: hi ? "सूर्य पथ · अज़ीमुथ" : "Sun path · azimuth",
      sunTeachTitle: hi
        ? "सूर्य पथ क्यों मायने रखता है"
        : "Why sun path matters",
      sunTeachLead: (city: string) =>
        hi
          ? `${city} में दक्षिण मुख सर्दियों में भी अधिक धूप पकड़ता है — वार्षिक इकाइयाँ बढ़ती हैं।`
          : `In ${city}, a south face catches more winter sun — lifting annual units.`,
      sunBenefits: hi
        ? [
            "सर्दी का निम्न सूर्य भी सरणी पर अधिक पड़ता है",
            "मध्य प्रदेश अक्षांश से झुकाव मेल — साल भर संतुलित यील्ड",
            "पूर्व/पश्चिम की तुलना में अधिक वार्षिक इकाइयाँ",
          ]
        : [
            "Winter low sun still lands harder on the array",
            "Tilt matched to MP latitude — balanced year-round yield",
            "Higher annual units vs east / west facing",
          ],
      sunrise: hi ? "सूर्योदय" : "Sunrise",
      noon: hi ? "दोपहर" : "Noon",
      sunset: hi ? "सूर्यास्त" : "Sunset",
      northShort: "N",
      southShort: hi ? "द" : "S",
      southEdge: hi ? "दक्षिण" : "SOUTH",
      southCue: hi ? "दक्षिण यील्ड" : "South yield",
      terraceLabel: hi ? "टेरेस प्लान" : "Terrace plan",
      moreModules: (n: number) =>
        hi ? `+${n} और मॉड्यूल` : `+${n} more modules`,
      engString: hi ? "स्ट्रिंग लेआउट" : "STRING LAYOUT",
      engDc: hi ? "डीसी आकार" : "DC SIZE",
      engYield: hi ? "विशिष्ट यील्ड" : "SPECIFIC YIELD",
      engWind: hi ? "पवन / संरचना" : "WIND / STRUCTURE",
      engStringVal: (n: number) => (hi ? `1 × ${n}` : `1 × ${n}`),
      engDcVal: (kwp: string) => `${kwp} kWp`,
      engYieldVal: "1440 kWh/kWp",
      engWindVal: hi ? "IS 875 · 150 किमी/घंटा" : "IS 875 · 150 km/h",
      modulesTag: hi ? "छत पर मॉड्यूल" : "MODULES ON ROOF",
      panelsVal: (n: number) =>
        hi ? `${n} पैनल` : `${n} panels`,
      wpEach: (wp: number) =>
        hi ? `प्रत्येक ${wp} Wp` : `${wp} Wp each`,
      areaTag: hi ? "आवश्यक छत क्षेत्र" : "ROOF AREA REQUIRED",
      areaNote: hi
        ? "प्रति पैनल लगभग 2 मी²"
        : "2 m² per panel approx.",
      tiltTag: hi ? "इष्टतम झुकाव कोण" : "OPTIMAL TILT ANGLE",
      tiltNote: (city: string) =>
        hi
          ? `${city} अक्षांश के लिए गणना`
          : `Calculated for ${city} latitude`,
      irradTag: hi ? "वार्षिक विकिरण" : "ANNUAL IRRADIATION",
      irradNote: (city: string) =>
        hi
          ? `इष्टतम झुकाव — ${city}`
          : `Optimal inclination — ${city}`,
      shadowTag: hi ? "छाया विश्लेषण" : "SHADOW ANALYSIS",
      siteVerified: hi ? "साइट सत्यापित" : "Site Verified",
      methodApplied: hi
        ? "पद्धति लागू"
        : "Methodology Applied",
      shadowNote: hi
        ? "झुकाव-सुधारित, छाया-समायोजित"
        : "Tilt-corrected, shading-adjusted",
      utilTag: hi ? "छत उपयोग" : "ROOF UTILIZATION",
      utilNote: hi
        ? "उपलब्ध छाया-मुक्त क्षेत्र का"
        : "Of available shadow-free area",
    },

    roadmap: {
      tag: hi ? "09 — निष्पादन रोडमैप" : "09 — EXECUTION ROADMAP",
      title: hi
        ? "कागजी प्रक्रिया से बिजली तक"
        : "From Paperwork to Power",
      journeyLabel: hi ? "कार्य यात्रा" : "Project journey",
      payLabel: hi ? "भुगतान योजना" : "Payment plan",
      bankLabel: hi ? "विक्रेता बैंक खाता" : "Vendor bank account",
      bankNote: hi
        ? "केवल इसी खाते में भुगतान करें · More → Brand settings"
        : "Pay only into this account · More → Brand settings",
      bankEmpty: hi
        ? "बैंक विवरण जोड़ें: More → Brand settings"
        : "Add bank details in More → Brand settings",
      accountName: hi ? "खाता नाम" : "Account name",
      accountNumber: hi ? "खाता संख्या" : "Account number",
      ifsc: "IFSC",
      upi: "UPI",
      branch: hi ? "शाखा" : "Branch",
      timelineBefore: hi
        ? "अनुमानित समयसीमा: "
        : "Estimated timeline: ",
      timelineStrong: hi
        ? "18–20 कार्य दिवस"
        : "18–20 working days",
      timelineAfter: hi
        ? " एडवांस प्राप्ति से ग्रिड सिंक तक, डिस्कॉम अनुमोदन गति के अधीन।"
        : " from advance receipt to grid sync, subject to DISCOM approval speed.",
      preparedFor: (name: string) =>
        hi ? `${name} के लिए तैयार` : `Prepared for ${name}`,
      netPayable: hi
        ? "शुद्ध देय (सब्सिडी के बाद)"
        : "Net Payable (After Subsidy)",
      milestone: hi ? "मील का पत्थर" : "Milestone",
      share: hi ? "हिस्सा" : "Share",
      amount: hi ? "राशि" : "Amount",
      subsidyFooter: (amt: string) =>
        hi
          ? `${amt} की सब्सिडी कमीशनिंग के बाद सरकार द्वारा सीधे आपके बैंक खाते में जमा की जाती है।`
          : `Subsidy of ${amt} is credited directly to your bank account by the government after commissioning.`,
    },

    terms: {
      tag10: hi
        ? "10 — शर्तें व अनुपालन"
        : "10 — TERMS & COMPLIANCE",
      tag11: hi
        ? "11 — शर्तें व अनुपालन (जारी)"
        : "11 — TERMS & COMPLIANCE (CONTD.)",
      title: hi ? "नियम व शर्तें" : "Terms & Conditions",
      general: hi ? "सामान्य शर्तें" : "General Terms",
      documents: hi ? "आवश्यक दस्तावेज़" : "Documents Required",
      amcScope: hi
        ? "वार्षिक रखरखाव — दायरा"
        : "Annual Maintenance — Scope",
      clientScope: hi ? "ग्राहक का दायरा" : "Client's Scope",
      costMaint: hi
        ? "रखरखाव की लागत"
        : "Cost of Maintenance",
      regards: hi ? "सादर," : "Regards,",
    },

    closing: {
      tag: hi
        ? "12 — ऊर्जा स्वतंत्रता"
        : "12 — ENERGY INDEPENDENCE",
      congrats: hi ? "बधाई हो।" : "Congratulations.",
      statement1: hi
        ? "आज आप सौर पैनल नहीं खरीद रहे।"
        : "Today you are not buying solar panels.",
      statement2: hi
        ? "आप अगले 25 वर्षों के लिए अपनी बिजली कीमत लॉक कर रहे हैं।"
        : "You are locking your electricity price for the next 25 years.",
      sub: hi
        ? "हर दिन सूरज उगता है, आपकी छत कमाती है। हर महीने आपका मीटर पीछे घूमता है। हर साल आपका धन बढ़ता है। यह उपयोगिता खर्च नहीं — यह आपकी छत पर एक वित्तीय संपत्ति है।"
        : "Every day the sun rises, your roof earns. Every month your meter spins backward. Every year your wealth compounds. This is not a utility expense — this is a financial asset on your rooftop.",
      unitsYear: hi ? "यूनिट / वर्ष" : "units / year",
      savedYear: hi ? "बचत / वर्ष" : "saved / year",
      wealth25: hi ? "25-वर्ष धन" : "25-yr wealth",
      ctaTitle: hi
        ? "अपनी सौर यात्रा शुरू करने के लिए तैयार?"
        : "Ready to Begin Your Solar Journey?",
      ctaDesc: hi
        ? "आज अपनी बिजली कीमत लॉक करें। यह प्रस्ताव आपकी छत, आपके उपयोग व आपके वित्तीय लक्ष्यों के लिए कस्टम-इंजीनियर है।"
        : "Lock your electricity price today. This proposal is custom-engineered for your roof, your usage, and your financial goals.",
      ctaBtn: hi ? "आइए शुरू करें →" : "Let's Begin →",
      validity: hi
        ? "15 दिनों के लिए मान्य। जब आप तैयार हों, हम तैयार हैं।"
        : "Valid for 15 days. We are ready when you are.",
    },
  };
}

export type AtelierCopy = ReturnType<typeof getAtelierCopy>;
