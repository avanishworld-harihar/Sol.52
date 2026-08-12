/**
 * Zenith — rich engineering brief derived from ProposalData + BOM.
 * Preset-local; does not change shared build-proposal-data.
 */

import type { ProposalData } from "@/lib/proposal-data";
import type { ZenithLang } from "./zenith-copy";

export type ZenithEngRow = { label: string; value: string; hint?: string };

export type ZenithEngineeringModel = {
  headlineMetrics: ZenithEngRow[];
  methodology: string;
  arrayDesign: ZenithEngRow[];
  performance: ZenithEngRow[];
  electrical: ZenithEngRow[];
  structural: ZenithEngRow[];
  standards: string[];
  deliverables: string[];
  phases: { num: string; title: string; description: string }[];
};

function bomHint(data: ProposalData, re: RegExp) {
  return data.bom.find(
    (b) => re.test(b.name) || re.test(b.spec) || re.test(b.brand ?? "")
  );
}

function parsePanelSpec(spec: string): { count: number; watt: number } | null {
  const m = spec.match(/(\d+)\s*[×x]\s*(\d+)\s*W/i);
  if (m) return { count: Number(m[1]), watt: Number(m[2]) };
  const single = spec.match(/(\d+)\s*W/i);
  if (single) return { count: 0, watt: Number(single[1]) };
  return null;
}

