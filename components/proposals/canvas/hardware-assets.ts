/**
 * Canvas hardware / brand image paths under public/assets/.
 * Prefer brand PNGs, then category PNGs, then SVG fallbacks.
 */

import type { ProposalBomItem } from "@/lib/proposal-data";

/** Brand keyword → premium product PNG (transparent-ready studio shots). */
const BRAND_ASSETS: Array<{ match: RegExp; src: string }> = [
  { match: /waaree|waree/i, src: "/assets/hardware/waaree-panel.png" },
  { match: /havells|havell/i, src: "/assets/hardware/havells-inverter.png" },
  { match: /\bjsw\b/i, src: "/assets/hardware/jsw-structure.png" },
  { match: /luminous|microtek|polycab|ke\s*i\b|finolex/i, src: "/assets/hardware/cable.png" },
];

const CATEGORY_ASSETS: Array<{ match: RegExp; src: string }> = [
  { match: /module|panel|solar\s*mod/i, src: "/assets/hardware/panel.png" },
  { match: /inverter|mppt|ongrid|offgrid|hybrid/i, src: "/assets/hardware/inverter.png" },
  { match: /structure|mount|rail|mms|racking/i, src: "/assets/hardware/structure.png" },
  { match: /cable|wire|dc\b|ac\b|conductor/i, src: "/assets/hardware/cable.png" },
];

const FALLBACK = "/assets/hardware/default.svg";

export function resolveHardwareImageSrc(item: ProposalBomItem): string {
  const hay = `${item.name} ${item.brand} ${item.spec}`;
  for (const row of BRAND_ASSETS) {
    if (row.match.test(hay)) return row.src;
  }
  for (const row of CATEGORY_ASSETS) {
    if (row.match.test(hay)) return row.src;
  }
  return FALLBACK;
}
