/**
 * Obsidian array sizing — live BOM / proposal numbers only.
 * Do not import Emerald/Quantum helpers. Do not invent 580W / 1440 / Satna coords.
 */

import type { ProposalBomItem, ProposalData } from "@/lib/proposal-data";

export type ObsidianPanelSpec = {
  watt: number;
  modules: number;
  dcKwp: number;
  panelItem: ProposalBomItem | null;
  inverterItem: ProposalBomItem | null;
};

function bomText(item: ProposalBomItem | null | undefined): string {
  if (!item) return "";
  return [item.name, item.brand, item.spec, item.description, ...(item.technicalPoints ?? [])]
    .filter(Boolean)
    .join(" ");
}

function parseCountAndWatt(text: string): { count: number; watt: number } {
  const combo = text.match(/(\d+)\s*(?:×|x)\s*(\d{3,4})\s*(?:W|Wp)\b/i);
  if (combo) {
    return { count: Number(combo[1]), watt: Number(combo[2]) };
  }
  const wattOnly = text.match(/(\d{3,4})\s*(?:W|Wp)\b/i);
  return { count: 0, watt: wattOnly ? Number(wattOnly[1]) : 0 };
}

function findBom(items: ProposalBomItem[], test: RegExp): ProposalBomItem | null {
  return (
    items.find((item) => test.test(`${item.name} ${item.brand} ${item.spec}`)) ??
    null
  );
}

export function resolveObsidianPanelSpec(data: ProposalData): ObsidianPanelSpec {
  const items = (data.bom ?? []).filter((b) => b.name?.trim());
  const panelItem = findBom(items, /panel|module|pv\b/i);
  const inverterItem = findBom(items, /inverter/i);
  const parsed = parseCountAndWatt(bomText(panelItem));
  const systemKw = Number(data.meta.systemKw) || 0;
  const watt = parsed.watt > 0 ? parsed.watt : 0;
  const modules =
    parsed.count > 0
      ? parsed.count
      : watt > 0 && systemKw > 0
        ? Math.max(1, Math.ceil((systemKw * 1000) / watt))
        : 0;
  const dcKwp = modules > 0 && watt > 0 ? (modules * watt) / 1000 : 0;
  return { watt, modules, dcKwp, panelItem, inverterItem };
}

export function formatObsidianKw(kw: number, digits = 2): string {
  if (!(kw > 0)) return "—";
  return kw % 1 === 0 ? String(kw) : kw.toFixed(digits);
}
