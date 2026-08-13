/**
 * Canvas — EN / Hindi UI copy.
 */

export type CanvasLang = "en" | "hi";

export function getCanvasCopy(lang: CanvasLang) {
  const hi = lang === "hi";
  return {
    print: {
      downloadPdf: hi ? "PDF डाउनलोड" : "Download PDF",
      langEn: "EN",
      langHi: "हिंदी",
    },
    cover: {
      brandFallback: "HARIHAR SOLAR",
      eyebrow: hi ? "निजी ऊर्जा पोर्टफोलियो" : "Private Energy Portfolio",
      subtitle: hi
        ? "प्रीमियम रूफटॉप आर्किटेक्चर"
        : "Premium Rooftop Architecture",
      heroAlt: hi
        ? "लक्ज़री भारतीय छत — सोलर प्लांट, मिनी गार्डन और बच्चे"
        : "Luxury Indian rooftop with solar plant, mini garden, and children",
      capacity: hi ? "सिस्टम क्षमता" : "System Capacity",
      yield: hi ? "वार्षिक उत्पादन अनुमान" : "Annual Yield Est.",
      impact: hi ? "पारिस्थितिक प्रभाव" : "Ecological Impact",
    },
    pages: {
      bill: hi ? "बिल ऑडिट और ब्रेकडाउन" : "Bill Audit & Breakdown",
      billLead: hi
        ? "माह-दर-माह यूनिट, ऊर्जा शुल्क, फिक्स्ड चार्ज, ड्यूटी और कुल बिल।"
        : "Month-by-month units, energy charges, fixed liability, duty and net bill.",
      requirement: hi ? "आवश्यकता" : "Requirement",
      requirementLead: hi
        ? "प्रस्तावित AC क्षमता, DC ऐरे, कवरेज और छत की आवश्यकता।"
        : "Proposed AC capacity, DC array, coverage and roof requirement.",
      financial: hi ? "Financial Story" : "Financial Story",
      financialLead: hi
        ? "बिल घटे → अनुमानित मासिक बचत → फिर साल और 25-वर्ष का नतीजा।"
        : "Bill drops → estimated monthly savings → then year-one and 25-year outcome.",
      billSection: hi ? "मासिक बिल कैसे बदलेगा" : "How your monthly bill changes",
      billHint: hi
        ? "आज का बिल सोलर के बाद गिरता है — अंतर आपकी अनुमानित मासिक बचत है।"
        : "Today’s bill falls after solar — the gap is your estimated monthly savings.",
      timeSection: hi ? "समय के साथ" : "Over time",
      outcomeSection: hi ? "निवेश का नतीजा" : "Investment outcome",
      outcomeHint: hi
        ? "नेट भुगतान बनाम 25 वर्षों का अनुमानित शुद्ध लाभ (बचत − निवेश)।"
        : "Net payable versus estimated 25-year net benefit (savings − investment).",
      immediateProfit: hi ? "अनुमानित मासिक बचत" : "Estimated Monthly Savings",
      netGainHint: hi ? "दिन 1 से अनुमानित मासिक बचत" : "Estimated monthly savings from day 1",
      today: hi ? "आज का बिल" : "Today’s bill",
      afterSolar: hi ? "सोलर के बाद" : "After solar",
      monthlyProfit: hi ? "अनुमानित मासिक बचत" : "Estimated monthly savings",
      investment: hi ? "निवेश योजना" : "Investment plan",
      investmentLead: hi
        ? "सकल में से सब्सिडी घटे — फिर EMI या रिटर्न साफ़ दिखें।"
        : "See subsidy come off gross — then returns and EMI options at a glance.",
      costSection: hi ? "आपकी लागत" : "Your cost",
      equationHint: hi
        ? "सकल − सब्सिडी = आपका वास्तविक भुगतान (पेबैक इसी पर)। राशियाँ निकटतम ₹0.1L तक पूर्णांकित हो सकती हैं।"
        : "Gross − Subsidy = what you actually pay (payback baseline). Figures may round to the nearest ₹0.1L.",
      returnsSection: hi ? "रिटर्न स्नैपशॉट" : "Return snapshot",
      financeSection: hi ? "फाइनेंसिंग · मासिक EMI" : "Financing · Monthly EMI",
      financeSectionLead: hi
        ? "नेट लागत पर ऋण अवधि — अनुमानित EMI (~7% p.a. ब्याज मानकर)। वास्तविक दर बैंक/NBFC पर निर्भर।"
        : "Loan tenures on your net cost — estimated EMI (assumes ~7% p.a.). Final rate depends on the lender.",
      assumptionsSection: hi ? "मुख्य अनुमान" : "Key assumptions",
      emiUnit: hi ? "/ महीना" : "/ month",
      gross: hi ? "सकल" : "Gross",
      subsidy: hi ? "सब्सिडी" : "Subsidy",
      youPay: hi ? "आप चुकाएँगे" : "You pay",
      payback: hi ? "पेबैक" : "Payback",
      wealth: hi ? "25-Year Returns" : "25-Year Returns",
      wealthLead: hi
        ? "संचयी बचत और निवेश के बाद शुद्ध लाभ — अलग-अलग दिखाया गया।"
        : "Cumulative savings versus net benefit after investment — shown separately.",
      investScore: hi ? "अनुमानित रिटर्न गुणक" : "Estimated return multiple",
      investScoreValue: (multiple: string) =>
        multiple !== "—" ? `~${multiple}× net outlay` : "—",
      investScoreInsight: (netLakh: string, multiple: string) =>
        hi
          ? `₹${netLakh}L नेट निवेश पर ~${multiple}× अनुमानित 25-वर्ष शुद्ध लाभ (टैरिफ वृद्धि ~6%/वर्ष मानकर)। यह स्कोर नहीं — गणना-आधारित अनुपात है।`
          : `About ${multiple}× your ₹${netLakh}L net outlay as estimated 25-year net benefit (≈6%/yr tariff escalation). Not a credit score — a calculated ratio.`,
      cumulativeSavingsLabel: hi
        ? "25-वर्ष संचयी बचत"
        : "25-Year Cumulative Savings",
      netBenefitLabel: hi ? "25-वर्ष शुद्ध लाभ" : "25-Year Net Benefit",
      cumulativeSavingsHint: hi
        ? "अनुमानित बिल बचत का योग (निवेश घटाने से पहले)।"
        : "Sum of estimated bill savings before subtracting your investment.",
      netBenefitHint: hi
        ? "संचयी बचत − नेट भुगतान (आपका वास्तविक आर्थिक लाभ)।"
        : "Cumulative savings − net payable (your economic gain).",
      generation: hi ? "मासिक उत्पादन पूर्वानुमान" : "Monthly generation forecast",
      generationLead: hi
        ? "जनवरी–दिसंबर अनुमानित यूनिट और बचत — गर्मी/मानसून का अंतर साफ़ दिखे।"
        : "Jan–Dec estimated units and savings — summer vs monsoon at a glance.",
      genInsightTitle: hi
        ? "मौसमी भिन्नता क्यों मायने रखती है"
        : "Why seasonal variation matters",
      genInsightBody: hi
        ? "उत्पादन स्थानीय विकिरण प्रोफ़ाइल पर आधारित अनुमान है। गर्मी में ऊँचा उत्पादन अक्सर ऊँचे बिल महीनों से मेल खाता है — बचत का मुख्य इंजन।"
        : "Generation uses a regional irradiance profile. Higher summer output often aligns with peak bill months — that overlap drives most of the savings.",
      requirementInsightTitle: hi
        ? "यह सिस्टम आकार क्यों"
        : "Why this system size",
      requirementInsightBody: hi
        ? "AC क्षमता, DC मॉड्यूल ऐरे, लक्ष्य लोड कवरेज और अनुमानित छत क्षेत्र मिलकर शुरुआती सिस्टम आवश्यकता तय करते हैं। अंतिम लेआउट साइट सर्वे, छाया और उपलब्ध छत के बाद तय होगा।"
        : "AC capacity, DC module array, target load coverage and estimated roof area define the initial system requirement. Final layout is confirmed after the site survey, shading review and roof measurement.",
      genUnitsLabel: hi ? "अनुमानित यूनिट" : "Est. units",
      genSavingsLabel: hi ? "अनुमानित बचत" : "Est. savings",
      hardware: hi ? "Hardware Trust" : "Hardware Trust",
      hardwareLead: hi
        ? "टियर-1 पार्ट्स — प्रमाण, वारंटी, और उपज।"
        : "Tier-1 parts — proven, warranted, and built for yield.",
      hwInsightTitle: hi
        ? "टियर-1 क्यों मायने रखता है"
        : "Why Tier-1 matters",
      hwInsightBody: hi
        ? "मॉड्यूल और इन्वर्टर का ब्रांड दीर्घकालिक उपज और सर्विस नेटवर्क तय करता है। साथ ही ACDB/DCDB सुरक्षा बॉक्स सर्ज, ओवर-करंट और लाइटनिंग से पूरे सिस्टम को बचाते हैं — हम केवल वे पार्ट्स लगाते हैं जिनकी वारंटी और स्पेयर भारत में आसानी से उपलब्ध हैं।"
        : "Module and inverter brand set long-term yield and service reach, while the ACDB/DCDB protection boxes guard the whole system against surges, over-current and lightning. We specify parts with warranties and spare availability across India.",
      billInsightTitle: hi ? "बिल में क्या छिपा है" : "What the bill is telling you",
      billInsightBody: hi
        ? "गर्मी के पीक महीने औसत बिल को ऊपर खींचते हैं। सोलर का उत्पादन भी इन्हीं महीनों में ऊँचा होता है — इसलिए बचत सिर्फ औसत पर नहीं, सबसे महंगे महीनों पर लगती है।"
        : "Summer peak months pull the average bill up. Solar generation peaks in those same months — so savings hit hardest when electricity is most expensive.",
      investInsightTitle: hi ? "नेट लागत कैसे पढ़ें" : "How to read net cost",
      investInsightBody: hi
        ? "सकल कीमत में हार्डवेयर + इंस्टॉल शामिल है। सब्सिडी घटने के बाद जो राशि बचती है, वही आपकी वास्तविक निवेश आधार-रेखा है — पेबैक इसी आंकड़े पर चलता है।"
        : "Gross includes hardware and install. After subsidy, the remainder is your true investment baseline — payback is measured against that number alone.",
      financeInsightTitle: hi ? "दिन-1 बचत क्यों मायने रखती है" : "Why day-1 savings matter",
      financeInsightBody: hi
        ? "अनुमानित मासिक बचत EMI अवधि में भी कैश-फ्लो को सहारा देती है। बचत स्थिर रहे तो पेबैक के बाद हर यूनिट अतिरिक्त लाभ बनती है।"
        : "Estimated monthly savings support cash flow even during an EMI period. After payback, each unit is incremental gain — not a guaranteed profit rate.",
      wealthInsightTitle: hi ? "दो आंकड़े क्यों अलग हैं" : "Why two figures are shown",
      wealthInsightBody: hi
        ? "संचयी बचत कुल बिल राहत है; शुद्ध लाभ = बचत − नेट निवेश। चार्ट ~6%/वर्ष टैरिफ वृद्धि मानकर बनता है — वास्तविक बिल/टैरिफ से परिणाम बदल सकते हैं।"
        : "Cumulative savings is total bill relief; net benefit = savings − net investment. The chart assumes ~6%/yr tariff escalation — actual bills and tariffs can change results.",
      impactInsightTitle: hi ? "एक्सपर्ट इनसाइट" : "Expert Insight",
      impactInsightBody: hi
        ? "यह केवल मार्केटिंग के आंकड़े नहीं हैं। आपके द्वारा बनाई गई हर 1 यूनिट बिजली का मतलब है कि पावर ग्रिड में कोयला कम जलाया जा रहा है। आप सिर्फ ऊर्जा नहीं बचा रहे, आप एक सुरक्षित भविष्य का निर्माण कर रहे हैं।"
        : "These are not just marketing figures. Every unit your roof generates means less coal burned on the grid. You are not only saving energy — you are building a safer future.",
      impactEyebrow: hi ? "पारिस्थितिक लाभांश" : "Ecological dividend",
      impactTitle: hi
        ? "बिजली से आगे का उपहार।"
        : "A Gift Beyond Electricity.",
      impactSubtitle: hi
        ? "आपकी छत का पारिस्थितिकी तंत्र चुपचाप ग्रह के लिए काम करता है। सोलर की हर यूनिट जलवायु कार्रवाई है — अगली पीढ़ी के लिए साफ़ हवा।"
        : "Your rooftop ecosystem works silently for the planet. Every unit of solar energy generated is a direct act of climate action, ensuring cleaner air for the next generation.",
      co2Heading: hi
        ? "आजीवन CO₂ समाप्त"
        : "Lifetime CO₂ Eliminated",
      co2Body: hi
        ? "अनुमानित ग्रिड उत्सर्जन कारक (~0.82 kg/kWh) × 25 वर्ष उत्पादन। संकेतक समतुल्य — साइट और ग्रिड मिश्रण से भिन्न हो सकता है।"
        : "Estimated from grid emission factor (~0.82 kg/kWh) × 25-year generation. An indicative equivalent — site and grid mix can vary.",
      treesHeading: hi
        ? "समतुल्य कार्बन अवशोषण"
        : "Equivalent Carbon Absorption",
      treesBody: hi
        ? "अनुमान: ~0.82 kg CO₂/kWh और ~22 kg CO₂/वृक्ष-वर्ष। यह वृक्षारोपण का वादा नहीं — कार्बन अवशोषण का समकक्ष माप है।"
        : "Estimate uses ~0.82 kg CO₂/kWh and ~22 kg CO₂ per tree-year. Not a planting pledge — an equivalent carbon-absorption measure.",
      cleanEnergyLabel: hi ? "वार्षिक स्वच्छ ऊर्जा" : "Annual clean energy",
      firstYearSavingsLabel: hi
        ? "पहले वर्ष की वित्तीय बचत"
        : "First year financial savings",
      tonsUnit: hi ? "टन" : "Tons",
      treesUnit: hi ? "वृक्ष" : "Trees",
      impact: hi ? "प्रभाव" : "Impact",
      impactLead: hi ? "स्वच्छ ऊर्जा का माप।" : "Clean generation, measured.",
      co2: hi ? "CO₂ बचत" : "CO₂ avoided",
      trees: hi ? "वृक्ष समकक्ष" : "Tree equivalent",
      engInsightTitle: hi ? "साइट मेट्रिक्स क्यों सुरक्षित हैं" : "Why site metrics protect yield",
      engInsightBody: hi
        ? "हमने सिस्टम को ~1.04 DC/AC अनुपात पर डिज़ाइन किया है — कम धूप में भी इन्वर्टर अधिकतम क्षमता के पास चलता है, जिससे साल भर उत्पादन स्थिर रहता है।"
        : "We designed around a ~1.04 DC/AC ratio so the inverter stays near capacity on low-sun days — keeping annual yield steadier through winter and monsoon.",
      warrantyInsightTitle: hi ? "वारंटी कैसे पढ़ें" : "How to read warranty",
      warrantyInsightBody: hi
        ? "प्रदर्शन वारंटी उपज गारंटी देती है; उत्पाद वारंटी हार्डवेयर दोष कवर करती है। दोनों का मिलान ब्रांड + इंस्टॉलर कार्य निष्पादन से होता है।"
        : "Performance warranty guards yield; product warranty covers hardware faults. Both should align with brand terms plus installer workmanship.",
      execInsightTitle: hi ? "माइलस्टोन अनुशासन" : "Milestone discipline",
      execInsightBody: hi
        ? "भुगतान चरणों को साइट प्रगति से जोड़ें — सर्वे, सामग्री पहुँच, इंस्टॉल, कमीशनिंग। इससे दोनों पक्षों के लिए जोखिम कम और समय-सारणी स्पष्ट रहती है।"
        : "Tie payment stages to site progress — survey, material delivery, install, commissioning. That keeps risk low and the timeline honest for both sides.",
      engineering: hi ? "इंजीनियरिंग" : "Engineering",
      engineeringLead: hi
        ? "साइट मेट्रिक्स और मानक।"
        : "Site metrics and standards.",
      warranty: hi ? "वारंटी" : "Warranty",
      warrantyLead: hi ? "कवरेज एक नज़र में।" : "Coverage at a glance.",
      execution: hi ? "निष्पादन" : "Execution",
      executionLead: hi ? "सर्वे से गो-लाइव।" : "From survey to go-live.",
      payment: hi ? "भुगतान और नियम" : "Payment & terms",
      paymentLead: hi ? "माइलस्टोन अनुसूची और शर्तें।" : "Milestone schedule and conditions.",
      closing: hi ? "बधाई" : "Congratulations",
      closingEyebrow: hi ? "अंतिम कदम" : "The final step",
      closingTitle: hi ? "ऊर्जा स्वतंत्रता," : "Energy Independence,",
      closingTitleLock: hi
        ? "दशकों के लिए इंजीनियर।"
        : "Engineered for Decades.",
      closingSubtitle: (city: string) =>
        hi
          ? `जब सूरज ${city} पर चमकता है, आपकी छत अनुमानित यूनिट बनाती है। बचत वास्तविक खपत पर निर्भर करती है — यह ब्लूप्रिंट खर्च घटाने और ग्रिड निर्भरता तोड़ने का रास्ता है।`
          : `When the sun shines over ${city}, your roof produces estimated units. Savings depend on actual consumption — this blueprint is your path to lowering costs and breaking grid dependence.`,
      closingCtaTitle: hi ? "शुरू करने को तैयार?" : "Ready to initiate?",
      closingCtaBody: (brand: string) =>
        hi
          ? `इस ब्लूप्रिंट पर हस्ताक्षर करें। ${brand} इंजीनियरिंग, DISCOM कागज़ात, और इंस्टॉलेशन टाइमलाइन शुरू करेगा।`
          : `Sign this blueprint to authorize the project. ${brand} will commence engineering, DISCOM paperwork, and schedule installation.`,
      closingSystemLabel: hi ? "सिस्टम इंजन" : "System engine",
      closingSignature: hi ? "अधिकृत हस्ताक्षर" : "Authorized Signature",
      closingClientSign: hi ? "ग्राहक स्वीकृति" : "Client acceptance",
      closingCompanySign: hi ? "अधिकृत हस्ताक्षरकर्ता" : "Authorized signatory",
      closingHeroAlt: hi ? "सोलर आर्किटेक्चर" : "Solar architecture",
      closingBody: hi
        ? "आप अगले 25 वर्षों के लिए अपनी बिजली की कीमत लॉक कर रहे हैं।"
        : "You are locking your electricity price for the next 25 years.",
      closingCta: hi ? "शुरू करें" : "Let's Begin",
      contact: hi ? "संपर्क" : "Contact",
      years: hi ? "वर्ष" : "Years",
      cumulative: hi ? "संचयी बचत" : "Cumulative savings",
      terms: hi ? "नियम" : "Terms",
      lifetimeWealth: hi ? "25-वर्ष शुद्ध लाभ" : "25-Year Net Benefit",
    },
    labels: {
      yearlyBill: hi ? "वार्षिक बिल" : "Yearly bill",
      capacity: hi ? "क्षमता" : "Capacity",
      annualGen: hi ? "वार्षिक उत्पादन" : "Annual generation",
      coverage: hi ? "कवरेज" : "Coverage",
      warranty: hi ? "वारंटी" : "Warranty",
      units: hi ? "यूनिट" : "Units",
      brand: hi ? "कंपोनेंट" : "Component",
      summerTrap: hi ? "गर्मी का उछाल" : "Summer trap",
      solarShare: hi ? "सोलर से बचत %" : "Solar savings %",
      annualSavings: hi ? "वार्षिक बचत" : "Annual savings",
      dailyGen: hi ? "अनुमानित दैनिक" : "Est. daily gen",
      specificYield: hi ? "स्पेसिफिक यील्ड" : "Specific yield",
    },
  };
}

export type CanvasCopy = ReturnType<typeof getCanvasCopy>;
