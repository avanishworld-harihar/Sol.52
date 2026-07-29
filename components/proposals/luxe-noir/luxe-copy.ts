/**
 * Premium Luxe — EN / Hindi UI copy.
 */

export type LuxeLang = "en" | "hi";

export function getLuxeCopy(lang: LuxeLang) {
  const hi = lang === "hi";
  return {
    print: {
      brand: hi ? "प्रीमियम लक्स · A4 प्रस्ताव" : "Premium Luxe · A4 Proposal",
      downloadPdf: hi ? "प्रिंट / PDF सेव" : "Print / Save PDF",
      langEn: "EN",
      langHi: "हिंदी",
    },
    cover: {
      series: hi ? "प्रीमियम लक्स प्रस्ताव" : "PREMIUM LUXE PROPOSAL",
      confidential: hi ? "गोपनीय" : "CONFIDENTIAL",
      vendor: hi ? "विक्रेता" : "VENDOR",
      discipline: hi ? "रूफटॉप सोलर · निजी प्रस्ताव" : "Rooftop solar · Private offer",
      preparedFor: hi ? "के लिए तैयार" : "Prepared for",
      offer: hi
        ? "निजी रूफटॉप सोलर ब्रीफ — निवेश, बचत और कारीगरी, आपके घर के लिए।"
        : "A private rooftop solar brief — investment, savings, and craft — prepared for your home.",
      system: hi ? "सिस्टम" : "System",
      location: hi ? "स्थान" : "Location",
      year: hi ? "वर्ष" : "Year",
    },
    load: {
      eyebrow: hi ? "लोड और मांग" : "Load & demand",
      title: hi ? "सिस्टम आवश्यकता और लोड विश्लेषण" : "System Requirement & Load Analysis",
      lead: hi
        ? "हम आपकी असली खपत से सिस्टम साइज़ करते हैं — सामान्य अनुमान से नहीं — ताकि उत्पादन आपके बिल से मेल खाए।"
        : "We size the array from your actual consumption pattern — not a generic rule of thumb — so generation tracks the bill you already pay.",
      avgUnits: hi ? "औसत मासिक यूनिट" : "Avg monthly units",
      fromBill: hi ? "बिल इतिहास से" : "From bill history",
      estBill: hi ? "अनुमानित मासिक बिल" : "Est. monthly bill",
      billHint: hi ? "एनर्जी + फिक्स्ड + ड्यूटी" : "Energy + fixed + duty",
      capacity: hi ? "प्रस्तावित क्षमता" : "Proposed capacity",
      acRating: hi ? "AC इन्वर्टर रेटिंग" : "AC inverter rating",
      annualGen: hi ? "वार्षिक उत्पादन लक्ष्य" : "Annual generation target",
      yieldHint: hi ? "~1,450 kWh/kW · साइट कैलिब्रेटेड यील्ड" : "~1,450 kWh/kW · site-calibrated yield",
      recentMonths: hi ? "हाल के बिल महीने" : "Recent bill months",
      peak: hi ? "पीक" : "peak",
      coverage: hi ? "कवरेज उद्देश्य" : "Coverage intent",
      coverageBody: hi
        ? "दिन के लोड को ऑफ़सेट करने और पीक टैरिफ में ग्रिड ड्रॉ कम करने के लिए ऐरे साइज़। अंतिम नेट-मीटरिंग DISCOM मंज़ूरी के बाद।"
        : "Array sized to offset daytime load and reduce grid draw during peak tariff windows. Final net-metering settlement follows DISCOM approval.",
      verdictLabel: hi ? "लोड विश्लेषक का निष्कर्ष" : "LOAD ANALYST'S VERDICT",
      verdictWithData: (units: string, kw: string, gen: string) =>
        hi
          ? `आपकी ~${units} यूनिट मासिक औसत ${kw} kW AC सिस्टम से मेल खाती है — ${gen} उत्पादन लक्ष्य इसी बिल इतिहास पर आधारित है, कैटलॉग अनुमान पर नहीं।`
          : `Your ~${units} unit monthly average maps to a ${kw} kW AC system — the ${gen} generation target is calibrated to this bill history, not a catalogue default.`,
      verdictFallback: hi
        ? "हम आपकी असली खपत से साइज़ करते हैं ताकि दिन का उत्पादन आपके बिल से जुड़े — क्षमता लोड से मैच है, अनुमान नहीं।"
        : "We size from your actual consumption pattern so daytime generation tracks the bill you already pay — capacity is a match to load, not a guess.",
    },
    wealth: {
      tag: hi ? "03 // पूँजी स्पष्टता" : "03 // CAPITAL CLARITY",
      title: hi ? "आपकी नेट स्थिति।" : "Your Net Position.",
      netInvest: hi ? "आपका नेट निवेश" : "YOUR NET INVESTMENT",
      exact: hi ? "सटीक" : "Exact",
      gross: hi ? "सकल" : "Gross",
      subsidy: hi ? "सब्सिडी" : "Subsidy",
      capitalComp: hi ? "पूँजी संरचना" : "CAPITAL COMPOSITION",
      yourNet: hi ? "आपका नेट" : "Your net",
      billCompare: hi ? "वार्षिक बिल — पहले बनाम बाद" : "ANNUAL BILL — BEFORE VS AFTER",
      relief: hi ? "राहत" : "Relief",
      todayGrid: hi ? "आज · ग्रिड" : "Today · grid",
      year1Solar: hi ? "वर्ष 1 · सोलर" : "Year 1 · solar",
      year1Relief: hi ? "वर्ष-1 राहत" : "YEAR-1 RELIEF",
      payback: hi ? "पेबैक" : "PAYBACK",
      wealth25: hi ? "25-वर्ष संपत्ति" : "25-YR WEALTH",
      monthlyRelief: hi ? "मासिक राहत" : "MONTHLY RELIEF",
      wealthPath: hi ? "25-वर्ष संपत्ति पथ" : "25-YEAR WEALTH PATH",
      breakEven: hi ? "ब्रेक-ईवन" : "Break-even",
      cumulative: hi ? "संचयी स्थिति" : "CUMULATIVE POSITION",
      recovery: hi ? "रिकवरी" : "Recovery",
      chartFoot: (years: string, lifetime: string) =>
        hi
          ? `वक्र आपके नेट खर्च से शुरू होता है, ${years} पर ब्रेक-ईवन पार करता है, फिर 25 वर्षों में लगभग ${lifetime} की ओर बिल राहत जोड़ता है।`
          : `Curve starts at your net outlay, crosses break-even at ${years}, then compounds bill relief toward about ${lifetime} over 25 years.`,
      footnote: hi
        ? "सब्सिडी MNRE / DISCOM मंज़ूरी पर निर्भर · आँकड़े आपके बिल अपलोड और साइट यील्ड अनुमान से।"
        : "Subsidy subject to MNRE / DISCOM approval · figures derived from your bill upload and site yield assumptions.",
      verdictLabel: hi ? "प्लांट इंजीनियर की सलाह" : "PLANT ENGINEER'S ADVICE",
      verdict: hi
        ? "नेट निवेश के आँकड़े ऊपर हैं — प्लांट की बात अलग है: ऐरे को अपने असली बिल पैटर्न से साइज़ करें, फिर इन्वर्टर चुनें ताकि DC/AC लगभग 1.1–1.25 रहे। सही स्ट्रिंग वोल्टेज और साउथ-फेसिंग टिल्ट इन्वर्टर की उम्र बचाते हैं और सालाना यूनिट बढ़ाते हैं — बिना बेकार AC क्षमता के।"
        : "The capital numbers are above — the plant rule is different: size the array to your real bill pattern first, then pick the inverter so DC/AC sits near 1.1–1.25. Correct string voltage and a south-facing tilt protect inverter life and lift annual units — without wasting roof on unused AC headroom.",
    },
    emi: {
      eyebrow: hi ? "वित्तपोषण" : "Financing",
      title: hi ? "EMI लेआउट" : "EMI Layout",
      lead: hi
        ? "नेट निवेश को अवधि में बाँटें — अक्सर आपके मासिक बिल के करीब।"
        : "Spread the net investment across tenures — often comparable to the bill you already settle every month.",
      rateLabel: hi ? "मानी गई ब्याज दर" : "Assumed interest rate",
      rateValue: (pct: string) => (hi ? `${pct}% प्रति वर्ष` : `${pct}% p.a.`),
      tenure: hi ? "अवधि" : "Tenure",
      interest: hi ? "ब्याज (अनु.)" : "Interest (est.)",
      interestAt: (pct: string) =>
        hi ? `ब्याज (अनु.) · @${pct}%` : `Interest (est.) · @${pct}%`,
      monthlyEmi: hi ? "मासिक EMI" : "Monthly EMI",
      emiEmpty: hi
        ? "EMI विकल्प आपके लेंडिंग पार्टनर से तय होंगे। सामान्य अवधि: नेट लागत पर 3–7 वर्ष।"
        : "EMI options will be confirmed with your preferred lending partner. Typical tenures: 3–7 years against the net project cost.",
      refNet: hi ? "संदर्भ नेट लागत" : "Reference net cost",
      vsBill: hi ? "मासिक बिल बनाम" : "Vs. monthly bill",
      gridSpend: hi ? "वर्तमान लगभग ग्रिड खर्च" : "Current approx. grid spend",
      disclaimer: (pct: string) =>
        hi
          ? `संकेतक EMI ~${pct}% प्रति वर्ष रिटेल दर मानती है; अंतिम मंज़ूरी, शुल्क और अवधि लेंडर के अधीन। हम दस्तावेज़ में मदद करते हैं — मंज़ूरी बैंक / NBFC की।`
          : `Indicative EMIs assume ~${pct}% p.a. retail rate; final sanction, processing fees, and tenure are at the lender's discretion. We assist with documentation — approval rests with the bank / NBFC.`,
      verdictLabel: hi ? "सोलर साइंस नोट" : "SOLAR SCIENCE NOTE",
      verdict: hi
        ? "क्रिस्टलाइन मॉड्यूल आमतौर पर प्रति वर्ष ~0.4–0.7% डिग्रेड होते हैं। 5–7 वर्ष के लोन के अंत तक प्लांट अभी भी नामप्लेट यील्ड का लगभग 96–98% देता है — इसलिए लोन खत्म होने के बाद के वर्ष ज़्यादातर ‘मुफ़्त’ सोलर यूनिट हैं, जबकि ग्रिड टैरिफ अक्सर बढ़ता रहता है।"
        : "Crystalline modules typically degrade ~0.4–0.7% per year. By the end of a 5–7 year loan the plant still delivers about 96–98% of nameplate yield — so post-tenure years are mostly free solar kilowatt-hours, while grid tariffs usually keep rising.",
    },
    eng: {
      tag: hi ? "05 // इंजीनियरिंग डिज़ाइन" : "05 // ENGINEERING DESIGN",
      title: hi ? "ऐरे और पावर आर्किटेक्चर।" : "Array & Power Architecture.",
      roofPlan: hi ? "रूफ ऐरे प्लान" : "ROOF ARRAY PLAN",
      siteMetrics: hi ? "साइट और ऐरे मेट्रिक्स" : "SITE & ARRAY METRICS",
      location: hi ? "स्थान / अक्षांश आधार" : "Location / latitude basis",
      locationHint: hi
        ? "दक्षिण मुखी ऐरे वार्षिक फोटॉन कैप्चर बेहतर बनाता है।"
        : "South-facing array optimizes annual photon capture.",
      roofArea: hi ? "आवश्यक छत क्षेत्र" : "Required roof area",
      stringTopo: hi ? "स्ट्रिंग टोपोलॉजी" : "String topology",
      stringHint: hi ? "डुअल MPPT इनपुट · शेड-टॉलरेंट ट्रैकिंग।" : "Dual MPPT inputs · shade-tolerant tracking.",
      specificYield: hi ? "विशिष्ट यील्ड" : "Specific yield",
      arch: hi ? "सिस्टम आर्किटेक्चर" : "SYSTEM ARCHITECTURE",
      archLead: hi
        ? "DC उत्पादन → सुरक्षा → कन्वर्ज़न → AC सुरक्षा → DISCOM नेट मीटर"
        : "DC generation → protection → conversion → AC protection → DISCOM net meter",
      la: hi ? "लाइटनिंग अरेस्टर" : "Lightning arrestor",
      earth: hi ? "कॉपर अर्थिंग" : "Copper earthing",
      cable: hi ? "केबल क्लास" : "Cable class",
      verdictLabel: hi ? "ज़्यादा यूनिट कैसे पाएँ" : "HOW TO GET MORE UNITS",
      verdict: hi
        ? "पैनल दक्षिण मुखी रखें, टिल्ट अपने शहर के अक्षांश के करीब रखें, सूखे महीनों में हर कुछ हफ़्ते धूल साफ़ करें, और किसी पेड़ या पानी की टंकी की छाया एक कोने पर भी न आने दें — एक मॉड्यूल पर छाया पूरे स्ट्रिंग की बिजली घटा सकती है।"
        : "Keep panels facing south, set tilt near your city’s latitude, wash dust every few weeks in dry months, and never let a tree or tank shade even one corner — shade on a single module can cut power from the whole string.",
    },
    bom: {
      tag: hi ? "06 // सामग्री सूची" : "06 // BILL OF MATERIALS",
      title: hi ? "सिलिकॉन और स्टील लेजर।" : "The Silicon & Steel Ledger.",
      lead: hi
        ? "सात अलग परतें — उत्पादन, कन्वर्ज़न, स्ट्रक्चर, DC सुरक्षा, AC सुरक्षा, सर्ज/केबलिंग और अर्थिंग।"
        : "Seven distinct layers — generation, conversion, structure, DC protection, AC protection, surge/cabling, and earthing. No duplicated safety line.",
      verdictLabel: hi ? "एक्सपर्ट सलाह" : "EXPERT ADVICE",
      verdict: hi
        ? "अच्छे मॉड्यूल और इन्वर्टर तभी ज़्यादा यूनिट देते हैं जब केबल सही मोटाई की हों, जोड़ कसकर लगे हों, और पैनल साफ़ रहें। ढीला कनेक्शन या धूल भरा शीशा वही हार्डवेयर बेकार कर देता है जिसके पैसे आपने दिए।"
        : "Good modules and an inverter only deliver more units when cables are the right size, joints stay tight, and the glass stays clean. A loose connection or a dusty panel wastes the hardware you paid for.",
    },
    impact: {
      tag: hi ? "07 // स्वच्छ प्रभाव" : "07 // CLEAN IMPACT",
      title: hi ? "आपका स्वच्छ ऊर्जा प्रभाव।" : "Your Clean Energy Impact.",
      lead: hi
        ? "आपकी छत पर सोलर घर पर स्वच्छ बिजली बनाता है। ग्रिड से कम कोयला बिजली। परिवार के लिए साफ़ हवा — कई वर्षों तक।"
        : "Solar on your roof makes clean power at home. Less coal power from the grid. Cleaner air for your family — for many years.",
      co2Label: hi ? "CO₂ बचाव · जीवनकाल" : "CO₂ AVOIDED · LIFETIME",
      tonnes: hi ? "टन" : "tonnes",
      co2Note: hi
        ? "लगभग पेट्रोल कार को वर्षों तक सड़क से हटाने जितना — आपके सिस्टम आकार और वार्षिक उत्पादन से अनुमान।"
        : "About the same as taking a petrol car off the road for years — estimated from your system size and yearly generation.",
      heroArtLabel: hi ? "≈ पेट्रोल कार कम" : "≈ FEWER PETROL KM",
      likePlanting: hi ? "पेड़ लगाने जैसा" : "LIKE PLANTING",
      treesHint: hi ? "प्लांट जीवन में पेड़" : "trees over the plant life",
      cleanPower: hi ? "स्वच्छ बिजली / वर्ष" : "CLEAN POWER / YEAR",
      unitsHint: hi ? "आपकी छत से यूनिट" : "units from your roof",
      forHome: hi ? "आपके घर के लिए" : "FOR YOUR HOME",
      years25: hi ? "25 वर्ष" : "25 years",
      homeHint: hi ? "साफ़ स्थानीय हवा, कम बिल" : "cleaner local air, lower bills",
      chartHead: hi ? "स्वच्छ यूनिट — पहले 5 वर्ष" : "CLEAN UNITS — FIRST 5 YEARS",
      chartSteady: hi ? "हर साल स्थिर स्वच्छ बिजली" : "Steady clean power each year",
      chartSameLine: hi ? "समान हर वर्ष" : "SAME EACH YEAR",
      chartFoot: hi
        ? "हर साल वही स्वच्छ यूनिट — जबकि ग्रिड बिजली अभी भी कोयला जलाती।"
        : "Same clean units, year after year — while grid power would still burn coal.",
      verdictLabel: hi ? "एक्सपर्ट सलाह" : "EXPERT ADVICE",
      verdict: hi
        ? "कोयला प्लांट हर यूनिट के साथ CO₂ के अलावा PM2.5 और NOx भी छोड़ते हैं। छत का सोलर ग्रिड की गंदी बैकअप बिजली घटाता है — इसलिए फायदा सिर्फ़ स्प्रेडशीट का टन नहीं: आपके इलाके की हवा असल में साफ़ होती है जब मीटर रिवर्स चलता है।"
        : "Coal plants that back the grid release PM2.5 and NOx with every kilowatt-hour — not only CO₂. Rooftop solar trims that dirty backup power, so the benefit is not just tonnes on a spreadsheet: the air on your street improves in real time as your meter runs backward.",
    },
    pay: {
      tag: hi ? "08 // भुगतान प्रणाली" : "08 // PAYMENT SYSTEM",
      title: hi ? "आप कैसे भुगतान करें।" : "How You Pay.",
      lead: hi
        ? "आप चार साफ़ चरणों में भुगतान करते हैं। हर भुगतान अगला काम खोलता है — बुकिंग से स्विच-ऑन तक।"
        : "You pay in four clear steps. Each payment unlocks the next stage of work — from booking to switch-on.",
      projectValue: hi ? "दिखाई गई परियोजना मूल्य" : "Project value shown",
      netAfter: hi ? "सब्सिडी के बाद नेट लगभग" : "net after subsidy about",
      ofValue: hi ? "परियोजना मूल्य का · इस चरण पर देय" : "of project value · due at this stage",
      scheduleHead: hi ? "भुगतान चरण" : "PAYMENT STAGES",
      scheduleHint: hi ? "चार चरण · चरण दर चरण" : "Four stages · pay as work progresses",
      stageDue: hi ? "इस चरण पर देय" : "due at this stage",
      bankEyebrow: hi ? "विक्रेता बैंक खाता" : "VENDOR BANK ACCOUNT",
      bankTitle: hi ? "केवल इसी खाते में भुगतान करें" : "Pay only to this account",
      bankNote: hi
        ? "एडवांस और सभी माइलस्टोन ट्रांसफ़र के लिए ये विवरण उपयोग करें। भुगतान स्क्रीनशॉट रखें।"
        : "Use these details for advance and all milestone transfers. Keep the payment screenshot for your records.",
      accountName: hi ? "खाता नाम" : "Account name",
      accountNo: hi ? "खाता संख्या" : "Account number",
      ifsc: "IFSC",
      upi: "UPI",
      bankEmpty: hi
        ? "बैंक विवरण आधिकारिक इनवॉइस / बुकिंग पुष्टि पर साझा होंगे। किसी व्यक्तिगत खाते में ट्रांसफ़र न करें।"
        : "Bank details will be shared on the official invoice / booking confirmation. Please do not transfer to any personal account.",
      rules: hi ? "भुगतान नियम" : "PAYMENT RULES",
      verdictLabel: hi ? "प्रोजेक्ट डायरेक्टर का निष्कर्ष" : "PROJECT DIRECTOR'S VERDICT",
      verdict: hi
        ? "चरण दर चरण भुगतान करें — बुकिंग, सामग्री, इंस्टॉल, फिर कमीशनिंग। ऊपर दिए विक्रेता बैंक खाते का ही उपयोग करें।"
        : "Pay stage by stage — booking, material, installation, then commissioning. Always use the vendor bank account above so every rupee is tracked against work on your roof.",
      defaultTitles: hi
        ? (["एडवांस (बुकिंग)", "सामग्री डिलीवरी", "इंस्टॉलेशन", "कमीशनिंग"] as const)
        : (["Advance (Booking)", "Material Delivery", "Installation", "Commissioning"] as const),
    },
    terms: {
      tag1: hi ? "09 / शर्तें और अनुपालन" : "09 / TERMS & COMPLIANCE",
      tag2: hi ? "10 / शर्तें और अनुपालन (जारी)" : "10 / TERMS & COMPLIANCE (CONTD.)",
      title: hi ? "नियम और शर्तें" : "Terms & Conditions",
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
      amcCost: hi ? "06 · रखरखाव की लागत" : "06 · Cost of Maintenance",
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
    close: {
      series: hi ? "11 · समापन" : "11 · CLOSING",
      privateOffer: hi ? "निजी प्रस्ताव" : "PRIVATE OFFER",
      title: hi ? "जब आप तैयार हों।" : "Ready when you are.",
      lead: hi
        ? "हाँ कहें — कागज़ात, इंस्टॉल योजना और स्विच-ऑन शुरू। इसी प्रस्ताव जैसी सावधानी के साथ।"
        : "Say yes — and we begin paperwork, the install plan, and switch-on with the same care shown in this proposal.",
      preparedFor: hi ? "के लिए तैयार" : "Prepared for",
      vendor: hi ? "विक्रेता" : "Vendor",
      nextHead: hi ? "आगे का रास्ता" : "YOUR PATH FORWARD",
      nextHint: hi ? "चार चरण · बुकिंग → स्विच-ऑन" : "Four stages · booking → switch-on",
      stepTitles: hi
        ? (["पुष्टि व एडवांस", "दस्तावेज़", "डिज़ाइन लॉक", "इंस्टॉल व ऑन"] as const)
        : (["Confirm & pay", "Documents", "Design lock", "Install & on"] as const),
      steps: hi
        ? [
            "स्वीकार करें · बैंक में एडवांस।",
            "बिल, ID, स्वामित्व प्रमाण।",
            "साइट जाँच · डिज़ाइन लॉक।",
            "इंस्टॉल · नेट-मीटर · ऑन।",
          ]
        : [
            "Accept · pay booking advance.",
            "Bill, ID, ownership proof.",
            "Site check · lock design.",
            "Install · net-meter · on.",
          ],
      clientAccept: hi ? "ग्राहक स्वीकृति" : "Client acceptance",
      authSign: hi ? "अधिकृत हस्ताक्षर" : "Authorized signature",
      sigDate: hi ? "हस्ताक्षर और तारीख" : "Signature & date",
      contact: hi ? "शुरू करें" : "Begin here",
      contactHint: hi ? "कॉल या WhatsApp" : "Call or WhatsApp",
      finalLabel: hi ? "एक्सपर्ट सलाह" : "EXPERT ADVICE",
      final: hi
        ? "स्विच-ऑन के बाद पहले 90 दिन मॉनिटर रखें: ऐप में रोज़ का उत्पादन देखें। अगर कोई दिन साफ़ धूप में भी बहुत कम दिखे, तुरंत बताएँ — जल्दी पकड़ी गई वायरिंग / शैडिंग समस्या सालों की यूनिट बचाती है।"
        : "Watch the first 90 days after switch-on: check daily generation in the app. If a clear sunny day looks unusually low, tell us early — catching a wiring or shading issue fast protects years of units.",
      sealReady: hi ? "तैयार" : "READY",
    },
    common: {
      unit: hi ? "यू" : "u",
    },
  };
}

export type LuxeCopy = ReturnType<typeof getLuxeCopy>;
