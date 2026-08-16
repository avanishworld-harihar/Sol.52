/**
 * Khadi EN / Hindi UI copy — household solar, quiet Khadi voice.
 * Hindi is spoken Hinglish. Never “ग्राहक”.
 */

export type KhadiLang = "en" | "hi";

export function getKhadiCopy(lang: KhadiLang) {
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
    spine: {
      bill: hi ? "Bill" : "Bill",
      parts: hi ? "Parts" : "Parts",
      drawing: hi ? "Drawing" : "Drawing",
      year: hi ? "Year" : "Year",
      outlay: hi ? "Outlay" : "Outlay",
      terms: hi ? "Terms" : "Terms",
      terms2: hi ? "AMC" : "AMC",
    },
    cover: {
      kicker: hi ? "यह छत" : "This roof",
      heroMms: "Elevated GI MMS",
      heroTerrace: hi ? "Garden · plant ke neeche" : "Garden under the array",
      preparedFor: (name: string) =>
        hi
          ? name !== "—"
            ? `${name} के लिए`
            : "इस property के लिए"
          : name !== "—"
            ? `For ${name}`
            : "For this property",
      title: hi ? "Yeh plant ke neeche ghar chalta hai." : "Life under this plant.",
      lead: (kw: string, location: string) =>
        hi
          ? `${kw ? `${kw} kW ` : ""}rooftop plant${
              location ? ` — ${location}` : ""
            }. Garden plant ke neeche. Grid kam.`
          : `${kw ? `${kw} kW ` : ""}rooftop plant${
              location ? ` in ${location}` : ""
            }. Garden under the plant. Less grid.`,
      system: hi ? "Plant size" : "Plant size",
      yield: hi ? "Year-1 units" : "Year-1 units",
      units: hi ? "units" : "units",
      site: hi ? "Site" : "Site",
    },
    audit: {
      kicker: hi ? "आज का bill" : "Today’s bill",
      title: hi ? "पैसा अभी कहाँ जाता है." : "Where the money goes now.",
      lead: hi
        ? "यह पेज सिर्फ बिजली का bill है. Plant की कीमत Outlay पेज पर है."
        : "This page is only the electricity bill. Plant price sits on the Outlay page.",
      today: hi ? "आज / साल" : "Today / year",
      keep: hi ? "Solar के बाद / महीना" : "After solar / month",
      todayHint: (monthly: string) =>
        hi ? `File पर लगभग ${monthly} हर महीने।` : `About ${monthly} each month on the bill on file.`,
      todayEmpty: hi ? "Yearly bill इस proposal पर अभी नहीं है।" : "No yearly bill is on this proposal yet.",
      keepHint: (yearly: string) =>
        hi ? `पूरे साल यही ${yearly}.` : `That is ${yearly} across the year.`,
      keepEmpty: hi ? "Monthly saving अभी file पर नहीं।" : "Monthly saving is not on file yet.",
      cover: hi ? "Bill का कितना हिस्सा solar ले सकता है" : "How much of the bill solar can take",
      coverEmpty: hi
        ? "Coverage तब जब bill और saving दोनों file पर हों।"
        : "Coverage appears when bill and saving are both on file.",
      months: hi ? "Bill के महीने" : "Months on the bill",
      monthsEmpty: hi
        ? "Bill upload ke baad har mahine ki ₹ yahan bars mein aayegi. Sirf requirement se bani proposal par yeh khali rehti hai."
        : "Month bars fill after a bill is uploaded. A requirement-only proposal leaves this chart empty.",
      readSave: (month: string) =>
        hi
          ? `सीधी बात: हर महीने लगभग ${month} कम. खरीद का पैसा Outlay पेज पर.`
          : `Plain talk: about ${month} less each month. Money to buy the plant is on Outlay.`,
      readEmpty: hi
        ? "जब bill सेव होगा, ये संख्याएँ भरेंगी. कीमत Outlay पर है."
        : "When a bill is saved, these figures fill. Price sits on Outlay.",
    },
    hardware: {
      kicker: hi ? "सात हिस्से" : "Seven parts",
      title: hi ? "Plant क्या-क्या लगाता है." : "What the plant is made of.",
      lead: hi
        ? "DCDB, ACDB, lightning arrester और earthing अलग हैं. Earthing: 3 nos × 17 mm copper rod (IS 3043)."
        : "DCDB, ACDB, lightning arrester and earthing are separate. Earthing: 3 nos × 17 mm copper rod (IS 3043).",
      colNo: "No.",
      colPart: hi ? "हिस्सा" : "Part",
      colSpec: hi ? "Spec" : "Spec",
      colMark: hi ? "Mark" : "Mark",
    },
    engineering: {
      kicker: hi ? "Drawing" : "Drawing",
      title: hi ? "छत पर array कैसे बैठता है." : "How the array sits on this roof.",
      lead: hi
        ? "Layout, latitude, tilt, Indian standards. Year-round yield अगले पेज पर. Guess नहीं."
        : "Layout, latitude, tilt, Indian standards. Year-round yield is next. Nothing is guessed.",
      drawingNo: hi ? "Sheet 04 · roof plan" : "Sheet 04 · roof plan",
      arrayTitle: hi ? "South-facing array" : "South-facing array",
      arrayTilt: (tilt: number, az: number) => `Tilt ${tilt}° · Azimuth ${az}° (True South)`,
      arrayAzimuthOnly: (az: number) =>
        hi
          ? `Azimuth ${az}° (True South) · tilt latitude के साथ`
          : `Azimuth ${az}° (True South) · tilt with latitude`,
      arrayNoTilt: hi
        ? "Tilt तब जब site latitude file पर हो।"
        : "Tilt appears when site latitude is on file.",
      showing: (shown: number, total: number) =>
        hi ? ` · ${shown}/${total}` : ` · ${shown}/${total}`,
      roofEmpty: hi
        ? "Module count file पर होने पर plan दिखेगा।"
        : "Plan appears when module count is on file.",
      planLegend: hi ? "Har block = 1 module. Dashed = gap." : "Each block = 1 module. Dashed = gap.",
      siteTitle: hi ? "Title block" : "Title block",
      latitude: "Latitude",
      latitudeCaption: hi ? "इसी छत का capture angle." : "Sets the capture angle for this roof.",
      roofArea: hi ? "Roof area" : "Roof area",
      roofAreaCaption: (n: number, per: string) =>
        hi
          ? `${n} × ${per}/module. Survey के बाद final.`
          : `${n} × ${per}/module. Final after survey.`,
      roofAreaEmpty: hi ? "Module count के साथ आएगा।" : "Appears with module count.",
      shadow: hi ? "Shadow" : "Shadow",
      shadowValue: "Dual MPPT",
      shadowCaption: hi
        ? "बादल पर inverter खुद adjust करता है।"
        : "Inverter adjusts to passing cloud.",
      cableFallback: hi
        ? "DC: roof → inverter · AC: inverter → main board · VD survey के बाद"
        : "DC: roof → inverter · AC: inverter → main board · VD after survey",
      specInverter: hi ? "Inverter" : "Inverter",
      specInverterDesc: hi ? "घर की grid को max power." : "Max power to the home grid.",
      specDc: hi ? "DC array" : "DC array",
      specDcDesc: (n: number, w: number) => `${n} × ${w} Wp`,
      specDcEmpty: hi ? "Live BOM से." : "From the live BOM.",
      specPr: "PR",
      specPrDesc: hi ? "Losses के बाद typical." : "Typical after losses.",
      specDcAc: "DC/AC",
      specDcAcDesc: hi ? "सुबह-शाम के लिए extra panel." : "Over-panel for morning and evening.",
      peakSun: hi ? "Peak sun" : "Peak sun",
      specificYield: hi ? "Specific yield" : "Specific yield",
      loadCoverage: hi ? "Load cover" : "Load cover",
      hrsDay: (n: number) => `${n} hrs/day`,
      standards: hi ? "Standards" : "Standards",
      expertTag: hi ? "Notes on this roof" : "Notes on this roof",
    },
    capital: {
      kicker: hi ? "Outlay" : "Outlay",
      title: hi ? "लगाने में कितना देना है." : "What you pay to put it up.",
      lead: hi
        ? "Plant ki keemat, usme se subsidy ghat-ti hai, bachi net aap dete ho. Bill saving Year page par hai."
        : "Plant price, minus subsidy, is what you pay. Bill saving is on the Year page.",
      youPay: hi ? "Net cost" : "Net cost",
      gross: hi ? "Gross cost" : "Gross cost",
      subsidy: hi ? "Subsidy" : "Subsidy",
      subsidyNone: hi ? "File पर नहीं" : "None on file",
      minus: "−",
      equals: "=",
      netHint: hi ? "Subsidy बाद में credit — यहाँ net." : "Subsidy credited later — net here.",
      netSameHint: hi ? "Gross जैसा." : "Same as gross.",
      stages: hi ? "किस्तें" : "Stage payments",
      stagesHint: hi ? "Gross पर schedule" : "Schedule on gross",
      year1: hi ? "Year-1 generation" : "Year-1 generation",
      payback: hi ? "Payback" : "Payback",
      years: hi ? "years" : "years",
      over25: hi ? "25 साल" : "25 years",
    },
    forecast: {
      kicker: hi ? "साल का सूरज" : "A year of sun",
      title: hi ? "बारह महीने, एक छत." : "Twelve months, one roof.",
      lead: (units: string, bill: boolean) =>
        hi
          ? `Year-1 yield ${units} units. Central-India rooftop का typical curve.${
              bill
                ? " Patli indigo = solar, stone = bill units. Lal = peak-sun."
                : " Lal marks = peak-sun महीने."
            }`
          : `Year-1 yield is ${units} units. Typical central-India rooftop curve.${
              bill
                ? " Slim indigo is solar; stone is bill units. Red marks peak-sun months."
                : " Red marks are peak-sun months."
            }`,
      leadEmpty: hi
        ? "Year-1 yield file पर हो तो महीने की bars दिखेंगी."
        : "The month columns appear when year-1 yield is on file.",
      units: "units",
      highest: hi ? "ऊँचा महीना" : "Highest",
      lowest: hi ? "नीचा महीना" : "Lowest",
      billYear: hi ? "Bill year" : "Bill year",
      legendSolar: "Solar",
      legendPeak: hi ? "Peak" : "Peak",
      legendBill: hi ? "Bill" : "Bill",
      chartAria: (bill: boolean) =>
        hi
          ? bill
            ? "महीने की solar vs bill units"
            : "महीने की generation"
          : bill
            ? "Monthly solar versus bill units"
            : "Monthly generation",
    },
    terms: {
      kicker: hi ? "नियम" : "Rules",
      title: hi ? "काम कैसे चलेगा." : "How the work runs.",
      lead: hi
        ? "General terms, net-metering documents, AMC क्या cover करता है."
        : "General terms, net-metering documents, and what AMC covers.",
      general: hi ? "General" : "General",
      documents: hi ? "Documents" : "Documents",
      amcScope: hi ? "AMC — scope" : "AMC — scope",
      kicker2: hi ? "AMC आगे" : "AMC continued",
      title2: hi ? "आपका हिस्सा, हमारी cost." : "Your scope, our cost.",
      lead2: hi
        ? "AMC में हम क्या करते हैं, क्या आपके पास रहता है, बाद के साल कैसे charge होते हैं."
        : "What we cover, what stays with you, and how later years are charged.",
      clientScope: hi ? "Customer का scope" : "Your scope",
      cost: hi ? "Maintenance cost" : "Maintenance cost",
      regards: hi ? "Regards," : "Regards,",
      bankTitle: hi ? "Bank details" : "Bank details",
      bankIntro: hi
        ? "सभी stage payments इसी account में:"
        : "All stage payments to this account:",
      bankAccountName: hi ? "Account" : "Account",
      bankAcNo: hi ? "A/c No" : "A/c No",
      bankIfsc: "IFSC",
      bankUpi: "UPI",
    },
    close: {
      kicker: hi ? "दस्तखत" : "Sign",
      titleNamed: (name: string) =>
        hi ? `${name}, छत ready है.` : `${name}, the roof is ready.`,
      titlePlain: hi ? "छत ready है." : "The roof is ready.",
      lead: (plant: string, location: string | null) =>
        hi
          ? `${plant}${location ? ` — ${location}` : ""}. जब तैयार हों, sign करें.`
          : `${plant}${location ? ` in ${location}` : ""}. Sign when you are ready.`,
      plantKw: (kw: string) => (hi ? `${kw} kW rooftop plant` : `${kw} kW rooftop plant`),
      plantPlain: hi ? "यह rooftop plant" : "This rooftop plant",
      clientRole: hi ? "Customer" : "Client",
      officialRole: hi ? "Company" : "Company",
      contactTitle: hi ? "Contact" : "Contact",
      contactPhone: hi ? "Phone" : "Phone",
      contactEmail: "Email",
      contactWeb: hi ? "Web" : "Web",
    },
  };
}

export type KhadiCopy = ReturnType<typeof getKhadiCopy>;
