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
      installerFallback: hi ? "इंस्टॉलर" : "Installer",
      units: hi ? "यूनिट" : "Units",
      unitsShort: hi ? "यू" : "U",
      years: hi ? "साल" : "Yrs",
      section: (n: string) => (hi ? `सेक्शन ${n}` : `SECTION ${n}`),
    },
    cover: {
      docNo: hi ? "दस्तावेज़ संख्या" : "DOCUMENT NUMBER",
      issueDate: hi ? "जारी करने की तारीख" : "DATE OF ISSUE",
      photoAlt: hi
        ? "भारतीय छत पर सोलर पैनल, नीचे सोफा और मिनी गार्डन में खुश पति-पत्नी"
        : "Indian rooftop solar above a terrace sofa and mini garden with a happy couple",
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
      sidebarTitle: hi ? ["सोलर", "कैसे चलता है।"] : ["How Solar", "Works."],
      sidebarBlurb: hi
        ? "धूप छत पर पड़ती है। पैनल बिजली बनाते हैं। इनवर्टर उसे घर के लिए ठीक करता है। बची यूनिट ग्रिड में जाती है।"
        : "Sunlight hits the roof. Panels make power. The inverter makes it safe for the home. Extra units go to the grid.",
      pageHeader: hi ? "धूप से घर तक" : "From sunlight to your home",
      storyEyebrow: hi ? "जनरेशन कैसे होती है" : "HOW GENERATION WORKS",
      stepSun: hi ? "धूप" : "Sunlight",
      stepSunHint: hi
        ? "सूरज की रोशनी आपकी छत पर पड़ती है।"
        : "Sunlight falls on your roof all day.",
      stepPanels: hi ? "पैनल" : "Panels",
      stepPanelsHint: (count: number, watt: number) =>
        count > 0 && watt > 0
          ? hi
            ? `${count} × ${watt}W पैनल रोशनी को DC बिजली बनाते हैं।`
            : `${count} × ${watt}W panels turn light into DC power.`
          : hi
            ? "पैनल रोशनी को DC बिजली बनाते हैं।"
            : "Panels turn light into DC power.",
      stepInverter: hi ? "इनवर्टर" : "Inverter",
      stepInverterHint: hi
        ? "यह DC को 230V AC में बदलता है — पंखे, लाइट, सॉकेट के लिए।"
        : "It changes DC into 230V AC for fans, lights, and sockets.",
      stepHome: hi ? "पहले घर" : "Home first",
      stepHomeHint: hi
        ? "घर पहले इस बिजली का इस्तेमाल करता है। बची यूनिट DISCOM ग्रिड में जाती है।"
        : "The house uses this power first. Extra units go to the DISCOM grid.",
      specEyebrow: hi ? "इस सिस्टम के आँकड़े" : "THIS SYSTEM",
      labelDc: "DC",
      labelAc: "AC",
      labelLight: hi ? "रोशनी" : "LIGHT",
      labelHome: hi ? "घर" : "HOME",
      labelGrid: hi ? "ग्रिड" : "GRID",
      plateEyebrow: hi ? "जनरेशन कैसे होती है" : "HOW GENERATION WORKS",
      plateDwg: hi ? "प्लेट A · ऑन-ग्रिड" : "PLATE A · ON-GRID",
      callModule: hi ? "मॉड्यूल" : "Module",
      callArray: hi ? "ऐरे" : "Array",
      callInverter: hi ? "इनवर्टर" : "Inverter",
      callHome: hi ? "घर" : "Home",
      callGrid: hi ? "ग्रिड" : "Grid",
      callHomeHint: hi ? "पहले घर का लोड" : "Home load first",
      callGridHint: hi ? "नेट मीटर एक्सपोर्ट" : "Net-meter export",
      photonEyebrow: hi ? "एनर्जी कैस्केड" : "ENERGY CASCADE",
      photonSun: hi ? "फोटॉन" : "Photons",
      photonDc: hi ? "DC हार्वेस्ट" : "DC harvest",
      photonAc: hi ? "कन्वर्ज़न" : "Conversion",
      photonOut: hi ? "डिलीवरी" : "Delivery",
      photonSunHint: hi ? "सूरज की रोशनी" : "Incident light",
      legendEyebrow: hi ? "लाइव स्पेसिफिकेशन" : "LIVE SPECIFICATION",
      tiltDim: (deg: number) => (hi ? `टिल्ट ${deg}°` : `TILT ${deg}°`),
      year1Dim: (units: string) =>
        hi ? `पहला साल ${units} यू` : `YEAR 1 ${units} u`,
      schematicEyebrow: hi ? "पावर फ्लो स्कीमैटिक" : "POWER FLOW SCHEMATIC",
      totalArray: hi ? "कुल ऐरे" : "Total Array",
      acOutput: hi ? "AC आउटपुट" : "AC Output",
      dcAcRatio: hi ? "DC/AC अनुपात" : "DC/AC Ratio",
      topology: hi ? "टोपोलॉजी" : "Topology",
      onGrid: hi ? "ऑन-ग्रिड" : "ON-GRID",
      pvArray: hi ? "PV ऐरे" : "PV ARRAY",
      inverter: hi ? "इनवर्टर" : "INVERTER",
      localLoad: hi ? "घर का लोड" : "LOCAL LOAD",
      utilityGrid: hi ? "यूटिलिटी ग्रिड" : "UTILITY GRID",
      prioritySync: hi ? "पहले घर" : "Priority Sync",
      netMetering: hi ? "नेट मीटरिंग" : "Net Metering",
      mpptSuffix: hi ? "kW MPPT" : "kW MPPT",
      dcWatts: (count: number, watt: number) =>
        count > 0 && watt > 0
          ? hi
            ? `${count}× ${watt}W DC`
            : `${count}x ${watt}W DC`
          : "—",
      prDerating: hi ? "असली यूनिट (PR)" : "HONEST UNITS (PR)",
      prBlurb: hi
        ? "गर्मी, केबल और इनवर्टर थोड़ी ऊर्जा ले लेते हैं। PR बताता है कि धूप का कितना हिस्सा असल यूनिट बनता है।"
        : "Heat, cables, and the inverter use a little energy. PR is the share of sunlight that actually becomes units.",
      prFormulaAria: hi
        ? "PR बराबर E ग्रिड बटे P नॉम गुणा H बटे G STC"
        : "PR equals E grid over P nom times H over G STC",
      nodeDc: hi ? "DC सोर्स मैट्रिक्स" : "DC Source Matrix",
      nodeAc: hi ? "कन्वर्ज़न कोर" : "Conversion Core",
      nodeGrid: hi ? "दो-तरफ़ा गेटवे" : "Bi-Directional Gateway",
      nodeGridSpec: hi ? "DISCOM नेट मीटर" : "DISCOM NET METER",
      nodeDcDesc: (count: number, watt: number, make: string) => {
        const who = make ? ` ${make}` : "";
        if (count > 0 && watt > 0) {
          return hi
            ? `${count} × ${watt}W${who} मॉड्यूल छत की धूप पकड़ते हैं।`
            : `${count} × ${watt}W${who} modules capturing sunlight on this roof.`;
        }
        return hi
          ? `${who ? `${make} ` : ""}सोलर मॉड्यूल छत की धूप पकड़ते हैं।`
          : `${make ? `${make} ` : ""}solar modules capturing sunlight on this roof.`;
      },
      nodeAcDesc: (make: string) =>
        make
          ? hi
            ? `${make} ऑन-ग्रिड स्ट्रिंग इनवर्टर DC को घर और ग्रिड के लिए 230V AC में बदलता है।`
            : `${make} on-grid string inverter converting DC into 230V AC for the home and grid.`
          : hi
            ? "ऑन-ग्रिड स्ट्रिंग इनवर्टर DC को घर और ग्रिड के लिए 230V AC में बदलता है।"
            : "On-grid string inverter converting DC into 230V AC for the home and grid.",
      nodeGridDesc: hi
        ? "दो-तरफ़ा नेट मीटर: घर पहले इस्तेमाल करता है, बची बिजली DISCOM ग्रिड में जाती है।"
        : "Two-way net meter: the home uses power first, and extra units go to the DISCOM grid.",
      bentoSize: hi ? "सिस्टम साइज़" : "System Size",
      bentoRatio: hi ? "DC/AC अनुपात" : "DC/AC Overclock",
      bentoPr: hi ? "परफॉर्मेंस रेशियो" : "Performance Ratio",
      step1: hi ? "01 / सोलर पैनल" : "01 / SOLAR PANELS",
      dcTitle: (kwp: string) => (hi ? `${kwp} kWp DC ऐरे` : `${kwp} kWp DC Array`),
      dcTitleEmpty: hi ? "DC ऐरे" : "DC Array",
      step1Hint: (modules: number, watt: number) =>
        modules > 0 && watt > 0
          ? hi
            ? `${modules} × ${watt}W पैनल जो धूप पकड़ते हैं।`
            : `${modules} × ${watt}W panels that capture sunlight.`
          : hi
            ? "सोलर पैनल जो धूप पकड़ते हैं।"
            : "Solar panels that capture sunlight.",
      step2: hi ? "02 / इनवर्टर" : "02 / INVERTER",
      acTitle: (kw: string) => (hi ? `${kw} kW AC आउटपुट` : `${kw} kW AC Output`),
      acTitleEmpty: hi ? "AC आउटपुट" : "AC Output",
      step2Hint: hi
        ? "DC बिजली को घर के लिए AC में बदलता है।"
        : "Converts DC power to AC power for your home.",
      step3: hi ? "03 / ग्रिड" : "03 / GRID",
      gridTitle: hi ? "दो-तरफ़ा नेट मीटर" : "Two-way Net Meter",
      step3Hint: hi
        ? "बची बिजली आपके लोकल DISCOM ग्रिड में जाती है।"
        : "Extra power goes to your local DISCOM grid.",
      keyNumbers: hi ? "मुख्य आँकड़े" : "KEY NUMBERS",
      dcAc: hi ? "DC / AC अनुपात" : "DC / AC ratio",
      modules: hi ? "मॉड्यूल" : "Modules",
      panelBrand: hi ? "पैनल ब्रांड" : "Panel brand",
      inverterBrand: hi ? "इनवर्टर ब्रांड" : "Inverter brand",
      annualGen: hi ? "सालाना उत्पादन" : "Annual generation",
      coverage: hi ? "लोड कवरेज" : "Load coverage",
      tilt: hi ? "ऐरे टिल्ट" : "Array tilt",
      pr: hi ? "अनुमानित परफॉर्मेंस रेशियो (PR)" : "Estimated performance ratio (PR)",
      wind: hi ? "पवन प्रतिरोध" : "Wind resistance",
    },
    econ: {
      sidebarTitle: hi ? ["प्रोजेक्ट", "लागत।"] : ["Project", "Cost."],
      sidebarBlurb: hi
        ? "साफ प्रोजेक्ट लागत, बाद में आने वाली सब्सिडी, और 25 साल की बचत।"
        : "Clear project cost, subsidy credited later, and savings over 25 years.",
      pageHeader: hi ? "निवेश सारांश" : "Investment Summary",
      netCost: hi ? "सब्सिडी के बाद नेट" : "Net after subsidy",
      projectCost: hi ? "प्रोजेक्ट लागत" : "Project cost",
      breakdown: hi ? "लागत विवरण" : "COST BREAKDOWN",
      gross: hi ? "कुल सिस्टम लागत" : "Gross system cost",
      subsidy: hi ? "सब्सिडी (बाद में)" : "Subsidy (later)",
      youPay: hi ? "सब्सिडी के बाद" : "After subsidy",
      subsidyNote: hi
        ? "सब्सिडी मंज़ूरी के बाद आती है। भुगतान सकल राशि पर है।"
        : "Subsidy is credited after approval. Payments follow the gross amount.",
      lifetime: hi ? "आजीवन बचत" : "LIFETIME SAVINGS",
      lifetimeHint: hi ? "25 साल की कुल बचत" : "Total savings over 25 years",
      payback: hi ? "पेबैक" : "PAYBACK",
      paybackHint: hi ? "अनुमानित पेबैक समय" : "Estimated payback time",
      financeTitle: hi ? "फाइनेंसिंग · मासिक EMI" : "Financing · Monthly EMI",
      financeLead: (rate: string) =>
        rate
          ? hi
            ? `अनुमानित EMI (~${rate}% वार्षिक)। अंतिम दर बैंक/NBFC पर निर्भर।`
            : `Estimated EMI (~${rate}% p.a.). Final rate depends on the lender.`
          : hi
            ? "अनुमानित EMI। अंतिम दर बैंक/NBFC पर निर्भर।"
            : "Estimated EMI. Final rate depends on the lender.",
      emiUnit: hi ? "/ महीना" : "/ month",
      tenureLoan: (years: number) =>
        hi ? `${years}-साल ऋण` : `${years}-Year Loan`,
      interestTotal: (amt: string) =>
        hi ? `कुल ब्याज ~${amt}` : `Total interest ~${amt}`,
      emiSelected: hi ? "चुनी हुई अवधि" : "Selected tenure",
      savingsCoverEmi: hi ? "बचत EMI कवर करती है" : "Savings cover EMI",
      emiAboveSavings: hi ? "EMI बचत से अधिक" : "EMI above savings",
    },
    hardware: {
      sidebarTitle: hi ? ["हार्डवेयर", "सूची।"] : ["Hardware", "List."],
      sidebarBlurb: hi
        ? "पैनल, इनवर्टर, स्ट्रक्चर, केबल और सुरक्षा — पूरा मटीरियल लिस्ट।"
        : "Panels, inverter, structure, cables, and protection — the full material list.",
      pageHeader: hi ? "हम क्या लगाएँगे" : "What We Will Install",
      pageHeaderMore: hi ? "मटीरियल (जारी)" : "Materials (continued)",
      brand: hi ? "ब्रांड" : "Brand",
      spec: hi ? "स्पेक" : "Spec",
      warranty: hi ? "वारंटी" : "Warranty",
      panelTitle: hi ? "सोलर पैनल" : "Solar Panels",
      panelDesc: (modules: number, watt: number) =>
        modules > 0 && watt > 0
          ? hi
            ? `${modules} × ${watt}W सोलर पैनल इस छत के लिए।`
            : `${modules} × ${watt}W solar panels for this roof.`
          : hi
            ? "सोलर पैनल इस छत के लिए।"
            : "Solar panels for this roof.",
      inverterTitle: hi ? "ग्रिड-टाई इनवर्टर" : "Grid-Tie Inverter",
      inverterDesc: (kw: string) =>
        kw
          ? hi
            ? `${kw} kW इनवर्टर पैनल की बिजली घर के लिए बदलता है।`
            : `A ${kw} kW inverter that converts panel power for your home.`
          : hi
            ? "इनवर्टर पैनल की बिजली घर के लिए बदलता है।"
            : "An inverter that converts panel power for your home.",
      structureTitle: hi ? "माउंटिंग स्ट्रक्चर" : "Mounting Structure",
      structureDesc: hi
        ? "माउंटिंग स्ट्रक्चर पैनल को छत पर सुरक्षित रखने के लिए।"
        : "Mounting structure to hold the panels safely on the roof.",
      chosen: hi
        ? "इस रूफटॉप प्रोजेक्ट के लिए चुना गया।"
        : "Chosen for this rooftop project.",
    },
    impact: {
      co2Label: hi ? "CO₂ बचाव" : "CO₂ avoided",
      treesLabel: hi ? "पेड़ों के बराबर" : "Equal to trees",
    },
    bill: {
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
      monthUse: hi ? "मासिक उपयोग" : "Monthly use",
    },
    forecast: {
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
      bank: hi ? "बैंक विवरण" : "Bank details",
      account: hi ? "खाता" : "Account",
      ifsc: hi ? "IFSC" : "IFSC",
      upi: hi ? "UPI" : "UPI",
      accountName: hi ? "खाता नाम" : "Account name",
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
      sidebarTitle: hi ? ["नियम", "और शर्तें।"] : ["Terms", "& Conditions."],
      sidebarBlurb: hi
        ? "कीमत, सब्सिडी, भुगतान, वारंटी और कानून।"
        : "Price, subsidy, payments, warranty, and governing law.",
      pageHeader: hi ? "नियम और शर्तें" : "Terms & Conditions",
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
      c5: (brand: string, panelYrs: string, inverterYrs: string, workYrs: string) => {
        const panelBit = panelYrs ? (hi ? `पैनल ${panelYrs}` : `${panelYrs} panel`) : "";
        const invBit = inverterYrs
          ? hi
            ? `इनवर्टर ${inverterYrs}`
            : `${inverterYrs} inverter`
          : "";
        const bits = [panelBit, invBit].filter(Boolean).join(hi ? " और " : " and ");
        const workBit = workYrs
          ? hi
            ? ` ${workYrs} वर्कमैनशिप वारंटी`
            : ` a ${workYrs} workmanship warranty`
          : hi
            ? " वर्कमैनशिप वारंटी"
            : " a workmanship warranty";
        return hi
          ? `प्रोडक्ट वारंटी निर्माताओं की ओर से है${bits ? ` (${bits})` : ""}। ${brand} इंस्टॉलेशन पर${workBit} देता है। पैनल साफ रखना आपकी ज़िम्मेदारी है, जब तक अलग AMC न लिया हो।`
          : `Product warranties come from the manufacturers${bits ? ` (${bits})` : ""}. ${brand} gives${workBit} on the installation. You must clean the panels unless you take a separate AMC.`;
      },
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
        ? "भारतीय छत पर बड़ा रूफटॉप सोलर प्लांट"
        : "Large rooftop solar plant on an Indian building",
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
