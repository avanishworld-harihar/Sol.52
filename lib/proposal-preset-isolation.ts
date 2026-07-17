/**
 * Proposal preset isolation — runtime + contributor contract.
 *
 * Goal: residential document presets (Golden / Zenith / Atelier / Blueprint) and
 * commercial_executive must not break each other via shared CSS or shared models.
 *
 * Rules:
 * 1. Never import `app/proposal-premium.css` from the shared proposal layout —
 *    only Commercial (and any true ProposalWebRenderer presets) may load it.
 * 2. Never define a bare `@page { … }` inside a preset stylesheet. Use named
 *    pages (`@page zenith-sheet`, `@page atelier-cover`, …) + `page: …` on
 *    elements. Bare `@page` is document-global and overrides other presets.
 * 3. Do not edit Golden frozen paths for another preset’s sake
 *    (see `lib/golden-proposal-lock.ts`). Duplicate helpers instead.
 * 4. Prefer preset-local CSS modules / packages; keep `globals.css` print
 *    rules behind `.commercial-proposal` / `.proposal-document` when possible.
 */

import type { ProposalPresetId } from "@/lib/proposal-preset-engine";
import {
  isCommercialPreset,
  isResidentialDocumentPreset,
} from "@/lib/proposal-preset-engine";

export type ProposalIsolationLane = "residential-document" | "commercial" | "legacy-web";

export function getProposalIsolationLane(presetId: ProposalPresetId): ProposalIsolationLane {
  if (isCommercialPreset(presetId)) return "commercial";
  if (isResidentialDocumentPreset(presetId)) return "residential-document";
  return "legacy-web";
}

/** CSS / print packages that must not load on residential-document presets. */
export const COMMERCIAL_ONLY_STYLE_ENTRY = "app/proposal-premium.css" as const;

export const PRESET_ISOLATION_NOTES = [
  "Shared route shell: app/(public)/proposal/layout.tsx — fonts + canvas only.",
  "Commercial styles: imported by commercial-proposal-view.tsx only.",
  "Named @page only inside preset CSS — no bare @page in Atelier/Zenith/Golden/Canvas when editing print.",
  "Golden editorial transform is Golden-owned; other themes must not force Golden CSS changes.",
] as const;
