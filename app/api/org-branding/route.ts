/**
 * GET/PUT /api/org-branding
 * Org-scoped Brand & Proposals settings (company profile, logo URL, banking).
 * Service-role path; localStorage remains a client cache.
 */
import { NextRequest, NextResponse } from "next/server";
import {
  finalizeBrandingSettings,
  type ProposalBrandingSettings,
} from "@/lib/proposal-branding-settings";
import { readOrgBrandingSettings, writeOrgBrandingSettings } from "@/lib/org-branding-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await readOrgBrandingSettings();
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error, settings: null },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }
    return NextResponse.json(
      {
        ok: true,
        settings: result.record?.settings ?? null,
        updatedAt: result.record?.updatedAt ?? null,
        organizationId: result.record?.organizationId ?? null,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "org_branding_read_failed";
    return NextResponse.json(
      { ok: false, error: message, settings: null },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as { settings?: Partial<ProposalBrandingSettings> };
    if (!body?.settings || typeof body.settings !== "object") {
      return NextResponse.json({ ok: false, error: "settings object is required." }, { status: 400 });
    }

    const normalized = finalizeBrandingSettings(body.settings);
    const result = await writeOrgBrandingSettings(normalized);
    if (!result.ok) {
      const status = result.error.includes("migration")
        ? 503
        : result.error.includes("organization")
          ? 400
          : 500;
      return NextResponse.json({ ok: false, error: result.error }, { status });
    }

    return NextResponse.json(
      {
        ok: true,
        settings: result.record.settings,
        updatedAt: result.record.updatedAt,
        organizationId: result.record.organizationId,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "org_branding_write_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
