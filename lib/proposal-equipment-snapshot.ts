import { calculateEquipmentEngineering, type EquipmentEngineeringSnapshot } from "@/lib/equipment-engineering";
import {
  BUILT_IN_EQUIPMENT_LIBRARY,
  resolveInverterProfile,
  resolveModuleProfile,
  type EquipmentLibrary,
} from "@/lib/equipment-library";
import type { PremiumProposalPptInput, ProposalDeckSummary } from "@/lib/proposal-ppt";

export function buildProposalEquipmentSnapshot(
  pptInput: PremiumProposalPptInput,
  summary: ProposalDeckSummary,
  library: EquipmentLibrary = BUILT_IN_EQUIPMENT_LIBRARY,
  calculatedAt?: string
): EquipmentEngineeringSnapshot {
  const config = pptInput.residentialConfig;
  const selection = config?.equipmentSelection;
  const panelRow = summary.bom.find((row) => /panel|module/i.test(row.title));
  const inverterRow = summary.bom.find((row) => /inverter/i.test(row.title));
  const moduleManufacturer =
    config?.solar?.brand?.trim() || panelRow?.brand?.split("/")[0]?.trim() || "Unspecified";
  const moduleWatt = summary.panelWatt ?? config?.solar?.watt ?? 540;
  const inverterManufacturer =
    config?.inverterBrandOptions?.[0]?.brand?.trim() ||
    inverterRow?.brand?.split("/")[0]?.trim() ||
    "Unspecified";

  return calculateEquipmentEngineering({
    targetAcKw: summary.systemKw,
    targetDcAcRatio: selection?.targetDcAcRatio,
    moduleCountOverride: summary.panels > 0 ? summary.panels : config?.solar?.moduleCountOverride,
    module: resolveModuleProfile(library, {
      catalogId: selection?.moduleCatalogId,
      manufacturer: moduleManufacturer,
      model: selection?.moduleModel,
      watt: moduleWatt,
    }),
    inverter: resolveInverterProfile(library, {
      catalogId: selection?.inverterCatalogId,
      manufacturer: inverterManufacturer,
      model: selection?.inverterModel,
      ratedAcKw: summary.systemKw,
      phase: config?.pricing?.connectionPhase,
    }),
    calculatedAt,
  });
}
