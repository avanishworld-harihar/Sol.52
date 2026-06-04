import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { appendActivityEvent } from "@/lib/followup-store";
import { listCustomerFilesForApi } from "@/lib/document-write-router";
import { resolveDefaultOrgId } from "@/lib/project-store";
import {
  customerFileTypeToAssetCategory,
  insertCustomerAsset,
  customerAssetToLegacyFileRow,
} from "@/lib/customer-asset-store";
import type { CustomerFileType } from "@/lib/customer-file-upload";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

const postSchema = z.object({
  file_name: z.string().min(1).max(255),
  file_url: z.string().url(),
  file_type: z.enum(["bill", "site_image", "document"]),
  file_size_kb: z.number().nonnegative().optional(),
  mime_type: z.string().max(100).optional().nullable(),
});

export async function GET(_req: NextRequest, ctx: RouteCtx) {
  try {
    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ ok: false, error: "missing id" }, { status: 400 });

    const data = await listCustomerFilesForApi(id);
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, ctx: RouteCtx) {
  try {
    const { id: leadId } = await ctx.params;
    if (!leadId) return NextResponse.json({ ok: false, error: "missing id" }, { status: 400 });

    const body = await req.json();
    const parsed = postSchema.parse(body);

    const orgId = await resolveDefaultOrgId();
    if (!orgId) {
      return NextResponse.json({ ok: false, error: "organization_not_configured" }, { status: 400 });
    }
    const category = customerFileTypeToAssetCategory(parsed.file_type as CustomerFileType);
    const asset = await insertCustomerAsset({
      organizationId: orgId,
      customerId: leadId,
      category,
      storagePath: parsed.file_url,
      publicUrl: parsed.file_url,
      filename: parsed.file_name,
      mimeType: parsed.mime_type ?? "application/octet-stream",
      sizeBytes: (parsed.file_size_kb ?? 1) * 1024,
    });
    if (!asset) {
      return NextResponse.json({ ok: false, error: "customer_asset_insert_failed" }, { status: 400 });
    }
    const data = customerAssetToLegacyFileRow(asset, parsed.file_type as CustomerFileType);
    void appendActivityEvent({
      leadId,
      eventType: "file_uploaded",
      meta: { file_name: parsed.file_name, file_type: parsed.file_type, storage_v2: true },
    });
    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof z.ZodError
        ? err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")
        : err instanceof Error
          ? err.message
          : "Failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
