import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { supabase } from "@/lib/supabase";
import { appendActivityEvent } from "@/lib/followup-store";
import type { CustomerFileType } from "@/lib/customer-file-upload";
import { writeCustomerFileUpload } from "@/lib/document-write-router";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

type RouteCtx = { params: Promise<{ id: string }> };

function db() {
  return createSupabaseAdmin() ?? supabase;
}

const fileTypeSchema = z.enum(["bill", "site_image", "document"]);

export async function POST(req: NextRequest, ctx: RouteCtx) {
  try {
    const { id: leadId } = await ctx.params;
    if (!leadId) return NextResponse.json({ ok: false, error: "missing id" }, { status: 400 });

    const client = db();
    if (!client) return NextResponse.json({ ok: false, error: "db_unavailable" }, { status: 503 });

    const form = await req.formData();
    const file = form.get("file");
    const fileTypeRaw = form.get("file_type");

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "file is required" }, { status: 400 });
    }

    const fileType = fileTypeSchema.parse(typeof fileTypeRaw === "string" ? fileTypeRaw : "document");
    const bytes = Buffer.from(await file.arrayBuffer());

    const result = await writeCustomerFileUpload({
      leadId,
      fileBuffer: bytes,
      mimeType: file.type || "application/octet-stream",
      fileType: fileType as CustomerFileType,
      fileName: file.name,
      legacyInsert: async () => {
        const { uploadCustomerFile } = await import("@/lib/customer-file-upload");
        const uploaded = await uploadCustomerFile(
          leadId,
          bytes,
          file.type || "application/octet-stream",
          fileType as CustomerFileType,
          file.name
        );
        if (!uploaded.ok || !uploaded.url) return null;
        const fileSizeKb = Math.round(bytes.length / 1024);
        const { data, error } = await client
          .from("customer_files")
          .insert({
            lead_id: leadId,
            file_name: file.name.slice(0, 255),
            file_url: uploaded.url,
            file_type: fileType,
            file_size_kb: fileSizeKb,
            mime_type: file.type || null,
          })
          .select("*")
          .single();
        if (error) return null;
        return data as Record<string, unknown>;
      },
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    void appendActivityEvent({
      leadId,
      eventType: "file_uploaded",
      meta: { file_name: file.name, file_type: fileType, storage_v2: result.v2 },
    });

    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof z.ZodError
        ? err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")
        : err instanceof Error
          ? err.message
          : "Upload failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
