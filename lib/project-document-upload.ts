import { createSupabaseAdmin } from "@/lib/supabase-admin";
import {
  PROJECT_DOCUMENT_ALLOWED_MIME,
  PROJECT_DOCUMENT_MAX_BYTES,
} from "@/lib/project-document-types";

export const PROJECT_FILES_BUCKET = "project-files";

function extFromMime(mime: string, fileName?: string): string {
  const m = mime.split(";")[0]?.trim().toLowerCase() || "";
  if (m === "image/jpeg" || m === "image/jpg") return "jpg";
  if (m === "image/png") return "png";
  if (m === "image/webp") return "webp";
  if (m === "image/heic" || m === "image/heif") return "heic";
  if (m === "application/pdf") return "pdf";
  if (m === "application/msword") return "doc";
  if (m === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return "docx";
  }
  const fromName = fileName?.split(".").pop()?.toLowerCase();
  if (fromName && fromName.length <= 5) return fromName;
  return "bin";
}

async function ensureProjectFilesBucket() {
  const admin = createSupabaseAdmin();
  if (!admin) return { ok: false as const, error: "SUPABASE_SERVICE_ROLE_KEY missing." };

  const { data: bucket } = await admin.storage.getBucket(PROJECT_FILES_BUCKET);
  if (bucket) return { ok: true as const, admin };

  const { error: createErr } = await admin.storage.createBucket(PROJECT_FILES_BUCKET, {
    public: false,
    fileSizeLimit: PROJECT_DOCUMENT_MAX_BYTES,
    allowedMimeTypes: [...PROJECT_DOCUMENT_ALLOWED_MIME],
  });
  if (createErr && !createErr.message.toLowerCase().includes("already")) {
    return { ok: false as const, error: createErr.message };
  }
  return { ok: true as const, admin };
}

export function buildProjectDocumentStoragePath(opts: {
  organizationId: string;
  projectId: string;
  documentId: string;
  mimeType: string;
  fileName?: string;
}): string {
  const ext = extFromMime(opts.mimeType, opts.fileName);
  return `${opts.organizationId}/${opts.projectId}/${opts.documentId}.${ext}`;
}

export async function uploadProjectDocumentFile(opts: {
  storagePath: string;
  fileBuffer: Buffer;
  mimeType: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const mime = opts.mimeType.split(";")[0]?.trim().toLowerCase() || "application/octet-stream";
  if (!PROJECT_DOCUMENT_ALLOWED_MIME.has(mime)) {
    return { ok: false, error: `Unsupported file type: ${mime || "unknown"}` };
  }
  if (opts.fileBuffer.length > PROJECT_DOCUMENT_MAX_BYTES) {
    return {
      ok: false,
      error: `File too large. Max size is ${Math.round(PROJECT_DOCUMENT_MAX_BYTES / 1024 / 1024)}MB.`,
    };
  }

  const setup = await ensureProjectFilesBucket();
  if (!setup.ok) return { ok: false, error: setup.error };
  const admin = setup.admin;

  const { error: uploadErr } = await admin.storage
    .from(PROJECT_FILES_BUCKET)
    .upload(opts.storagePath, opts.fileBuffer, {
      upsert: false,
      contentType: mime,
      cacheControl: "3600",
    });
  if (uploadErr) return { ok: false, error: uploadErr.message };
  return { ok: true };
}

export async function removeProjectDocumentFile(
  storagePath: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createSupabaseAdmin();
  if (!admin) return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY missing." };

  const { error } = await admin.storage.from(PROJECT_FILES_BUCKET).remove([storagePath]);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function createProjectDocumentSignedUrl(
  storagePath: string,
  expiresInSeconds = 3600
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const admin = createSupabaseAdmin();
  if (!admin) return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY missing." };

  const { data, error } = await admin.storage
    .from(PROJECT_FILES_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);
  if (error || !data?.signedUrl) {
    return { ok: false, error: error?.message ?? "signed_url_failed" };
  }
  return { ok: true, url: data.signedUrl };
}
