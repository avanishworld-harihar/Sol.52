/**
 * Jaali EN / Hindi UI copy — courtyard / jali voice.
 * Hindi is spoken Hinglish. Never “ग्राहक”.
 */

export type JaaliLang = "en" | "hi";

export function getJaaliCopy(lang: JaaliLang) {
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
      drawing: hi ? "सूरज" : "Sun",
      year: hi ? "Year" : "Year",
      outlay: hi ? "Outlay" : "Outlay",
      terms: hi ? "Terms" : "Terms",
      terms2: hi ? "AMC" : "AMC",
    },
    cover: {
      kicker: hi ? "jali के पार." : "Through the screen.",
      heroMms: hi ? "Jali ke paar" : "Through the jaali",
      heroTerrace: hi ? "Sofa · plant ki chhaya" : "Sofa · shade under the plant",
      preparedFor: (name: string) =>
        hi
          ? name !== "—"
            ? `${name} के लिए`
            : "इस property के लिए"
          : name !== "—"
            ? `For ${name}`
            : "For this property",
      title: hi ? "Aangan. Working plant." : "A courtyard. A working plant.",
      lead: (kw: string, location: string) =>
        hi
          ? `${kw ? `${kw} kW ` : ""}rooftop plant${
              location ? ` — ${location}` : ""
            }. Grid कम, terrace वही. खाली field guess नहीं।`
          : `${kw ? `${kw} kW ` : ""}rooftop plant${
              location ? ` in ${location}` : ""
            }. Less grid, same terrace. Blank fields are not guessed.`,
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
      kicker: hi ? "सूरज का रास्ता" : "Sun path",
      title: hi
        ? "यह छत धूप को पंखे तक कैसे पहुँचाती है."
        : "How this roof turns light into the fan.",
      lead: hi
        ? "South section: GHI (1) south glass par padti hai, tilt ≈ is shehar ki latitude. Kaanch DC (2) banata hai, inverter AC (3) pakaata hai, board (4) ghar ko deta hai. Ank is proposal ke hain."
        : "South section: GHI (1) hits south-facing glass, tilt ≈ this city’s latitude. Modules make DC (2), the inverter cooks AC (3), the board (4) feeds the house. Figures are from this proposal.",
      drawingNo: hi ? "Sheet 04 · south section" : "Sheet 04 · south section",
      plateCaption: hi
        ? "Elevated GI MMS · modules true south (180°) · neeche walk. Tilt ≈ latitude (MNRE rooftop rule)."
        : "Elevated GI MMS · modules true south (180°) · walkable under the table. Tilt ≈ latitude (MNRE rooftop rule).",
      walkLabel: hi ? "WALK" : "WALK",
      southLabel: hi ? "SOUTH · 180°" : "SOUTH · 180°",
      tiltCaption: (tilt: number) =>
        tilt > 0 ? `θ ${tilt}°` : hi ? "θ · latitude" : "θ · latitude",
      pathSky: hi ? "Sun · GHI" : "Sun · GHI",
      pathGlass: hi ? "PV · DC" : "PV · DC",
      pathKitchen: hi ? "Inverter" : "Inverter",
      pathHome: hi ? "Home · AC" : "Home · AC",
      pathSkyHint: hi ? "Peak sun, is shehar ka." : "Peak sun for this city.",
      pathGlassHint: hi ? "Modules · DC array." : "Modules · DC array.",
      pathKitchenHint: hi ? "Inverter · PR after losses." : "Inverter · PR after losses.",
      pathHomeHint: hi ? "Bill cover · extra glass for dawn." : "Bill cover · extra glass for dawn.",
      measureLat: "Latitude",
      measureTilt: "Tilt",
      measureAz: hi ? "Azimuth" : "Azimuth",
      measureArea: hi ? "Roof" : "Roof",
      measureYield: hi ? "kWh / kW" : "kWh / kW",
      measureCover: hi ? "Load" : "Load",
      hrsDay: (n: number) => `${n} hrs/day`,
      specDcDesc: (n: number, w: number) => `${n} × ${w} Wp`,
      specDcEmpty: hi ? "Live BOM se." : "From the live BOM.",
      cableFallback: hi
        ? "DC: roof → inverter · AC: inverter → main board · VD survey ke baad"
        : "DC: roof → inverter · AC: inverter → main board · VD after survey",
      arrayTilt: (tilt: number, az: number) => `Tilt ${tilt}° · Azimuth ${az}°`,
      arrayNoTilt: hi ? "Tilt city file par ho to." : "Tilt appears with city on file.",
    },
    capital: {
      kicker: hi ? "Outlay" : "Outlay",
      title: hi ? "लगाने में कितना देना है." : "What you pay to put it up.",
      lead: hi
        ? "Pehle plant ki keemat, phir subsidy ghat-ti hai, bachi net aap dete ho. Bill saving Year page par hai."
        : "Plant price, minus subsidy, is what you pay. Bill saving is on the Year page.",
      youPay: hi ? "आपको देना" : "You pay",
      gross: hi ? "Plant price" : "Plant price",
      subsidy: hi ? "Subsidy" : "Subsidy",
      subsidyNone: hi ? "File par nahi" : "None on file",
      minus: "−",
      equals: "=",
      netHint: hi
        ? "Subsidy baad mein credit. Yeh net hai."
        : "Subsidy credited later. This is the net.",
      netSameHint: hi
        ? "Subsidy file par nahi — gross hi dena."
        : "No subsidy on file — you pay gross.",
      stages: hi ? "किस्तें" : "Stage payments",
      stagesHint: hi ? "Gross par schedule" : "Schedule on gross",
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
              bill ? " गहरी पट्टी bill units हैं." : " Terracotta columns = peak-sun महीने."
            }`
          : `Year-1 yield is ${units} units. Typical central-India rooftop curve.${
              bill ? " Dark strip is bill units." : " Terracotta columns = peak-sun months."
            }`,
      leadEmpty: hi
        ? "Year-1 yield file par ho to columns dikhengi."
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

export type JaaliCopy = ReturnType<typeof getJaaliCopy>;
