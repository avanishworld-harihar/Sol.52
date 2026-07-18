import type { DeckBomItem } from "@/lib/proposal-deck-helpers";
import { computeResidentialEngineeringMetrics } from "@/lib/proposal-engineering-metrics";
import type { PremiumProposalPptInput, ProposalDeckSummary } from "@/lib/proposal-ppt";

export type EnrichedBomRow = DeckBomItem & {
  technicalPoints: string[];
};

function panelTrackLabel(
  track: string | undefined,
  isHi: boolean
): string | null {
  if (track === "dcr") return isHi ? "DCR (ALMM सूचीबद्ध)" : "DCR (ALMM listed)";
  if (track === "non_dcr") return isHi ? "Non-DCR" : "Non-DCR";
  return null;
}

function technicalPointsForSlot(
  item: DeckBomItem,
  summary: ProposalDeckSummary,
  pptInput: PremiumProposalPptInput | undefined,
  isHi: boolean
): string[] {
  const layout = pptInput?.residentialTechnicalSpecs?.layout;
  const mounting = pptInput?.residentialTechnicalSpecs?.mounting;
  const solar = pptInput?.residentialConfig?.solar;
  const panelWatt = summary.panelWatt ?? 540;
  const track = panelTrackLabel(solar?.panelTrack, isHi);
  const dcKwp = Math.round(((summary.panels * panelWatt) / 1000) * 100) / 100;
  const dcKwpLabel =
    Number.isInteger(dcKwp) ? String(dcKwp) : dcKwp.toFixed(2);

  if (item.slot === 1) {
    const points = [
      isHi
        ? `${summary.panels} मॉड्यूल × ${panelWatt} Wp — ${dcKwpLabel} kWp DC ऐरे`
        : `${summary.panels} modules × ${panelWatt} Wp — ${dcKwpLabel} kWp DC array`,
      isHi
        ? "≥21% मॉड्यूल दक्षता · Y1 के बाद ≤0.55%/yr लीनियर डिग्रेडेशन"
        : "≥21% module efficiency · ≤0.55%/yr linear degradation after Y1",
      isHi
        ? "BIS IS 14286 · MNRE ALMM / IEC 61215 & IEC 61730"
        : "BIS IS 14286 · MNRE ALMM · IEC 61215 & IEC 61730",
    ];
    if (track) points.push(track);
    const eng = computeResidentialEngineeringMetrics(summary, {
      location: pptInput?.location,
      state: pptInput?.state,
      siteLat: mounting?.siteLat,
    });
    const tiltDeg = mounting?.actualTiltDeg ?? eng.tiltDeg;
    points.push(
      isHi
        ? `इंस्टॉल टिल्ट ${tiltDeg}° (${eng.cityLabel}, ${eng.siteLat.toFixed(1)}°N)`
        : `Installed tilt ${tiltDeg}° (${eng.cityLabel}, ${eng.siteLat.toFixed(1)}°N)`
    );
    if (mounting?.type) {
      points.push(isHi ? `माउंटिंग: ${mounting.type}` : `Mounting: ${mounting.type}`);
    }
    return points;
  }

  if (item.slot === 2) {
    const points = [
      isHi
        ? `${summary.systemKw} kW ऑन-ग्रिड स्ट्रिंग इन्वर्टर · ड्यूल MPPT`
        : `${summary.systemKw} kW on-grid string inverter · dual MPPT`,
      isHi
        ? "≥97.5% अधिकतम दक्षता · IP65 आउटडोर एनक्लोज़र"
        : "≥97.5% max efficiency · IP65 outdoor enclosure",
      isHi
        ? "ग्रिड-टाई सिंक · एंटी-आइलैंडिंग · IEC 62109"
        : "Grid-tie sync · anti-islanding · IEC 62109",
    ];
    if (layout?.inverterLocation) {
      points.push(
        isHi ? `स्थान: ${layout.inverterLocation}` : `Location: ${layout.inverterLocation}`
      );
    }
    return points;
  }

  if (item.slot === 3) {
    return [
      isHi
        ? "हॉट-डिप गैल्वनाइज़्ड (HDG) माइल्ड स्टील स्ट्रक्चर"
        : "Hot-dip galvanized (HDG) mild steel structure",
      isHi
        ? "150 km/h विंड लोड (IS 875) · RCC पेनिट्रेशन / क्लैम्प सिस्टम"
        : "150 km/h wind load (IS 875) · RCC penetration / clamp system",
      isHi
        ? "कोरोज़न-रेज़िस्टेंट फास्टनर्स · 25 वर्ष सेवा जीवन"
        : "Corrosion-resistant fasteners · 25-year service life",
    ];
  }

  if (item.slot === 4) {
    const dcSq = layout?.cableDcSqMm ?? 4;
    const dcRun = layout?.dcRunLengthM;
    const acRun = layout?.acRunLengthM;
    const vDrop = layout?.voltageDropDcPct;
    const points = [
      isHi
        ? `TUV 2PfG 1169 / IEC 62930 · ${dcSq} mm² DC + 4 mm² AC FR ग्रेड`
        : `TUV 2PfG 1169 / IEC 62930 · ${dcSq} mm² DC + 4 mm² AC FR grade`,
      isHi
        ? "UV-रेज़िस्टेंट · लो-स्मोक · फायर-रेटेड इंसुलेशन"
        : "UV-resistant · low-smoke · fire-rated insulation",
    ];
    if (dcRun != null || acRun != null) {
      const parts: string[] = [];
      if (dcRun != null) parts.push(isHi ? `DC रन ${dcRun} m` : `DC run ${dcRun} m`);
      if (acRun != null) parts.push(isHi ? `AC रन ${acRun} m` : `AC run ${acRun} m`);
      if (vDrop != null) parts.push(isHi ? `VD ${vDrop}%` : `VD ${vDrop}%`);
      points.push(parts.join(" · "));
    }
    return points;
  }

  if (item.slot === 5) {
    return [
      isHi
        ? "DCDB: फ्यूज़ + Type II SPD · ACDB: MCB/MCCB + Type II SPD"
        : "DCDB: fuse + Type II SPD · ACDB: MCB/MCCB + Type II SPD",
      isHi
        ? "कॉपर अर्थिंग · प्रतिरोध ≤1Ω (IS 3043)"
        : "Copper earthing · resistance ≤1Ω (IS 3043)",
      isHi
        ? "लाइटनिंग प्रोटेक्शन · ओवर-करंट / ओवर-वोल्टेज सुरक्षा"
        : "Lightning protection · over-current / over-voltage protection",
    ];
  }

  if (item.slot === 6) {
    return [
      isHi
        ? "बाइ-डायरेक्शनल नेट मीटर · DISCOM लाइज़न और कमीशनिंग"
        : "Bi-directional net meter · DISCOM liaison & commissioning",
      isHi
        ? "रिमोट मॉनिटरिंग (जहाँ लागू) · O&M सर्विस डेस्क"
        : "Remote monitoring (where applicable) · O&M service desk",
      isHi
        ? "मीटरिंग एग्रीमेंट, सुरक्षा सर्टिफिकेशन और ग्रिड सिंक्रोनाइज़ेशन"
        : "Metering agreement, safety certification & grid synchronization",
    ];
  }

  const key = item.title.toLowerCase();
  if (key.includes("panel")) {
    return [isHi ? `ब्रांड: ${item.brand}` : `Brand: ${item.brand}`, item.spec];
  }
  return [item.spec, isHi ? `ब्रांड: ${item.brand}` : `Brand: ${item.brand}`];
}

