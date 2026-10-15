import {
  buildIndicativeInverterProfile,
  buildIndicativeModuleProfile,
  calculateEquipmentEngineering,
} from "@/lib/equipment-engineering";
import { BUILT_IN_EQUIPMENT_LIBRARY, resolveInverterProfile, resolveModuleProfile } from "@/lib/equipment-library";
import { parseInverterDatasheetText, parseModuleDatasheetText } from "@/lib/equipment-datasheet-parser";

export function validateEquipmentEngineeringGuards(): string[] {
  const errors: string[] = [];
  for (const watt of [540, 575, 600, 700]) {
    const design = calculateEquipmentEngineering({
      targetAcKw: 5,
      targetDcAcRatio: 1.1,
      module: buildIndicativeModuleProfile({ manufacturer: "Guard", watt }),
      inverter: buildIndicativeInverterProfile({ manufacturer: "Guard", ratedAcKw: 5 }),
      calculatedAt: "2026-01-01T00:00:00.000Z",
    });
    const expectedCount = Math.ceil(5_500 / watt);
    if (design.moduleCount !== expectedCount) {
      errors.push(`[equipment-engineering] ${watt} W count expected ${expectedCount}, got ${design.moduleCount}`);
    }
    if (design.stringSizes.reduce((sum, value) => sum + value, 0) !== design.moduleCount) {
      errors.push(`[equipment-engineering] ${watt} W string allocation does not equal module count`);
    }
    if (design.status === "invalid") {
      errors.push(`[equipment-engineering] ${watt} W baseline unexpectedly invalid: ${design.errors.join("; ")}`);
    }
  }

  const unsafe = calculateEquipmentEngineering({
    targetAcKw: 5,
    moduleCountOverride: 8,
    module: {
      ...buildIndicativeModuleProfile({ manufacturer: "Guard", watt: 700 }),
      impA: 30,
      iscA: 32,
    },
    inverter: buildIndicativeInverterProfile({ manufacturer: "Guard", ratedAcKw: 5 }),
    calculatedAt: "2026-01-01T00:00:00.000Z",
  });
  if (unsafe.status !== "invalid" || !unsafe.errors.some((message) => /current/i.test(message))) {
    errors.push("[equipment-engineering] unsafe MPPT current was not blocked");
  }

  const waaree580 = resolveModuleProfile(BUILT_IN_EQUIPMENT_LIBRARY, {
    manufacturer: "Waaree",
    model: "BiN-08-580",
    watt: 580,
  });
  const sungrow5 = resolveInverterProfile(BUILT_IN_EQUIPMENT_LIBRARY, {
    manufacturer: "Sungrow",
    model: "SG5.0RS-L",
    ratedAcKw: 5,
    phase: "single_phase",
  });
  const verified = calculateEquipmentEngineering({
    targetAcKw: 5,
    targetDcAcRatio: 1.1,
    module: waaree580,
    inverter: sungrow5,
    calculatedAt: "2026-01-01T00:00:00.000Z",
  });
  if (verified.status !== "verified" || verified.moduleCount !== 10 || verified.stringSizes.join("+") !== "10") {
    errors.push("[equipment-engineering] verified Waaree 580 W / Sungrow 5 kW design is not stable");
  }
  if (verified.requiredRoofAreaSqFt <= 0 || verified.requiredRoofAreaM2 <= 0) {
    errors.push("[equipment-engineering] shared roof-area calculation is missing");
  }

  for (const manufacturer of ["Polycab", "Waaree", "Havells", "Vesole", "Luminous"]) {
    const profile = resolveInverterProfile(BUILT_IN_EQUIPMENT_LIBRARY, {
      manufacturer,
      ratedAcKw: 5,
      phase: "single_phase",
    });
    if (profile.manufacturer !== manufacturer || profile.verification !== "indicative") {
      errors.push(`[equipment-engineering] ${manufacturer} 5 kW design envelope is unavailable`);
    }
  }

  for (const manufacturer of ["Vikram Solar", "RenewSys", "LONGi", "Jinko Solar"]) {
    const profile = resolveModuleProfile(BUILT_IN_EQUIPMENT_LIBRARY, {
      manufacturer,
      watt: 580,
    });
    if (profile.manufacturer !== manufacturer || profile.verification !== "indicative") {
      errors.push(`[equipment-engineering] ${manufacturer} 580 W design envelope is unavailable`);
    }
  }

  const moduleExtraction = parseModuleDatasheetText(
    "BiN-08-580 Open circuit voltage Voc 52.60 V Maximum power voltage Vmp 44.10 V Short circuit current Isc 14.00 A Maximum power current Imp 13.20 A Maximum system voltage 1500 V Dimensions 2278 x 1134 mm",
    waaree580
  );
  if (moduleExtraction.patch.vocV !== 52.6 || moduleExtraction.patch.widthMm !== 1134) {
    errors.push("[equipment-engineering] module datasheet extraction failed");
  }

  const inverterExtraction = parseInverterDatasheetText(
    "SG5.0RS-L Max. PV input voltage 600 V Min. operating PV voltage / Start-up input voltage 40 V / 50 V MPP voltage range 40 V - 560 V No. of independent MPP inputs 2 No. of PV strings per MPPT 1 Max. PV input current 16 A Max. DC short-circuit current 20 A",
    sungrow5
  );
  if (inverterExtraction.patch.mpptMaxV !== 560 || inverterExtraction.patch.startupVoltageV !== 50) {
    errors.push("[equipment-engineering] inverter datasheet extraction failed");
  }
  return errors;
}
