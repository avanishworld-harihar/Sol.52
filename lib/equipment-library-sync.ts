import { createHash } from "crypto";
import {
  BUILT_IN_EQUIPMENT_LIBRARY,
  equipmentLibrarySchema,
  type EquipmentLibrary,
  type EquipmentSourceState,
} from "@/lib/equipment-library";

type OfficialSource = {
  equipmentId: string;
  kind: "module" | "inverter";
  url: string;
  parser: "waaree_product_html" | "official_datasheet_watch";
};

/** Curated manufacturer-owned sources only. Never accept arbitrary URLs here. */
export const OFFICIAL_EQUIPMENT_SOURCES: OfficialSource[] = [
  {
    equipmentId: "waaree-bin-03-700",
    kind: "module",
    url: "https://shop.waaree.com/waaree-700wp-topcon-n-type-bifacial-solar-panel-m12-g2g-132-cells-dual-glass-high-efficiency-solar-module-for-rooftop-commercial-use/",
    parser: "waaree_product_html",
  },
  {
    equipmentId: "sungrow-mg5rl",
    kind: "inverter",
    url: "https://info-support.sungrowpower.com/datasheet-materials/de58dcf3-84b9-4f96-af76-f00a9df37dfa.pdf",
    parser: "official_datasheet_watch",
  },
  {
    equipmentId: "sungrow-sg110cx",
    kind: "inverter",
    url: "https://en.sungrowpower.com/upload/documentFile/DS_SG110CX%20Datasheet_V14_EN.pdf.pdf",
    parser: "official_datasheet_watch",
  },
];

function sourcesForLibrary(library: EquipmentLibrary): OfficialSource[] {
  const sources = new Map(
    OFFICIAL_EQUIPMENT_SOURCES.map((source) => [source.equipmentId, source])
  );
  library.modules.forEach((entry) => {
    if (!entry.source.url || sources.has(entry.id)) return;
    sources.set(entry.id, {
      equipmentId: entry.id,
      kind: "module",
      url: entry.source.url,
      parser: "official_datasheet_watch",
    });
  });
  library.inverters.forEach((entry) => {
    if (!entry.source.url || sources.has(entry.id)) return;
    sources.set(entry.id, {
      equipmentId: entry.id,
      kind: "inverter",
      url: entry.source.url,
      parser: "official_datasheet_watch",
    });
  });
  return [...sources.values()];
}

function hash(bytes: ArrayBuffer): string {
  return createHash("sha256").update(Buffer.from(bytes)).digest("hex");
}

function htmlText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function numberMatch(text: string, pattern: RegExp): number | null {
  const match = text.match(pattern);
  if (!match?.[1]) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

function updateWaareeProductHtml(
  library: EquipmentLibrary,
  equipmentId: string,
  html: string,
  checkedAt: string,
  contentHash: string
): EquipmentLibrary {
  const text = htmlText(html);
  const watt = numberMatch(text, /rated power of\s*(\d+(?:\.\d+)?)\s*W/i);
  const efficiencyPct = numberMatch(text, /efficiency of\s*(\d+(?:\.\d+)?)\s*%/i);
  const widthCm = numberMatch(text, /Width:\s*(\d+(?:\.\d+)?)\s*\(cm\)/i);
  const heightCm = numberMatch(text, /Height:\s*(\d+(?:\.\d+)?)\s*\(cm\)/i);
  return {
    ...library,
    modules: library.modules.map((entry) =>
      entry.id !== equipmentId
        ? entry
        : {
            ...entry,
            ...(watt ? { watt } : {}),
            ...(efficiencyPct ? { efficiencyPct } : {}),
            ...(widthCm ? { widthMm: Math.round(widthCm * 10) } : {}),
            ...(heightCm ? { heightMm: Math.round(heightCm * 10) } : {}),
            source: {
              ...entry.source,
              checkedAt,
              contentHash,
            },
          }
    ),
  };
}

/**
 * Refresh official sources. A changed datasheet is quarantined instead of
 * silently changing electrical limits; verified calculations keep using the
 * last approved revision until the new document is reviewed.
 */
export async function syncOfficialEquipmentLibrary(
  current: EquipmentLibrary = BUILT_IN_EQUIPMENT_LIBRARY
): Promise<EquipmentLibrary> {
  let library = equipmentLibrarySchema.parse(current);
  const checkedAt = new Date().toISOString();
  const states: EquipmentSourceState[] = [];

  for (const source of sourcesForLibrary(library)) {
    const previous = library.sources.find((entry) => entry.equipmentId === source.equipmentId);
    try {
      const response = await fetch(source.url, {
        cache: "no-store",
        redirect: "follow",
        signal: AbortSignal.timeout(25_000),
        headers: { "User-Agent": "Sol52-Equipment-Library/1.0" },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const bytes = await response.arrayBuffer();
      if (bytes.byteLength < 100 || bytes.byteLength > 20_000_000) {
        throw new Error("Unexpected source size");
      }
      const contentHash = hash(bytes);
      const changed = Boolean(previous?.contentHash && previous.contentHash !== contentHash);

      if (source.parser === "waaree_product_html") {
        library = updateWaareeProductHtml(
          library,
          source.equipmentId,
          Buffer.from(bytes).toString("utf8"),
          checkedAt,
          contentHash
        );
      } else if (changed) {
        library = {
          ...library,
          modules: library.modules.map((entry) =>
            source.kind === "module" && entry.id === source.equipmentId
              ? {
                  ...entry,
                  verification: "review_required" as const,
                  source: { ...entry.source, checkedAt, contentHash },
                }
              : entry
          ),
          inverters: library.inverters.map((entry) =>
            source.kind === "inverter" && entry.id === source.equipmentId
              ? {
                  ...entry,
                  verification: "review_required" as const,
                  source: { ...entry.source, checkedAt, contentHash },
                }
              : entry
          ),
        };
      } else {
        library = {
          ...library,
          modules: library.modules.map((entry) =>
            source.kind === "module" && entry.id === source.equipmentId
              ? { ...entry, source: { ...entry.source, checkedAt, contentHash } }
              : entry
          ),
          inverters: library.inverters.map((entry) =>
            source.kind === "inverter" && entry.id === source.equipmentId
              ? { ...entry, source: { ...entry.source, checkedAt, contentHash } }
              : entry
          ),
        };
      }

      states.push({
        equipmentId: source.equipmentId,
        url: source.url,
        checkedAt,
        contentHash,
        status: changed && source.parser === "official_datasheet_watch" ? "review_required" : "current",
        message:
          changed && source.parser === "official_datasheet_watch"
            ? "Official datasheet changed; electrical revision quarantined for review."
            : undefined,
      });
    } catch (error) {
      states.push({
        equipmentId: source.equipmentId,
        url: source.url,
        checkedAt,
        contentHash: previous?.contentHash,
        status: "fetch_failed",
        message: error instanceof Error ? error.message.slice(0, 500) : "Fetch failed",
      });
    }
  }

  return equipmentLibrarySchema.parse({
    ...library,
    revision: library.revision + 1,
    sources: states,
    lastSyncedAt: checkedAt,
  });
}
