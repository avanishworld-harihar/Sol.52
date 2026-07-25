/**
 * Design Studio Phase 5 — Design pack share (token URL).
 * Separate from customer proposal share links.
 */

import { buildDesignStudioPackModel, type DesignStudioPackModel } from "@/lib/design-studio-pack-model";
import type { ProjectPanelLayout } from "@/lib/panel-layout";
import type { ProjectSiteLayout, RoofGeometry, SiteObstruction } from "@/lib/site-layout";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { supabase } from "@/lib/supabase";

function db() {
  return createSupabaseAdmin() ?? supabase;
}

export type DesignPackSharePayload = {
  token: string;
  model: DesignStudioPackModel;
  mapSnapshotPath: string | null;
};

function asLayout(row: Record<string, unknown>): ProjectSiteLayout {
  return row as unknown as ProjectSiteLayout;
}

export async function ensureDesignPackShareToken(
  projectId: string
): Promise<{ ok: true; token: string; layoutId: string } | { ok: false; error: string }> {
  const client = db();
  if (!client) return { ok: false, error: "db_unavailable" };

  const { data: current, error } = await client
    .from("project_site_layouts")
    .select("id, share_token")
    .eq("project_id", projectId)
    .eq("is_current", true)
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!current) return { ok: false, error: "site_layout_missing" };

  const existing = (current as { id: string; share_token: string | null }).share_token;
  if (existing) {
    return { ok: true, token: existing, layoutId: (current as { id: string }).id };
  }

  const token = crypto.randomUUID();
  const { data: updated, error: updateErr } = await client
    .from("project_site_layouts")
    .update({ share_token: token })
    .eq("id", (current as { id: string }).id)
    .select("id, share_token")
    .single();

  if (updateErr || !updated) {
    return { ok: false, error: updateErr?.message || "share_token_update_failed" };
  }

  return {
    ok: true,
    token: (updated as { share_token: string }).share_token,
    layoutId: (updated as { id: string }).id,
  };
}

export async function getDesignPackByShareToken(
  token: string
): Promise<DesignPackSharePayload | null> {
  const trimmed = token.trim();
  if (!trimmed || trimmed.length < 32) return null;

  const client = db();
  if (!client) return null;

  const { data: layoutRow, error } = await client
    .from("project_site_layouts")
    .select("*")
    .eq("share_token", trimmed)
    .maybeSingle();

  if (error || !layoutRow) return null;
  const layout = asLayout(layoutRow as Record<string, unknown>);

  const { data: project } = await client
    .from("projects")
    .select("id, official_name, lead_name")
    .eq("id", layout.project_id)
    .maybeSingle();

  const { data: panelRow } = await client
    .from("project_panel_layouts")
    .select("*")
    .eq("project_id", layout.project_id)
    .eq("is_current", true)
    .maybeSingle();

  const panel = (panelRow as ProjectPanelLayout | null) ?? null;
  const projectName =
    (project as { official_name?: string | null; lead_name?: string | null } | null)
      ?.official_name?.trim() ||
    (project as { lead_name?: string | null } | null)?.lead_name?.trim() ||
    "Project";

  const panels = panel?.panels_geojson ?? [];
  const panelSpec = panel?.panel_spec ?? {
    catalog_id: "unknown",
    manufacturer: "—",
    model: "—",
    wattage: 540,
    width_mm: 1134,
    height_mm: 2278,
  };

  const model = buildDesignStudioPackModel({
    projectName,
    projectId: layout.project_id,
    center: [
      Number(layout.center_lng ?? 0),
      Number(layout.center_lat ?? 0),
    ],
    roof: layout.roof_geojson as RoofGeometry,
    roofAreaSqft: layout.roof_area_sqft,
    roofAzimuthDeg: layout.roof_azimuth_deg ?? null,
    roofType: null,
    obstructions: (layout.obstructions_geojson ?? []) as SiteObstruction[],
    panels,
    panelSpec,
    orientation: panel?.orientation ?? "portrait",
    tiltDeg: panel?.tilt_deg ?? 15,
    mountingType: panel?.mounting_type ?? "elevated",
    setbackFt: panel?.setback_ft ?? 1.5,
    coveragePct: panel?.coverage_pct ?? 0,
    remainingAreaSqft: panel?.remaining_area_sqft ?? 0,
    plantRoofHeightFt: 0,
    shadowAnalysis: null,
    shadowSampleLabel: null,
    annualYieldKwh: null,
    annualShadeLossKwh: null,
  });

  return {
    token: trimmed,
    model,
    mapSnapshotPath: layout.map_snapshot_path ?? null,
  };
}
