import { createSupabaseAdmin } from "@/lib/supabase-admin";

/** CRM lead attachments — bills, site photos, documents. */
const BUCKET = "customer-files";

const IMAGE_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const DOC_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export const CUSTOMER_FILE_MIME = {
  site_image: IMAGE_MIME,
  bill: new Set([...IMAGE_MIME, ...DOC_MIME]),
  document: new Set([...IMAGE_MIME, ...DOC_MIME]),
} as const;

export type CustomerFileType = keyof typeof CUSTOMER_FILE_MIME;

const MAX_BYTES = 10 * 1024 * 1024;

function extFromMime(mime: string, fileName?: string): string {
  const m = mime.split(";")[0]?.trim().toLowerCase() || "";
  if (m === "image/jpeg" || m === "image/jpg") return "jpg";
  if (m === "image/png") return "png";
  if (m === "image/webp") return "webp";
  if (m === "image/heic" || m === "image/heif") return "heic";
  if (m === "application/pdf") return "pdf";
  if (m === "application/msword") return "doc";
  if (m === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return "docx";
  const fromName = fileName?.split(".").pop()?.toLowerCase();
  if (fromName && fromName.length <= 5) return fromName;
  return "bin";
}

async function ensureBucket() {
  const admin = createSupabaseAdmin();
  if (!admin) return { ok: false as const, error: "SUPABASE_SERVICE_ROLE_KEY missing." };

  const { data: bucket } = await admin.storage.getBucket(BUCKET);
  if (bucket) return { ok: true as const, admin };

  const allMime = [...new Set([...IMAGE_MIME, ...DOC_MIME])];
  const { error: createErr } = await admin.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: MAX_BYTES,
    allowedMimeTypes: allMime,
  });
  if (createErr && !createErr.message.toLowerCase().includes("already")) {
    return { ok: false as const, error: createErr.message };
  }
  return { ok: true as const, admin };
}

export async function uploadCustomerFile(
  leadId: string,
  fileBuffer: Buffer,
  mimeType: string,
  fileType: CustomerFileType,
  fileName?: string
): Promise<{ ok: boolean; url?: string; path?: string; error?: string }> {
  const mime = mimeType.split(";")[0]?.trim().toLowerCase() || "application/octet-stream";
  const allowed = CUSTOMER_FILE_MIME[fileType];
  if (!allowed.has(mime)) {
    return { ok: false, error: `Unsupported file type for ${fileType.replace("_", " ")}: ${mime || "unknown"}` };
  }
  if (fileBuffer.length > MAX_BYTES) {
    return { ok: false, error: `File too large. Max size is ${Math.round(MAX_BYTES / 1024 / 1024)}MB.` };
  }

  const setup = await ensureBucket();
  if (!setup.ok) return { ok: false, error: setup.error };
  const admin = setup.admin;

  const ext = extFromMime(mime, fileName);
  const path = `${leadId}/${fileType}/${crypto.randomUUID()}.${ext}`;
  const { error: uploadErr } = await admin.storage.from(BUCKET).upload(path, fileBuffer, {
    upsert: false,
    contentType: mime,
    cacheControl: "3600",
  });
  if (uploadErr) return { ok: false, error: uploadErr.message };

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) return { ok: false, error: "Could not generate public URL." };

  return { ok: true, url: data.publicUrl, path };
}
