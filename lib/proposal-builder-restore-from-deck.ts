import { isPlaceholderProposalCustomerName } from "@/lib/proposal-customer-placeholder";
import type { ManualProposalCustomer } from "@/lib/merge-proposal-customer";
import { EMPTY_MANUAL_PROPOSAL_CUSTOMER } from "@/lib/proposal-builder-session";
import type { PremiumProposalPptInput } from "@/lib/proposal-ppt";
import { parseResidentialConfig } from "@/lib/residential-proposal-config";
import { emptyMonthlyUnits } from "@/lib/bill-parse";
import type { MonthlyUnits } from "@/lib/types";

const MONTH_KEYS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
] as const satisfies readonly (keyof MonthlyUnits)[];

export type BuilderRestoreFromDeck = {
  monthlyUnits: MonthlyUnits;
  manual: ManualProposalCustomer;
  overrideSolarKw: string;
  overridePanels: string;
  residentialInputMode?: "bill" | "requirement";
};

function normalizeMonthlyUnitsFromDeck(raw: PremiumProposalPptInput["monthlyUnits"]): MonthlyUnits {
  const units = emptyMonthlyUnits();
  if (!raw || typeof raw !== "object") return units;
  for (const key of MONTH_KEYS) {
    const value = raw[key];
    if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
      units[key] = value;
    }
  }
  return units;
}

/** Rebuild proposal builder state from a saved `ppt_input` deck payload. */
export function builderStateFromPptInput(
  ppt: PremiumProposalPptInput,
  opts?: { customerName?: string; location?: string | null }
): BuilderRestoreFromDeck {
  const monthlyUnits = normalizeMonthlyUnitsFromDeck(ppt.monthlyUnits);
  const cp = ppt.customerProfile ?? {};
  const resCfg = parseResidentialConfig(ppt.residentialConfig);
  const locationLine = (opts?.location ?? ppt.location ?? "").trim();
  const locationParts = locationLine.split(",").map((p) => p.trim()).filter(Boolean);
  const displayName = (opts?.customerName ?? ppt.customerName ?? "").trim();

  const manual: ManualProposalCustomer = {
    ...EMPTY_MANUAL_PROPOSAL_CUSTOMER,
    leadContactName: isPlaceholderProposalCustomerName(displayName) ? "" : displayName,
    officialBillName: displayName || EMPTY_MANUAL_PROPOSAL_CUSTOMER.officialBillName,
    city: locationParts[0] ?? "",
    state: ppt.state?.trim() || locationParts[locationParts.length - 1] || "",
    discom: ppt.discom?.trim() || "",
    connectionType: ppt.connectionType?.trim() || cp.connectionType?.trim() || "",
    consumerId: cp.consumerId?.trim() || "",
    meterNumber: cp.meterNumber?.trim() || "",
    connectionDate: cp.connectionDate?.trim() || "",
    phase: cp.phase?.trim() || "",
    tariffCategory: ppt.tariffCategory?.trim() || "",
    purposeOfSupply: ppt.purposeOfSupply?.trim() || "",
    sanctionedLoad:
      cp.sanctionedLoadKw != null && Number.isFinite(cp.sanctionedLoadKw)
        ? String(cp.sanctionedLoadKw)
        : "",
    contractDemandKva:
      ppt.contractDemandKva != null && Number.isFinite(ppt.contractDemandKva)
        ? String(ppt.contractDemandKva)
        : "",
    area: ppt.areaProfile === "rural" ? "rural" : ppt.areaProfile === "urban" ? "urban" : "",
    location: locationParts.length > 2 ? locationParts.slice(0, -1).join(", ") : "",
  };

  const dataSource =
    ppt.dataSource ?? resCfg?.inputMode ?? (monthlyUnits.jan > 0 ? "bill" : undefined);

  const systemKw =
    resCfg?.solar.plantCapacityKw && resCfg.solar.plantCapacityKw > 0
      ? resCfg.solar.plantCapacityKw
      : ppt.systemKw > 0
        ? ppt.systemKw
        : 0;

  const panels =
    resCfg?.solar.moduleCountOverride && resCfg.solar.moduleCountOverride > 0
      ? resCfg.solar.moduleCountOverride
      : 0;

  return {
    monthlyUnits,
    manual,
    overrideSolarKw: systemKw > 0 ? String(systemKw) : "",
    overridePanels: panels > 0 ? String(panels) : "",
    residentialInputMode:
      dataSource === "requirement" ? "requirement" : dataSource === "bill" ? "bill" : undefined,
  };
}
