import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { supabase } from "@/lib/supabase";
import { appendActivityEvent } from "@/lib/followup-store";
import type { CustomerFileType } from "@/lib/customer-file-upload";
import { writeCustomerHubCategoryUpload } from "@/lib/document-write-router";
import type { CustomerHubUploadCategory } from "@/lib/documents-hub-ui-categories";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

type RouteCtx = { params: Promise<{ id: string }> };

function db() {
  return createSupabaseAdmin() ?? supabase;
}

const fileTypeSchema = z.enum(["bill", "site_image", "document"]);
const hubCategorySchema = z.enum([
  "electricity_bill",
  "aadhaar",
  "pan",
  "agreement",
  "advance_receipt",
  "site_photo",
  "other",
]);

export async function POST(req: NextRequest, ctx: RouteCtx) {
  try {
    const { id: leadId } = await ctx.params;
    if (!leadId) return NextResponse.json({ ok: false, error: "missing id" }, { status: 400 });

    const client = db();
    if (!client) return NextResponse.json({ ok: false, error: "db_unavailable" }, { status: 503 });

    const form = await req.formData();
    const file = form.get("file");
    const fileTypeRaw = form.get("file_type");
    const hubCategoryRaw = form.get("hub_category");

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "file is required" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "application/octet-stream";

    const legacyInsert = async (fileType: CustomerFileType) => {
      const { uploadCustomerFile } = await import("@/lib/customer-file-upload");
      const uploaded = await uploadCustomerFile(
        leadId,
        bytes,
        mimeType,
        fileType,
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
    };

    let result;
    if (typeof hubCategoryRaw === "string" && hubCategoryRaw.trim()) {
      const hubCategory = hubCategorySchema.parse(hubCategoryRaw.trim());
      result = await writeCustomerHubCategoryUpload({
        leadId,
        hubCategory: hubCategory as CustomerHubUploadCategory,
        fileBuffer: bytes,
        mimeType,
        fileName: file.name,
        legacyInsert,
      });
    } else {
      const fileType = fileTypeSchema.parse(typeof fileTypeRaw === "string" ? fileTypeRaw : "document");
      const { writeCustomerFileUpload } = await import("@/lib/document-write-router");
      result = await writeCustomerFileUpload({
        leadId,
        fileBuffer: bytes,
        mimeType,
        fileType: fileType as CustomerFileType,
        fileName: file.name,
        legacyInsert: () => legacyInsert(fileType as CustomerFileType),
      });
    }

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    const fileType =
      typeof fileTypeRaw === "string"
        ? fileTypeSchema.safeParse(fileTypeRaw).success
          ? fileTypeRaw
          : typeof hubCategoryRaw === "string"
            ? hubCategoryRaw
            : "document"
        : typeof hubCategoryRaw === "string"
          ? hubCategoryRaw
          : "document";

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
