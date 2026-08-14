/**
 * Obsidian array sizing — local copy (do not import Emerald/Quantum helpers).
 */

export const OBSIDIAN_PANEL_WATT = 580;
export const OBSIDIAN_SPECIFIC_YIELD = 1440;

export function obsidianModuleCount(systemKw: number): number {
  if (!(systemKw > 0)) return 0;
  return Math.max(1, Math.ceil((systemKw * 1000) / OBSIDIAN_PANEL_WATT));
}

export function obsidianDcKwp(moduleCount: number): number {
  return moduleCount > 0 ? (moduleCount * OBSIDIAN_PANEL_WATT) / 1000 : 0;
}

export function formatObsidianKw(kw: number, digits = 2): string {
  if (!(kw > 0)) return "—";
  return kw % 1 === 0 ? String(kw) : kw.toFixed(digits);
}
