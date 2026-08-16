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
      site: hi ? "Site" : "Site",
    },
    audit: {
      tag: hi ? "Finance · बिजली का bill" : "Finance · the electricity bill",
      title: hi ? "Bill का पैसा कहाँ जाता है." : "Where the bill money goes.",
      lead: hi
        ? "यह पेज सिर्फ बिजली का पैसा है — आज का grid bill, और solar के बाद हर महीने क्या बचता है। Plant की कीमत, subsidy और payback Capital पेज पर हैं। खाली जगह अंदाज़ा नहीं।"
        : "This page is only electricity money — today’s grid bill, and what solar keeps in your pocket each month. Plant price, subsidy, and payback live on the Capital page. Blank fields are not guessed.",
      step1: hi ? "1 · आज का bill" : "1 · Today’s bill",
      step1Hint: (monthly: string) =>
        hi ? `File पर लगभग ${monthly} हर महीने।` : `About ${monthly} each month on the bill on file.`,
      step1Empty: hi ? "इस proposal पर yearly bill अभी नहीं है।" : "No yearly bill is on this proposal yet.",
      step2: hi ? "2 · हर महीने बचता है" : "2 · You keep each month",
      step2Hint: (yearly: string) =>
        hi ? `पूरे साल यही ${yearly} बनता है — यही finance है।` : `That is ${yearly} across the year — this is the finance.`,
      step2Empty: hi ? "Monthly saving इस proposal पर अभी नहीं है।" : "Monthly saving is not on this proposal yet.",
      step3: hi ? "3 · Bill का कितना हिस्सा" : "3 · How much of the bill",
      step3Hint: hi
        ? "इतना bill solar cover कर सकता है। बाकी grid से आता है।"
        : "This much of the bill solar can cover. The rest still comes from the grid.",
      step3Empty: hi
        ? "Coverage तब आएगा जब bill और solar saving file पर हों।"
        : "Coverage appears when bill and solar saving are on file.",
      monthsOnBill: hi ? "Bill के महीने" : "Months on the bill",
      monthsEmpty: hi
        ? "महीने-महीने की bars तब दिखेंगी जब bill months file पर हों।"
        : "Month-by-month bars appear when bill months are on file.",
      readSave: (month: string) =>
        hi
          ? `सीधी बात: हर महीने लगभग ${month} bill में कम। Plant खरीदने का पैसा Capital पेज पर है।`
          : `Plain talk: about ${month} less on the bill each month. Money to buy the plant is on the Capital page.`,
      readEmpty: hi
        ? "जब bill file पर सेव होगा, ये boxes भर जाएँगे। Plant की कीमत Capital पेज पर है।"
        : "When a bill is saved on the proposal, these boxes fill. Plant price sits on the Capital page.",
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
        ? "इस plant का rooftop layout, site latitude, tilt और Indian standards. Year-round yield अगले पेज पर है। खाली field खाली रहती है — guess नहीं।"
        : "Rooftop layout, site latitude, tilt, and Indian standards for this plant. Year-round yield is on the next page. Blank fields stay blank — they are not guessed.",
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
      tag: hi ? "Capital · plant की कीमत" : "Capital · the plant price",
      title: hi ? "Plant लगाने में कितना लगेगा." : "What it costs to put the plant up.",
      lead: hi
        ? "यह पेज खरीद का पैसा है। Bill में कितना बचता है पिछले Forecast पेज पर है। यहाँ: कीमत, subsidy, किस्तें, और कितने साल में पैसा वापस आता है।"
        : "This page is money to buy the plant. What the bill saves is on the previous Forecast page. Here: price, subsidy, stage payments, and how many years until the plant pays itself back.",
      pay: hi ? "1 · Plant की कीमत" : "1 · Plant price",
      payHint: hi ? "एक बार का investment" : "One-time money to install",
      gross: hi ? "System cost (gross)" : "System cost (gross)",
      subsidyLater: hi ? "Subsidy (बाद में credit)" : "Subsidy (credited later)",
      subsidyNone: hi ? "इस quote पर subsidy" : "Subsidy on this quote",
      noneOnFile: hi ? "File पर नहीं" : "None on file",
      netAfter: hi ? "Subsidy के बाद आपको देना" : "Net outlay after subsidy",
      netSame: hi ? "आपको देना (gross जैसा)" : "You pay (same as gross)",
      howPay: hi ? "2 · पैसे कैसे देते हैं" : "2 · How you pay",
      howPayHint: hi ? "Gross cost पर stage schedule" : "Stage schedule on gross cost",
      produce: hi ? "3 · पैसे कब लौटते हैं" : "3 · When the money comes back",
      produceHint: hi
        ? "Payback = Forecast पेज की saving से plant की कीमत कितने साल में भरती है"
        : "Payback = years for the Forecast-page saving to cover this plant price",
      year1Gen: hi ? "Year-1 generation" : "Year-1 generation",
      payback: hi ? "Simple payback" : "Simple payback",
      years: hi ? "years" : "years",
      over25: hi ? "25 साल में यह capital" : "This capital over 25 years",
      over25Hint: hi
        ? "Bill saving Forecast पेज पर है — यहाँ सिर्फ plant पर लंबा return।"
        : "Bill saving sits on the Forecast page — here only the long return on this plant.",
    },
    forecast: {
      tag: hi ? "Yield · array के बाद" : "Yield · after the array",
      title: "Seasonal Forecast.",
      lead: (units: string, bill: boolean) =>
        hi
          ? `Engineering के बाद: Year-1 yield ${units} units. Bars central-India rooftop का typical curve हैं.${
              bill ? " गहरी bars uploaded bill की units हैं." : " हरे = peak-sun महीने."
            }`
          : `After the array design: Year-1 yield is ${units} units. Bars follow a typical central-India rooftop curve.${
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
      bankTitle: hi ? "Payment Terms & Bank Details" : "Payment Terms & Bank Details",
      bankIntro: hi
        ? "सभी stage payments सीधे नीचे दिए company account में transfer करें:"
        : "All stage payments must be transferred directly to the following company account:",
      bankAccountName: hi ? "Account Name" : "Account Name",
      bankAcNo: hi ? "A/c No" : "A/c No",
      bankIfsc: "IFSC",
      bankUpi: "UPI",
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
      contactTitle: hi ? "Contact" : "Contact",
    },
  };
}

export type LuminaCopy = ReturnType<typeof getLuminaCopy>;
