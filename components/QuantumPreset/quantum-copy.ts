/**
 * Quantum Glass3D — EN / Hindi UI copy.
 */

export type QuantumLang = "en" | "hi";

export function getQuantumCopy(lang: QuantumLang) {
  const hi = lang === "hi";
  return {
    print: {
      brand: hi ? "Sol.52 · क्वांटम" : "Sol.52 · Quantum",
      downloadPdf: hi ? "PDF डाउनलोड" : "Download PDF",
      langEn: "EN",
      langHi: "हिंदी",
      loading: hi ? "क्वांटम लोड हो रहा है…" : "INITIALIZING QUANTUM…",
    },
    cover: {
      confidential: hi ? "गोपनीय" : "Strictly Confidential",
      photoTitle: hi ? "एलिवेटेड रूफटॉप सोलर" : "Elevated rooftop solar",
      photoSub: hi
        ? "~20° टिल्ट · नीचे वॉकेबल टेरेस"
        : "~20° tilt · Walkable terrace below",
      preparedFor: hi ? "के लिए तैयार" : "Prepared for",
      tagline: hi ? "आपका सोलर प्रस्ताव" : "Your solar proposal",
      acCapacity: hi ? "AC क्षमता" : "AC Capacity",
      dcArray: hi ? "DC ऐरे" : "DC Array",
      moduleType: hi ? "मॉड्यूल प्रकार" : "Module Type",
      customerFallback: hi ? "ग्राहक" : "Customer",
    },
    billAudit: {
      eyebrow: hi ? "01 // बिल ऑडिट" : "01 // BILL AUDIT",
      title: hi ? "बिल ऑडिट और ब्रेकडाउन।" : "Bill Audit & Breakdown.",
      lead: hi
        ? "माह-दर-माह यूनिट, ऊर्जा शुल्क, फिक्स्ड चार्ज, ड्यूटी और कुल बिल — आपकी असली खपत का खाता।"
        : "Month-by-month units, energy charges, fixed liability, duty and net bill — the ledger from your consumption.",
      summerIncrease: hi ? "गर्मी में बिल वृद्धि" : "Summer bill increase",
      summerHint: hi ? "पीक महीनों का असर" : "Impact of peak months",
      fixedLiability: hi ? "वार्षिक फिक्स्ड देनदारी" : "Annual fixed liability",
      fixedHint: hi ? "उपयोग से स्वतंत्र" : "Independent of usage",
      solarSavings: hi ? "अनुमानित सोलर बचत" : "Estimated solar savings",
      solarHint: hi
        ? "ऊर्जा बिल में संभावित कमी"
        : "Potential energy-bill reduction",
      chartLabel: hi
        ? "मासिक बिजली बिल प्रोफ़ाइल"
        : "Monthly electricity bill profile",
      month: hi ? "माह" : "Month",
      units: hi ? "यूनिट" : "Units",
      energy: hi ? "ऊर्जा" : "Energy",
      fixed: hi ? "फिक्स्ड" : "Fixed",
      duty: hi ? "ड्यूटी" : "Duty",
      netBill: hi ? "कुल बिल" : "Net bill",
      total: hi ? "कुल" : "Total",
      peak: hi ? "पीक" : "peak",
      footnote: hi
        ? "ऊर्जा शुल्क खपत के साथ बदलता है; फिक्स्ड शुल्क उपयोग कम होने पर भी जारी रह सकता है। ड्यूटी और कुल राशि उपलब्ध बिल डेटा से ली गई है।"
        : "Energy charges vary with consumption; fixed charges may continue even when usage falls. Duty and net totals are taken from the available bill data.",
      verdictLabel: hi ? "बिल विश्लेषक का निष्कर्ष" : "Bill analyst's verdict",
      verdictWithData: (units: string, kw: string, monthCount: string) =>
        hi
          ? `आपकी ~${units} यूनिट मासिक औसत (${monthCount} महीने का बिल इतिहास) ${kw} kW AC सिस्टम से मैप होती है — साइज़िंग इसी खपत पर है, कैटलॉग अनुमान पर नहीं।`
          : `Your ~${units} unit monthly average across ${monthCount} bill months maps to a ${kw} kW AC system — sized from this consumption, not a catalogue default.`,
      verdictFallback: hi
        ? "हर महीने के यूनिट और शुल्क दिखाते हैं कि गर्मी का पीक और फिक्स्ड देनदारी कहाँ बैठती है — सोलर इसी असली बिल प्रोफ़ाइल पर कैलिब्रेट होता है।"
        : "Month-by-month units and charges show where summer peaks and fixed liability land — solar is calibrated to this real bill profile.",
    },
    eng: {
      eyebrow: hi ? "01 // इंजीनियरिंग" : "01 // ENGINEERING",
      title: hi ? "सिस्टम डिज़ाइन।" : "System Design.",
      roofPlan: hi ? "रूफ ऐरे प्लान · टॉप व्यू" : "Roof Array Plan · Top view",
      metrics: hi ? "साइट और ऐरे मेट्रिक्स" : "Site & Array Metrics",
      location: hi ? "स्थान" : "Location",
      locationNote: hi
        ? "अंतिम दिशा साइट सर्वे के बाद तय"
        : "Final direction confirmed after site survey",
      roofArea: hi ? "छत क्षेत्र" : "Roof area",
      roofAreaNote: (modules: number, sqft: number) =>
        hi
          ? `${modules} × ~${sqft} वर्ग फुट प्रति मॉड्यूल, वॉकवे सहित। सर्वे के बाद अंतिम।`
          : `${modules} × ~${sqft} sq ft per module, including walkway. Final after survey.`,
      stringLayout: hi ? "स्ट्रिंग लेआउट" : "String layout",
      stringNote: hi
        ? "पैनल सीरीज़ में इन्वर्टर तक जुड़े"
        : "Panels wired in series to the inverter",
      yearlyOutput: hi ? "वार्षिक उत्पादन" : "Yearly output",
      yearlyNote: (units: string) =>
        hi
          ? `लगभग ${units} यूनिट/वर्ष · वास्तविक उत्पादन आदर्श का ~75% · संरचना 150 km/h पवन रेटेड।`
          : `About ${units} units/year · real output ~75% of ideal · structure rated 150 km/h wind.`,
      chipDc: "DC",
      chipAc: "AC",
      chipDcAc: "DC/AC",
      chipTilt: hi ? "टिल्ट" : "TILT",
      architecture: hi ? "सिस्टम आर्किटेक्चर" : "System Architecture",
      archLead: hi
        ? "बिजली पैनलों से इन्वर्टर तक, फिर ग्रिड मीटर तक जाती है।"
        : "Power flows from the panels to the inverter, then to the grid meter.",
      archNames: hi
        ? (["मॉड्यूल्स", "DC बॉक्स", "स्ट्रिंग INV", "AC बॉक्स", "नेट मीटर"] as const)
        : (["Modules", "DC Box", "String INV", "AC Box", "Net meter"] as const),
      archSubsStatic: hi
        ? (["फ्यूज़ + SPD", "MCB + SPD", "द्वि-दिशा"] as const)
        : (["Fuse + SPD", "MCB + SPD", "Bi-directional"] as const),
      prStrip: hi
        ? "वास्तविक उत्पादन ~75% — गर्मी, इन्वर्टर और केबल हानि के बाद"
        : "Real-world output ~75% after heat, inverter, and cable losses",
      standardsFallback: hi
        ? "IS/IEC · CEA · DISCOM नेट-मीटरिंग · IS 3043 अर्थिंग"
        : "IS/IEC · CEA · DISCOM net-metering · IS 3043 earthing",
      arrayCaption: (
        modules: number,
        kw: string,
        stringLabel: string,
        watt: number
      ) =>
        hi
          ? `${modules} मॉड्यूल · ${kw} kWp DC · ${stringLabel} · दक्षिण मुख · ${watt}W`
          : `${modules} modules · ${kw} kWp DC · ${stringLabel} · facing South · ${watt}W`,
      facingSouth: hi ? "दक्षिण मुख" : "Facing South",
    },
    econ: {
      eyebrow: hi ? "02 // लागत और बचत" : "02 // COST & SAVINGS",
      title: hi ? "आपका निवेश।" : "Your Investment.",
      lead: hi
        ? "देखें आप क्या देते हैं, EMI विकल्प, कब वापस आता है, और 25 वर्षों में बचत कैसे बढ़ती है।"
        : "See what you pay, EMI options, how soon it returns, and how savings grow over 25 years.",
      youPay: hi ? "आप देते हैं (नेट)" : "You pay (net)",
      afterSubsidy: hi ? "सब्सिडी के बाद" : "After subsidy",
      saveMonth: hi ? "हर महीने बचत" : "Save every month",
      lowerBill: hi ? "बिजली बिल कम" : "Lower electricity bill",
      moneyBack: hi ? "पैसे वापस" : "Money back in",
      paybackTime: hi ? "पेबैक समय" : "Payback time",
      savings25: hi ? "25-वर्ष बचत" : "25-year savings",
      totalRelief: hi ? "कुल बिल राहत" : "Total bill relief",
      yrs: hi ? "वर्ष" : "yrs",
      priceBreakup: hi ? "कीमत ब्रेकअप" : "Price breakup",
      systemGross: hi ? "सिस्टम कीमत (सकल)" : "System price (gross)",
      subsidyEst: hi ? "MNRE सब्सिडी (अनु.)" : "MNRE subsidy (est.)",
      netYouPay: hi ? "नेट आप देते हैं" : "Net you pay",
      netMeterFees: hi ? "नेट मीटरिंग और DISCOM शुल्क" : "Net metering & DISCOM fees",
      amc5: hi ? "5-वर्ष AMC" : "5-year AMC",
      included: hi ? "शामिल" : "Included",
      yearlyBill: hi ? "वार्षिक बिजली बिल" : "Yearly electricity bill",
      beforeSolar: hi ? "सोलर से पहले" : "Before solar",
      afterSolar: hi ? "सोलर के बाद" : "After solar",
      firstYear: hi ? "पहले वर्ष की बचत:" : "First-year savings:",
      perMonth: hi ? "/महीना" : "/month",
      path25: hi ? "25-वर्ष बचत पथ" : "25-year savings path",
      pathSub: hi
        ? "पहले निवेश, पेबैक पर शून्य, फिर बचत बढ़ती है।"
        : "Starts as money you invest, crosses zero at payback, then grows as savings.",
      breakEven: hi ? "ब्रेक-ईवन" : "Break-even",
      payback: hi ? "पेबैक" : "PAYBACK",
      cumulative: hi ? "संचयी स्थिति" : "CUMULATIVE POSITION",
      chartFoot: (pb: string, lifetime: string) =>
        hi
          ? `वक्र आपके नेट खर्च से शुरू होता है, ${pb} पर ब्रेक-ईवन, फिर 25 वर्षों में लगभग ${lifetime} की ओर बढ़ता है।`
          : `Curve starts at your net cost, reaches break-even at ${pb}, then grows toward about ${lifetime} over 25 years.`,
      longTerm: hi ? "दीर्घकालिक बचत" : "long-term savings",
      financeTitle: hi ? "फाइनेंसिंग · मासिक EMI" : "Financing · Monthly EMI",
      financeLead: (rate: string) =>
        hi
          ? `नेट लागत पर ऋण अवधि — अनुमानित EMI (~${rate}% p.a.)। अंतिम दर बैंक/NBFC पर निर्भर।`
          : `Loan tenures on your net cost — estimated EMI (~${rate}% p.a.). Final rate depends on the lender.`,
      emiUnit: hi ? "/ महीना" : "/ month",
      tenureLoan: (years: number) =>
        hi ? `${years}-वर्ष ऋण` : `${years}-Year Loan`,
      interestTotal: (amt: string) =>
        hi ? `कुल ब्याज ~${amt}` : `Total interest ~${amt}`,
      emiSelected: hi ? "चुनी हुई अवधि" : "Selected tenure",
      savingsCoverEmi: hi ? "बचत EMI कवर करती है" : "Savings cover EMI",
      emiAboveSavings: hi ? "EMI बचत से अधिक" : "EMI above savings",
    },
    gen: {
      eyebrow: hi ? "03 // उत्पादन पूर्वानुमान" : "03 // GENERATION FORECAST",
      title: hi ? "मासिक उत्पादन पूर्वानुमान।" : "Monthly generation forecast.",
      lead: hi
        ? "जनवरी–दिसंबर अनुमानित यूनिट और बचत — गर्मी बनाम मानसून एक नज़र में।"
        : "Jan–Dec estimated units and savings — summer vs monsoon at a glance.",
      leadBill: hi
        ? "सोलर उत्पादन के साथ आपके बिल के मासिक यूनिट — एक ही चार्ट में तुलना।"
        : "Solar generation alongside your bill months — compared in one chart.",
      annualGen: hi ? "वार्षिक उत्पादन" : "Annual generation",
      annualGenHint: hi ? "वर्ष भर का अनुमानित योग।" : "Estimated total across the year.",
      annualSavings: hi ? "वार्षिक बचत" : "Annual savings",
      year1Hint: hi ? "वर्ष-1 अनुमानित बिल बचत।" : "Year-1 estimated bill savings.",
      about: hi ? "लगभग" : "About",
      perMonth: hi ? "/माह" : "/mo",
      unitsWord: hi ? "यूनिट" : "units",
      chartHead: hi ? "मासिक यूनिट" : "Monthly units",
      chartHint: hi ? "मौसमी प्रोफ़ाइल · मध्य भारत" : "Seasonal profile · Central India",
      legendGen: hi ? "सोलर उत्पादन" : "Solar generation",
      legendBill: hi ? "बिल खपत" : "Bill usage",
      ariaGen: hi ? "मासिक सोलर उत्पादन" : "Monthly solar generation",
      ariaBoth: hi
        ? "मासिक सोलर उत्पादन और बिल खपत"
        : "Monthly generation and bill units",
      unitsLabel: hi ? "अनुमानित यूनिट" : "Est. units",
      savingsLabel: hi ? "अनुमानित बचत" : "Est. savings",
      savingsBasis: (rate: string) =>
        hi
          ? `अनुमानित बचत = मासिक यूनिट × ₹${rate}/यूनिट प्रभावी बचत दर। फिक्स्ड चार्ज शामिल नहीं।`
          : `Estimated savings = monthly units × ₹${rate}/unit effective saving rate. Fixed charges excluded.`,
      billNote: hi
        ? "सियान बार = अनुमानित सोलर उत्पादन। सफ़ेद बार = बिल से वास्तविक खपत (जहाँ उपलब्ध)।"
        : "Cyan bars = estimated solar generation. Pale bars = actual bill usage where available.",
      verdictLabel: hi ? "मौसमी विश्लेषण" : "Seasonal analysis",
      verdict: hi
        ? "उत्पादन स्थानीय विकिरण प्रोफ़ाइल पर आधारित है। गर्मी में ऊँचा उत्पादन अक्सर ऊँचे बिल महीनों से मिलता है — बचत का मुख्य इंजन।"
        : "Generation uses a regional irradiance profile. Higher summer output often aligns with peak bill months — that overlap drives most of the savings.",
      verdictBill: hi
        ? "जहाँ बिल बार और सोलर बार दोनों ऊँचे हैं, वहीं बचत सबसे तेज़ लगती है। जिन महीनों का बिल नहीं है, वहाँ सिर्फ उत्पादन दिखता है।"
        : "Where bill bars and solar bars both run high, savings hit hardest. Months without a bill show generation only.",
      months: hi
        ? ([
            "जन",
            "फर",
            "मार",
            "अप्र",
            "मई",
            "जून",
            "जुल",
            "अग",
            "सित",
            "अक्ट",
            "नव",
            "दिस",
          ] as const)
        : ([
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ] as const),
    },
    bom: {
      eyebrow: hi ? "04 // सामग्री सूची" : "04 // BILL OF MATERIALS",
      title: hi ? "हम क्या लगाते हैं।" : "What We Install.",
      lead: hi
        ? "सात भाग — मॉड्यूल, इन्वर्टर, स्ट्रक्चर, DCDB, ACDB, लाइटनिंग + केबल, और अर्थिंग। मात्रा इंस्टॉलर BOM से।"
        : "Seven parts — modules, inverter, structure, DCDB, ACDB, lightning protection with cable, and earthing. Quantities follow the installer BOM sheet.",
      make: hi ? "मेक" : "Make",
      rows: (modules: number, watt: number, acLabel: string) =>
        hi
          ? [
              {
                num: "01",
                role: "मॉड्यूल्स",
                title: "N-Type TOPCon मॉड्यूल",
                badge: "30-वर्ष प्रदर्शन",
                body: `मात्रा ${modules} नग · ${modules} × ${watt} Wp DCR TOPCon · ≥21% दक्षता · कम वार्षिक हानि।`,
              },
              {
                num: "02",
                role: "इन्वर्टर",
                title: "ग्रिड-टाइड स्ट्रिंग इन्वर्टर",
                badge: "8–10 वर्ष OEM",
                body: `मात्रा 1 नग · ${acLabel} kW ऑन-ग्रिड · Dual MPPT · IP65 · ≥97.5% दक्षता।`,
              },
              {
                num: "03",
                role: "स्ट्रक्चर",
                title: "हॉट-डिप GI माउंटिंग स्ट्रक्चर",
                badge: "150 KM/H पवन",
                body: "मात्रा साइट अनुसार · Hot-Dip GI (IS 875) · 150 km/h पवन · सर्वे अनुसार छत फिक्सिंग।",
              },
              {
                num: "04",
                role: "DCDB",
                title: "DC डिस्ट्रीब्यूशन बॉक्स",
                badge: "1 नग · HAVELLS",
                body: "मात्रा 1 नग · Havells / प्रतिष्ठित मेक · फ्यूज़ / आइसोलेटर + Type-II SPD।",
              },
              {
                num: "05",
                role: "ACDB",
                title: "AC डिस्ट्रीब्यूशन बॉक्स",
                badge: "1 नग · HAVELLS",
                body: "मात्रा 1 नग · Havells / प्रतिष्ठित मेक · MCB/MCCB + Type-II SPD।",
              },
              {
                num: "06",
                role: "सर्ज और केबल",
                title: "लाइटनिंग अरेस्टर + DC/AC केबलिंग",
                badge: "LA 1 सेट · 4 SQMM",
                body: "LA: 1 सेट · 2 मी. DC/AC केबल: 4 sqmm (Polycab / Anchor) — आवश्यकतानुसार।",
              },
              {
                num: "07",
                role: "अर्थिंग",
                title: "कॉपर अर्थिंग किट + अर्थ केबल",
                badge: "3 सेट · 17 MM",
                body: "अर्थिंग: 3 सेट · 17 mm कॉपर। अर्थ केबल: 4 sqmm। इन्वर्टर, DCDB/ACDB और LA बॉन्ड।",
              },
            ]
          : [
              {
                num: "01",
                role: "MODULES",
                title: "N-Type TOPCon Modules",
                badge: "30-YEAR PERFORMANCE",
                body: `Qty ${modules} Nos · ${modules} × ${watt} Wp DCR TOPCon · ≥21% efficiency · low yearly loss.`,
              },
              {
                num: "02",
                role: "INVERTER",
                title: "Grid-Tied String Inverter",
                badge: "8–10 YEAR OEM",
                body: `Qty 1 Nos · ${acLabel} kW on-grid · Dual MPPT · IP65 · ≥97.5% efficiency.`,
              },
              {
                num: "03",
                role: "STRUCTURE",
                title: "Hot-Dip GI Mounting Structure",
                badge: "150 KM/H WIND",
                body: "Qty as per site · Hot-Dip GI (IS 875) · 150 km/h wind load · roof fixing as surveyed.",
              },
              {
                num: "04",
                role: "DCDB",
                title: "DC Distribution Box",
                badge: "1 NOS · HAVELLS",
                body: "Qty 1 Nos · Havells / reputed make · Fuse / isolator + Type-II SPD (array to inverter).",
              },
              {
                num: "05",
                role: "ACDB",
                title: "AC Distribution Box",
                badge: "1 NOS · HAVELLS",
                body: "Qty 1 Nos · Havells / reputed make · MCB/MCCB + Type-II SPD (inverter to meter).",
              },
              {
                num: "06",
                role: "SURGE & CABLE",
                title: "Lightning Arrestor + DC/AC Cabling",
                badge: "LA 1 SET · 4 SQMM",
                body: "LA: 1 Set · 2 mtr. DC/AC cable: 4 sqmm (Polycab / Anchor) — meters as needed.",
              },
              {
                num: "07",
                role: "EARTHING",
                title: "Copper Earthing Kit + Earth Cable",
                badge: "3 SET · 17 MM",
                body: "Earthing: 3 Set · 17 mm copper. Earth cable: 4 sqmm as needed. Bonds inverter, DCDB/ACDB, and LA.",
              },
            ],
    },
    impact: {
      eyebrow: hi ? "05 // पर्यावरण" : "05 // ENVIRONMENT",
      title: hi ? "स्वच्छ ऊर्जा प्रभाव।" : "Clean Energy Impact.",
      lead: hi
        ? "आपका सोलर प्लांट घर पर स्वच्छ बिजली बनाता है — कम ग्रिड, कम कार्बन, 25 वर्षों तक हरित पदचिह्न।"
        : "Your solar plant makes clean power at home — less grid power, less carbon, and a greener footprint for 25 years.",
      co2Label: hi ? "टन CO₂ बचाए" : "Tonnes CO₂ avoided",
      co2Sub: hi ? "सिस्टम जीवन भर" : "Over system life",
      treesLabel: hi ? "पेड़ों के बराबर" : "Trees equivalent",
      treesSub: hi ? "वैसा ही कार्बन लाभ" : "Same carbon benefit",
      unitsLabel: hi ? "स्वच्छ यूनिट / वर्ष" : "Clean units / year",
      unitsSub: hi ? "अनुमानित उत्पादन" : "Estimated generation",
      simple: hi ? "सरल शब्दों में" : "In simple words",
      carbonCut: hi ? "कार्बन कट" : "Carbon cut",
      tonnesCo2: hi ? "टन CO₂" : "tonnes CO₂",
      likePlanting: hi ? "पेड़ लगाने जैसा" : "Like planting",
      trees: hi ? "पेड़" : "trees",
      likeCars: hi ? "सड़क से कारें हटाने जैसा" : "Like taking cars off road",
      carsYear: hi ? "कार / वर्ष" : "cars / year",
      plantSize: hi ? "प्लांट आकार" : "Plant size",
      rooftopKw: hi ? "kW रूफटॉप सोलर" : "kW rooftop solar",
      units5: hi ? "5 वर्षों में स्वच्छ यूनिट" : "Clean units over 5 years",
      units5Sub: hi
        ? "यदि प्लांट हर वर्ष अनुमान के अनुसार चले तो संचयी उत्पादन।"
        : "Cumulative generation if the plant runs as estimated each year.",
      footer: hi
        ? "घर की स्वच्छ बिजली · कम कार्बन · परिवार के लिए हरित विकल्प"
        : "Clean home power · lower carbon · greener choice for your family",
    },
    pay: {
      eyebrow: hi ? "06 // भुगतान और हस्ताक्षर" : "06 // PAYMENT & SIGN-OFF",
      title: hi ? "भुगतान योजना।" : "Payment Plan.",
      leadWithValue: (project: string, netPart: string) =>
        hi
          ? `परियोजना मूल्य: ${project}${netPart}। नीचे विक्रेता खाते में चरणबद्ध भुगतान करें।`
          : `Project value: ${project}${netPart}. Pay stage-wise into the vendor account below.`,
      netAfter: hi ? " · सब्सिडी के बाद नेट: " : " · Net after subsidy: ",
      leadFallback: hi
        ? "More सेटिंग्स के विक्रेता बैंक खाते में चरणबद्ध भुगतान करें।"
        : "Pay stage-wise into the vendor bank account from More settings.",
      planTitle: hi ? "भुगतान योजना" : "Payment plan",
      bankTitle: hi ? "विक्रेता बैंक" : "Vendor bank",
      bankNote: hi ? "केवल इसी खाते में भुगतान करें" : "Pay only to this account",
      name: hi ? "नाम" : "Name",
      acNumber: hi ? "खाता संख्या" : "A/C number",
      ifsc: "IFSC",
      upi: "UPI",
      branch: hi ? "शाखा" : "Branch",
      bankEmpty: hi
        ? "More → Brand settings में बैंक जोड़ें।"
        : "Add bank in More → Brand settings.",
      rulesTitle: hi ? "भुगतान नियम" : "Payment rules",
      rulesFoot: hi
        ? "पूर्ण नियम व शर्तें अगले पृष्ठों पर जारी हैं।"
        : "Full terms & conditions continue on the next pages.",
      sceneAlt: hi
        ? "भारतीय घर की छत — ऊपर से एलिवेटेड सोलर प्लांट और मिनी गार्डन"
        : "Indian home rooftop — elevated solar plant and mini garden from above",
      signatures: hi ? "हस्ताक्षर" : "Signatures",
      customer: hi ? "ग्राहक" : "Customer",
      installer: hi ? "इंस्टॉलर" : "Installer",
      customerFallback: hi ? "ग्राहक का नाम" : "Customer Name",
      stage: hi ? "चरण" : "Stage",
      disclaimer: hi
        ? "हस्ताक्षर करके दोनों पक्ष इस भुगतान योजना और प्रस्ताव की पूर्ण शर्तों से सहमत होते हैं।"
        : "By signing, both parties agree to this payment plan and the full terms & conditions in this proposal.",
      defaultSteps: hi
        ? [
            { title: "एडवांस", desc: "बुकिंग और सामग्री ऑर्डर", percent: 25 },
            { title: "सामग्री", desc: "साइट पर उपकरण डिलीवरी", percent: 50 },
            { title: "इंस्टॉलेशन", desc: "स्ट्रक्चर और पैनल माउंटिंग", percent: 20 },
            { title: "कमीशनिंग", desc: "टेस्टिंग और नेट-मीटर सक्रियण", percent: 5 },
          ]
        : [
            { title: "Advance", desc: "Booking and material order", percent: 25 },
            { title: "Material", desc: "Delivery of equipment at site", percent: 50 },
            { title: "Installation", desc: "Structure and panel mounting", percent: 20 },
            { title: "Commissioning", desc: "Testing and net-meter activation", percent: 5 },
          ],
      defaultRules: hi
        ? [
            "प्रस्ताव जारी तिथि से 30 दिनों तक मान्य।",
            "अंतिम कीमत साइट सर्वे के बाद बदल सकती है।",
            "सब्सिडी MNRE / DISCOM मंज़ूरी पर निर्भर।",
            "नेट मीटरिंग का समय आपके स्थानीय DISCOM पर निर्भर।",
          ]
        : [
            "Proposal valid for 30 days from issue date.",
            "Final price may change after site survey.",
            "Subsidy depends on MNRE / DISCOM approval.",
            "Net metering timing depends on your local DISCOM.",
          ],
    },
    terms: {
      eyebrow: hi ? "07 // नियम और शर्तें" : "07 // TERMS & CONDITIONS",
      eyebrowCont: hi
        ? "07 // नियम और शर्तें · जारी"
        : "07 // TERMS & CONDITIONS · CONT.",
      title: hi ? "नियम और शर्तें।" : "Terms & Conditions.",
      title2: hi ? "सुरक्षा, दायरा और AMC।" : "Safety, Scope & AMC.",
      intro1: hi
        ? "कृपया इन शर्तों को ध्यान से पढ़ें। इनमें वारंटी, दस्तावेज़, समयसीमा और ग्राहक का दायरा शामिल है।"
        : "Please read these terms carefully. They cover warranties, documents, timelines, and what is in the customer's scope.",
      intro2: hi
        ? "इस प्रस्ताव के लिए सुरक्षा नियम, ग्राहक जिम्मेदारियाँ और वार्षिक रखरखाव विवरण।"
        : "Safety rules, customer responsibilities, and annual maintenance details for this proposal.",
      general: hi ? "01 · सामान्य शर्तें" : "01 · General terms",
      docs: hi ? "02 · आवश्यक दस्तावेज़" : "02 · Documents required",
      safety: hi ? "03 · सुरक्षा और सुरक्षा उपकरण" : "03 · Safety & protection",
      clientScope: hi ? "04 · ग्राहक का दायरा" : "04 · Customer scope",
      amcScope: hi ? "05 · वार्षिक रखरखाव — दायरा" : "05 · Annual maintenance — scope",
      amcCost: hi ? "06 · रखरखाव की लागत" : "06 · Cost of maintenance",
      counsel: hi
        ? "काम शुरू होने से पहले प्रतियाँ तैयार रखें — इससे सब्सिडी और नेट-मीटरिंग में देरी नहीं होती।"
        : "Keep copies ready before work starts — this avoids delays in subsidy and net-metering.",
      availablePlans: hi ? "उपलब्ध योजनाएँ:" : "Available plans:",
      amcIncludes: hi ? "AMC में शामिल:" : "AMC includes:",
      amcExcludes: hi ? "AMC में शामिल नहीं:" : "AMC does not include:",
      paymentNotes: hi ? "भुगतान नोट्स:" : "Payment notes:",
      year1: hi
        ? "वर्ष 1: AMC / बेसिक O&M सिस्टम कोट के साथ शामिल है।"
        : "Year 1: AMC / basic O&M is included with the system as quoted.",
      year2: hi
        ? "वर्ष 2 से: आपसी समझौते के अनुसार शुल्क"
        : "Year 2 onwards: charged as per mutual agreement",
      refInvoice: hi ? "संदर्भ इनवॉइस:" : "reference invoice:",
      invoiceValue: hi ? "इनवॉइस मूल्य" : "invoice value",
      regards: hi ? "सादर," : "With regards,",
      partner: hi ? "आपका सोलर पार्टनर" : "Your solar partner",
      generalTerms: hi
        ? [
            {
              label: "लोड परिवर्तन",
              text: "DISCOM लोड परिवर्तन, या पोल से मीटर तक केबल परिवर्तन और लायजन — यदि आवश्यक हो — ग्राहक के दायरे में है।",
            },
            {
              label: "वैधानिक शुल्क",
              text: "नेट-मीटरिंग, सब्सिडी और DISCOM मंज़ूरी के सरकारी शुल्क ग्राहक सीधे भुगतान करता है।",
            },
            {
              label: "बकाया",
              text: "यदि लोड बढ़ाने की आवश्यकता हो तो प्रक्रिया से पहले पिछले DISCOM बिल/बकाया चुकाएँ।",
            },
            {
              label: "इन्वर्टर वारंटी",
              text: "इन्वर्टर वारंटी निर्माता अनुसार (स्ट्रिंग इन्वर्टर पर आमतौर पर 8–10 वर्ष)।",
            },
            {
              label: "मॉड्यूल वारंटी",
              text: "उत्पाद 15 वर्ष; प्रदर्शन वर्ष 30 पर ≥80%। अन्य भाग: कमीशनिंग से 1 वर्ष।",
            },
            {
              label: "वारंटी दायरा",
              text: "केवल निर्माण दोष। शारीरिक क्षति, दुरुपयोग या तोड़फोड़ कवर नहीं।",
            },
            {
              label: "रखरखाव",
              text: "नियमित मॉड्यूल सफाई (साप्ताहिक अनुशंसित) ग्राहक के दायरे में है।",
            },
            {
              label: "समयसीमा",
              text: "एडवांस से 30–40 कार्य दिवसों में इंस्टॉलेशन, सहमत PO / शेड्यूल अनुसार।",
            },
            {
              label: "शासन शर्तें",
              text: "यहाँ न लिखी शर्तें आपसी लिखित समझौते से नियंत्रित होती हैं।",
            },
            {
              label: "रिफंड",
              text: "यदि लागू: फाइनलाइज़ेशन राशि पर 2.5% कटौती और दस्तावेज़ी खर्च के बाद।",
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
      defaultDocs: hi
        ? [
            "नवीनतम बिजली बिल (स्पष्ट प्रति)",
            "PAN कार्ड की प्रति",
            "आधार कार्ड की प्रति",
            "स्वामित्व प्रमाण — टैक्स रसीद / सेल डीड",
            "पासपोर्ट साइज़ फोटो",
            "हस्ताक्षरित SLD (हमारा ड्राफ्ट)",
          ]
        : [
            "Latest electricity bill (clear copy)",
            "PAN card copy",
            "Aadhaar card copy",
            "Ownership proof — tax receipt / sale deed",
            "Passport-size photograph",
            "Signed SLD (draft provided by us)",
          ],
      amcObjective: hi
        ? "AMC उत्पादन जाँच और सुरक्षा विज़िट को शेड्यूल पर रखता है।"
        : "AMC keeps generation checks and safety visits on schedule.",
      amcIncludesList: hi
        ? [
            "आवधिक प्लांट प्रदर्शन निगरानी",
            "नियमित निवारक रखरखाव",
            "आपातकालीन ब्रेकडाउन (48 कार्य घंटों में)",
            "वारंटी सहायता के लिए OEM समन्वय",
          ]
        : [
            "Periodic plant performance monitoring",
            "Routine preventive maintenance",
            "Emergency breakdown (within 48 working hours)",
            "OEM coordination for warranty support",
          ],
      amcExcludesList: hi
        ? [
            "शारीरिक क्षति, चोरी या तोड़फोड़",
            "बाहरी प्रभाव से मॉड्यूल ग्लास बदलना",
            "DISCOM मीटरिंग शुल्क और सरकारी चार्ज",
          ]
        : [
            "Physical damage, theft, or vandalism",
            "Module glass replacement from external impact",
            "DISCOM metering fees and government charges",
          ],
      clientScopeList: hi
        ? [
            "साइट सुरक्षा / चौकीदारी",
            "प्लांट का बीमा (यदि चाहें)",
            "मॉनिटरिंग के लिए स्थिर इंटरनेट (यदि लागू)",
            "रखरखाव हेतु पानी और सहायक बिजली",
            "OEM दिशानिर्देश अनुसार नियमित मॉड्यूल सफाई",
            "अनुरोध पर DISCOM / नगरपालिका पत्र",
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
            "जब शुल्क लगे, अग्रिम (अर्धवार्षिक) देय।",
            "न्यूनतम O&M: 2 वर्ष, आपसी सहमति से बढ़ाया जा सकता है।",
          ]
        : [
            "When charged, fees are payable in advance (half-yearly).",
            "Minimum O&M: 2 years, extendable by mutual consent.",
          ],
      safetyNotes: hi
        ? [
            "ACDB / DCDB या इन्वर्टर कवर न खोलें — केवल प्रशिक्षित तकनीशियन।",
            "लाइटनिंग अरेस्टर और अर्थिंग जुड़े रखें; अर्थ लीड न काटें।",
            "आइसोलेशन ट्रिप या जलने की गंध तुरंत बताएँ; बार-बार रीसेट न करें।",
          ]
        : [
            "Do not open ACDB / DCDB or inverter covers — trained technicians only.",
            "Keep lightning arrestor and earthing bonded; do not disconnect earth leads.",
            "Report isolation trips or burning smell immediately; do not reset repeatedly.",
          ],
    },
  };
}

export type QuantumCopy = ReturnType<typeof getQuantumCopy>;
