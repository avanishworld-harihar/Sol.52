import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { appendActivityEvent, createLeadNote, listLeadNotes } from "@/lib/followup-store";

type RouteCtx = { params: Promise<{ id: string }> };
export const dynamic = "force-dynamic";

const noteSchema = z.object({
  body_text: z.string().max(5000).default(""),
  attachments_json: z
    .array(
      z.object({
        id: z.string(),
        url: z.string(),
        kind: z.literal("image"),
        name: z.string().optional(),
        sizeKb: z.number().optional(),
      })
    )
    .default([]),
  voice_ref: z.string().optional().nullable(),
  sketch_ref: z.string().optional().nullable(),
});

export async function GET(req: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const url = req.nextUrl;
  const limit = Number(url.searchParams.get("limit") ?? 30);
  const offset = Number(url.searchParams.get("offset") ?? 0);
  if (!id) return NextResponse.json({ ok: false, error: "missing id" }, { status: 400 });
  const data = await listLeadNotes(id, { limit, offset });
  return NextResponse.json({ ok: true, data });
}

export async function POST(req: NextRequest, ctx: RouteCtx) {
  try {
    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ ok: false, error: "missing id" }, { status: 400 });
    const parsed = noteSchema.parse(await req.json());
    const created = await createLeadNote({ lead_id: id, ...parsed });
    if (!created) return NextResponse.json({ ok: false, error: "create_failed" }, { status: 400 });
    await appendActivityEvent({
      leadId: id,
      eventType: "note_added",
      meta: { noteId: created.id, hasAttachments: created.attachments_json.length > 0 },
    });
    return NextResponse.json({ ok: true, data: created });
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid_payload";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
