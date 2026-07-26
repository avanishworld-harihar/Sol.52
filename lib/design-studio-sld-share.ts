/**
 * Design Studio — SLD pack share (token URL).
 * Separate from customer proposal and Design pack share links.
 */

import { buildDesignStudioSldModel, type DesignStudioSldModel } from "@/lib/design-studio-sld-model";
import { estimateStringing } from "@/lib/design-studio-stringing";
import type { PanelSpec, ProjectPanelLayout } from "@/lib/panel-layout";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { supabase } from "@/lib/supabase";

function db() {
  return createSupabaseAdmin() ?? supabase;
}

export type SldPackSharePayload = {
  token: string;
  model: DesignStudioSldModel;
};

export async function ensureSldPackShareToken(
  projectId: string
): Promise<{ ok: true; token: string; layoutId: string } | { ok: false; error: string }> {
  const client = db();
  if (!client) return { ok: false, error: "db_unavailable" };

  const { data: current, error } = await client
    .from("project_panel_layouts")
    .select("id, share_token")
    .eq("project_id", projectId)
    .eq("is_current", true)
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!current) return { ok: false, error: "panel_layout_missing" };

  const row = current as { id: string; share_token: string | null };
  if (row.share_token) {
    return { ok: true, token: row.share_token, layoutId: row.id };
  }

  const token = crypto.randomUUID();
  const { data: updated, error: updateErr } = await client
    .from("project_panel_layouts")
    .update({ share_token: token })
    .eq("id", row.id)
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

export async function getSldPackByShareToken(
  token: string
): Promise<SldPackSharePayload | null> {
  const trimmed = token.trim();
  if (!trimmed || trimmed.length < 32) return null;

  const client = db();
  if (!client) return null;

  const { data: panelRow, error } = await client
    .from("project_panel_layouts")
    .select("*")
    .eq("share_token", trimmed)
    .maybeSingle();

  if (error || !panelRow) return null;
  const panel = panelRow as ProjectPanelLayout & {
    project_id: string;
    tilt_deg?: number | null;
  };

  const { data: project } = await client
    .from("projects")
    .select("id, official_name, lead_name")
    .eq("id", panel.project_id)
    .maybeSingle();

  const { data: siteRow } = await client
    .from("project_site_layouts")
    .select("center_lat, center_lng, roof_azimuth_deg")
    .eq("project_id", panel.project_id)
    .eq("is_current", true)
    .maybeSingle();

  const projectName =
    (project as { official_name?: string | null; lead_name?: string | null } | null)
      ?.official_name?.trim() ||
    (project as { lead_name?: string | null } | null)?.lead_name?.trim() ||
    "Project";

  const panelSpec: PanelSpec = panel.panel_spec ?? {
    catalog_id: "unknown",
    manufacturer: "—",
    model: "—",
    wattage: 540,
    width_mm: 1134,
    height_mm: 2278,
  };

  const panelCount = panel.panel_count ?? panel.panels_geojson?.length ?? 0;
  const stringing = estimateStringing({ panelCount, panelSpec });
  if (!stringing) return null;

  const site = siteRow as {
    center_lat?: number | null;
    center_lng?: number | null;
    roof_azimuth_deg?: number | null;
  } | null;

  const model = buildDesignStudioSldModel({
    projectName,
    panelSpec,
    stringing,
    panelTiltDeg: Number(panel.tilt_deg ?? 0) || 0,
    latitudeDeg: site?.center_lat != null ? Number(site.center_lat) : null,
    longitudeDeg: site?.center_lng != null ? Number(site.center_lng) : null,
    azimuthDeg: site?.roof_azimuth_deg != null ? Number(site.roof_azimuth_deg) : null,
  });

  return { token: trimmed, model };
}
