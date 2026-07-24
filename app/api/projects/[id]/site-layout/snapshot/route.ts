import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { supabase } from "@/lib/supabase";
import { roofGeometrySchema } from "@/lib/site-layout";
import { buildDesignStudioStaticMapUrl } from "@/lib/design-studio-map-snapshot";
import {
  fetchStaticMapPng,
  resolveDesignStudioSnapshotUrl,
  uploadDesignStudioSnapshotPng,
} from "@/lib/design-studio-snapshot-upload";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

function db() {
  return createSupabaseAdmin() ?? supabase;
}

const bodySchema = z.object({
  center_lat: z.number().min(-90).max(90),
  center_lng: z.number().min(-180).max(180),
  zoom: z.number().min(3).max(22).optional(),
  roof_geojson: roofGeometrySchema.nullable().optional(),
  panels: z
    .array(
      z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
      })
    )
    .max(200)
    .optional()
    .default([]),
});

/**
 * POST — capture Static Maps hybrid PNG, upload to project-files, return path + signed URL.
 * Design / Hub only — not embedded in customer proposal.
 */
export async function POST(req: NextRequest, ctx: RouteCtx) {
  try {
    const { id: projectId } = await ctx.params;
    if (!projectId) {
      return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });
    }

    const parsed = bodySchema.parse(await req.json());
    const apiKey =
      process.env.GOOGLE_MAPS_API_KEY?.trim() ||
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
      "";
    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "google_maps_api_key_missing" },
        { status: 503 }
      );
    }

    const client = db();
    if (!client) {
      return NextResponse.json({ ok: false, error: "db_unavailable" }, { status: 503 });
    }

    const { data: project, error: projectError } = await client
      .from("projects")
      .select("organization_id")
      .eq("id", projectId)
      .maybeSingle();

    if (projectError || !project?.organization_id) {
      return NextResponse.json(
        { ok: false, error: projectError?.message ?? "project_not_found" },
        { status: 404 }
      );
    }

    const staticUrl = buildDesignStudioStaticMapUrl({
      centerLat: parsed.center_lat,
      centerLng: parsed.center_lng,
      zoom: parsed.zoom,
      roof: parsed.roof_geojson ?? null,
      panelPoints: parsed.panels,
      apiKey,
    });
    if (!staticUrl) {
      return NextResponse.json(
        { ok: false, error: "static_map_url_failed" },
        { status: 400 }
      );
    }

    const fetched = await fetchStaticMapPng(staticUrl);
    if (!fetched.ok) {
      return NextResponse.json({ ok: false, error: fetched.error }, { status: 502 });
    }

    const uploaded = await uploadDesignStudioSnapshotPng({
      organizationId: String(project.organization_id),
      projectId,
      pngBuffer: fetched.buffer,
    });
    if (!uploaded.ok) {
      return NextResponse.json({ ok: false, error: uploaded.error }, { status: 500 });
    }

    const url = await resolveDesignStudioSnapshotUrl(uploaded.path, 3600);
    return NextResponse.json(
      {
        ok: true,
        data: {
          path: uploaded.path,
          url,
        },
      },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join(", ")
        : error instanceof Error
          ? error.message
          : "snapshot_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
