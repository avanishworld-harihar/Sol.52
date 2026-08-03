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
      exceptional: hi ? "बेहतरीन सौदा" : "Excellent deal",
      veryHigh: hi ? "बहुत अच्छा सौदा" : "Excellent deal",
      high: hi ? "अच्छा सौदा" : "Good deal",
      aboveAvg: hi ? "ठीक-ठाक सौदा" : "Fair deal",
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

    /** Premium Luxe terms content — Atelier EN/HI */
    generalTerms: hi
      ? [
          {
            label: "लोड परिवर्तन",
            text: "डिस्कॉम लोड परिवर्तन, या पोल से मीटर तक केबल परिवर्तन व लायसनिंग — केवल यदि आवश्यक हो — ग्राहक के दायरे में है।",
          },
          {
            label: "वैधानिक शुल्क",
            text: "नेट-मीटरिंग, सब्सिडी और डिस्कॉम अनुमोदन के सरकारी शुल्क ग्राहक द्वारा सीधे भुगतान किए जाते हैं।",
          },
          {
            label: "बकाया",
            text: "यदि लोड बढ़ाना आवश्यक हो, तो प्रक्रिया से पहले पूर्व डिस्कॉम बिल / बकाया चुकाएँ।",
          },
          {
            label: "इन्वर्टर वारंटी",
            text: "इन्वर्टर वारंटी निर्माता के अनुसार (स्ट्रिंग इन्वर्टर पर सामान्यतः 8–10 वर्ष)।",
          },
          {
            label: "मॉड्यूल वारंटी",
            text: "उत्पाद 15 वर्ष; प्रदर्शन वर्ष 30 पर ≥80%। अन्य भाग: कमीशनिंग से 1 वर्ष।",
          },
          {
            label: "वारंटी दायरा",
            text: "केवल निर्माण दोष। भौतिक क्षति, दुरुपयोग या तोड़फोड़ कवर नहीं।",
          },
          {
            label: "रखरखाव",
            text: "नियमित मॉड्यूल सफाई (साप्ताहिक अनुशंसित) ग्राहक के दायरे में है।",
          },
          {
            label: "समयसीमा",
            text: "एडवांस से 30–40 कार्य दिवसों में स्थापना, सहमत पीओ / अनुसूची के अनुसार।",
          },
          {
            label: "शासकीय शर्तें",
            text: "यहाँ सूचीबद्ध न की गई शर्तें आपसी लिखित समझौते से शासित होंगी।",
          },
          {
            label: "रिफंड",
            text: "यदि लागू: फाइनल राशि पर 2.5% कटौती तथा दस्तावेज़ी खर्चों के बाद।",
          },
        ]
      : [
          {
            label: "Load Change",
            text: "DISCOM load change, or cable change from pole to meter and liaison — only if required — is in the customer's scope.",
          },
          {
            label: "Statutory Fees",
            text: "Government fees for net-metering, subsidy, and DISCOM approvals are paid directly by the client.",
          },
          {
            label: "Arrears",
            text: "If load increase is required, clear prior DISCOM bills/arrears before processing.",
          },
          {
            label: "Inverter Warranty",
            text: "Inverter warranty as per manufacturer (typically 8–10 years on string inverters).",
          },
          {
            label: "Module Warranty",
            text: "Product 15 years; performance ≥80% at year 30. Other parts: 1 year from commissioning.",
          },
          {
            label: "Warranty Scope",
            text: "Manufacturing defects only. Physical damage, misuse, or vandalism is not covered.",
          },
          {
            label: "Maintenance",
            text: "Routine module cleaning (recommended weekly) is in the customer's scope.",
          },
          {
            label: "Timeline",
            text: "Installation within 30–40 working days from advance, as per agreed PO / schedule.",
          },
          {
            label: "Governing Terms",
            text: "Terms not listed here are governed by mutual written agreement.",
          },
          {
            label: "Refunds",
            text: "If applicable: after 2.5% deduction on finalization amount plus documented expenses.",
          },
        ],

    docs: hi
      ? [
          "नवीनतम बिजली बिल (स्पष्ट प्रति)",
          "पैन कार्ड की प्रति",
          "आधार कार्ड की प्रति",
          "स्वामित्व प्रमाण — कर रसीद / विक्रय विलेख",
          "पासपोर्ट आकार का फोटो",
          "हस्ताक्षरित एसएलडी (हमारा ड्राफ्ट)",
        ]
      : [
          "Latest electricity bill (clear copy)",
          "PAN card copy",
          "Aadhaar card copy",
          "Ownership proof — tax receipt / sale deed",
          "Passport-size photograph",
          "Signed SLD (draft provided by us)",
        ],

    safetyNotes: hi
      ? [
          "ACDB / DCDB या इन्वर्टर कवर न खोलें — केवल प्रशिक्षित तकनीशियन।",
          "लाइटनिंग अरेस्टर और अर्थिंग बंधे रखें; अर्थ लीड न काटें।",
          "आइसोलेशन ट्रिप या जलने की गंध तुरंत रिपोर्ट करें; बार-बार रीसेट न करें।",
        ]
      : [
          "Do not open ACDB / DCDB or inverter covers — trained technicians only.",
          "Keep lightning arrestor and earthing bonded; do not disconnect earth leads.",
          "Report isolation trips or burning smell immediately; do not reset repeatedly.",
        ],

    amcObjective: hi
      ? "एएमसी उत्पादन जाँच और सुरक्षा विज़िट को समय पर रखती है।"
      : "AMC keeps generation checks and safety visits on schedule.",

    amcIncludes: hi
      ? [
          "आवधिक प्लांट प्रदर्शन निगरानी",
          "नियमित निवारक रखरखाव",
          "आपातकालीन ब्रेकडाउन (48 कार्य घंटों में)",
          "वारंटी सहायता के लिए ओईएम समन्वय",
        ]
      : [
          "Periodic plant performance monitoring",
          "Routine preventive maintenance",
          "Emergency breakdown (within 48 working hours)",
          "OEM coordination for warranty support",
        ],

    amcExcludes: hi
      ? [
          "भौतिक क्षति, चोरी या तोड़फोड़",
          "बाहरी प्रभाव से मॉड्यूल ग्लास प्रतिस्थापन",
          "डिस्कॉम मीटरिंग शुल्क और सरकारी प्रभार",
        ]
      : [
          "Physical damage, theft, or vandalism",
          "Module glass replacement from external impact",
          "DISCOM metering fees and government charges",
        ],

    clientScope: hi
      ? [
          "साइट सुरक्षा / चौकीदारी",
          "प्लांट का बीमा (यदि वांछित)",
          "मॉनिटरिंग के लिए स्थिर इंटरनेट (जहाँ लागू)",
          "रखरखाव के लिए पानी व सहायक बिजली",
          "ओईएम दिशानिर्देशों के अनुसार नियमित मॉड्यूल सफाई",
          "अनुरोध पर डिस्कॉम / नगरपालिका पत्र",
        ]
      : [
          "Site security / watch and ward",
          "Insurance of plant (if desired)",
          "Stable internet for monitoring (if applicable)",
          "Water and auxiliary power for maintenance",
          "Regular module cleaning per OEM guidelines",
          "DISCOM / municipal letters when requested",
        ],

    amcCommercial: hi
      ? [
          "लागू होने पर शुल्क अग्रिम (अर्धवार्षिक) देय हैं।",
          "न्यूनतम O&M: 2 वर्ष, आपसी सहमति से विस्तार योग्य।",
        ]
      : [
          "When charged, fees are payable in advance (half-yearly).",
          "Minimum O&M: 2 years, extendable by mutual consent.",
        ],

    cover: {
      docType: hi ? "निवेश ब्लूप्रिंट" : "INVESTMENT BLUEPRINT",
      preparedFor: hi ? "के लिए तैयार" : "PREPARED FOR",
      photoTitle: hi
        ? "ऊपर सोलर · नीचे आपका बगीचा"
        : "Solar above · your garden below",
      photoSub: hi
        ? "ऊंची संरचना, दिन की धूप, और छत पर परिवार का आराम — घर की खूबसूरती के साथ"
        : "Elevated structure, daylight on the array, family comfort on the terrace — solar that feels beautiful at home",
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
      tag: hi ? "10 — आपका प्रभाव" : "10 — YOUR IMPACT",
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
      chartTitle: hi
        ? "CO₂ ऑफसेट कैसे बढ़ता है"
        : "How your CO₂ offset grows",
      chartHint: hi
        ? "साल दर साल — आपकी छत की जलवायु बचत"
        : "Year by year — climate savings from your roof",
      meaningTitle: hi
        ? "आसान भाषा में समझें"
        : "What this means in plain words",
      meaningCarTitle: hi ? "कार के साल" : "Car-years avoided",
      meaningCarBody: (yrs: string | number) =>
        hi
          ? `लगभग ${yrs} वर्ष की पेट्रोल कार सड़क से हटाने जितना।`
          : `About ${yrs} years of petrol-car emissions kept off the road.`,
      meaningTreeTitle: hi ? "पेड़ों जैसा असर" : "Like planting trees",
      meaningTreeBody: (n: string | number) =>
        hi
          ? `लगभग ${n} पेड़ लगाने के पारिस्थितिक समकक्ष।`
          : `Ecological equivalent of planting about ${n} trees.`,
      meaningRoofTitle: hi ? "हर दिन स्वच्छ यूनिट" : "Clean units every day",
      meaningRoofBody: hi
        ? "आपकी छत चुपचाप ग्रीन यूनिट बनाती है — बिल और ग्रह दोनों के लिए।"
        : "Your roof quietly makes green units — for your bill and the planet.",
      tagline: hi
        ? "आपकी छत द्वारा उत्पन्न सौर ऊर्जा की हर इकाई जलवायु कार्रवाई का सीधा कार्य है।"
        : "Every unit of solar energy your roof generates is a direct act of climate action.",
    },

    billAudit: {
      tag: hi ? "02 — बिल ऑडिट" : "02 — BILL AUDIT",
      title: hi ? "बिल ऑडिट और ब्रेकडाउन" : "Bill Audit & Breakdown",
      lead: hi
        ? "माह-दर-माह यूनिट, ऊर्जा शुल्क, फिक्स्ड चार्ज, ड्यूटी और कुल बिल।"
        : "Month-by-month units, energy charges, fixed liability, duty and net bill.",
      summerIncrease: hi ? "गर्मी में बिल वृद्धि" : "Summer bill increase",
      summerHint: hi ? "पीक महीनों का असर" : "Impact of peak months",
      fixedLiability: hi ? "वार्षिक फिक्स्ड देनदारी" : "Annual fixed liability",
      fixedHint: hi ? "उपयोग से स्वतंत्र" : "Independent of usage",
      solarSavings: hi ? "अनुमानित सोलर बचत" : "Estimated solar savings",
      solarHint: hi
        ? "ऊर्जा बिल में संभावित कमी"
        : "Potential energy-bill reduction",
      month: hi ? "माह" : "Month",
      units: hi ? "यूनिट" : "Units",
      energy: hi ? "ऊर्जा" : "Energy",
      fixed: hi ? "फिक्स्ड" : "Fixed",
      duty: hi ? "ड्यूटी" : "Duty",
      netBill: hi ? "कुल बिल" : "Net bill",
      total: hi ? "कुल" : "Total",
      chartLabel: hi
        ? "मासिक बिजली बिल प्रोफ़ाइल"
        : "Monthly electricity bill profile",
      footnote: hi
        ? "ऊर्जा शुल्क खपत के साथ बदलता है; फिक्स्ड शुल्क उपयोग कम होने पर भी जारी रह सकता है। ड्यूटी और कुल राशि उपलब्ध बिल डेटा से ली गई है।"
        : "Energy charges vary with consumption; fixed charges may continue even when usage falls. Duty and net totals are taken from the available bill data.",
    },

    finance: {
      tag: hi ? "02 — धन प्रक्षेपण" : "02 — WEALTH PROJECTION",
      title: hi
        ? "आपका पैसा कैसे बढ़ता है"
        : "How your money grows",
      lead: hi
        ? "शुद्ध निवेश, मासिक बचत, और निवेश स्कोर — एक ही नज़र में।"
        : "Net investment, monthly gain, and your investment score — at a glance.",
      todayTag: hi ? "आज · बिना सोलर" : "Today · no solar",
      todayLabel: hi ? "मासिक बिजली बिल" : "Monthly electricity bill",
      todayNote: hi
        ? "~6%/वर्ष बढ़ता है — बिल सिर्फ ऊपर जाता है।"
        : "Rises ~6%/yr — the bill only climbs.",
      tomorrowTag: hi ? "कल · सोलर के साथ" : "Tomorrow · with solar",
      tomorrowLabel: hi ? "मासिक सोलर लागत" : "Monthly solar cost",
      tomorrowNote: hi
        ? "5 वर्ष निश्चित, फिर लगभग शून्य।"
        : "Fixed ~5 years, then near zero.",
      profitTag: hi ? "आपकी बचत" : "Your gain",
      profitLabel: hi ? "दिन 1 से हर महीने" : "Every month from Day 1",
      profitNote: hi
        ? "इतना पैसा जेब में रहता है — तुरंत।"
        : "This much stays with you — starting now.",
      trajectoryTag: hi
        ? "25 वर्ष · बिल की कहानी"
        : "25 years · the bill story",
      trajectoryHint: hi
        ? "नारंगी क्षेत्र = आपकी बचत का अंतर"
        : "Orange band = your savings gap",
      loanEndCue: hi ? "ऋण समाप्त → बिल ≈ 0" : "Loan ends → bill ≈ 0",
      yr: (y: number) => (hi ? `व${y}` : `Y${y}`),
      legendWithout: hi ? "बिना सोलर (बढ़ता बिल)" : "Without solar (rising)",
      legendWith: hi ? "सोलर के साथ (नियंत्रित)" : "With solar (controlled)",
      legendGap: hi ? "मासिक बचत" : "Monthly savings",
      grossCost: hi ? "सकल लागत" : "Gross cost",
      subsidy: hi ? "पीएम सूर्य घर सब्सिडी" : "PM Surya Ghar subsidy",
      netInvestment: hi ? "आपका शुद्ध निवेश" : "Your net investment",
      netCue: hi
        ? "यही राशि मासिक बचत की गणना चलाती है।"
        : "This is the amount that powers the monthly savings math.",
      brandCompareKicker: hi ? "ब्रांड तुलना" : "Brand comparison",
      brandCompareTrack: hi ? "ट्रैक" : "Track",
      brandCompareDcr: "DCR",
      brandCompareNonDcr: "Non-DCR",
      brandCompareSub: (kw: number, track: "dcr" | "non_dcr") =>
        hi
          ? `${kw} kW · ${track === "non_dcr" ? "Non-DCR" : "DCR"} plant gross`
          : `${kw} kW · ${track === "non_dcr" ? "Non-DCR" : "DCR"} plant gross`,
    },

    wealth: {
      tag: hi ? "04 — 25-वर्ष बचत" : "04 — 25-YEAR SAVINGS",
      title: hi
        ? "साल दर साल आपकी बचत कैसे बढ़ती है"
        : "How your savings build year by year",
      lead: hi
        ? "तीन आसान कदम — निवेश → पैसा वापस → फिर बचत आपके पास।"
        : "Three simple steps — invest → money back → then savings stay with you.",
      pathInvest: hi ? "आप लगाते हैं" : "You invest",
      pathPayback: hi ? "पैसा वापस" : "Money back",
      pathKeep: hi ? "आप रखते हैं" : "You keep",
      pathToday: hi ? "आज" : "Today",
      pathBy25: hi ? "वर्ष 25 तक" : "By year 25",
      pathPayoff: hi ? "सिस्टम चुकता" : "System paid off",
      step1Num: "01",
      step2Num: "02",
      step3Num: "03",
      phase1: hi ? "चरण 1" : "Step 1",
      investment: hi ? "सोलर के लिए भुगतान" : "You pay for solar",
      year0To: (n: number) =>
        hi ? `वर्ष 0 → ${n}` : `Year 0 → ${n}`,
      phase1Note: hi
        ? "बिल कम होता रहता है।"
        : "Bills keep getting smaller.",
      milestone: hi ? "चरण 2" : "Step 2",
      payback: hi ? "सोलर चुकता" : "Solar is paid off",
      yearAt: (v: string) => (hi ? `वर्ष ${v}` : `Year ${v}`),
      paybackNote: hi
        ? "अब हर यूनिट आपकी बचत।"
        : "Every unit after this is yours.",
      phase2: hi ? "चरण 3" : "Step 3",
      passiveIncome: hi ? "बचत आपका पैसा" : "Savings become yours",
      yearRange: (from: number) =>
        hi ? `वर्ष ${from} → 25` : `Year ${from} → 25`,
      passiveWealth: (amt: string) =>
        hi ? `लगभग ${amt} और।` : `About ${amt} more.`,
      pureWealth: hi ? "बचत बढ़ती रहती है।" : "Savings keep growing.",
      zeroEnergy: hi ? "पैसा घर में।" : "Money stays home.",
      chartTitle: hi
        ? "साल दर साल आपकी बचत"
        : "Your savings year by year",
      chartHint: hi
        ? "बड़ी पट्टी = ज़्यादा बचत"
        : "Taller bar = more saved",
      chartNote: hi
        ? "आज के बिल स्तर पर अनुमान।"
        : "Estimate at today’s bill level.",
      withoutSolar: hi
        ? "बिना सोलर — ग्रिड को"
        : "Without solar — to the grid",
      withSolar: hi
        ? "सोलर के साथ — आपके पास"
        : "With solar — you keep",
      paidToGrid: hi
        ? "बिलों में चला जाता"
        : "paid in bills",
      yrShort: (y: number) => (hi ? `वर्ष ${y}` : `Year ${y}`),
      scoreTag: hi
        ? "सौर निवेश स्कोर"
        : "SOLAR INVESTMENT SCORE",
      paybackLabel: hi ? "पैसा वापस" : "Money back",
      annualRoi: hi ? "सालाना रिटर्न" : "Yearly return",
      yrsShort: hi ? "वर्ष" : "yrs",
      basis: hi ? "AA+ क्यों:" : "Why AA+:",
      basisText: (pb: string) =>
        hi
          ? `आपका पैसा लगभग ${pb} वर्षों में वापस। कई घरों में 5–7 वर्ष लगते हैं।`
          : `Your money returns in about ${pb} years. Many homes take 5–7 years.`,
      totalWealthTag: hi
        ? "25वें वर्ष तक कुल बचत"
        : "TOTAL SAVINGS BY YEAR 25",
      returnsNote: (inv: string, mult: string) =>
        hi
          ? `आपका ₹${inv} → लगभग ${mult} (25 वर्ष)।`
          : `Your ₹${inv} → about ${mult} in 25 years.`,
      takeaway: (pb: string, freeYrs: string) =>
        hi
          ? `~${pb} वर्ष में पेबैक → फिर ~${freeYrs} वर्ष बिल बचत।`
          : `Payback in ~${pb} years — then ~${freeYrs} years of bill savings.`,
      expertTag: hi
        ? "विशेषज्ञ सलाह · ईपीसी इंजीनियरिंग"
        : "EXPERT ADVICE · EPC ENGINEERING",
      expertBody: (city: string) =>
        hi
          ? `डिस्कॉम टैरिफ आमतौर पर ~5–6%/वर्ष बढ़ता है, जबकि टियर-1 मॉड्यूल सिर्फ ~0.4%/वर्ष degrad होते हैं — वर्ष 20 पर भी उत्पादन लगभग ~92% रहता है। यही अंतर पेबैक के बाद धन को तेज़ बढ़ाता है। हम ${city} के लिए झुकाव, स्ट्रिंगिंग और परफॉर्मेंस रेशियो डिज़ाइन करते हैं — ताकि यह प्रक्षेपण इंजीनियरिंग पर टिका हो, अनुमान पर नहीं।`
          : `DISCOM tariffs typically rise ~5–6%/year, while tier-1 modules degrade only ~0.4%/year — so Year 20 still delivers ~92% of Year-1 output. That widening gap is why wealth accelerates after payback. We engineer tilt, stringing, and performance ratio for ${city} — so this projection is design-backed, not a brochure guess.`,
      expertAttr: (name: string) =>
        hi ? `— ${name} डिज़ाइन डेस्क` : `— ${name} Design Desk`,
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
      tiltUnit: hi ? "झुकाव" : "tilt",
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

    genForecast: {
      tag: hi
        ? "06 — मासिक उत्पादन पूर्वानुमान"
        : "06 — MONTHLY GENERATION FORECAST",
      title: hi
        ? "मासिक उत्पादन पूर्वानुमान"
        : "Monthly generation forecast",
      lead: hi
        ? "जनवरी–दिसंबर अनुमानित यूनिट और बचत — गर्मी/मानसून का अंतर साफ़ दिखे।"
        : "Jan–Dec estimated units and savings — summer vs monsoon at a glance.",
      leadBill: hi
        ? "सोलर उत्पादन के साथ आपके अपलोड किए बिल की यूनिट — महीने दर महीने तुलना।"
        : "Solar generation beside your uploaded bill units — month-by-month comparison.",
      legendGen: hi ? "सोलर उत्पादन" : "Solar generation",
      legendBill: hi ? "बिल यूनिट" : "Bill units",
      chartAriaDual: hi
        ? "मासिक सोलर उत्पादन और बिल यूनिट"
        : "Monthly solar generation and bill units",
      noBillMonth: hi
        ? "इस महीने का बिल उपलब्ध नहीं"
        : "No bill for this month",
      billNote: hi
        ? "नीले बार = अपलोड किए बिल की यूनिट। नारंगी = अनुमानित सोलर उत्पादन।"
        : "Blue bars = units from your uploaded bills. Orange = estimated solar generation.",
      annualGen: hi ? "वार्षिक उत्पादन" : "Annual generation",
      annualGenHint: hi
        ? "वर्ष भर का अनुमानित योग।"
        : "Estimated total across the year.",
      annualSavings: hi ? "वार्षिक बचत" : "Annual savings",
      annualSavingsHint: hi
        ? "वर्ष-1 अनुमानित बिल बचत।"
        : "Year-1 estimated bill savings.",
      unitsLabel: hi ? "अनुमानित यूनिट" : "Est. units",
      savingsLabel: hi ? "अनुमानित बचत" : "Est. savings",
      savingsBasis: (rate: string) =>
        hi
          ? `अनुमानित बचत = मासिक यूनिट × ₹${rate}/यूनिट प्रभावी बचत दर। फिक्स्ड चार्ज शामिल नहीं हैं।`
          : `Estimated savings = monthly units × ₹${rate}/unit effective saving rate. Fixed charges excluded.`,
      peakNote: hi
        ? "अप्रैल–जून गर्मियों के पीक महीने"
        : "Apr–Jun summer peak months",
      expertTag: hi
        ? "मौसमी भिन्नता क्यों मायने रखती है"
        : "Why seasonal variation matters",
      expertBody: hi
        ? "उत्पादन स्थानीय विकिरण प्रोफ़ाइल पर आधारित अनुमान है। गर्मी में ऊँचा उत्पादन अक्सर ऊँचे बिल महीनों से मेल खाता है — बचत का मुख्य इंजन।"
        : "Generation uses a regional irradiance profile. Higher summer output often aligns with peak bill months — that overlap drives most of the savings.",
    },

    hw: {
      tag: hi ? "07 — हार्डवेयर विश्वास" : "07 — HARDWARE TRUST",
      title: hi
        ? "टियर-1 घटक। शून्य समझौता।"
        : "Tier-1 Components. Zero Compromise.",
      lead: hi
        ? "पैनल से सुरक्षा तक — हर हिस्सा टियर-1। नीचे अर्थिंग व लाइटनिंग की संख्या भी साफ़ दिखती है।"
        : "From panels to protection — every part is tier-1. Earthing and lightning counts are called out below.",
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
        ? "एमसीबी/एमसीसीबी व सर्ज प्रोटेक्शन (एसपीडी) — ग्रिड फॉल्ट व सर्ज से सिस्टम की सुरक्षा। अर्थिंग नीचे अलग दिखी है।"
        : "MCB/MCCB and surge protection (SPD) — guards the system against grid faults and surges. Earthing is shown separately below.",
      viewDatasheet: hi ? "डेटाशीट देखें" : "View Datasheet",
      yrs: hi ? "वर्ष" : "YRS",
      earthTag: hi
        ? "अर्थिंग व लाइटनिंग सुरक्षा"
        : "EARTH & LIGHTNING PROTECTION",
      earthLead: hi
        ? "घर और प्लांट के लिए बंधी अर्थिंग — मात्रा साफ़।"
        : "Bonded earth for home and plant — quantities are clear.",
      earthKitsVal: hi ? "3 सेट" : "3 sets",
      earthKitsLabel: hi
        ? "17 मिमी मेंटेनेंस-फ्री अर्थिंग किट"
        : "17 mm maintenance-free earthing kits",
      earthCableVal: "4 sqmm",
      earthCableLabel: hi
        ? "कॉपर अर्थिंग केबल"
        : "Copper earthing cable",
      earthLaVal: hi ? "1 × 2 मी" : "1 × 2 m",
      earthLaLabel: hi ? "लाइटनिंग अरेस्टर" : "Lightning arrester",
      earthWhy: hi
        ? "आईएस 3043 शैली बंधी अर्थ + अरेस्टर — मानसून व लाइटनिंग के लिए सुरक्षा का आधार।"
        : "IS 3043-style bonded earth + arrester — the safety base for monsoon and lightning.",
    },

    trust: {
      tag: (brand: string) =>
        hi ? `08 — क्यों ${brand}` : `08 — WHY ${brand}`,
      title: hi
        ? "क्योंकि आपकी छत को केवल सर्वोत्तम पैनल नहीं, सर्वोत्तम टीम चाहिए।"
        : "Because Your Rooftop Deserves the Best Team, Not Just the Best Panel.",
      cards: [
        {
          icon: "installs" as const,
          num: "500+",
          label: hi ? "पूर्ण स्थापनाएँ" : "Installations Completed",
          note: hi
            ? "मध्य प्रदेश व पड़ोसी राज्यों में"
            : "Across Madhya Pradesh & neighbouring states",
        },
        {
          icon: "engineers" as const,
          num: "100%",
          label: hi ? "प्रमाणित इंजीनियर" : "Certified Engineers",
          note: hi
            ? "एमएनआरई-एम्पैनल्ड डिज़ाइन व इंस्टॉल टीम"
            : "MNRE-empanelled design & install team",
        },
        {
          icon: "local" as const,
          num: hi ? "स्थानीय" : "Local",
          label: hi ? "ऑन-ग्राउंड सेवा" : "On-Ground Service",
          note: hi
            ? "कोई कॉल सेंटर नहीं — आपका इंस्टॉलर आपका पड़ोसी है"
            : "No call centres — your installer is your neighbour",
        },
        {
          icon: "support" as const,
          num: hi ? "48 घं" : "48 Hr",
          label: hi ? "सहायता प्रतिक्रिया" : "Support Response",
          note: hi
            ? "किसी भी दोष पर 2 कार्य दिवसों में उपस्थिति"
            : "Any fault attended within 2 working days",
        },
        {
          icon: "subsidy" as const,
          num: "100%",
          label: hi ? "सब्सिडी सहायता" : "Subsidy Assistance",
          note: hi
            ? "एंड-टू-एंड पीएम सूर्य घर कागजी प्रक्रिया, आपके लिए"
            : "End-to-end PM Surya Ghar paperwork, done for you",
        },
        {
          icon: "years" as const,
          num: hi ? "25 वर्ष" : "25 Yr",
          label: hi
            ? "परफॉर्मेंस प्रतिबद्धता"
            : "Performance Commitment",
          note: hi
            ? "हमारे द्वारा स्थापित हर पैनल के पीछे हम खड़े हैं"
            : "We stand behind every panel we install",
        },
      ],
      photoTitle: hi
        ? "प्रीमियम छत · इंजीनियर डिज़ाइन"
        : "Premium rooftops · engineered design",
      photoSub: hi
        ? "लक्ज़री घरों के लिए स्ट्रक्चर, स्ट्रिंगिंग और यील्ड — डिज़ाइन डेस्क से।"
        : "Structure, stringing, and yield planned for luxury homes — from our design desk.",
      quote: hi
        ? "“हम केवल सौर सिस्टम नहीं बेचते — हम 25-वर्ष के संबंध इंजीनियर करते हैं। हर स्थापना एक स्थानीय टीम द्वारा समर्थित है जो पहुँच योग्य, जवाबदेह है और स्थापना दिन के बहुत बाद भी आपके सिस्टम के प्रदर्शन में निवेशित है।”"
        : "“We don't just sell solar systems — we engineer 25-year relationships. Every installation is backed by a local team that's reachable, accountable, and invested in your system's performance long after installation day.”",
      quoteAttr: (brand: string) =>
        hi
          ? `— ${brand} इंजीनियरिंग टीम`
          : `— ${brand} Engineering Team`,
      expertTag: hi
        ? "विशेषज्ञ सलाह · डिज़ाइन इंजीनियरिंग"
        : "EXPERT ADVICE · DESIGN ENGINEERING",
      expertAttr: (brand: string) =>
        hi ? `— ${brand} डिज़ाइन डेस्क` : `— ${brand} Design Desk`,
      expertBody: (city: string, brand: string) =>
        hi
          ? `${brand} केवल कैटलॉग किट नहीं लगाता। हर प्रोजेक्ट पर हम ${city} के लिए विंड लोड (IS 875), स्ट्रिंग वोल्टेज, शैडो लॉस और परफॉर्मेंस रेशियो मॉडल करते हैं — ताकि यील्ड अनुमान कागज़ पर नहीं, छत पर साबित हो। यही इन-हाउस इंजीनियरिंग आपको सामान्य इंस्टॉलर से अलग विक्रेता देती है।`
          : `${brand} does not drop a catalogue kit on your roof. On every project we model wind load (IS 875), string voltage, shade loss, and performance ratio for ${city} — so yield is proven on the terrace, not just on paper. That in-house engineering is what sets this vendor apart from a typical installer.`,
    },

    roof: {
      tag: hi ? "03 — छत बुद्धिमत्ता" : "03 — ROOF INTELLIGENCE",
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
      blueprintTitle: hi
        ? "इंजीनियरिंग ब्लूप्रिंट (System Architecture)"
        : "Engineering Blueprint (System Architecture)",
      blueprintArray: hi
        ? "इष्टतम दक्षिण-मुखी ऐरे"
        : "Optimal South-Facing Array",
      blueprintTiltLine: hi
        ? "टिल्ट: {tilt}° | अज़ीमुथ: 180° (True South)"
        : "Tilt: {tilt}° | Azimuth: 180° (True South)",
      blueprintShowing: hi
        ? "दृश्य {shown}/{total}"
        : "showing {shown}/{total}",
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
      areaVal: (sqft: number) =>
        hi ? `~${sqft.toLocaleString("en-IN")} वर्ग फुट` : `~${sqft.toLocaleString("en-IN")} sq ft`,
      areaNote: (wp: number, perPanel: number) =>
        hi
          ? `${wp} Wp · लगभग ${perPanel} वर्ग फुट / पैनल`
          : `${wp} Wp · ~${perPanel} sq ft / panel`,
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
        ? "11 — शर्तें व अनुपालन"
        : "11 — TERMS & COMPLIANCE",
      tag11: hi
        ? "12 — शर्तें व अनुपालन (जारी)"
        : "12 — TERMS & COMPLIANCE (CONTD.)",
      title: hi ? "नियम व शर्तें" : "Terms & Conditions",
      intro1: hi
        ? "साइन करने से पहले प्रत्येक बिंदु ध्यान से पढ़ें।"
        : "Please read each point carefully before signing.",
      intro2: hi
        ? "सुरक्षा, आपकी ज़िम्मेदारियाँ, AMC स्कोप और रखरखाव लागत — एक के बाद एक।"
        : "Safety, your duties, AMC scope, and maintenance cost — one section after another.",
      general: hi ? "01 · सामान्य शर्तें" : "01 · General Terms",
      documents: hi ? "02 · आवश्यक दस्तावेज़" : "02 · Documents Required",
      safety: hi ? "03 · सुरक्षा और सुरक्षात्मक उपाय" : "03 · Safety & Protection",
      clientScope: hi ? "04 · ग्राहक का दायरा" : "04 · Client's Scope",
      amcScope: hi ? "05 · वार्षिक रखरखाव — स्कोप" : "05 · Annual Maintenance — Scope",
      costMaint: hi ? "06 · रखरखाव की लागत" : "06 · Cost of Maintenance",
      availablePlans: hi ? "उपलब्ध योजनाएँ:" : "Available plans:",
      amcIncludes: hi ? "AMC में शामिल:" : "AMC includes:",
      amcExcludes: hi ? "AMC में शामिल नहीं:" : "AMC does not include:",
      paymentNotes: hi ? "भुगतान और अनुबंध नोट:" : "Payment & contract notes:",
      year1Included: hi
        ? "पहला 1 वर्ष AMC उद्धृत कीमत में शामिल है।"
        : "First 1 year AMC is included in the quoted price.",
      year2Onwards: hi
        ? "वर्ष 2 से वार्षिक रखरखाव इनवॉइस मूल्य का 2% हो सकता है, 5% वार्षिक वृद्धि के साथ, हस्ताक्षरित O&M समझौते पर।"
        : "From Year 2 onwards, annual maintenance may be charged at 2% of invoice value with 5% year-on-year escalation, subject to a signed O&M agreement.",
      regards: hi ? "सादर," : "Regards,",
      vendorTag: hi ? "विक्रेता" : "Vendor",
      counselLabel: hi ? "अनुपालन सलाहकार का नोट" : "COMPLIANCE COUNSEL'S NOTE",
      counsel: hi
        ? "साइन से पहले प्रत्येक लेख पढ़ें — वारंटी, शुल्क और आपके कर्तव्य दोनों पक्षों की रक्षा करते हैं।"
        : "Read each article before signing — warranties, fees, and your duties protect both sides if DISCOM timing or site conditions change.",
      omLabel: hi ? "O&M सलाहकार का निष्कर्ष" : "O&M ADVISOR'S VERDICT",
      om: hi
        ? "वर्ष-1 AMC शामिल है; वर्ष 2 से इनवॉइस का लगभग 2% बजट वार्षिक वृद्धि के साथ — नियमित देखभाल उत्पादन और वारंटी दोनों बचाती है।"
        : "Year-1 AMC is included; from Year 2, budget about 2% of invoice with yearly increase — regular care protects both generation and warranty.",
    },

    closing: {
      tag: hi
        ? "13 — ऊर्जा स्वतंत्रता"
        : "13 — ENERGY INDEPENDENCE",
      congrats: hi ? "बधाई हो।" : "Congratulations.",
      statement1: hi
        ? "आज आप सौर पैनल नहीं खरीद रहे।"
        : "Today you are not buying solar panels.",
      statement2: hi
        ? "आप अगले 25 वर्षों के लिए अपनी बिजली कीमत लॉक कर रहे हैं।"
        : "You are locking your electricity price for the next 25 years.",
      sub: hi
        ? "हर दिन सूरज उगता है, आपकी छत कमाती है। हर महीने आपका मीटर पीछे घूमता है। हर साल आपका धन बढ़ता है।"
        : "Every day the sun rises, your roof earns. Every month your meter spins backward. Every year your wealth compounds.",
      photoTitle: hi
        ? "आरसीसी छत · प्रीमियम सोलर"
        : "RCC rooftop · premium solar",
      photoSub: hi
        ? "भारतीय लग्ज़री घर की छत — साफ़ आरसीसी स्लैब पर लगे मॉड्यूल, घर की सुंदरता के साथ ऊर्जा स्वतंत्रता।"
        : "An Indian luxury home — clean RCC slab, precise modules, energy independence that looks beautiful from above.",
      unitsYear: hi ? "यूनिट / वर्ष" : "units / year",
      savedYear: hi ? "बचत / वर्ष" : "saved / year",
      wealth25: hi ? "25-वर्ष धन" : "25-yr wealth",
      ctaTitle: hi
        ? "अपनी सौर यात्रा शुरू करने के लिए तैयार?"
        : "Ready to Begin Your Solar Journey?",
      ctaDesc: hi
        ? "आज अपनी बिजली कीमत लॉक करें। यह प्रस्ताव आपकी छत के लिए कस्टम-इंजीनियर है।"
        : "Lock your electricity price today. This proposal is custom-engineered for your roof.",
      ctaBtn: hi ? "आइए शुरू करें →" : "Let's Begin →",
      validity: hi
        ? "15 दिनों के लिए मान्य। जब आप तैयार हों, हम तैयार हैं।"
        : "Valid for 15 days. We are ready when you are.",
    },
  };
}

export type AtelierCopy = ReturnType<typeof getAtelierCopy>;
