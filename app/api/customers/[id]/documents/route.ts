/**
 * GET /api/customers/[id]/documents — Unified Customer Documents Hub (Phase 1 read-only)
 *
 * Query: q, types, project_id, owner, from, to, limit, cursor
 */
import { NextRequest, NextResponse } from "next/server";
import { categoryIdToDb, type DocumentCategoryDb } from "@/lib/document-category-registry";
import { listUnifiedCustomerDocuments } from "@/lib/unified-documents-store";
import type { DocumentOwner } from "@/lib/document-category-registry";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

function parseTypes(raw: string | null): DocumentCategoryDb[] | undefined {
  if (!raw?.trim()) return undefined;
  const out: DocumentCategoryDb[] = [];
  for (const part of raw.split(",")) {
    const db = categoryIdToDb(part.trim()) ?? (part.trim().toLowerCase() as DocumentCategoryDb);
    if (db) out.push(db);
  }
  return out.length ? out : undefined;
}

export async function GET(req: NextRequest, ctx: RouteCtx) {
  try {
    const { id: customerId } = await ctx.params;
    if (!customerId?.trim()) {
      return NextResponse.json({ ok: false, error: "missing id" }, { status: 400 });
    }

    const url = req.nextUrl;
    const ownerRaw = url.searchParams.get("owner")?.trim().toLowerCase();
    const owner =
      ownerRaw === "customer" || ownerRaw === "project" || ownerRaw === "proposal"
        ? (ownerRaw as DocumentOwner)
        : null;

    const projectParam = url.searchParams.get("project_id");
    let projectId: string | "none" | null = null;
    if (projectParam === "none") projectId = "none";
    else if (projectParam?.trim()) projectId = projectParam.trim();

    const result = await listUnifiedCustomerDocuments(customerId.trim(), {
      q: url.searchParams.get("q") ?? undefined,
      types: parseTypes(url.searchParams.get("types")),
      projectId,
      owner,
      from: url.searchParams.get("from") ?? undefined,
      to: url.searchParams.get("to") ?? undefined,
      limit: Number(url.searchParams.get("limit") ?? 40),
      cursor: url.searchParams.get("cursor") ?? undefined,
    });

    return NextResponse.json(
      { ok: true, data: result },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "list_documents_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
