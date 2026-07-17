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
      badge: hi ? "सौर प्रस्ताव" : "Solar proposal",
      title: "Investment Blueprint",
      sub: hi
        ? "आपकी छत के लिए स्पष्ट वित्तीय और तकनीकी योजना।"
        : "A clear financial and technical plan shaped for your rooftop.",
      lifetime: hi ? "आजीवन लाभ" : "Lifetime wealth",
      system: hi ? "सिस्टम" : "System",
      preparedFor: hi ? "के लिए तैयार" : "Prepared for",
    },
    pages: {
      bill: hi ? "बिल एविडेंस" : "Bill evidence",
      billLead: hi
        ? "आज का खर्च — डेटा से साबित।"
        : "What you pay today — proven from your bill data.",
      requirement: hi ? "आवश्यकता" : "Requirement",
      requirementLead: hi
        ? "प्रस्तावित क्षमता और वार्षिक उत्पादन।"
        : "Proposed capacity and annual generation.",
      financial: hi ? "Financial Story" : "Financial Story",
      financialLead: hi
        ? "दिन 1 से शुद्ध मासिक लाभ।"
        : "Net monthly gain from day one.",
      immediateProfit: hi ? "तत्काल मासिक लाभ" : "Immediate Monthly Profit",
      netGainHint: hi ? "दिन 1 से शुद्ध मासिक लाभ" : "Net Monthly Gain from Day 1",
      today: hi ? "आज" : "Today",
      afterSolar: hi ? "सोलर के बाद" : "After solar",
      monthlyProfit: hi ? "मासिक लाभ" : "Monthly profit",
      investment: hi ? "निवेश योजना" : "Investment plan",
      investmentLead: hi
        ? "सकल लागत, सब्सिडी, और आपका भुगतान।"
        : "Gross cost, subsidy, and what you pay.",
      gross: hi ? "सकल" : "Gross",
      subsidy: hi ? "सब्सिडी" : "Subsidy",
      youPay: hi ? "आप चुकाएँगे" : "You pay",
      payback: hi ? "पेबैक" : "Payback",
      wealth: hi ? "Wealth Projection" : "Wealth Projection",
      wealthLead: hi
        ? "25 वर्षों में आपकी बचत कैसे बढ़ती है।"
        : "How your savings compound across 25 years.",
      investScore: hi ? "सोलर निवेश स्कोर" : "Solar Investment Score",
      investScoreValue: "AA+ (Very High Return)",
      investScoreInsight: (netLakh: string, multiple: string) =>
        hi
          ? `आपका ₹${netLakh}L निवेश ग्रिड मूल्य मुद्रास्फीति के कारण 25 वर्षों में ~${multiple}x रिटर्न देता है।`
          : `Your ₹${netLakh}L investment generates ~${multiple}x returns over 25 years due to grid price inflation.`,
      generation: hi ? "उत्पादन" : "Generation",
      generationLead: hi
        ? "वार्षिक यूनिट, कवरेज, और साइट क्षमता।"
        : "Annual units, coverage, and site capacity.",
      genInsightTitle: hi
        ? "क्यों यह क्षमता सही है"
        : "Why this capacity fits",
      genInsightBody: hi
        ? "उत्पादन अनुमान स्थानीय विकिरण और छत अभिविन्यास पर आधारित है। गर्मियों में उच्च उत्पादन बिल के पीक महीनों से मेल खाता है — यही बचत का मुख्य इंजन है।"
        : "Generation estimates use local irradiance and roof orientation. Summer output aligns with peak bill months — that overlap is the core savings engine.",
      hardware: hi ? "Hardware Trust" : "Hardware Trust",
      hardwareLead: hi
        ? "टियर-1 पार्ट्स — प्रमाण, वारंटी, और उपज।"
        : "Tier-1 parts — proven, warranted, and built for yield.",
      hwInsightTitle: hi
        ? "टियर-1 क्यों मायने रखता है"
        : "Why Tier-1 matters",
      hwInsightBody: hi
        ? "मॉड्यूल और इन्वर्टर का ब्रांड दीर्घकालिक उपज और सर्विस नेटवर्क तय करता है। हम केवल उन पार्ट्स का उपयोग करते हैं जिनकी वारंटी और स्पेयर पार्ट्स भारत में आसानी से उपलब्ध हैं।"
        : "Module and inverter brand set long-term yield and service reach. We specify parts with warranties and spare availability across India.",
      billInsightTitle: hi ? "बिल में क्या छिपा है" : "What the bill is telling you",
      billInsightBody: hi
        ? "गर्मी के पीक महीने औसत बिल को ऊपर खींचते हैं। सोलर का उत्पादन भी इन्हीं महीनों में ऊँचा होता है — इसलिए बचत सिर्फ औसत पर नहीं, सबसे महंगे महीनों पर लगती है।"
        : "Summer peak months pull the average bill up. Solar generation peaks in those same months — so savings hit hardest when electricity is most expensive.",
      investInsightTitle: hi ? "नेट लागत कैसे पढ़ें" : "How to read net cost",
      investInsightBody: hi
        ? "सकल कीमत में हार्डवेयर + इंस्टॉल शामिल है। सब्सिडी घटने के बाद जो राशि बचती है, वही आपकी वास्तविक निवेश आधार-रेखा है — पेबैक इसी आंकड़े पर चलता है।"
        : "Gross includes hardware and install. After subsidy, the remainder is your true investment baseline — payback is measured against that number alone.",
      financeInsightTitle: hi ? "दिन-1 लाभ क्यों मायने रखता है" : "Why day-1 profit matters",
      financeInsightBody: hi
        ? "मासिक बचत EMI या कैश-फ्लो से पहले दिखती है। अगर बचत स्थिर रहे, तो सिस्टम खुद को चुकाता है — और उसके बाद हर यूनिट शुद्ध लाभ बन जाती है।"
        : "Monthly savings show up before EMI stress fades. When savings hold steady, the system pays itself down — and every unit after payback is pure gain.",
      wealthInsightTitle: hi ? "वक्र क्यों ऊपर मुड़ता है" : "Why the curve bends upward",
      wealthInsightBody: hi
        ? "टैरिफ मुद्रास्फीति बचत को साल-दर-साल बढ़ाती है। शुरुआती वर्ष निवेश वसूली हैं; बाद के वर्ष चक्रवृद्धि धन बनाते हैं — इसलिए 25-वर्ष का आंकड़ा सिर्फ 25× साल-1 नहीं है।"
        : "Tariff inflation lifts savings year over year. Early years recover capital; later years compound wealth — so the 25-year figure is not simply 25× year one.",
      impactInsightTitle: hi ? "संख्याओं के पीछे अर्थ" : "Meaning behind the numbers",
      impactInsightBody: hi
        ? "CO₂ और वृक्ष समकक्ष सिर्फ मार्केटिंग नहीं — वे आपके घर की ग्रिड मांग कम करने का माप हैं। हर वर्ष स्वच्छ यूनिट = कम कोयला-आधारित बिजली।"
        : "CO₂ and tree equivalents are not just marketing — they measure reduced grid demand from your home. Every clean unit displaces coal-heavy power.",
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
      impact: hi ? "प्रभाव" : "Impact",
      impactLead: hi ? "स्वच्छ ऊर्जा का माप।" : "Clean generation, measured.",
      co2: hi ? "CO₂ बचत" : "CO₂ avoided",
      trees: hi ? "वृक्ष समकक्ष" : "Tree equivalent",
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
      closingTitle: hi ? "बधाई।" : "Congratulations.",
      closingBody: hi
        ? "आप अगले 25 वर्षों के लिए अपनी बिजली की कीमत लॉक कर रहे हैं।"
        : "You are locking your electricity price for the next 25 years.",
      closingCta: hi ? "शुरू करें" : "Let's Begin",
      contact: hi ? "संपर्क" : "Contact",
      years: hi ? "वर्ष" : "Years",
      cumulative: hi ? "संचयी बचत" : "Cumulative savings",
      terms: hi ? "नियम" : "Terms",
      lifetimeWealth: hi ? "आजीवन धन" : "Lifetime Wealth",
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
