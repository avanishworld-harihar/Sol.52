/**
 * HT-Commercial — EN / Hindi UI copy.
 * Dedicated preset for HT (High Tension) industrial & large commercial clients.
 */

export type HtCommercialLang = "en" | "hi";

export function getHtCommercialCopy(lang: HtCommercialLang) {
  const hi = lang === "hi";
  return {
    print: {
      downloadPdf: hi ? "PDF डाउनलोड" : "Download PDF",
      pdfBuilding: hi ? "PDF बन रही है…" : "Building PDF…",
      pdfFailed: hi ? "PDF निर्यात विफल। पुनः प्रयास करें।" : "PDF export failed. Please try again.",
      pdfReadyTitle: hi ? "PDF तैयार" : "PDF ready",
      pdfReadyBody: hi
        ? "Share दबाकर Files में सहेजें।"
        : "Tap Share to save this proposal to Files.",
      pdfReadyShare: hi ? "Share" : "Share",
      pdfSharing: hi ? "Share खोल रहे हैं…" : "Opening share…",
      pdfReadyClose: hi ? "बंद करें" : "Close",
      langEn: "EN",
      langHi: "हिंदी",
    },
    cover: {
      badge: hi ? "HT औद्योगिक सौर प्रस्ताव" : "HT Industrial Solar Proposal",
      title: hi ? "एनर्जी कॉस्ट ऑप्टिमाइज़ेशन प्लान" : "Energy Cost Optimization Plan",
      sub: hi
        ? "kWh बिलिंग, ToD सोलर विंडो (TOD3) और डिमांड चार्ज को ध्यान में रखकर बना विश्लेषण।"
        : "An analysis built around kWh billing, the TOD3 solar window and demand charges.",
      preparedFor: hi ? "के लिए तैयार" : "Prepared for",
      systemLabel: hi ? "प्रस्तावित सिस्टम" : "Proposed system",
      savingsLabel: hi ? "अनुमानित वार्षिक बचत" : "Estimated annual savings",
    },
    audit: {
      title: hi ? "HT बिल प्रोफ़ाइल" : "HT Bill Profile",
      lead: hi
        ? "आपके बिल से लिए गए मुख्य HT पैरामीटर।"
        : "Key HT parameters taken from your bill.",
      contractDemand: hi ? "कॉन्ट्रैक्ट डिमांड" : "Contract Demand",
      maxDemand: hi ? "अधिकतम डिमांड (MD)" : "Maximum Demand (MD)",
      powerFactor: hi ? "औसत पावर फैक्टर" : "Avg Power Factor",
      kvahBilled: hi ? "kVAh मीटरड / माह (सूचना)" : "kVAh metered / month (info)",
      supplyVoltage: hi ? "सप्लाई वोल्टेज" : "Supply Voltage",
      demandUtil: hi ? "डिमांड उपयोग (MD ÷ CD)" : "Demand utilization (MD ÷ CD)",
    },
    pf: {
      title: hi ? "पावर फैक्टर और APFC" : "Power Factor & APFC",
      lead: hi
        ? "MP में HT एनर्जी बिलिंग kWh पर होती है। कम PF पर अलग से PF सरचार्ज लग सकता है — इसे सोलर नहीं, APFC पैनल से ठीक करें।"
        : "In MP, HT energy is billed on kWh. A low PF can attract a separate PF surcharge — fix it with an APFC panel, not solar alone.",
      formulaLabel: hi ? "सोलर ऑफसेट (MP)" : "Solar offset (MP)",
      formula: "kWh saved ≈ Solar kWh offset in TOD3 (solar hours)",
      insightTitle: hi ? "APFC सिफारिश" : "APFC recommendation",
      insightBody: hi
        ? "सोलर इन्वर्टर ग्रिड-साइड पावर फैक्टर सरचार्ज अपने आप नहीं हटाता। PF सुधार और सरचार्ज बचत के लिए APFC / कैपेसिटर-बैंक पैनल लगाना सही उपाय है। सोलर की बचत अलग — एनर्जी (kWh) और ToD ऑफसेट पर आधारित है।"
        : "A solar inverter does not by itself eliminate grid-side power-factor surcharge. An APFC / capacitor-bank panel is the right remediation for PF improvement and surcharge avoidance. Solar savings are separate — based on kWh energy and ToD offset.",
      billedOn: hi ? "बिलिंग आधार" : "Billing basis",
      billedOnValue: hi ? "kWh (MPERC — HT/EHT)" : "kWh (MPERC — HT/EHT)",
      effectiveRate: hi ? "प्रभावी दर (बिल / स्लैब)" : "Effective rate (bill / slabs)",
      kvahSaved: hi ? "अनुमानित वार्षिक kWh ऑफसेट (TOD3)" : "Estimated annual kWh offset (TOD3)",
    },
    tod: {
      title: hi ? "ToD सेविंग्स विंडो" : "ToD Savings Window",
      lead: hi
        ? "सोलर केवल TOD3 (सोलर आवर्स, −20% रिबेट) की खपत घटाता है। TOD1 रात (−7.5%/−10%), TOD2/TOD4 पीक (+20%) बिना BESS बचे रहते हैं।"
        : "Solar offsets only TOD3 (solar hours, −20% rebate). TOD1 night (−7.5%/−10%) and TOD2/TOD4 peak (+20%) remain without BESS.",
      zoneLabel: (zone: string) => zone,
      solarWindow: hi ? "सोलर विंडो (TOD3)" : "Solar window (TOD3)",
      nonSolarWindow: hi ? "नॉन-सोलर (रात/पीक)" : "Non-solar (night/peak)",
      daytimeShare: hi ? "TOD3 खपत का हिस्सा" : "TOD3 consumption share",
      cappedNote: hi
        ? "सोलर उत्पादन TOD3 खपत से अधिक है — अतिरिक्त बेस-रेट क्रेडिट / BESS पर विचार करें।"
        : "Solar generation exceeds TOD3 consumption — consider base-rate banking credit / BESS for the surplus.",
      insightTitle: hi ? "ToD इंटेलिजेंस" : "Time-of-Day Intelligence",
      insightBody: hi
        ? "सेविंग्स सिर्फ़ TOD3 सोलर-आवर यूनिट्स (−20% नेट रेट) पर गिनी गई हैं। शाम के पीक सरचार्ज बने रहेंगे जब तक BESS न जोड़ा जाए।"
        : "Savings are counted only on TOD3 solar-hour units (net −20% rate). Evening peak surcharges remain until a BESS is added.",
    },
    demand: {
      title: hi ? "डिमांड चार्ज — स्थिर" : "Demand Charges — Held Constant",
      body: hi
        ? "बिना बैटरी (BESS) के सोलर बिलिंग डिमांड (kVA) नहीं घटाता। इसलिए ROI गणना में डिमांड चार्ज जस के तस रखे गए हैं — बचत सिर्फ़ एनर्जी साइड पर दिखाई गई है।"
        : "Without batteries (BESS), solar does not reduce billing demand (kVA). Demand charges are therefore held constant in the ROI — savings are shown on the energy side only.",
      annualLabel: hi ? "वार्षिक डिमांड चार्ज (स्थिर)" : "Annual demand charges (fixed)",
    },
    ad: {
      title: hi ? "एक्सेलरेटेड डेप्रिसिएशन (धारा 32)" : "Accelerated Depreciation (Section 32)",
      lead: hi
        ? "व्यवसायों के लिए वर्ष-1 का बड़ा टैक्स लाभ — 40% WDV दर से।"
        : "A major year-1 tax benefit for businesses — at 40% WDV.",
      plantCost: hi ? "प्लांट लागत (सकल)" : "Plant cost (gross)",
      depreciationY1: hi ? "वर्ष-1 डेप्रिसिएशन (40%)" : "Year-1 depreciation (40%)",
      taxRate: hi ? "कॉर्पोरेट टैक्स दर" : "Corporate tax rate",
      taxBenefit: hi ? "वर्ष-1 टैक्स बचत" : "Year-1 tax saved",
      note: hi
        ? "गणना सांकेतिक है — अंतिम लाभ आपकी टैक्स स्थिति और CA की सलाह पर निर्भर करता है।"
        : "Indicative computation — final benefit depends on your tax position and CA advice.",
    },
    summary: {
      title: hi ? "निवेश सारांश" : "Investment Summary",
      systemSize: hi ? "सिस्टम क्षमता" : "System capacity",
      annualGen: hi ? "वार्षिक सोलर उत्पादन" : "Annual solar generation",
      energySavings: hi ? "वार्षिक एनर्जी बचत" : "Annual energy savings",
      grossCost: hi ? "परियोजना लागत" : "Project cost",
      paybackNote: hi
        ? "एनर्जी बचत + वर्ष-1 टैक्स लाभ मिलाकर प्रभावी पेबैक और तेज़ होता है।"
        : "Energy savings plus the year-1 tax shield make the effective payback even faster.",
    },
    space: {
      title: hi ? "जगह की आवश्यकता और इंजीनियरिंग" : "Space Requirement & Engineering",
      lead: hi
        ? "RCC छत और इंडस्ट्रियल शेड — दोनों के लिए अलग स्ट्रक्चर, अलग जगह। साइट सर्वे में अंतिम लेआउट तय होगा।"
        : "RCC roof and industrial shed need different structures and different areas. The final layout is fixed at site survey.",
      rccTitle: hi ? "RCC छत (फ्लैट रूफ)" : "RCC Roof (Flat)",
      rccStructure: hi
        ? "एलिवेटेड/बैलास्ट GI स्ट्रक्चर · ~20° टिल्ट · कतारों में छाया-गैप + वॉकवे"
        : "Elevated/ballast GI structure · ~20° tilt · shadow gaps between rows + walkways",
      shedTitle: hi ? "इंडस्ट्रियल शेड (टिन/मेटल)" : "Industrial Shed (Tin/Metal)",
      shedStructure: hi
        ? "फ्लश-माउंट रेल स्ट्रक्चर · शीट के ढलान पर सीधे पैनल · कोई अलग छाया-गैप नहीं"
        : "Flush-mount rail structure · panels follow the sheet slope · no separate shadow gaps",
      areaLabel: hi ? "अनुमानित क्षेत्र" : "Estimated area",
      perKwRcc: hi ? "~10 m²/kWp (छाया-गैप सहित)" : "~10 m²/kWp (incl. shadow gaps)",
      perKwShed: hi ? "~6 m²/kWp (फ्लश माउंट)" : "~6 m²/kWp (flush mount)",
      panelsLabel: hi ? "मॉड्यूल संख्या" : "Module count",
      structureLabel: hi ? "स्ट्रक्चर" : "Structure",
      whichBetter: hi ? "कौन सा बेहतर?" : "Which is better?",
      whichBetterBody: hi
        ? "शेड पर प्लांट सस्ता और कॉम्पैक्ट बैठता है (कम स्ट्रक्चर लागत)। RCC पर टिल्ट अनुकूल होने से प्रति kWp उत्पादन थोड़ा बेहतर मिलता है, पर जगह ~1.7× लगती है। मिक्स लेआउट भी संभव है।"
        : "A shed plant is cheaper and more compact (less structure cost). RCC allows an optimal tilt for slightly better per-kWp yield but needs ~1.7× the area. A mixed layout is also possible.",
    },
    analysis: {
      pageTitle1: hi ? "डिसीज़न एनालिसिस — आपकी ज़रूरत" : "Decision Analysis — Your Need, Decoded",
      lead1: hi
        ? "बिल के जटिल आंकड़ों को सरल भाषा में — क्या ज़रूरत है, कितना फायदा है।"
        : "The bill's complex numbers in plain language — what you need and what you gain.",
      needTitle: hi ? "आपकी असली ज़रूरत" : "Your actual need",
      needDayLoad: hi ? "दिन की खपत (TOD3 / माह)" : "Daytime consumption (TOD3 / month)",
      needIdealSize: hi ? "दिन-लोड के हिसाब से आदर्श प्लांट" : "Ideal plant for daytime load",
      needProposed: hi ? "प्रस्तावित प्लांट" : "Proposed plant",
      verdictRight: hi
        ? "प्रस्तावित साइज़ आपके दिन-लोड के अनुरूप है — हर सोलर यूनिट सीधे महंगी ग्रिड यूनिट की जगह लेगी।"
        : "The proposed size matches your daytime load — every solar unit directly replaces an expensive grid unit.",
      verdictOver: hi
        ? "प्रस्तावित साइज़ दिन-लोड से बड़ा है — अतिरिक्त यूनिट बेस रेट पर बैंक होंगी। BESS या साइज़ घटाने पर विचार करें।"
        : "The proposed size exceeds the daytime load — surplus units bank at base rate. Consider BESS or a smaller size.",
      verdictUnder: hi
        ? "दिन-लोड प्रस्तावित साइज़ से बड़ा है — भविष्य में विस्तार की गुंजाइश है।"
        : "Daytime load exceeds the proposed size — there is headroom to expand later.",
      mpercTitle: hi ? "MPERC नियम — सरल भाषा में" : "MPERC rules — in plain language",
      mpercRules: (vals: { billingDemand: string; nightPct: string }) =>
        hi
          ? [
              `बिल हमेशा kWh (यूनिट) पर बनता है — kVAh सिर्फ़ मीटर में दिखता है, पैसा kWh पर लगता है।`,
              `डिमांड चार्ज कभी माफ नहीं होता: MD कम भी हो तो कम-से-कम 90% कॉन्ट्रैक्ट डिमांड (${vals.billingDemand}) का बिल बनेगा। सोलर इसे नहीं घटाता।`,
              `दिन 9AM–5PM (TOD3) की यूनिट्स पर −20% रिबेट है — सोलर इसी विंडो की यूनिट्स हटाता है।`,
              `शाम/सुबह की पीक यूनिट्स पर +20% सरचार्ज है — यह सोलर से नहीं बचता, BESS से बचता है।`,
              `रात 10PM–6AM पर ${vals.nightPct} रिबेट (मौसम के अनुसार) मिलता है।`,
              `PF 0.90 से नीचे जाए तो PF सरचार्ज लगता है — इलाज APFC पैनल है, सोलर नहीं।`,
            ]
          : [
              `Bills are always computed on kWh (units) — kVAh only appears on the meter; money is charged on kWh.`,
              `Demand charges are never waived: even if MD is low, at least 90% of contract demand (${vals.billingDemand}) is billed. Solar does not reduce this.`,
              `Daytime 9AM–5PM (TOD3) units get a −20% rebate — solar removes exactly these units.`,
              `Morning/evening peak units carry a +20% surcharge — solar cannot avoid it; a BESS can.`,
              `Night 10PM–6AM units get a ${vals.nightPct} rebate (seasonal).`,
              `If PF drops below 0.90, a PF surcharge applies — the fix is an APFC panel, not solar.`,
            ],
      pageTitle2: hi ? "एक्शन प्लान — आगे क्या करें" : "Action Plan — What To Do Next",
      lead2: hi
        ? "ग्राहक और वेंडर — दोनों के लिए सीधे कदम, ताकि HT की तकनीकी उलझन न रहे।"
        : "Clear steps for both customer and vendor, so HT technicalities never block the project.",
      customerTitle: hi ? "ग्राहक के लिए" : "For the customer",
      customerSteps: hi
        ? [
            "नेट-मीटरिंग आवेदन DISCOM (MPPKVVCL) में जमा करें — CD में कोई बदलाव नहीं होगा।",
            "प्लांट साइज़ दिन-लोड (TOD3) के अनुसार तय करें — बड़ी बचत यहीं है।",
            "PF सुधार के लिए APFC पैनल अलग से लगवाएँ — PF सरचार्ज सीधा बचेगा।",
            "Section 32 AD का लाभ CA से confirm कर के बुक करें (40% WDV × टैक्स दर)।",
            "शाम की पीक लागत ज़्यादा हो तो अगले चरण में BESS का आकलन कराएँ।",
          ]
        : [
            "File the net-metering application with the DISCOM (MPPKVVCL) — contract demand stays unchanged.",
            "Size the plant to the daytime (TOD3) load — that is where the real savings are.",
            "Install an APFC panel separately for PF correction — it directly avoids the PF surcharge.",
            "Confirm and book the Section 32 AD benefit with your CA (40% WDV × tax rate).",
            "If evening peak costs are heavy, evaluate a BESS as the next phase.",
          ],
      vendorTitle: hi ? "वेंडर के लिए" : "For the vendor",
      vendorSteps: hi
        ? [
            "बिल से 4 चीज़ें पढ़ें: CD, बिलिंग डिमांड (90% नियम), TOD3 यूनिट्स, PF — यही पूरा HT गणित है।",
            "सेविंग्स सिर्फ़ TOD3 ऑफसेट × (रेट − 20%) पर quote करें — डिमांड चार्ज बचत का वादा न करें।",
            "इन्वर्टर AC क्षमता CD के भीतर रखें; DISCOM लोड-सैंक्शन बदलने की ज़रूरत नहीं।",
            "बाइ-डायरेक्शनल HT मीटर + CT/PT चेंज DISCOM प्रक्रिया में शामिल करें।",
            "PF सुधार का वादा सोलर से न करें — APFC अलग लाइन-आइटम रखें।",
          ]
        : [
            "Read 4 things off the bill: CD, billing demand (90% rule), TOD3 units, PF — that is the whole HT math.",
            "Quote savings only as TOD3 offset × (rate − 20%) — never promise demand-charge savings.",
            "Keep inverter AC capacity within the CD; no DISCOM load-sanction change is needed.",
            "Include the bi-directional HT meter + CT/PT change in the DISCOM process.",
            "Do not promise PF improvement from solar — keep APFC as a separate line item.",
          ],
      wayTitle: hi ? "सबसे फायदेमंद रास्ता" : "The most beneficial route",
      wayBody: (vals: { sizeKw: string; savings: string; tax: string }) =>
        hi
          ? `नेट-मीटर्ड रूफटॉप प्लांट ~${vals.sizeKw}, दिन-लोड पर साइज़्ड। अनुमानित वार्षिक एनर्जी बचत ${vals.savings} + वर्ष-1 टैक्स लाभ ${vals.tax}। डिमांड चार्ज स्थिर रहेंगे — वादा सिर्फ़ उतना, जितना नियम देते हैं।`
          : `A net-metered rooftop plant of ~${vals.sizeKw}, sized to the daytime load. Estimated annual energy savings ${vals.savings} plus year-1 tax benefit ${vals.tax}. Demand charges stay constant — we promise only what the rules allow.`,
    },
    footer: {
      disclaimer: hi
        ? "सभी आंकड़े उपलब्ध बिल डेटा और साइट-पूर्व अनुमानों पर आधारित हैं; अंतिम मान सर्वे व DISCOM अनुमोदन के बाद तय होंगे।"
        : "All figures are based on available bill data and pre-survey estimates; final values follow site survey and DISCOM approvals.",
    },
  };
}
