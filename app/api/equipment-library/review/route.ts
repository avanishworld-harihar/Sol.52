import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { approveEquipmentCandidate } from "@/lib/equipment-library";
import { getEquipmentLibrary, saveEquipmentLibrary } from "@/lib/equipment-library-store";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  equipmentId: z.string().min(1).max(120),
  action: z.literal("approve"),
});

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    const payload = requestSchema.parse(await req.json());
    const current = await getEquipmentLibrary();
    const next = approveEquipmentCandidate(current, payload.equipmentId);
    const persisted = await saveEquipmentLibrary(next);
    if (!persisted) {
      return NextResponse.json(
        { ok: false, error: "Equipment revision could not be persisted." },
        { status: 503 }
      );
    }
    return NextResponse.json({
      ok: true,
      revision: next.revision,
      equipmentId: payload.equipmentId,
    });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? error.issues.map((issue) => issue.message).join(", ")
      : error instanceof Error
        ? error.message
        : "review_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
