import { NextRequest, NextResponse } from "next/server";
import { getEquipmentLibrary, saveEquipmentLibrary } from "@/lib/equipment-library-store";
import { syncOfficialEquipmentLibrary } from "@/lib/equipment-library-sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    const current = await getEquipmentLibrary();
    const next = await syncOfficialEquipmentLibrary(current);
    const persisted = await saveEquipmentLibrary(next);
    return NextResponse.json({
      ok: true,
      persisted,
      revision: next.revision,
      lastSyncedAt: next.lastSyncedAt,
      sources: next.sources,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "sync_failed" },
      { status: 500 }
    );
  }
}
