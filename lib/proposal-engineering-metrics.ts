import { commercialDcCapacityKwp } from "@/lib/commercial-bom-panels";
import type { ProposalDeckSummary } from "@/lib/proposal-ppt";
import {
  recommendedTiltFromLatitude,
  resolveSiteLatitude,
  tiltRationaleForSite,
} from "@/lib/proposal-site-geo";

export type ResidentialEngineeringMetrics = {
  dcCapacityKwp: number;
  acCapacityKw: number;
  dcAcRatio: number;
  performanceRatioPct: number;
  capacityFactorPct: number;
  specificYieldKwhPerKwp: number;
  peakSunHours: number;
  annualGenUnits: number;
  loadCoveragePct: number;
  panelWatt: number;
  panelCount: number;
  siteLat: number;
  cityLabel: string;
  tiltDeg: number;
  tiltRationale: string;
};

export function computeResidentialEngineeringMetrics(
  summary: ProposalDeckSummary,
  opts?: { location?: string | null; state?: string | null; siteLat?: number }
): ResidentialEngineeringMetrics {
  const panelWatt = summary.panelWatt ?? 540;
  const acCapacityKw = summary.systemKw;
  const dcCapacityKwp = commercialDcCapacityKwp(acCapacityKw, panelWatt);
  const dcAcRatio =
    acCapacityKw > 0 ? Math.round((dcCapacityKwp / acCapacityKw) * 100) / 100 : 1.1;
  const annualGenUnits = summary.annualGen;
  const specificYieldKwhPerKwp =
    acCapacityKw > 0 ? Math.round(annualGenUnits / acCapacityKw) : 0;
  const capacityFactorPct =
    acCapacityKw > 0
      ? Math.round((annualGenUnits / (acCapacityKw * 8760)) * 100 * 10) / 10
      : 0;
  const performanceRatioPct = 75;

  const geo = resolveSiteLatitude(opts?.location, opts?.state);
  const siteLat = opts?.siteLat ?? geo.lat;
  const tiltDeg = recommendedTiltFromLatitude(siteLat);

  return {
    dcCapacityKwp,
    acCapacityKw,
    dcAcRatio,
    performanceRatioPct,
    capacityFactorPct,
    specificYieldKwhPerKwp,
    peakSunHours: 5.0,
    annualGenUnits,
    loadCoveragePct: Math.round(summary.coverage),
    panelWatt,
    panelCount: summary.panels,
    siteLat,
    cityLabel: geo.cityLabel,
    tiltDeg,
    tiltRationale: tiltRationaleForSite(geo.cityLabel, siteLat, tiltDeg),
  };
}

export const RESIDENTIAL_ENGINEERING_STANDARDS = [
  "IEC 61215 / IEC 61730 — PV modules",
  "BIS IS 14286 · MNRE ALMM listed panels",
  "IEC 62109 — string inverter safety",
  "IS 3043 — copper earthing",
  "IS/IEC 62446 — commissioning tests",
  "IS 732 — electrical wiring",
  "DISCOM net-metering (state SERC)",
] as const;

export const RESIDENTIAL_INSTALL_PHASES_EN = [
  { num: "01", title: "Site survey", detail: "Roof shading · load check · structure assessment" },
  { num: "02", title: "Design & SLD", detail: "Single-line diagram · tilt layout · cable routing" },
  { num: "03", title: "DISCOM / subsidy", detail: "Net-meter application · PM Surya Ghar paperwork" },
  { num: "04", title: "Installation", detail: "Tier-1 modules · inverter · AC/DC protection" },
  { num: "05", title: "Testing", detail: "Earthing test · insulation · commissioning report" },
  { num: "06", title: "Go live", detail: "Net meter · grid sync · handover & monitoring" },
] as const;

export const RESIDENTIAL_INSTALL_PHASES_HI = [
  { num: "01", title: "साइट सर्वे", detail: "छाया · लोड · स्ट्रक्चर जाँच" },
  { num: "02", title: "डिज़ाइन और SLD", detail: "सिंगल-लाइन डायग्राम · टिल्ट लेआउट" },
  { num: "03", title: "DISCOM / सब्सिडी", detail: "नेट-मीटर · PM Surya Ghar आवेदन" },
  { num: "04", title: "इंस्टॉलेशन", detail: "पैनल · इन्वर्टर · AC/DC सुरक्षा" },
  { num: "05", title: "टेस्टिंग", detail: "अर्थिंग · इन्सुलेशन · कमीशनिंग" },
  { num: "06", title: "गो लाइव", detail: "नेट मीटर · ग्रिड सिंक · हैंडओवर" },
] as const;
