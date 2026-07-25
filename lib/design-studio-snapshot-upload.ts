/**
 * Design Studio Phase 5 — upload map snapshot PNGs to private project-files storage.
 */

import {
  createProjectDocumentSignedUrl,
  PROJECT_FILES_BUCKET,
  uploadProjectDocumentFile,
} from "@/lib/project-document-upload";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { isLikelyValidPngSnapshot } from "@/lib/design-studio-phase6-gates";

export function buildDesignStudioSnapshotStoragePath(opts: {
  organizationId: string;
  projectId: string;
}): string {
  const stamp = Date.now();
  return `${opts.organizationId}/${opts.projectId}/design-studio/snapshots/${stamp}.png`;
}

export async function uploadDesignStudioSnapshotPng(opts: {
  organizationId: string;
  projectId: string;
  pngBuffer: Buffer;
}): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  const storagePath = buildDesignStudioSnapshotStoragePath({
    organizationId: opts.organizationId,
    projectId: opts.projectId,
  });
  const uploaded = await uploadProjectDocumentFile({
    storagePath,
    fileBuffer: opts.pngBuffer,
    mimeType: "image/png",
  });
  if (!uploaded.ok) return uploaded;
  return { ok: true, path: storagePath };
}

export async function resolveDesignStudioSnapshotUrl(
  storagePath: string | null | undefined,
  expiresInSeconds = 3600
): Promise<string | null> {
  if (!storagePath?.trim()) return null;
  // Only serve Design Studio snapshot paths (avoid open signed-url of arbitrary files).
  if (!storagePath.includes("/design-studio/snapshots/")) return null;
  const signed = await createProjectDocumentSignedUrl(storagePath, expiresInSeconds);
  return signed.ok ? signed.url : null;
}

export async function fetchStaticMapPng(
  staticMapUrl: string
): Promise<{ ok: true; buffer: Buffer } | { ok: false; error: string }> {
  try {
    const res = await fetch(staticMapUrl, { cache: "no-store" });
    if (!res.ok) {
      return { ok: false, error: `static_map_http_${res.status}` };
    }
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("image")) {
      return { ok: false, error: "static_map_not_image" };
    }
    const ab = await res.arrayBuffer();
    const buffer = Buffer.from(ab);
    if (!isLikelyValidPngSnapshot(buffer)) {
      return { ok: false, error: "static_map_invalid_png" };
    }
    return { ok: true, buffer };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "static_map_fetch_failed",
    };
  }
}

/** Optional: confirm bucket exists (upload helper already ensures). */
export async function ensureSnapshotStorageReady(): Promise<boolean> {
  const admin = createSupabaseAdmin();
  if (!admin) return false;
  const { data } = await admin.storage.getBucket(PROJECT_FILES_BUCKET);
  return Boolean(data);
}
