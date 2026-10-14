"use client";

/** Local Canvas preview — /dev/canvas-preview */

import { ProposalPageFit } from "@/components/proposals/_shared/proposal-page-fit";
import { CanvasProposalRenderer } from "@/components/proposals/canvas/canvas-renderer";
import { MOCK_ZENITH_DATA } from "@/components/proposals/zenith/mock-zenith-data";
import { calculateEquipmentEngineering } from "@/lib/equipment-engineering";
import { BUILT_IN_EQUIPMENT_LIBRARY } from "@/lib/equipment-library";

const equipment = calculateEquipmentEngineering({
  targetAcKw: 5,
  moduleCountOverride: 8,
  module: BUILT_IN_EQUIPMENT_LIBRARY.modules[0]!,
  inverter: BUILT_IN_EQUIPMENT_LIBRARY.inverters[0]!,
  calculatedAt: "2026-10-14T12:00:00.000Z",
});

const previewData = {
  ...MOCK_ZENITH_DATA,
  bill: { ...MOCK_ZENITH_DATA.bill, hasData: false },
  bom: MOCK_ZENITH_DATA.bom.map((item) => {
    if (/module|panel/i.test(item.name)) {
      return {
        ...item,
        brand: equipment.module.manufacturer,
        spec: `${equipment.moduleCount} × ${equipment.module.watt} Wp · ${equipment.module.model}`,
      };
    }
    if (/inverter/i.test(item.name)) {
      return {
        ...item,
        brand: equipment.inverter.manufacturer,
        spec: `${equipment.inverter.ratedAcKw} kW · ${equipment.inverter.model} · ${equipment.inverter.mpptCount} MPPT`,
      };
    }
    return item;
  }),
  engineering: { ...MOCK_ZENITH_DATA.engineering, equipment },
  execution: {
    ...MOCK_ZENITH_DATA.execution,
    payments: [
      { label: "1. advance", pctLabel: "40%", amountInr: 120000 },
      { label: "2. material", pctLabel: "30%", amountInr: 90000 },
      { label: "3. installation", pctLabel: "15%", amountInr: 45000 },
      { label: "4. commissioning", pctLabel: "15%", amountInr: 45000 },
    ],
  },
};

export default function CanvasPreviewPage() {
  return (
    <div className="min-h-[100dvh] bg-[#dfe7ee]">
      <ProposalPageFit>
        <CanvasProposalRenderer data={previewData} />
      </ProposalPageFit>
    </div>
  );
}