function annualUnits(data: ProposalData): number {
  const fromClosing = data.closing?.annualUnits ?? 0;
  if (fromClosing > 0) return fromClosing;
  const hit = data.engineering.metrics.find((m) => /annual|generation|units/i.test(m.label));
  if (!hit) return 0;
  const n = Number(String(hit.value).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function specificYieldKwhPerKwp(annualGen: number, acKw: number): number {
  if (acKw <= 0 || annualGen <= 0) return 0;
  return Math.round(annualGen / acKw);
}

export function buildZenithEngineeringModel(
  data: ProposalData,
  lang: ZenithLang
): ZenithEngineeringModel {
  const hi = lang === "hi";
  const acKw = data.meta.systemKw > 0 ? data.meta.systemKw : 0;
  const city = data.engineering.cityLabel?.trim() || data.meta.locationLine.split(",")[0]?.trim() || "";
  const tilt = data.engineering.tiltDeg ?? 20;
  const annualGen = annualUnits(data);
  const dcRatio = 1.04;
  const dcKwp = acKw > 0 ? Math.round(acKw * dcRatio * 100) / 100 : 0;

  const panelItem = bomHint(data, /panel|module/i);
  const inverterItem = bomHint(data, /inverter/i);
  const structureItem = bomHint(data, /mount|structure/i);
  const protectionItem = bomHint(data, /protect|acdb|dcdb|meter/i);

  const parsedPanel = panelItem?.spec ? parsePanelSpec(panelItem.spec) : null;
  let panelCount = parsedPanel?.count ?? 0;
  const panelWatt = parsedPanel?.watt ?? 540;
  if (panelCount <= 0 && dcKwp > 0 && panelWatt > 0) {
    panelCount = Math.round((dcKwp * 1000) / panelWatt);
  }

  const yieldKwh = specificYieldKwhPerKwp(annualGen, acKw);
  const prPct =
    yieldKwh > 0 ? Math.min(82, Math.max(72, Math.round((yieldKwh / 1700) * 100))) : 75;
  const stringCount = panelCount > 0 ? Math.max(1, Math.ceil(panelCount / 12)) : acKw > 0 ? 2 : 0;
  const inverterSpec = inverterItem?.spec?.trim() || (acKw > 0 ? `${acKw} kW grid-tie` : "—");

  const headlineMetrics: ZenithEngRow[] =
    data.engineering.metrics.length >= 3
      ? data.engineering.metrics.slice(0, 6).map((m) => ({ label: m.label, value: m.value }))
      : [
          { label: hi ? "AC क्षमता" : "AC capacity", value: acKw > 0 ? `${acKw} kW` : "—" },
          {
            label: hi ? "DC क्षमता" : "DC capacity",
            value: dcKwp > 0 ? `${dcKwp} kWp` : "—",
          },
          {
            label: hi ? "वार्षिक उत्पादन" : "Annual generation",
            value: annualGen > 0 ? `${annualGen.toLocaleString("en-IN")} units` : "—",
          },
          {
            label: hi ? "PR (प्रदर्शन अनुपात)" : "Performance ratio",
            value: `${prPct}%`,
          },
          {
            label: hi ? "विशिष्ट उपज" : "Specific yield",
            value: yieldKwh > 0 ? `${yieldKwh} kWh/kWp·yr` : "—",
          },
          {
            label: hi ? "ऐरे झुकाव" : "Array tilt",
            value: `${tilt}°`,
          },
        ];

  const methodology = hi
    ? `${city ? `${city} ` : ""}साइट के लिए हम PVsyst-स्तरीय मॉडelling, छाया-विश्लेषण और IS 875 वायु-भार के साथ SLD तैयार करते हैं — ताकि उत्पादन कागज़ पर नहीं, आपकी छत पर सिद्ध हो।`
    : `For${city ? ` ${city}` : " your site"}, we model array layout, shade loss, and string voltage in PVsyst-class workflows, then issue an SLD with IS 875 wind-load checks — so yield is proven on your terrace, not only on paper.`;

  const arrayDesign: ZenithEngRow[] = [
    {
      label: hi ? "मॉड्यूल कॉन्फ़िग" : "Module layout",
      value:
        panelCount > 0
          ? `${panelCount} × ${panelWatt}Wp Tier-1`
          : panelItem?.spec?.trim() || "—",
      hint: panelItem?.brand?.trim() || undefined,
    },
    {
      label: hi ? "DC : AC ओवरसाइज़" : "DC : AC ratio",
      value: acKw > 0 ? `${dcRatio.toFixed(2)} : 1` : "—",
    },
    {
      label: hi ? "झुकाव / दक्षिण-दिशा" : "Tilt / azimuth",
      value: hi
        ? `${tilt}° · दक्षिण-मुखी (180°)`
        : `${tilt}° · South-facing (180° azimuth)`,
      hint: data.engineering.tiltNote?.trim() || undefined,
    },
    {
      label: hi ? "स्ट्रिंगिंग" : "Stringing",
      value:
        stringCount > 0 && panelCount > 0
          ? hi
            ? `~${stringCount} स्ट्रिंग · MPPT-अनुकूल`
            : `~${stringCount} strings · MPPT-balanced`
          : "—",
    },
    {
      label: hi ? "छाया & सफाई" : "Shade & soiling",
      value: hi
        ? "छाया-हानि सर्वे के बाद · वार्षिक पैनल सफाई AMC में"
        : "Shade loss post survey · annual panel cleaning in AMC",
    },
  ];

  const performance: ZenithEngRow[] = [
    {
      label: hi ? "वार्षिक उपज (मॉडल)" : "Modeled annual yield",
      value: annualGen > 0 ? `${annualGen.toLocaleString("en-IN")} kWh` : "—",
    },
    {
      label: hi ? "PR (लक्ष्य)" : "Target PR",
      value: `${prPct}%`,
      hint: hi ? "प्रदर्शन अनुपात · inverter + ताप हानि" : "Performance ratio incl. inverter & thermal loss",
    },
    {
      label: hi ? "विशिष्ट उपज" : "Specific yield",
      value: yieldKwh > 0 ? `${yieldKwh} kWh/kWp·yr` : "—",
    },
    {
      label: hi ? "वार्षिक ह्रास" : "Annual degradation",
      value: hi ? "≤ 0.55% / वर्ष (Tier-1)" : "≤ 0.55% / yr (Tier-1 linear)",
    },
    {
      label: hi ? "25-वर्ष ऊर्जा" : "25-year energy",
      value:
        annualGen > 0
          ? `~${Math.round(annualGen * 22.5).toLocaleString("en-IN")} kWh`
          : "—",
      hint: hi ? "ह्रास-समायोजित अनुमान" : "Degradation-adjusted estimate",
    },
  ];

  const electrical: ZenithEngRow[] = [
    {
      label: hi ? "इनवर्टर" : "Inverter",
      value: inverterSpec,
      hint: [inverterItem?.brand, inverterItem?.warranty].filter(Boolean).join(" · ") || undefined,
    },
    {
      label: hi ? "ग्रिड कनेक्शन" : "Grid connection",
      value: hi ? "On-grid · bi-directional net meter" : "On-grid · bi-directional net meter",
    },
    {
      label: hi ? "सुरक्षा" : "Protection",
      value:
        protectionItem?.spec?.trim() ||
        (hi ? "ACDB · DCDB · SPD · RCD" : "ACDB · DCDB · SPD · RCD"),
    },
    {
      label: hi ? "अर्थिंग" : "Earthing",
      value: hi ? "IS 3043 · ≤ 1 Ω लक्ष्य" : "IS 3043 · ≤ 1 Ω target",
    },
    {
      label: hi ? "केबलिंग" : "Cabling",
      value: hi
        ? "UV-प्रूफ DC · FRLS AC · conduit / tray"
        : "UV-rated DC · FRLS AC · conduit / cable tray",
    },
  ];

  const structural: ZenithEngRow[] = [
    {
      label: hi ? "माउंटिंग" : "Mounting",
      value: structureItem?.spec?.trim() || (hi ? "Hot-dip GI / aluminium" : "Hot-dip GI / aluminium"),
      hint: structureItem?.brand?.trim() || undefined,
    },
    {
      label: hi ? "वायु भार" : "Wind load",
      value: hi ? "IS 875 · Zone III/IV (सर्वे-पुष्ट)" : "IS 875 · Zone III/IV (survey verified)",
    },
    {
      label: hi ? "छत भार" : "Roof loading",
      value: hi ? "~12–15 kg/m² · RCC/टिन-सुरक्षित" : "~12–15 kg/m² · RCC / tin-safe",
    },
    {
      label: hi ? "लाइटनिंग" : "Lightning",
      value: hi ? "SPD Type II · स्ट्रक्चर बॉन्डिंग" : "SPD Type II · structure bonding",
    },
    {
      label: hi ? "कमीशनिंग" : "Commissioning",
      value: hi ? "IS/IEC 62446 · IV curve · SLD हस्तांतरण" : "IS/IEC 62446 · IV curve · SLD handover",
    },
  ];

  const standards =
    data.engineering.standards.length >= 4
      ? data.engineering.standards
      : [
          "IEC 61215 / IEC 61730",
          "BIS IS 14286",
          "MNRE ALMM · DCR",
          "IEC 62109 (Inverter)",
          "IS 3043 (Earthing)",
          "IS/IEC 62446 (Commissioning)",
          "CEA / DISCOM net-metering",
        ];

  const deliverables = hi
    ? [
        "साइट सर्वे रिपोर्ट (छाया + छत माप)",
        "SLD + स्ट्रिंग लेआउट ड्रॉइंग",
        "BOM + वारंटी शीट",
        "DISCOM / PM Surya Ghar फाइलिंग सपोर्ट",
        "कमीशनिंग चेकलिस्ट + हैंडओवर",
      ]
    : [
        "Site survey report (shade + roof dimensions)",
        "SLD + string layout drawing",
        "BOM + warranty sheet",
        "DISCOM / PM Surya Ghar filing support",
        "Commissioning checklist + handover pack",
      ];

  const phases =
    data.engineering.phases.length > 0
      ? data.engineering.phases.slice(0, 6)
      : data.execution.steps.slice(0, 6);

  return {
    headlineMetrics,
    methodology,
    arrayDesign,
    performance,
    electrical,
    structural,
    standards,
    deliverables,
    phases,
  };
}
