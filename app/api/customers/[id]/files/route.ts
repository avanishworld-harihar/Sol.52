import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

function db() {
  return createSupabaseAdmin() ?? supabase;
}

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
    const client = db();
    if (!client) return NextResponse.json({ ok: false, error: "db_unavailable" }, { status: 503 });

    const { data, error } = await client
      .from("customer_files")
      .select("*")
      .eq("lead_id", id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      if (error.code === "42P01" || /does not exist/i.test(error.message)) {
        return NextResponse.json({ ok: true, data: [] });
      }
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, data: data ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, ctx: RouteCtx) {
  try {
    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ ok: false, error: "missing id" }, { status: 400 });
    const client = db();
    if (!client) return NextResponse.json({ ok: false, error: "db_unavailable" }, { status: 503 });

    const body = await req.json();
    const parsed = postSchema.parse(body);

    const { data, error } = await client
      .from("customer_files")
      .insert({ lead_id: id, ...parsed })
      .select("*")
      .single();

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
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
