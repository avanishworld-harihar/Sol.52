import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getInstallerRateCard,
  upsertInstallerRateCard,
} from "@/lib/installer-rate-card-store";
import { residentialBrandCatalogSchema } from "@/lib/residential-requirements-schema";
import { commercialPanelRateOverrideSchema } from "@/lib/installer-rate-card-schema";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  residentialCatalog: residentialBrandCatalogSchema.optional(),
  commercialPanelRates: z.array(commercialPanelRateOverrideSchema).max(64).optional(),
});

export async function GET() {
  try {
    const card = await getInstallerRateCard();
    if (!card) {
      return NextResponse.json(
        { ok: false, error: "rate_card_unavailable" },
        { status: 503, headers: { "Cache-Control": "no-store" } }
      );
    }
    return NextResponse.json({ ok: true, data: card }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "fetch_failed" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = patchSchema.parse(await req.json());
    const card = await upsertInstallerRateCard({
      residentialCatalog: body.residentialCatalog,
      commercialPanelRates: body.commercialPanelRates,
    });
    if (!card) {
      return NextResponse.json({ ok: false, error: "persist_failed" }, { status: 503 });
    }
    return NextResponse.json({ ok: true, data: card }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")
        : error instanceof Error
          ? error.message
          : "patch_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
