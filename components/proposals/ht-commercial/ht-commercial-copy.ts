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
    footer: {
      disclaimer: hi
        ? "सभी आंकड़े उपलब्ध बिल डेटा और साइट-पूर्व अनुमानों पर आधारित हैं; अंतिम मान सर्वे व DISCOM अनुमोदन के बाद तय होंगे।"
        : "All figures are based on available bill data and pre-survey estimates; final values follow site survey and DISCOM approvals.",
    },
  };
}
