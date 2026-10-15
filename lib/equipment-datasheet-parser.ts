import { PDFParse } from "pdf-parse";
import type { InverterProfile, PvModuleProfile } from "@/lib/equipment-engineering";

export const EQUIPMENT_DATASHEET_PARSER_VERSION = "1.1.0";

export type EquipmentDatasheetExtraction = {
  patch: Record<string, number | string>;
  fields: string[];
  confidence: number;
};

function normalized(text: string): string {
  return text
    .replace(/[−–—]/g, "-")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function numberAfter(text: string, labels: string[], unit?: string): number | undefined {
  for (const label of labels) {
    const suffix = unit ? `\\s*(?:${unit})` : "";
    const expression = new RegExp(`${label}[^0-9+\\-]{0,45}([+\\-]?\\d+(?:\\.\\d+)?)${suffix}`, "i");
    const match = text.match(expression);
    const value = match?.[1] ? Number(match[1]) : Number.NaN;
    if (Number.isFinite(value)) return value;
  }
  return undefined;
}

function voltageRange(text: string): [number, number] | undefined {
  const match = text.match(
    /(?:MPP|MPPT)[^0-9]{0,35}(?:voltage\s*)?range[^0-9]{0,25}(\d+(?:\.\d+)?)\s*V?\s*(?:-|to|~)\s*(\d+(?:\.\d+)?)\s*V/i
  );
  if (!match?.[1] || !match[2]) return undefined;
  return [Number(match[1]), Number(match[2])];
}

function dimensions(text: string): [number, number] | undefined {
  const match = text.match(
    /(?:dimensions?|length\s*x\s*width)[^0-9]{0,50}(\d{3,4}(?:\.\d+)?)\s*(?:mm)?\s*[x×]\s*(\d{3,4}(?:\.\d+)?)\s*mm/i
  );
  if (!match?.[1] || !match[2]) return undefined;
  const first = Number(match[1]);
  const second = Number(match[2]);
  return first >= second ? [Math.round(second), Math.round(first)] : [Math.round(first), Math.round(second)];
}

function keepNumber(
  patch: Record<string, number | string>,
  key: string,
  value: number | undefined,
  min: number,
  max: number
) {
  if (value != null && value >= min && value <= max) patch[key] = value;
}

export function parseModuleDatasheetText(
  rawText: string,
  current: PvModuleProfile
): EquipmentDatasheetExtraction {
  const text = normalized(rawText);
  const patch: Record<string, number | string> = {};
  keepNumber(patch, "vocV", numberAfter(text, ["open circuit voltage", "Voc"], "V"), 10, 200);
  keepNumber(patch, "vmpV", numberAfter(text, ["maximum power voltage", "maximum voltage", "Vmpp?"], "V"), 10, 200);
  keepNumber(patch, "iscA", numberAfter(text, ["short circuit current", "Isc"], "A"), 1, 100);
  keepNumber(patch, "impA", numberAfter(text, ["maximum power current", "maximum current", "Impp?"], "A"), 1, 100);
  keepNumber(
    patch,
    "vocTempCoeffPctC",
    numberAfter(text, ["temperature coefficient of (?:voltage|Voc)", "Tc of open circuit voltage"], "%\\s*\\/?(?:°|deg)?C"),
    -2,
    0
  );
  keepNumber(
    patch,
    "pmaxTempCoeffPctC",
    numberAfter(text, ["temperature coefficient of (?:power|Pmax|Pm)", "Tc of power"], "%\\s*\\/?(?:°|deg)?C"),
    -2,
    0
  );
  keepNumber(
    patch,
    "maxSystemVoltageV",
    numberAfter(text, ["maximum system voltage"], "V(?:DC)?"),
    100,
    2_000
  );
  const size = dimensions(text);
  if (size) {
    patch.widthMm = size[0];
    patch.heightMm = size[1];
  }

  // A parser result never silently changes the catalog. It only creates a
  // review candidate. Requiring the exact model token reduces cross-row reads
  // in multi-model datasheets.
  const modelPresent = text.toLowerCase().includes(current.model.toLowerCase());
  const fields = Object.keys(patch);
  const confidence = Math.min(0.98, (modelPresent ? 0.45 : 0.15) + fields.length * 0.08);
  return { patch, fields, confidence };
}

export function parseInverterDatasheetText(
  rawText: string,
  current: InverterProfile
): EquipmentDatasheetExtraction {
  const text = normalized(rawText);
  const patch: Record<string, number | string> = {};
  keepNumber(patch, "maxPvPowerKw", numberAfter(text, ["recommended max\\.? PV input power"], "kWp"), 0.1, 30_000);
  keepNumber(patch, "maxDcVoltageV", numberAfter(text, ["max\\.? PV input voltage", "max\\.? DC voltage"], "V"), 50, 2_000);
  const startup = text.match(
    /min\.?\s*operating\s*PV\s*voltage\s*\/\s*start-?up\s*input\s*voltage[^0-9]{0,30}(\d+(?:\.\d+)?)\s*V\s*\/\s*(\d+(?:\.\d+)?)\s*V/i
  );
  if (startup?.[2]) patch.startupVoltageV = Number(startup[2]);
  const mppt = voltageRange(text);
  if (mppt) {
    patch.mpptMinV = mppt[0];
    patch.mpptMaxV = mppt[1];
  }
  keepNumber(patch, "mpptCount", numberAfter(text, ["No\\.? of independent MPP inputs", "No\\.? of MPP trackers"]), 1, 100);
  keepNumber(patch, "stringsPerMppt", numberAfter(text, ["No\\.? of PV strings per MPPT", "Default No\\.? of PV strings per MPPT"]), 1, 20);
  keepNumber(patch, "maxInputCurrentPerMpptA", numberAfter(text, ["Max\\.? PV input current", "Max\\.? input current per MPP tracker"], "A"), 1, 1_000);
  keepNumber(patch, "maxShortCircuitCurrentPerMpptA", numberAfter(text, ["Max\\.? DC short-circuit current", "Max\\.? short-circuit current per MPP tracker"], "A"), 1, 2_000);

  const modelPresent = text.toLowerCase().includes(current.model.toLowerCase());
  const fields = Object.keys(patch);
  const confidence = Math.min(0.98, (modelPresent ? 0.45 : 0.15) + fields.length * 0.08);
  return { patch, fields, confidence };
}

export async function extractPdfText(bytes: ArrayBuffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(bytes) });
  try {
    return (await parser.getText()).text;
  } finally {
    await parser.destroy();
  }
}
