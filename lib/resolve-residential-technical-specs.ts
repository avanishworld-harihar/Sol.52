import type { PremiumProposalPptInput } from "@/lib/proposal-ppt";
import {
  recommendedTiltFromLatitude,
  resolveSiteLatitude,
  tiltRationaleForSite,
} from "@/lib/proposal-site-geo";

type ResidentialTechnicalSpecs = NonNullable<PremiumProposalPptInput["residentialTechnicalSpecs"]>;

export function resolveResidentialTechnicalSpecs(
  pptInput: PremiumProposalPptInput
): ResidentialTechnicalSpecs {
  const existing = pptInput.residentialTechnicalSpecs;
  const geo = resolveSiteLatitude(pptInput.location, pptInput.state);
  const siteLat = existing?.mounting?.siteLat ?? geo.lat;
  const tiltDeg =
    existing?.mounting?.actualTiltDeg ??
    existing?.mounting?.recommendedTiltDeg ??
    recommendedTiltFromLatitude(siteLat);

  return {
    mounting: {
      siteLat,
      actualTiltDeg: tiltDeg,
      recommendedTiltDeg: tiltDeg,
      type: existing?.mounting?.type ?? "elevated",
      rowSpacingM: existing?.mounting?.rowSpacingM,
      tiltRationale:
        existing?.mounting?.tiltRationale ??
        tiltRationaleForSite(geo.cityLabel, siteLat, tiltDeg),
    },
    layout: {
      dcRunLengthM: existing?.layout?.dcRunLengthM ?? 15,
      acRunLengthM: existing?.layout?.acRunLengthM ?? 8,
      inverterLocation:
        existing?.layout?.inverterLocation ?? "Ground floor / inverter room (shaded)",
      voltageDropDcPct: existing?.layout?.voltageDropDcPct ?? 1.8,
      cableDcSqMm: existing?.layout?.cableDcSqMm ?? 4,
    },
  };
}

/** Merge resolved specs into ppt input (immutable). */
export function withResolvedResidentialTechnicalSpecs(
  pptInput: PremiumProposalPptInput
): PremiumProposalPptInput {
  return {
    ...pptInput,
    residentialTechnicalSpecs: resolveResidentialTechnicalSpecs(pptInput),
  };
}
