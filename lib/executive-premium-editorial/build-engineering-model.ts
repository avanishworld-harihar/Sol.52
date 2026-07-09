import type { PremiumProposalPptInput, ProposalDeckSummary } from "@/lib/proposal-ppt";
import type { ProposalLang } from "@/lib/proposal-i18n";
import {
  computeResidentialEngineeringMetrics,
  RESIDENTIAL_ENGINEERING_STANDARDS,
  RESIDENTIAL_INSTALL_PHASES_EN,
  RESIDENTIAL_INSTALL_PHASES_HI,
} from "@/lib/proposal-engineering-metrics";
import { epGoldenCopy } from "@/lib/executive-premium-editorial/ep-golden-i18n";
import { withResolvedResidentialTechnicalSpecs } from "@/lib/resolve-residential-technical-specs";
import type { EditorialEngineeringModel, EditorialWarrantyModel } from "@/lib/executive-premium-editorial/types";

export function buildEditorialEngineeringModel(
  pptInput: PremiumProposalPptInput,
  summary: ProposalDeckSummary,
  lang: ProposalLang = "en"
): EditorialEngineeringModel {
  const resolved = withResolvedResidentialTechnicalSpecs(pptInput);
  const specs = resolved.residentialTechnicalSpecs;
  const metrics = computeResidentialEngineeringMetrics(summary, {
    location: pptInput.location,
    state: pptInput.state,
    siteLat: specs?.mounting?.siteLat,
  });
  const tiltDeg = specs?.mounting?.actualTiltDeg ?? metrics.tiltDeg;

  return {
    metrics_rows: [
      { label: "DC capacity (STC)", value: `${metrics.dcCapacityKwp.toFixed(2)} kWp`, highlight: true },
      { label: "AC capacity (inverter)", value: `${metrics.acCapacityKw} kW` },
      { label: "DC/AC ratio", value: `${metrics.dcAcRatio}` },
      { label: "Peak sun hours", value: `${metrics.peakSunHours} hrs/day` },
      { label: "Performance ratio (PR)", value: `${metrics.performanceRatioPct}%` },
      { label: "Specific yield", value: `${metrics.specificYieldKwhPerKwp} kWh/kWp/yr`, highlight: true },
      { label: "Annual generation", value: `${metrics.annualGenUnits.toLocaleString("en-IN")} units` },
      { label: "Load coverage", value: `${metrics.loadCoveragePct}%` },
      { label: "Modules", value: `${metrics.panelCount} × ${metrics.panelWatt} Wp` },
      { label: "Site latitude", value: `${metrics.siteLat.toFixed(1)}°N · ${metrics.cityLabel}` },
    ],
    tilt_deg: tiltDeg,
    tilt_note: specs?.mounting?.tiltRationale ?? metrics.tiltRationale,
    city_label: metrics.cityLabel,
    cable_note:
      specs?.layout != null
        ? `DC run ${specs.layout.dcRunLengthM} m · AC run ${specs.layout.acRunLengthM} m · VD ${specs.layout.voltageDropDcPct}%`
        : undefined,
    standards: [...RESIDENTIAL_ENGINEERING_STANDARDS],
    install_phases: (lang === "hi" ? RESIDENTIAL_INSTALL_PHASES_HI : RESIDENTIAL_INSTALL_PHASES_EN).map((p) => ({
      num: p.num,
      title: p.title,
      detail: p.detail,
    })),
  };
}

export function buildEditorialWarrantyModel(
  summary: ProposalDeckSummary,
  lang: ProposalLang = "en"
): EditorialWarrantyModel {
  const copy = epGoldenCopy(lang);
  const panelBrand = summary.brands?.panel ?? summary.panelBrand ?? "Tier-1";
  const inverterBrand = summary.brands?.inverter ?? "—";
  const amcYears = summary.amcSelectedYears ?? 1;

  return {
    intro: `${summary.systemKw} kW system — ${panelBrand} panels, ${inverterBrand} inverter.`,
    highlights: [
      { icon: "shield", value: "30", unit: copy.warranty.highlights[0].unit, label: copy.warranty.highlights[0].label },
      { icon: "panel", value: "15", unit: copy.warranty.highlights[1].unit, label: copy.warranty.highlights[1].label },
      { icon: "structure", value: "10", unit: copy.warranty.highlights[2].unit, label: copy.warranty.highlights[2].label },
      { icon: "support", value: `${amcYears}`, unit: copy.warranty.highlights[3].unit, label: copy.warranty.highlights[3].label },
    ],
    rows: [
      {
        item: "Solar modules — product",
        duration: "15 years",
        by: "Manufacturer",
        coverage: "Manufacturing defects",
      },
      {
        item: "Solar modules — power output",
        duration: "30 years",
        by: "Manufacturer",
        coverage: "≥80% rated @ year 30",
      },
      {
        item: "String inverter",
        duration: "5–10 years",
        by: "Manufacturer",
        coverage: "Product warranty",
      },
      {
        item: "Mounting structure",
        duration: "10 years",
        by: "EPC",
        coverage: "Corrosion & structural integrity",
      },
      {
        item: "Electrical workmanship",
        duration: "1–2 years",
        by: "Installer",
        coverage: "Installation guarantee",
      },
      {
        item: "Net-metering support",
        duration: `${amcYears} yr AMC`,
        by: "Service desk",
        coverage: "Commissioning & O&M",
      },
    ],
  };
}
