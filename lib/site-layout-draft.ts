import { openDB } from "idb";
import { assessDesignStudioDraftIntegrity } from "@/lib/design-studio-phase6-gates";
import type { PanelOrientation, PanelSpec, PlacedPanel } from "@/lib/panel-layout";
import type { RoofGeometry, SiteObstruction } from "@/lib/site-layout";

export type SiteLayoutDraft = {
  roof: RoofGeometry | null;
  obstructions: SiteObstruction[];
  center_lat: number | null;
  center_lng: number | null;
  roof_type: string | null;
  updated_at: string;
  /** Plant / terrace height above ground (ft) for shadow datum. */
  plant_roof_height_ft?: number | null;
  panel_spec?: PanelSpec | null;
  panel_orientation?: PanelOrientation | null;
  panel_setback_ft?: number | null;
  /** Panel array tilt (degrees from horizontal). */
  panel_tilt_deg?: number | null;
  mounting_type?: "flush" | "elevated" | "ground_mount" | null;
  panels?: PlacedPanel[] | null;
  panel_remaining_area_sqft?: number | null;
  panel_coverage_pct?: number | null;
  /** Walkway & safety profile id (residential / commercial / industrial / custom). */
  safety_profile_id?: "residential" | "commercial" | "industrial" | "custom" | null;
  panel_walkway_ft?: number | null;
  obstruction_clearance_ft?: number | null;
  map_labels?: Array<{ id: string; lng: number; lat: number; text: string }> | null;
};

const DB_NAME = "sol52-design-studio";
const STORE_NAME = "site-layout-drafts";

async function database() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
    },
  });
}

export async function readSiteLayoutDraft(projectId: string): Promise<SiteLayoutDraft | null> {
  if (typeof window === "undefined") return null;
  try {
    const db = await database();
    const draft = ((await db.get(STORE_NAME, projectId)) ?? null) as SiteLayoutDraft | null;
    if (!draft) return null;
    const integrity = assessDesignStudioDraftIntegrity({
      projectId,
      roof: draft.roof,
      updated_at: draft.updated_at,
    });
    if (!integrity.ok && integrity.reasons.includes("missing_roof")) {
      console.warn("[site-layout-draft] integrity failed; clearing draft", integrity.reasons);
      await db.delete(STORE_NAME, projectId);
      return null;
    }
    if (!integrity.ok) {
      console.warn("[site-layout-draft] integrity warnings", integrity.reasons);
    }
    return draft;
  } catch {
    return null;
  }
}

export async function writeSiteLayoutDraft(
  projectId: string,
  draft: SiteLayoutDraft
): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const db = await database();
    await db.put(STORE_NAME, draft, projectId);
  } catch {
    // Draft persistence must never block editor actions.
  }
}

export async function clearSiteLayoutDraft(projectId: string): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const db = await database();
    await db.delete(STORE_NAME, projectId);
  } catch {
    // Best effort.
  }
}
