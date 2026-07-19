import { openDB } from "idb";
import type { RoofPolygon, SiteObstruction } from "@/lib/site-layout";

export type SiteLayoutDraft = {
  roof: RoofPolygon | null;
  obstructions: SiteObstruction[];
  center_lat: number | null;
  center_lng: number | null;
  roof_type: string | null;
  updated_at: string;
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
