import { NextResponse } from "next/server";
import { getEquipmentLibrary } from "@/lib/equipment-library-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const library = await getEquipmentLibrary();
    return NextResponse.json(
      { ok: true, data: library },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "equipment_library_failed" },
      { status: 500 }
    );
  }
}
