import { openDB } from "idb";
import type { PanelOrientation, PanelSpec, PlacedPanel } from "@/lib/panel-layout";
import type { RoofGeometry, SiteObstruction } from "@/lib/site-layout";

export type SiteLayoutDraft = {
  roof: RoofGeometry | null;
  obstructions: SiteObstruction[];
  center_lat: number | null;
  center_lng: number | null;
  roof_type: string | null;
  updated_at: string;
  panel_spec?: PanelSpec | null;
  panel_orientation?: PanelOrientation | null;
  panel_setback_ft?: number | null;
  /** Panel array tilt (degrees from horizontal). */
  panel_tilt_deg?: number | null;
  mounting_type?: "flush" | "elevated" | "ground_mount" | null;
  panels?: PlacedPanel[] | null;
  panel_remaining_area_sqft?: number | null;
  panel_coverage_pct?: number | null;
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
    return (await db.get(STORE_NAME, projectId)) ?? null;
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
