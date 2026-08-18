/**
 * Voltaic — EN / Hindi copy.
 * Dynamic values (names, amounts, quantities) stay out of this file.
 */

export type VoltaicLang = "en" | "hi";

export function getVoltaicCopy(lang: VoltaicLang) {
  const hi = lang === "hi";

  return {
    print: {
      downloadPdf: hi ? "PDF डाउनलोड" : "Download PDF",
      preparing: hi ? "PDF तैयार हो रही है…" : "Preparing PDF…",
      pdfFailed: hi
        ? "PDF नहीं बन सकी। कृपया दोबारा कोशिश करें।"
        : "Could not create PDF. Please try again.",
      pdfReadyTitle: hi ? "PDF तैयार है" : "Your PDF is ready",
      pdfReadyBody: hi
        ? "सेव करने के लिए Share दबाएँ, फिर “Save to Files” चुनें।"
        : "Tap Share, then choose Save to Files.",
      pdfReadyShare: hi ? "Share" : "Share",
      pdfSharing: hi ? "खुल रहा है…" : "Opening…",
      pdfReadyClose: hi ? "बंद करें" : "Close",
      langEn: "EN",
      langHi: "हिंदी",
      langAria: hi ? "भाषा चुनें" : "Choose language",
      loading: hi ? "प्रस्ताव लोड हो रहा है…" : "Loading proposal…",
      series: hi ? "इंजीनियरिंग डोज़ियर" : "Engineering dossier",
    },

    sheet: {
      client: hi ? "ग्राहक" : "Client",
      project: hi ? "परियोजना" : "Project",
      sheetNo: hi ? "शीट" : "Sheet",
      rev: hi ? "रिव" : "Rev",
      date: hi ? "दिनांक" : "Date",
      scale: hi ? "स्केल" : "Scale",
      drawn: hi ? "तैयार" : "Drawn",
      nts: hi ? "मापानुसार नहीं" : "NTS",
      status: hi ? "प्रस्ताव हेतु जारी" : "Issued for proposal",
    },

    cover: {
      docType: hi ? "सोलर पीवी — इंजीनियरिंग डोज़ियर" : "Solar PV — engineering dossier",
      preparedFor: hi ? "के लिए तैयार" : "Prepared for",
      title1: hi ? "आपकी छत," : "Your roof,",
      title2: hi ? "पूरी तरह इंजीनियर्ड।" : "fully engineered.",
      lead: hi
        ? "यह कोई सामान्य कोटेशन नहीं है। इसमें वही ड्रॉइंग, गणनाएँ और मटीरियल सूची है जो हम इंस्टॉलेशन में इस्तेमाल करते हैं — ताकि आप ठीक-ठीक जान सकें कि आपकी छत पर क्या लग रहा है।"
        : "This is not a one-page quote. It carries the same drawings, calculations and material list our installation team works from — so you know exactly what goes on your roof.",
      contents: hi ? "इस डोज़ियर में" : "Inside this dossier",
      capacity: hi ? "संयंत्र क्षमता" : "Plant capacity",
      modules: hi ? "मॉड्यूल" : "Modules",
      annual: hi ? "वार्षिक उत्पादन" : "Annual generation",
      payback: hi ? "पेबैक" : "Payback",
      sections: [
        hi ? "सोलर का तर्क" : "The case for solar",
        hi ? "निवेश और रिटर्न" : "Investment & returns",
        hi ? "ऐरे और संरचना डिज़ाइन" : "Array & structural design",
        hi ? "विद्युत डिज़ाइन (SLD)" : "Electrical design (SLD)",
        hi ? "सामग्री सूची — मुख्य उपकरण" : "Bill of materials — major plant",
        hi ? "सामग्री सूची — BOS" : "Bill of materials — BOS",
        hi ? "गुणवत्ता और कमीशनिंग" : "Quality & commissioning",
        hi ? "उत्पादन पूर्वानुमान" : "Generation forecast",
      ],
    },

    why: {
      sheet: hi ? "सोलर का तर्क" : "The case for solar",
      title: hi ? "बिजली खरीदना बंद, बनाना शुरू।" : "Stop renting power. Start owning it.",
      lead: hi
        ? "ग्रिड की दर हर साल बढ़ती है। आपकी छत पर लगा सोलर उस दर को अगले 25 साल के लिए लगभग स्थिर कर देता है।"
        : "Grid tariffs rise every year. A system on your roof fixes your cost of electricity for the next 25 years.",
      cards: [
        {
          k: "01",
          t: hi ? "बिल घटता है, पहले महीने से" : "The bill drops from month one",
          d: hi
            ? "नेट मीटर आपके द्वारा बनाई गई हर यूनिट को गिनता है। दिन में बनी अतिरिक्त बिजली ग्रिड में जाती है और आपके बिल से घट जाती है।"
            : "The net meter counts every unit you generate. Daytime surplus flows to the grid and is deducted from your bill.",
        },
        {
          k: "02",
          t: hi ? "टैरिफ बढ़ोतरी से सुरक्षा" : "A hedge against tariff hikes",
          d: hi
            ? "बिजली दर आमतौर पर हर साल बढ़ती है। सोलर से बनी यूनिट की लागत तय है — इसलिए दर जितनी बढ़ेगी, बचत उतनी बढ़ेगी।"
            : "Tariffs climb most years. Your solar unit cost is already fixed, so every hike widens the gap in your favour.",
        },
        {
          k: "03",
          t: hi ? "संपत्ति का मूल्य बढ़ता है" : "It adds value to the property",
          d: hi
            ? "लगा हुआ, प्रमाणित और नेट-मीटर से जुड़ा संयंत्र घर के साथ रहता है — यह खर्च नहीं, स्थायी सुधार है।"
            : "A commissioned, certified, net-metered plant stays with the house. It is a permanent improvement, not an expense.",
        },
        {
          k: "04",
          t: hi ? "25 वर्ष का उपकरण" : "Built to run 25 years",
          d: hi
            ? "मॉड्यूल पर 25–30 वर्ष का प्रदर्शन वारंटी मानक है। कोई चलने वाला पुर्ज़ा नहीं, इसलिए रखरखाव बहुत कम।"
            : "Modules carry 25–30 year performance warranties. No moving parts, so upkeep stays minimal.",
        },
      ],
      mythTitle: hi ? "जो अक्सर पूछा जाता है" : "What people ask us first",
      myths: [
        {
          q: hi ? "बादल या बारिश में?" : "What about clouds and monsoon?",
          a: hi
            ? "उत्पादन घटता है, रुकता नहीं। वार्षिक अनुमान में मानसून पहले से शामिल है।"
            : "Output dips, it does not stop. The annual estimate already accounts for monsoon months.",
        },
        {
          q: hi ? "छत को नुकसान?" : "Will it damage the roof?",
          a: hi
            ? "हर पेनिट्रेशन सील किया जाता है और संरचना छत पर भार समान रूप से बाँटती है।"
            : "Every penetration is sealed, and the structure spreads load evenly across the slab.",
        },
        {
          q: hi ? "सफ़ाई कितनी?" : "How much cleaning?",
          a: hi
            ? "महीने में एक बार पानी से धुलाई काफी है। हम पहले साल इसमें मदद करते हैं।"
            : "A water rinse about once a month is enough. We cover it in the first year of service.",
        },
      ],
    },

    econ: {
      sheet: hi ? "निवेश और रिटर्न" : "Investment & returns",
      title: hi ? "पैसा कहाँ जाता है, कहाँ से लौटता है।" : "Where the money goes, and how it returns.",
      gross: hi ? "कुल संयंत्र लागत" : "Gross plant cost",
      subsidy: hi ? "पीएम सूर्य घर सब्सिडी" : "PM Surya Ghar subsidy",
      net: hi ? "आपका शुद्ध निवेश" : "Your net investment",
      monthly: hi ? "मासिक बचत" : "Monthly saving",
      payback: hi ? "पेबैक अवधि" : "Payback period",
      lifetime: hi ? "25-वर्ष लाभ" : "25-year gain",
      yrs: hi ? "वर्ष" : "yrs",
      emiTitle: hi ? "फाइनेंसिंग विकल्प" : "Financing options",
      emiLead: (pct: string) =>
        hi
          ? `शुद्ध लागत पर अनुमानित EMI (~${pct}% वार्षिक)। अंतिम दर बैंक/NBFC तय करता है।`
          : `Estimated EMI on the net cost (~${pct}% p.a.). Final rate rests with the lender.`,
      tenure: hi ? "अवधि" : "Tenure",
      emi: hi ? "मासिक EMI" : "Monthly EMI",
      interest: hi ? "कुल ब्याज" : "Total interest",
      yearLabel: (y: number) => (hi ? `${y}-वर्ष ऋण` : `${y}-Year loan`),
      projTitle: hi ? "25 वर्ष की संचयी बचत" : "Cumulative saving over 25 years",
      projNote: hi
        ? "6% वार्षिक टैरिफ वृद्धि मानकर। पेबैक के बाद हर यूनिट शुद्ध लाभ है।"
        : "Assumes 6% annual tariff escalation. After payback, every unit is net gain.",
      breakEven: hi ? "पेबैक" : "Payback",
    },

    bill: {
      sheet: hi ? "बिल विश्लेषण" : "Bill analysis",
      title: hi ? "आपके पिछले 12 महीने।" : "Your last twelve months.",
      lead: hi
        ? "संयंत्र का आकार इसी खपत पर तय किया गया है — अनुमान पर नहीं।"
        : "The plant is sized against this consumption, not an assumption.",
      month: hi ? "माह" : "Month",
      units: hi ? "यूनिट" : "Units",
      energy: hi ? "ऊर्जा" : "Energy",
      fixed: hi ? "फिक्स्ड" : "Fixed",
      duty: hi ? "ड्यूटी" : "Duty",
      total: hi ? "कुल" : "Total",
      yearTotal: hi ? "वार्षिक कुल" : "Annual total",
      summerNote: hi ? "गर्मी का उछाल" : "Summer peak",
    },

    array: {
      sheet: hi ? "ऐरे और संरचना डिज़ाइन" : "Array & structural design",
      title: hi ? "छत पर क्या-क्या लगता है।" : "What actually goes on the roof.",
      lead: hi
        ? "मॉड्यूल और छत के बीच पाँच परतें होती हैं। हर परत का मटीरियल, कोटिंग और फास्टनर पहले से तय है।"
        : "Five layers sit between the module and your slab. Every layer has a defined material, coating and fastener.",
      assembly: hi ? "असेंबली सेक्शन" : "Assembly section",
      geometry: hi ? "टिल्ट, पंक्ति दूरी और पवन भार" : "Tilt, row pitch & wind case",
      stack: {
        module: hi ? "पीवी मॉड्यूल" : "PV module",
        moduleNote: hi ? "एंटी-रिफ्लेक्टिव ग्लास" : "Anti-reflective glass",
        clamp: hi ? "मिड / एंड क्लैम्प" : "Mid / end clamp",
        clampNote: hi ? "SS 304 फास्टनर" : "SS 304 fastener",
        rail: hi ? "माउंटिंग रेल" : "Mounting rail",
        railNote: hi ? "एल्युमिनियम एक्सट्रूज़न" : "Aluminium extrusion",
        leg: hi ? "सपोर्ट लेग" : "Support leg",
        legNote: hi ? "हॉट-डिप गैल्वनाइज़्ड" : "Hot-dip galvanized",
        base: hi ? "बेस प्लेट + एंकर" : "Base plate + anchor",
        baseNote: hi ? "सील्ड पेनिट्रेशन" : "Sealed penetration",
        slab: hi ? "RCC छत" : "RCC slab",
        slabNote: hi ? "मौजूदा संरचना" : "Existing structure",
        title: hi ? "माउंटिंग असेंबली" : "Mounting assembly",
        scale: hi ? "मापानुसार नहीं" : "Not to scale",
      },
      geom: {
        tilt: hi ? "ऐरे टिल्ट" : "Array tilt",
        pitch: hi ? "पंक्ति दूरी" : "Row pitch",
        clearance: hi ? "क्लियरेंस" : "Clearance",
        wind: hi ? "डिज़ाइन पवन" : "Design wind",
        uplift: hi ? "प्रति मॉड्यूल अपलिफ्ट" : "Uplift / module",
        south: hi ? "दक्षिण" : "South",
        shadow: hi ? "शीत-संक्रांति छाया" : "Winter shadow",
        title: hi ? "ऐरे ज्यामिति" : "Array geometry",
      },
      specTitle: hi ? "डिज़ाइन आधार" : "Design basis",
      specs: {
        lat: hi ? "साइट अक्षांश" : "Site latitude",
        tilt: hi ? "इंस्टॉल टिल्ट" : "Installed tilt",
        azimuth: hi ? "अज़ीमथ" : "Azimuth",
        area: hi ? "ऐरे क्षेत्रफल" : "Array area",
        wind: hi ? "पवन ज़ोन" : "Wind zone",
        pressure: hi ? "डिज़ाइन दाब" : "Design pressure",
        anchor: hi ? "एंकरिंग" : "Anchoring",
        pitch: hi ? "पंक्ति दूरी" : "Row pitch",
      },
      whyTitle: hi ? "यह टिल्ट क्यों" : "Why this tilt",
    },

    elec: {
      sheet: hi ? "विद्युत डिज़ाइन" : "Electrical design",
      title: hi ? "सिंगल-लाइन डायग्राम।" : "The single-line diagram.",
      lead: hi
        ? "पैनल से मीटर तक हर सुरक्षा उपकरण — वही ड्रॉइंग जो इंस्टॉलेशन और DISCOM निरीक्षण में इस्तेमाल होती है।"
        : "Every protective device from panel to meter — the same drawing used for installation and the DISCOM inspection.",
      stringTitle: hi ? "स्ट्रिंग साइज़िंग गणना" : "String sizing calculation",
      stringLead: (min: number, max: number) =>
        hi
          ? `सबसे ठंडी सुबह Voc बढ़ता है और सबसे गर्म दोपहर Vmp घटता है। स्ट्रिंग की लंबाई इन्हीं दो सीमाओं के बीच रखी जाती है (${min}–${max} मॉड्यूल)।`
          : `Voc rises on the coldest morning and Vmp falls on the hottest afternoon. String length is chosen to stay between those limits (${min}–${max} modules).`,
      cableTitle: hi ? "केबल शेड्यूल" : "Cable schedule",
      testNote: hi
        ? "सभी मान डिज़ाइन-चरण के अनुमान हैं; कमीशनिंग पर मापे गए मान रिपोर्ट में दर्ज होते हैं।"
        : "All values are design-stage estimates; measured values are recorded in the commissioning report.",
      cols: {
        param: hi ? "पैरामीटर" : "Parameter",
        value: hi ? "मान" : "Value",
        basis: hi ? "आधार" : "Basis",
        ref: hi ? "संदर्भ" : "Ref",
        from: hi ? "से" : "From",
        to: hi ? "तक" : "To",
        cores: hi ? "कोर" : "Cores",
        size: hi ? "साइज़" : "Size",
        length: hi ? "लंबाई" : "Length",
        current: hi ? "धारा" : "Current",
        vd: hi ? "वोल्टेज ड्रॉप" : "Volt drop",
        method: hi ? "विधि" : "Method",
      },
      params: {
        vocStc: hi ? "मॉड्यूल Voc (STC)" : "Module Voc (STC)",
        vocCold: (t: number) => (hi ? `Voc @ ${t} °C (ठंडा)` : `Voc @ ${t} °C (cold)`),
        vmpHot: (t: number) => (hi ? `Vmp @ ${t} °C (गर्म)` : `Vmp @ ${t} °C (hot)`),
        maxDc: hi ? "इन्वर्टर अधिकतम DC" : "Inverter max DC",
        perString: hi ? "मॉड्यूल प्रति स्ट्रिंग" : "Modules per string",
        strings: hi ? "स्ट्रिंग संख्या" : "String count",
        stringVoc: hi ? "स्ट्रिंग Voc (ठंडा)" : "String Voc (cold)",
        headroom: hi ? "सुरक्षा मार्जिन" : "Safety headroom",
        tempCoeff: hi ? "तापमान गुणांक" : "Temp coefficient",
      },
      sld: {
        title: hi ? "सिंगल-लाइन डायग्राम" : "Single-line diagram",
        array: hi ? "पीवी ऐरे" : "PV array",
        string: hi ? "स्ट्रिंग" : "String",
        isolator: hi ? "DC आइसोलेटर" : "DC isolator",
        dcdb: "DCDB",
        fuse: hi ? "फ्यूज़" : "Fuse",
        spd: "SPD",
        inverter: hi ? "इन्वर्टर" : "Inverter",
        acdb: "ACDB",
        mcb: "MCB",
        rcd: "RCD",
        meter: hi ? "नेट मीटर" : "Net meter",
        grid: hi ? "ग्रिड" : "Grid",
        loads: hi ? "घर का लोड" : "House loads",
        earth: hi ? "अर्थ" : "Earth",
        la: hi ? "लाइटनिंग अरेस्टर" : "Lightning arrester",
        dcSide: hi ? "DC पक्ष" : "DC side",
        acSide: hi ? "AC पक्ष" : "AC side",
      },
    },

    bom: {
      sheetMajor: hi ? "सामग्री सूची — मुख्य उपकरण" : "Bill of materials — major plant",
      sheetBos: hi ? "सामग्री सूची — बैलेंस ऑफ सिस्टम" : "Bill of materials — balance of system",
      titleMajor: hi ? "जो बिजली बनाता और थामे रखता है।" : "What generates, and what holds it up.",
      titleBos: hi ? "वह सब जो अक्सर छिपा दिया जाता है।" : "Everything most quotes leave unlisted.",
      leadMajor: hi
        ? "हर लाइन पर मेक, स्पेसिफिकेशन, मात्रा, जिस मानक पर खरीदा गया है और वारंटी — बदलाव होने पर पहले सूचित किया जाता है।"
        : "Every line carries make, specification, quantity, the standard it is bought against, and its warranty. Any substitution is told to you first.",
      leadBos: hi
        ? "कनेक्टर, अर्थिंग, सुरक्षा उपकरण और दस्तावेज़ — सिस्टम की उम्र और सुरक्षा इन्हीं पर टिकी है।"
        : "Connectors, earthing, protection and documentation. The life and safety of the system rest on exactly these parts.",
      cols: {
        ref: hi ? "क्र." : "Ref",
        item: hi ? "सामग्री" : "Item",
        make: hi ? "मेक" : "Make",
        spec: hi ? "विवरण" : "Specification",
        qty: hi ? "मात्रा" : "Qty",
        standard: hi ? "मानक" : "Standard",
        warranty: hi ? "वारंटी" : "Warranty",
      },
      subNote: hi ? "क्यों मायने रखता है" : "Why it matters",
      datasheetTitle: hi ? "मुख्य डेटाशीट पैरामीटर" : "Key datasheet parameters",
      moduleCol: hi ? "पीवी मॉड्यूल" : "PV module",
      inverterCol: hi ? "स्ट्रिंग इन्वर्टर" : "String inverter",
      ds: {
        voc: hi ? "ओपन-सर्किट वोल्टेज (Voc)" : "Open-circuit voltage (Voc)",
        vmp: hi ? "अधिकतम पावर वोल्टेज (Vmp)" : "Max-power voltage (Vmp)",
        isc: hi ? "शॉर्ट-सर्किट धारा (Isc)" : "Short-circuit current (Isc)",
        imp: hi ? "अधिकतम पावर धारा (Imp)" : "Max-power current (Imp)",
        tempCoeff: hi ? "Voc तापमान गुणांक" : "Voc temperature coefficient",
        eff: hi ? "मॉड्यूल दक्षता" : "Module efficiency",
        degradation: hi ? "वार्षिक ह्रास" : "Annual degradation",
        cells: hi ? "सेल विन्यास" : "Cell configuration",
        acOut: hi ? "AC आउटपुट" : "AC output",
        mppt: hi ? "MPPT ट्रैकर" : "MPPT trackers",
        mpptRange: hi ? "MPPT वोल्टेज रेंज" : "MPPT voltage range",
        maxDc: hi ? "अधिकतम DC इनपुट" : "Max DC input",
        peakEff: hi ? "अधिकतम दक्षता" : "Peak efficiency",
        protection: hi ? "सुरक्षा श्रेणी" : "Protection class",
        islanding: hi ? "एंटी-आइलैंडिंग" : "Anti-islanding",
        monitoring: hi ? "मॉनिटरिंग" : "Monitoring",
      },
      dsNote: hi
        ? "अंतिम ब्रांड की डेटाशीट के अनुसार मान थोड़े भिन्न हो सकते हैं; ऑर्डर से पहले पुष्टि की जाती है।"
        : "Values follow the final selected make's datasheet and are confirmed before ordering.",
    },

    quality: {
      sheet: hi ? "गुणवत्ता और कमीशनिंग" : "Quality & commissioning",
      title: hi ? "हैंडओवर से पहले हर जाँच।" : "Every check before handover.",
      lead: hi
        ? "IS/IEC 62446 के अनुसार परीक्षण। मापे गए मान कमीशनिंग रिपोर्ट में दर्ज होते हैं जो आपको सौंपी जाती है।"
        : "Testing follows IS/IEC 62446. Measured values are recorded in the commissioning report handed to you.",
      cols: {
        ref: hi ? "क्र." : "Ref",
        test: hi ? "परीक्षण" : "Test",
        method: hi ? "विधि" : "Method",
        acceptance: hi ? "स्वीकृति मानदंड" : "Acceptance",
      },
      handoverTitle: hi ? "हैंडओवर पर आपको क्या मिलता है" : "What you receive at handover",
      handover: [
        hi ? "कमीशनिंग रिपोर्ट (मापे गए मान सहित)" : "Commissioning report with measured values",
        hi ? "अंतिम सिंगल-लाइन डायग्राम" : "As-built single-line diagram",
        hi ? "मॉड्यूल और इन्वर्टर सीरियल सूची" : "Module and inverter serial list",
        hi ? "वारंटी दस्तावेज़ और डेटाशीट" : "Warranty certificates and datasheets",
        hi ? "अर्थ प्रतिरोध परीक्षण रिपोर्ट" : "Earth resistance test report",
        hi ? "नेट-मीटर और DISCOM स्वीकृति" : "Net-meter and DISCOM approval",
      ],
      standardsTitle: hi ? "लागू मानक" : "Standards applied",
      serviceTitle: hi ? "सेवा अनुसूची" : "Service schedule",
      serviceCols: {
        when: hi ? "कब" : "When",
        work: hi ? "कार्य" : "Work",
      },
      service: [
        {
          when: hi ? "मासिक" : "Monthly",
          work: hi
            ? "मॉड्यूल की पानी से सफ़ाई · जनरेशन ऐप में जाँच"
            : "Water rinse of modules · check generation in the app",
        },
        {
          when: hi ? "तिमाही (वर्ष 1)" : "Quarterly (year 1)",
          work: hi
            ? "टर्मिनल टाइटनेस · स्ट्रक्चर बोल्ट · केबल टाई जाँच"
            : "Terminal tightness · structure bolts · cable tie inspection",
        },
        {
          when: hi ? "वार्षिक" : "Annual",
          work: hi
            ? "अर्थ प्रतिरोध मापन · SPD स्थिति · इन्वर्टर एरर लॉग"
            : "Earth resistance measurement · SPD status · inverter error log",
        },
        {
          when: hi ? "मानसून से पहले" : "Pre-monsoon",
          work: hi
            ? "एनक्लोज़र सीलिंग · वॉटरप्रूफिंग और ड्रेनेज जाँच"
            : "Enclosure sealing · waterproofing and drainage check",
        },
      ],
    },

    gen: {
      sheet: hi ? "उत्पादन पूर्वानुमान" : "Generation forecast",
      title: hi ? "साल भर, महीने दर महीने।" : "Month by month, across the year.",
      lead: hi
        ? "मध्य भारत के विकिरण और मानसून के आधार पर अनुमान। गर्मियों में अधिक, मानसून में कम।"
        : "Estimated from central-India irradiance and monsoon behaviour: strong summers, softer monsoon months.",
      units: hi ? "यूनिट" : "units",
      annual: hi ? "वार्षिक" : "Annual",
      daily: hi ? "औसत दैनिक" : "Avg daily",
      best: hi ? "सर्वोत्तम माह" : "Best month",
      basisTitle: hi ? "गणना का आधार" : "Calculation basis",
      basis: {
        dc: hi ? "DC क्षमता" : "DC capacity",
        psh: hi ? "पीक सन आवर्स" : "Peak sun hours",
        pr: hi ? "परफॉर्मेंस रेशियो" : "Performance ratio",
        yield: hi ? "विशिष्ट यील्ड" : "Specific yield",
        coverage: hi ? "लोड कवरेज" : "Load coverage",
        degradation: hi ? "वार्षिक ह्रास" : "Annual degradation",
      },
    },

    impact: {
      sheet: hi ? "पर्यावरणीय प्रभाव" : "Environmental impact",
      title: hi ? "25 वर्षों में आपका योगदान।" : "What this adds up to in 25 years.",
      co2: hi ? "CO₂ रोका गया" : "CO₂ avoided",
      trees: hi ? "पेड़ों के बराबर" : "Equivalent trees",
      tons: hi ? "टन" : "tonnes",
      note: hi
        ? "भारतीय ग्रिड के औसत उत्सर्जन गुणांक पर आधारित।"
        : "Based on the average emission factor of the Indian grid.",
    },

    exec: {
      sheet: hi ? "निष्पादन और भुगतान" : "Execution & payment",
      title: hi ? "साइन से चालू होने तक।" : "From signature to switch-on.",
      lead: hi
        ? "हर चरण की जिम्मेदारी हमारी टीम की है — DISCOM की फाइल सहित।"
        : "Each stage is owned by our team, including the DISCOM paperwork.",
      payTitle: hi ? "भुगतान चरण" : "Payment stages",
      bankTitle: hi ? "बैंक विवरण" : "Bank details",
      account: hi ? "खाता" : "Account",
      ifsc: "IFSC",
      upi: "UPI",
    },

    terms: {
      sheet: hi ? "नियम और दस्तावेज़" : "Terms & documents",
      title: hi ? "शर्तें, साफ़ शब्दों में।" : "The terms, in plain words.",
      conditions: hi ? "नियम व शर्तें" : "Terms & conditions",
      documents: hi ? "आवश्यक दस्तावेज़" : "Documents required",
      warranty: hi ? "वारंटी सार" : "Warranty summary",
      item: hi ? "मद" : "Item",
      duration: hi ? "अवधि" : "Duration",
      by: hi ? "द्वारा" : "By",
      amc: hi ? "रखरखाव" : "Maintenance",
    },

    closing: {
      sheet: hi ? "स्वीकृति" : "Acceptance",
      title1: hi ? "काम शुरू करने के" : "Ready when",
      title2: hi ? "लिए तैयार।" : "you are.",
      lead: hi
        ? "इस डोज़ियर की हर संख्या आपकी छत और आपके बिल से निकली है। मंज़ूरी मिलते ही सर्वे की तारीख तय कर देते हैं।"
        : "Every number in this dossier came from your roof and your bill. Say the word and we lock a survey date.",
      units: hi ? "यूनिट / वर्ष" : "units / year",
      saved: hi ? "बचत / वर्ष" : "saved / year",
      wealth: hi ? "25-वर्ष लाभ" : "25-year gain",
      cta: hi ? "आइए शुरू करें" : "Let's begin",
      validity: hi
        ? "यह प्रस्ताव 15 दिन के लिए मान्य है। सामग्री की उपलब्धता के अनुसार दरें बदल सकती हैं।"
        : "This proposal is valid for 15 days. Rates may change with material availability.",
      signOff: hi ? "आपके सोलर पार्टनर" : "Your solar partner",
      gstin: "GSTIN",
    },
  };
}

export type VoltaicCopy = ReturnType<typeof getVoltaicCopy>;
