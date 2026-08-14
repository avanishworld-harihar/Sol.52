/**
 * Emerald Signature — EN / Hindi UI copy (simple language).
 */

export type EmeraldLang = "en" | "hi";

export function getEmeraldCopy(lang: EmeraldLang) {
  const hi = lang === "hi";
  return {
    print: {
      brand: hi ? "एमराल्ड सिग्नेचर" : "Emerald Signature",
      downloadPdf: hi ? "PDF डाउनलोड" : "Download PDF",
      preparingPdf: hi ? "PDF बन रहा है…" : "Preparing PDF…",
      langEn: "EN",
      langHi: "हिंदी",
      langAria: hi ? "भाषा" : "Language",
      loading: hi ? "आपका प्रस्ताव तैयार हो रहा है…" : "Preparing your proposal…",
    },
    common: {
      customerFallback: hi ? "ग्राहक" : "Customer Name",
      youFallback: hi ? "आप" : "you",
      homeFallback: hi ? "आपके घर" : "your home",
      units: hi ? "यूनिट" : "Units",
      unitsShort: hi ? "यू" : "U",
      years: hi ? "साल" : "Yrs",
      section: (n: string) => (hi ? `सेक्शन ${n}` : `SECTION ${n}`),
    },
    cover: {
      docNo: hi ? "दस्तावेज़ संख्या" : "DOCUMENT NUMBER",
      issueDate: hi ? "जारी करने की तारीख" : "DATE OF ISSUE",
      photoAlt: hi
        ? "भारतीय घर की छत पर सोलर पैनल"
        : "Rooftop solar panels on an Indian house",
      eyebrow: hi ? "रूफटॉप सोलर प्रस्ताव" : "ROOFTOP SOLAR PROPOSAL",
      lead: (location: string) =>
        hi
          ? `${location} के लिए बना रूफटॉप सोलर प्लान। अच्छी पैदावार और साफ छत के लिए।`
          : `A rooftop solar plan made for ${location}. Built for strong generation and a clean look on your roof.`,
      systemSize: hi ? "सिस्टम साइज़" : "SYSTEM SIZE",
      solarArray: hi ? "सोलर ऐरे" : "SOLAR ARRAY",
      year1Units: hi ? "पहले साल की यूनिट" : "YEAR 1 UNITS",
    },
    arch: {
      eyebrow: hi ? "सेक्शन एक" : "SECTION ONE",
      sidebarTitle: hi ? ["सिस्टम", "डिज़ाइन।"] : ["System", "Design."],
      sidebarBlurb: hi
        ? "छत की धूप घर की बिजली कैसे बनती है।"
        : "How sunlight on your roof becomes electricity for your home.",
      pageHeader: hi ? "सिस्टम कैसे जुड़ता है" : "How the System Connects",
      step1: hi ? "01 / सोलर पैनल" : "01 / SOLAR PANELS",
      dcTitle: (kwp: string) => (hi ? `${kwp} kWp DC ऐरे` : `${kwp} kWp DC Array`),
      step1Hint: (modules: number, watt: number) =>
        modules > 0
          ? hi
            ? `${modules} × ${watt}W N-Type TOPCon पैनल जो धूप पकड़ते हैं।`
            : `${modules} × ${watt}W N-Type TOPCon panels that capture sunlight.`
          : hi
            ? "N-Type TOPCon पैनल जो धूप पकड़ते हैं।"
            : "N-Type TOPCon panels that capture sunlight.",
      step2: hi ? "02 / इनवर्टर" : "02 / INVERTER",
      acTitle: (kw: string) => (hi ? `${kw} kW AC आउटपुट` : `${kw} kW AC Output`),
      step2Hint: hi
        ? "DC बिजली को AC में बदलता है, 97.5% दक्षता, बेहतर आउटपुट के लिए डुअल MPPT।"
        : "Converts DC power to AC power at 97.5% efficiency, with dual MPPT for better output.",
      step3: hi ? "03 / ग्रिड" : "03 / GRID",
      gridTitle: hi ? "दो-तरफ़ा नेट मीटर" : "Two-way Net Meter",
      step3Hint: hi
        ? "बची बिजली आपके लोकल DISCOM ग्रिड में जाती है।"
        : "Extra power goes to your local DISCOM grid.",
      keyNumbers: hi ? "मुख्य आँकड़े" : "KEY NUMBERS",
      dcAc: hi ? "DC / AC अनुपात" : "DC / AC ratio",
      pr: hi ? "अनुमानित परफॉर्मेंस रेशियो (PR)" : "Estimated performance ratio (PR)",
      wind: hi ? "पवन प्रतिरोध" : "Wind resistance",
    },
    econ: {
      eyebrow: hi ? "सेक्शन दो" : "SECTION TWO",
      sidebarTitle: hi ? ["प्रोजेक्ट", "लागत।"] : ["Project", "Cost."],
      sidebarBlurb: hi
        ? "साफ प्रोजेक्ट लागत, सब्सिडी और 25 साल की बचत।"
        : "Clear project cost, subsidy, and savings over 25 years.",
      pageHeader: hi ? "निवेश सारांश" : "Investment Summary",
      netCost: hi ? "आपकी नेट लागत" : "Your Net Cost",
      breakdown: hi ? "लागत विवरण" : "COST BREAKDOWN",
      gross: hi ? "कुल सिस्टम लागत" : "Gross system cost",
      subsidy: hi ? "MNRE सब्सिडी" : "MNRE Subsidy",
      youPay: hi ? "आप चुकाएँगे" : "You pay",
      lifetime: hi ? "आजीवन बचत" : "LIFETIME SAVINGS",
      lifetimeHint: hi ? "25 साल की कुल बचत" : "Total savings over 25 years",
      payback: hi ? "पेबैक" : "PAYBACK",
      paybackHint: hi ? "अनुमानित पेबैक समय" : "Estimated payback time",
    },
    hardware: {
      eyebrow: hi ? "सेक्शन तीन" : "SECTION THREE",
      sidebarTitle: hi ? ["हार्डवेयर", "सूची।"] : ["Hardware", "List."],
      sidebarBlurb: hi
        ? "पैनल, इनवर्टर और स्टील स्ट्रक्चर — लंबे समय के लिए।"
        : "Quality panels, inverter, and steel structure built to last.",
      pageHeader: hi ? "हम क्या लगाएँगे" : "What We Will Install",
      panelTitle: hi ? "सोलर पैनल" : "Solar Panels",
      panelEyebrow: (yrs: string) =>
        hi ? `${yrs}-साल परफॉर्मेंस` : `${yrs}-YEAR PERFORMANCE`,
      panelDesc: (modules: number, watt: number) =>
        modules > 0
          ? hi
            ? `${modules} × ${watt}W हाई-एफिशिएंसी N-Type TOPCon पैनल। कम रोशनी में भी काम करते हैं, गर्मी में कम नुकसान, DCR कंप्लायंट, और लगभग 21% धूप को बिजली बनाते हैं।`
            : `${modules} × ${watt}W high-efficiency N-Type TOPCon panels. They work well in low light, lose less power in heat, are DCR compliant, and convert about 21% of sunlight into electricity.`
          : hi
            ? "हाई-एफिशिएंसी N-Type TOPCon पैनल। कम रोशनी में भी काम करते हैं, गर्मी में कम नुकसान, DCR कंप्लायंट, और लगभग 21% धूप को बिजली बनाते हैं।"
            : "High-efficiency N-Type TOPCon panels. They work well in low light, lose less power in heat, are DCR compliant, and convert about 21% of sunlight into electricity.",
      inverterTitle: hi ? "ग्रिड-टाई इनवर्टर" : "Grid-Tie Inverter",
      inverterEyebrow: (yrs: string) =>
        hi ? `${yrs}-साल रिप्लेसमेंट` : `${yrs}-YEAR REPLACEMENT`,
      inverterDesc: (kw: string) =>
        hi
          ? `${kw} kW स्ट्रिंग इनवर्टर पैनल की बिजली घर के लिए बदलता है। छाया में डुअल MPPT मदद करता है, IP65 मौसम सुरक्षा, लगभग 97.5% दक्षता।`
          : `A ${kw} kW string inverter that converts panel power for your home. Dual MPPT helps in shade, IP65 weather protection, and about 97.5% efficiency.`,
      structureTitle: hi ? "माउंटिंग स्ट्रक्चर" : "Mounting Structure",
      structureEyebrow: (wind: string) =>
        hi ? `${wind} पवन रेटिंग` : `${wind} WIND RATING`,
      structureDesc: hi
        ? "JSW हॉट-डिप गैल्वनाइज्ड आयरन (GI) स्ट्रक्चर, मानसून और हवा में पैनल को सुरक्षित रखने के लिए। TUV-अप्रूव्ड फायर-रेसिस्टेंट केबल और Type-II सर्ज प्रोटेक्शन (SPD) शामिल।"
        : "JSW hot-dip galvanized iron (GI) structure made to hold the panels safely in heavy monsoon and wind. Includes TUV-approved fire-resistant cables and Type-II surge protection (SPD).",
      chosen: hi
        ? "इस रूफटॉप प्रोजेक्ट के लिए चुना गया।"
        : "Chosen for this rooftop project.",
    },
    impact: {
      eyebrow: hi ? "सेक्शन चार" : "SECTION FOUR",
      sidebarTitle: hi ? ["हरित", "प्रभाव।"] : ["Green", "Impact."],
      sidebarBlurb: hi
        ? "यह सिस्टम पर्यावरण की कैसे मदद करता है।"
        : "How this system helps the environment.",
      pageHeader: hi ? "पर्यावरण प्रभाव" : "Environmental Impact",
      co2Label: hi ? "बचे टन CO₂" : "Tonnes of CO₂ avoided",
      co2Hint: hi
        ? "कोयला और अन्य जीवाश्म ईंधन की ग्रिड बिजली की जगह सोलर से 25 साल में बचा CO₂।"
        : "CO₂ saved over 25 years by using solar instead of grid power from coal and other fossil fuels.",
      treesLabel: hi ? "इतने पेड़ों के बराबर" : "Equal to this many trees",
      treesHint: hi
        ? "लगभग इतने बड़े पेड़ जितना CO₂ सोखते हैं।"
        : "About the same CO₂ absorbed by this many mature trees.",
      cleanEnergy: (units: string) =>
        hi
          ? `स्वच्छ ऊर्जा: ~${units} यूनिट / साल`
          : `CLEAN ENERGY: ~${units} UNITS / YEAR`,
      cleanEnergyEmpty: hi ? "स्वच्छ ऊर्जा: —" : "CLEAN ENERGY: —",
    },
    bill: {
      eyebrow: hi ? "सेक्शन पाँच" : "SECTION FIVE",
      sidebarTitle: hi ? ["ऊर्जा", "ऑडिट।"] : ["Energy", "Audit."],
      sidebarBlurb: hi
        ? "आज का बिजली बिल बनाम सोलर के बाद की बचत।"
        : "Your current electricity bill compared with savings after solar.",
      pageHeader: hi ? "आपका बिजली बिल" : "Your Electricity Bill",
      lead: hi
        ? "छत पर सोलर से ग्रिड से कम बिजली खरीदनी पड़ती है। यूनिट रेट बढ़ने से बचाव होता है, और साल की लागत ज़्यादा स्थिर रहती है।"
        : "Solar on your roof reduces how much power you buy from the grid. That helps protect you from rising unit rates and makes your yearly electricity cost more stable.",
      currentCost: hi ? "आज की बिजली लागत" : "Current electricity cost",
      avgUse: hi ? "औसत मासिक उपयोग" : "Average monthly use",
      avgRate: hi ? "औसत दर (प्रति यूनिट)" : "Average rate (per unit)",
      monthlyBill: hi ? "अनुमानित मासिक बिल" : "Estimated monthly bill",
      yearlyBill: hi ? "अनुमानित सालाना बिल" : "Estimated yearly bill",
      afterSolar: hi ? "सोलर के बाद" : "After solar",
      monthlySavings: hi ? "अनुमानित मासिक बचत" : "Estimated monthly savings",
      unitsWord: (n: string) => (hi ? `${n} यूनिट` : `${n} Units`),
    },
    forecast: {
      eyebrow: hi ? "सेक्शन छह" : "SECTION SIX",
      sidebarTitle: hi ? ["सालाना", "उत्पादन।"] : ["Yearly", "Output."],
      sidebarBlurb: hi
        ? "एक साल में महीने-महीने अनुमानित उत्पादन।"
        : "Expected monthly generation over one year.",
      pageHeader: hi ? "मासिक उत्पादन" : "Monthly Generation",
      lead: hi
        ? "गर्मी में उत्पादन ज़्यादा होता है, जब AC भी ज़्यादा चलता है। यानी जब बिल आमतौर पर सबसे ऊँचा होता है, बचत भी ज़्यादा।"
        : "Generation is higher in summer, when you also use more air-conditioning. That means more savings when your bill is usually highest.",
      h1: hi ? "जन – जून" : "JAN – JUN",
      h2: hi ? "जुल – दिस" : "JUL – DEC",
      yearly: hi ? "अनुमानित सालाना उत्पादन" : "Estimated yearly generation",
      yearlyValue: (n: string) => (hi ? `${n} यूनिट` : `${n} Units`),
      months: hi
        ? ["जन", "फर", "मार", "अप्र", "मई", "जून", "जुल", "अग", "सित", "अक्ट", "नव", "दिस"]
        : ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"],
    },
    pay: {
      eyebrow: hi ? "भुगतान योजना" : "PAYMENT PLAN",
      sidebarTitle: hi ? ["भुगतान", "कैसे होगा।"] : ["How We", "Get Paid."],
      sidebarBlurb: hi
        ? "प्रोजेक्ट शुरू करने के लिए भुगतान चरण और हस्ताक्षर।"
        : "Payment stages and signatures to start the project.",
      pageHeader: hi ? "भुगतान अनुसूची" : "Payment Schedule",
      lead: hi
        ? "काम आगे बढ़ने पर आप चरणों में भुगतान करते हैं। शुरू से अंत तक सब साफ रहता है।"
        : "You pay in stages as the work moves forward. This keeps the project clear and easy to follow from start to finish.",
      stages: hi ? "भुगतान चरण" : "Payment stages",
      stagesBased: (gross: string) =>
        hi ? `भुगतान चरण (${gross} सकल पर)` : `Payment stages (based on ${gross} gross)`,
      ofValue: (pct: number) =>
        hi ? `प्रोजेक्ट मूल्य का ${pct}%` : `${pct}% of project value`,
      customerSig: hi ? "ग्राहक हस्ताक्षर" : "CUSTOMER SIGNATURE",
      companySig: hi ? "कंपनी हस्ताक्षर" : "COMPANY SIGNATURE",
      disclaimer: hi
        ? "यह प्रस्ताव 30 दिन तक मान्य है। अंतिम कीमत DISCOM मंज़ूरी और विस्तृत साइट सर्वे पर निर्भर है।"
        : "THIS PROPOSAL IS VALID FOR 30 DAYS. FINAL PRICE DEPENDS ON DISCOM APPROVAL AND A DETAILED SITE SURVEY.",
      stageFallback: hi ? "चरण" : "Stage",
      defaultSteps: hi
        ? [
            { title: "एडवांस", percent: 25 },
            { title: "मटीरियल डिलीवरी", percent: 50 },
            { title: "इंस्टॉलेशन", percent: 20 },
            { title: "ग्रिड कनेक्शन", percent: 5 },
          ]
        : [
            { title: "Advance", percent: 25 },
            { title: "Material delivery", percent: 50 },
            { title: "Installation", percent: 20 },
            { title: "Grid connection", percent: 5 },
          ],
    },
    terms: {
      eyebrow: hi ? "सेक्शन सात" : "SECTION SEVEN",
      sidebarTitle: hi ? ["नियम", "और शर्तें।"] : ["Terms", "& Conditions."],
      sidebarBlurb1: hi
        ? "कीमत, सब्सिडी, भुगतान और नेट मीटरिंग (भाग 1)।"
        : "Price, subsidy, payments, and net metering (Part 1).",
      sidebarBlurb2: hi
        ? "वारंटी, उत्पादन अनुमान और कानून (भाग 2)।"
        : "Warranty, generation estimates, and governing law (Part 2).",
      pageHeader: hi ? "नियम और शर्तें" : "Terms & Conditions",
      continued: hi ? "नियम (जारी)" : "Terms (continued)",
      c1Title: hi ? "कीमत और वैधता" : "Price and validity",
      c1: hi
        ? "इस प्रस्ताव की कीमतें जारी होने की तारीख से 30 दिन तक मान्य हैं। अंतिम सिस्टम साइज़ और कीमत साइट सर्वे और छत की लोड क्षमता की जाँच पर निर्भर है। छत पर ज़रूरी अतिरिक्त काम वास्तविक लागत पर लगेगा।"
        : "Prices in this proposal are valid for 30 days from the date of issue. Final system size and price depend on a site survey and a check of the roof's load capacity. Any extra roof work needed will be charged at actual cost.",
      c2Title: hi ? "सब्सिडी और सरकारी मंज़ूरी" : "Subsidy and government approvals",
      c2: (brand: string) =>
        hi
          ? `दिखाई गई कोई भी सब्सिडी (जैसे PM सूर्य घर मुफ्त बिजली योजना) मौजूदा सरकारी नियमों पर आधारित अनुमान है। ${brand} आवेदन में मदद करता है। अंतिम सब्सिडी राशि और भुगतान MNRE और लोकल एजेंसियाँ तय करती हैं। पोर्टल मंज़ूरी या सब्सिडी क्रेडिट में देरी के लिए ${brand} ज़िम्मेदार नहीं है।`
          : `Any subsidy shown (for example, PM Surya Ghar Muft Bijli Yojana) is an estimate based on current government rules. ${brand} helps with the application. The final subsidy amount and payment are decided by MNRE and the local agencies. ${brand} is not responsible for delays in portal approval or subsidy credit.`,
      c3Title: hi ? "भुगतान" : "Payments",
      c3: (brand: string) =>
        hi
          ? `काम तय भुगतान चरणों के अनुसार चलता है। अगर भुगतान 7 कार्य दिवस से ज़्यादा देर हो, खरीद और इंस्टॉलेशन रुक जाएगा। पूरा भुगतान होने तक सारा सामान ${brand} के पास रहता है।`
          : `Work follows the agreed payment stages. If a payment is late by more than 7 working days, buying and installation will pause. All equipment stays with ${brand} until the full amount is paid.`,
      c4Title: hi ? "नेट मीटरिंग और ग्रिड कनेक्शन" : "Net metering and grid connection",
      c4: (brand: string) =>
        hi
          ? `नेट मीटर लगाने और ग्रिड कनेक्शन का समय आपके लोकल DISCOM पर निर्भर है। ${brand} कागज़ दाखिल करेगा और फॉलो-अप करेगा। DISCOM टेस्टिंग या मीटर उपलब्धता की देरी हमारे नियंत्रण से बाहर है।`
          : `The time needed for net meter installation and grid connection depends on your local DISCOM. ${brand} will file the papers and follow up. Delays from DISCOM testing or meter availability are outside our control.`,
      c5Title: hi ? "वारंटी और रखरखाव" : "Warranties and maintenance",
      c5: (brand: string, panelYrs: string, inverterYrs: string, workYrs: string) =>
        hi
          ? `प्रोडक्ट वारंटी (जैसे पैनल की ${panelYrs}-साल लीनियर परफॉर्मेंस और इनवर्टर की ${inverterYrs}-साल) निर्माताओं की ओर से है। ${brand} इंस्टॉलेशन पर ${workYrs}-साल वर्कमैनशिप वारंटी देता है। पैनल साफ रखना आपकी ज़िम्मेदारी है, जब तक अलग AMC न लिया हो।`
          : `Product warranties (for example, ${panelYrs}-year linear performance for panels and ${inverterYrs}-year for inverters) come from the manufacturers. ${brand} gives a ${workYrs}-year workmanship warranty on the installation. You must clean the panels unless you take a separate AMC.`,
      c6Title: hi ? "उत्पादन अनुमान और छाया" : "Generation estimates and shadows",
      c6: hi
        ? "इस प्रस्ताव में सालाना यूनिट और बचत पिछले मौसम डेटा पर आधारित अनुमान हैं। वास्तविक उत्पादन मौसम, गंदे पैनल, या इंस्टॉलेशन के बाद नई छाया से बदल सकता है।"
        : "Yearly units and savings in this proposal are estimates based on past weather data. Actual generation can change due to weather, dirty panels, or new shadows after installation.",
      c7Title: hi ? "हमारे नियंत्रण से बाहर की घटनाएँ" : "Events outside our control",
      c7: (brand: string) =>
        hi
          ? `${brand} ऐसी देरी के लिए ज़िम्मेदार नहीं है जो हमारे नियंत्रण से बाहर हो, जैसे प्राकृतिक आपदा, चरम मौसम, महामारी, लॉकडाउन, या बड़ी सप्लाई कमी।`
          : `${brand} is not responsible for delay caused by events outside our control, such as natural disasters, extreme weather, pandemics, lockdowns, or major supply shortages.`,
      c8Title: hi ? "लागू कानून" : "Governing law",
      c8Lead: hi
        ? "यह समझौता भारत के कानूनों के अनुसार है।"
        : "This agreement follows the laws of India.",
      courtsLoc: (loc: string) =>
        hi
          ? `दोनों पक्ष मानते हैं कि इस प्रोजेक्ट के किसी विवाद को ${loc} की अदालतें देखेंगी।`
          : `Both sides agree that courts in ${loc} will handle any dispute from this project.`,
      courtsIndia: hi
        ? "दोनों पक्ष मानते हैं कि इस प्रोजेक्ट के किसी विवाद को भारत की अदालतें देखेंगी।"
        : "Both sides agree that courts in India will handle any dispute from this project.",
      end: (brand: string) =>
        hi ? `दस्तावेज़ समाप्त • ${brand}` : `END OF DOCUMENT • ${brand}`,
    },
    back: {
      photoAlt: hi
        ? "सूर्यास्त के समय छत के सोलर पैनल"
        : "Rooftop solar panels at sunset",
      thankYou: hi ? "धन्यवाद" : "THANK YOU",
      preparedFor: hi ? "के लिए तैयार" : "Prepared for",
      lead: hi
        ? "अच्छी पैदावार, लंबी उम्र और स्थिर बचत के लिए बना रूफटॉप सोलर सिस्टम।"
        : "A rooftop solar system made for strong generation, long life, and steady savings.",
      installer: hi ? "इंस्टॉलर" : "Installer",
      phone: hi ? "फ़ोन / व्हाट्सऐप" : "Phone / WhatsApp",
      email: hi ? "ईमेल" : "Email",
      website: hi ? "वेबसाइट" : "Website",
      office: hi ? "कार्यालय" : "Office",
      person: hi ? "आपका संपर्क" : "Your contact",
    },
  };
}

export type EmeraldCopy = ReturnType<typeof getEmeraldCopy>;
