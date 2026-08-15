/**
 * Lumina EN / Hindi UI copy.
 * Hindi is spoken Hinglish: keep popular English words (customer, panel, inverter,
 * DC, AC, unit, bill, subsidy, net-metering, BOM). Never “ग्राहक”.
 */

export type LuminaLang = "en" | "hi";

export function getLuminaCopy(lang: LuminaLang) {
  const hi = lang === "hi";
  return {
    print: {
      pages: (n: number) => (hi ? `${n} पेज` : `${n} pages`),
      downloadPdf: hi ? "PDF डाउनलोड" : "Download PDF",
      preparingPdf: hi ? "PDF बन रहा है…" : "Preparing PDF…",
      langEn: "EN",
      langHi: "हिंदी",
      langAria: hi ? "Language" : "Language",
      loading: hi ? "Proposal तैयार हो रहा है…" : "Preparing proposal…",
    },
    cover: {
      heroMms: "Elevated GI MMS",
      heroTerrace: hi ? "RCC terrace · नीचे चल सकते हैं" : "RCC terrace · walkable under array",
      preparedFor: (name: string) =>
        hi
          ? name !== "—"
            ? `${name} के लिए तैयार`
            : "इस property के लिए तैयार"
          : name !== "—"
            ? `Prepared for ${name}`
            : "Prepared for this property",
      title: hi ? "Smart Energy Portfolio." : "Smart Energy Portfolio.",
      lead: (kw: string, location: string) =>
        hi
          ? `एक high-efficiency${kw ? ` ${kw} kW` : ""} photovoltaic system${
              location ? ` — ${location}` : ""
            } जो grid पर कम निर्भर करे, और live economics होने पर साफ return दिखाए।`
          : `A high-efficiency${kw ? ` ${kw} kW` : ""} photovoltaic system${
              location ? ` for ${location}` : ""
            } engineered to reduce grid reliance and deliver reliable returns when live economics are on file.`,
      systemEngine: hi ? "System size" : "System Engine",
      year1Yield: hi ? "Year-1 yield" : "Est. Year 1 Yield",
      units: hi ? "units" : "Units",
      netInvestment: hi ? "Net investment" : "Net Investment",
      turnkeyInvestment: hi ? "Turnkey investment" : "Turnkey Investment",
    },
    audit: {
      tag: hi ? "Bill vs solar" : "Bill vs solar",
      title: hi ? "आज आप क्या दे रहे हैं." : "What you pay today.",
      lead: hi
        ? "तीन live नंबर: proposal पर मौजूद grid bill, महीने की saving, और plant पर subsidy. खाली जगह खाली रहती है — अंदाज़ा नहीं लगाया जाता।"
        : "Three live numbers: the grid bill on file, the monthly saving on this proposal, and the subsidy credited on the plant. Empty fields stay blank — they are not guessed.",
      step1: hi ? "आज — grid bill" : "Today — grid bill",
      step1Hint: (monthly: string) =>
        hi ? `File पर लगभग ${monthly} हर महीने।` : `About ${monthly} each month on the bill on file.`,
      step1Empty: hi ? "इस proposal पर yearly bill अभी नहीं है।" : "No yearly bill is on this proposal yet.",
      step2: hi ? "Solar के बाद — आपके पास रहता है" : "After solar — you keep",
      step2Hint: (yearly: string, cover: string) =>
        hi ? `Year-1 में ${yearly}${cover}.` : `${yearly} in year 1${cover}.`,
      step2Cover: (pct: number) => (hi ? ` · bill का ~${pct}%` : ` · ~${pct}% of the bill`),
      step2Empty: hi ? "Monthly saving इस proposal पर अभी नहीं है।" : "Monthly saving is not on this proposal yet.",
      step3: hi ? "इस plant पर subsidy" : "Subsidy on this plant",
      noneOnFile: hi ? "File पर नहीं" : "None on file",
      step3HintYes: hi
        ? "बाद में credit होता है। Plant की cost कटती है, महीने का bill नहीं।"
        : "Credited later. It cuts plant cost, not the monthly bill.",
      step3HintNo: hi ? "इस quote पर subsidy amount सेव नहीं है।" : "No subsidy amount is saved on this quote.",
      plantAfterSubsidy: hi ? "Subsidy के बाद plant cost" : "Plant cost after subsidy",
      fromProposal: hi ? "इसी proposal से" : "From this proposal",
      grossSubsidy: (gross: string, subsidy: string) =>
        hi ? `Gross ${gross} − subsidy ${subsidy}` : `Gross ${gross} − subsidy ${subsidy}`,
      monthsOnBill: hi ? "Bill के महीने" : "Months on the bill",
      year1Saving: hi ? "Year-1 saving" : "Year-1 saving",
      year25: hi ? "25 साल का कुल" : "25-year total",
      payback: hi ? "Payback" : "Payback",
      yr: hi ? "yr" : "yr",
      readBoth: (month: string, subsidy: string) =>
        hi
          ? `ऐसे पढ़ें: bill हर महीने लगभग ${month} कम होता है। ${subsidy} की subsidy plant पर एक बार credit है — capital पेज पर फिर दिखेगी।`
          : `Read it this way: the bill drops by about ${month} a month. The subsidy of ${subsidy} is a one-time credit on the plant, shown again on the capital page.`,
      readSave: (month: string) =>
        hi
          ? `ऐसे पढ़ें: solar के बाद इस proposal पर हर महीने लगभग ${month} आपके पास रहता है। Subsidy तभी दिखती है जब quote पर amount हो।`
          : `Read it this way: after solar you keep about ${month} a month on this proposal. Subsidy appears here only when an amount is on the quote.`,
      readEmpty: hi
        ? "जब bill और subsidy proposal पर सेव होंगे, ये तीन boxes भर जाएँगे।"
        : "When a bill and subsidy are saved on the proposal, they will fill these three boxes.",
    },
    hardware: {
      tag: hi ? "System architecture · 7-item BOM" : "System architecture · 7-item BOM",
      title: "Hardware Specs.",
      lead: hi
        ? "DCDB, ACDB, lightning arrester और earthing अलग-अलग हैं। Earthing: 3 nos × 17 mm copper rod (IS 3043)."
        : "DCDB, ACDB, lightning arrester and earthing are separate. Earthing: 3 nos × 17 mm copper rod (IS 3043).",
    },
    engineering: {
      tag: hi ? "Engineering design" : "Engineering design",
      title: "Design & Performance.",
      lead: hi
        ? "इस plant का rooftop layout, site latitude, tilt और Indian standards. खाली field खाली रहती है — guess नहीं।"
        : "Rooftop layout, site latitude, tilt, and Indian standards for this plant. Blank fields stay blank — they are not guessed.",
      arrayTitle: hi ? "South-facing array" : "Optimal south-facing array",
      arrayTilt: (tilt: number, az: number) =>
        `Tilt: ${tilt}° | Azimuth: ${az}° (True South)`,
      arrayAzimuthOnly: (az: number) =>
        hi
          ? `Azimuth: ${az}° (True South) · tilt site latitude के साथ आएगा`
          : `Azimuth: ${az}° (True South) · tilt appears with site latitude`,
      arrayNoTilt: hi
        ? "Tilt तब दिखेगा जब site latitude इस proposal पर हो।"
        : "Tilt appears when site latitude is on this proposal.",
      showing: (shown: number, total: number) =>
        hi ? ` · ${shown}/${total} दिख रहे हैं` : ` · showing ${shown}/${total}`,
      roofEmpty: hi
        ? "Module count file पर होने पर array layout दिखेगा।"
        : "Array layout appears when module count is on file.",
      siteTitle: hi ? "Site & roof" : "Site & roof",
      latitude: "Latitude",
      latitudeCaption: hi ? "इसी छत का capture angle सेट करता है।" : "Sets the capture angle for this roof.",
      roofArea: hi ? "Required roof area" : "Required roof area",
      roofAreaCaption: (n: number, per: string) =>
        hi
          ? `${n} × ${per}/module (panel + walkway). Survey के बाद final.`
          : `${n} × ${per}/module (panel + walkway). Final after survey.`,
      roofAreaEmpty: hi
        ? "Module count proposal पर होने पर दिखेगा।"
        : "Appears when module count is on this proposal.",
      shadow: hi ? "Shadow tolerance" : "Shadow tolerance",
      shadowValue: "Dual MPPT tracking",
      shadowCaption: hi
        ? "बादल आने पर inverter खुद adjust करता है।"
        : "Inverter adjusts dynamically to passing clouds.",
      cableFallback: hi
        ? "DC run (roof → inverter) · AC run (inverter → main board) · VD survey के बाद"
        : "DC run (roof → inverter) · AC run (inverter → main board) · VD after survey",
      specsTitle: hi ? "Technical specifications" : "Technical specifications",
      specInverter: hi ? "Inverter capacity" : "Inverter capacity",
      specInverterDesc: hi
        ? "घर की grid को मिलने वाली max power."
        : "Max power delivered to the home grid.",
      specDc: hi ? "DC array (panels)" : "DC array (panels)",
      specDcDesc: (n: number, w: number) => `${n} × ${w} Wp modules.`,
      specDcEmpty: hi ? "Module count और wattage live BOM से।" : "Module count and wattage from the live BOM.",
      specPr: hi ? "Performance ratio" : "Performance ratio",
      specPrDesc: hi
        ? "Temperature और grid losses के बाद typical efficiency."
        : "Typical efficiency after temperature and grid losses.",
      specDcAc: "DC/AC ratio",
      specDcAcDesc: hi
        ? "सुबह-शाम बेहतर yield के लिए थोड़ा extra panel."
        : "Over-paneled for stronger morning and evening yield.",
      peakSun: hi ? "Peak sun hours" : "Peak sun hours",
      specificYield: hi ? "Specific yield" : "Specific yield",
      loadCoverage: hi ? "Load coverage" : "Load coverage",
      hrsDay: (n: number) => (hi ? `${n} hrs/day` : `${n} hrs/day`),
      standards: hi ? "Standards compliance" : "Standards compliance",
      expertTag: hi ? "Expert insight" : "Expert insight",
    },
    capital: {
      tag: hi ? "Capital summary" : "Capital summary",
      title: hi ? "आप क्या देते हैं. आपको क्या मिलता है." : "What you pay. What you get.",
      lead: hi
        ? "चार blocks, चार मतलब. Stage payment gross पर चलती है; subsidy बाद में credit होती है जब amount हो. खाली field अनुमान नहीं है।"
        : "Four blocks, four meanings. Stage payments stay on gross; subsidy is credited later when it exists. Blank fields are not estimated.",
      pay: hi ? "1 · आप देते हैं" : "1 · You pay",
      payHint: hi ? "Plant लगाने का investment" : "Investment to install the plant",
      gross: hi ? "System cost (gross)" : "System cost (gross)",
      subsidyLater: hi ? "Subsidy (बाद में credit)" : "Subsidy (credited later)",
      subsidyNone: hi ? "इस quote पर subsidy" : "Subsidy on this quote",
      noneOnFile: hi ? "File पर नहीं" : "None on file",
      netAfter: hi ? "Subsidy के बाद net outlay" : "Net outlay after subsidy",
      netSame: hi ? "Net outlay (gross जैसा)" : "Net outlay (same as gross)",
      produce: hi ? "2 · Plant बनाता है" : "2 · The plant produces",
      produceHint: hi ? "Energy और payback time — रुपये नहीं" : "Energy and recovery time — not rupees",
      year1Gen: hi ? "Year-1 generation" : "Year-1 generation",
      payback: hi ? "Simple payback" : "Simple payback",
      years: hi ? "years" : "years",
      save: hi ? "3 · आप बचाते हैं" : "3 · You save",
      saveHint: hi ? "Bill का पैसा आपके पास रहता है" : "Bill money that stays with you",
      everyYear: hi ? "हर साल (est.)" : "Every year (est.)",
      over25: hi ? "25 साल में (est.)" : "Over 25 years (est.)",
      howPay: hi ? "4 · कैसे देते हैं" : "4 · How you pay",
      howPayHint: hi ? "Gross cost पर stage schedule" : "Stage schedule on gross cost",
    },
    forecast: {
      tag: hi ? "Yield intelligence" : "Yield intelligence",
      title: "Seasonal Forecast.",
      lead: (units: string, bill: boolean) =>
        hi
          ? `इस proposal का Year-1 yield ${units} units है. Bars central-India rooftop का typical curve हैं.${
              bill ? " गहरी bars uploaded bill की units हैं." : " Green = peak-sun महीने."
            }`
          : `Year-1 yield on this proposal is ${units} units. Bars follow a typical central-India rooftop curve.${
              bill ? " Dark bars are bill units from the uploaded bill." : " Green = peak-sun months."
            }`,
      leadEmpty: hi
        ? "Year-1 yield proposal पर होने पर chart दिखेगा — कुछ गढ़ा नहीं जाता।"
        : "The chart appears when year-1 yield exists on this proposal — nothing is invented.",
      year1Solar: hi ? "Year-1 solar" : "Year-1 solar",
      units: "units",
      highest: hi ? "सबसे ऊँचा महीना" : "Highest month",
      lowest: hi ? "सबसे नीचा महीना" : "Lowest month",
      billYear: hi ? "Bill year units" : "Bill year units",
      legendSolar: "Solar",
      legendPeak: hi ? "Peak sun" : "Peak sun",
      legendBill: hi ? "Bill units" : "Bill units",
      chartAria: (bill: boolean) =>
        hi
          ? bill
            ? "महीने की solar generation vs bill units"
            : "महीने की generation forecast"
          : bill
            ? "Monthly solar generation versus bill units"
            : "Monthly generation forecast",
      axisUnits: hi ? "हर bar पर units" : "Units on each bar",
      axisSave: hi ? "महीने के नीचे ₹ saving" : "₹ saving under the month",
    },
    terms: {
      tag: hi ? "Terms & compliance" : "Terms & compliance",
      title: "Terms & Conditions.",
      lead: hi
        ? "General terms, net-metering के documents, और annual maintenance क्या cover करता है।"
        : "General terms, documents needed for net-metering, and what annual maintenance covers.",
      general: hi ? "General terms" : "General terms",
      documents: hi ? "Documents required" : "Documents required",
      amcScope: hi ? "Annual maintenance — scope" : "Annual maintenance — scope",
      tag2: hi ? "Terms & compliance · आगे" : "Terms & compliance · continued",
      title2: hi ? "Maintenance और आपका scope." : "Maintenance & client scope.",
      lead2: hi
        ? "AMC में हम क्या करते हैं, क्या आपके पास रहता है, और बाद के सालों का maintenance कैसे charge होता है।"
        : "What we cover under AMC, what stays with you, and how later-year maintenance is charged.",
      clientScope: hi ? "Customer का scope" : "Client's scope",
      cost: hi ? "Maintenance की cost" : "Cost of maintenance",
      regards: hi ? "Regards," : "Regards,",
    },
    close: {
      kicker: hi ? "Execution mandate" : "Execution mandate",
      titleNamed: (name: string) =>
        hi ? `${name}, यह छत तैयार है.` : `${name}, this roof is ready.`,
      titlePlain: hi ? "यह छत तैयार है." : "This roof is ready.",
      lead: (plant: string, location: string | null) =>
        hi
          ? `${plant}${location ? ` — ${location}` : ""} — जब आप ready हों, accept करें.`
          : `${plant}${location ? ` for ${location}` : ""} — accept when you are.`,
      plantKw: (kw: string) => (hi ? `एक ${kw} kW rooftop plant` : `A ${kw} kW rooftop plant`),
      plantPlain: hi ? "यह rooftop plant" : "This rooftop plant",
      clientRole: hi ? "Customer sign" : "Client authorization",
      officialRole: hi ? "Company sign" : "Official signatory",
    },
  };
}

export type LuminaCopy = ReturnType<typeof getLuminaCopy>;
