import {
  buildIndicativeInverterProfile,
  buildIndicativeModuleProfile,
  calculateEquipmentEngineering,
} from "@/lib/equipment-engineering";

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
  return errors;
}