export function enrichBomTechnicalRows(
  bom: DeckBomItem[],
  summary: ProposalDeckSummary,
  opts?: {
    lang?: "en" | "hi";
    pptInput?: PremiumProposalPptInput;
  }
): EnrichedBomRow[] {
  const isHi = opts?.lang === "hi";
  return bom.map((item) => ({
    ...item,
    technicalPoints: technicalPointsForSlot(item, summary, opts?.pptInput, isHi),
  }));
}

export function bomSystemEngineeringSnapshot(
  summary: ProposalDeckSummary,
  lang: "en" | "hi" = "en"
): { label: string; value: string }[] {
  const isHi = lang === "hi";
  const panelBrand = summary.brands?.panel ?? summary.panelBrand ?? "Tier-1";
  const inverterBrand = summary.brands?.inverter ?? "—";

  return [
    {
      label: isHi ? "इंस्टॉल क्षमता" : "Installed capacity",
      value: `${summary.systemKw} kW`,
    },
    {
      label: isHi ? "मॉड्यूल काउंट" : "Module count",
      value: `${summary.panels} × ${summary.panelWatt ?? 540} Wp`,
    },
    {
      label: isHi ? "पैनल / इन्वर्टर" : "Panel / inverter",
      value: `${panelBrand} · ${inverterBrand}`,
    },
    {
      label: isHi ? "वार्षिक उत्पादन" : "Annual generation",
      value: `${summary.annualGen.toLocaleString("en-IN")} ${isHi ? "यूनिट" : "units"}`,
    },
    {
      label: isHi ? "लोड कवरेज" : "Load coverage",
      value: `${Math.round(summary.coverage)}%`,
    },
    {
      label: isHi ? "प्रदर्शन अनुपात" : "Performance ratio",
      value: isHi ? "~75% (साइट-विशिष्ट)" : "~75% (site-specific)",
    },
  ];
}
