import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { designPanelCatalogPatchSchema } from "@/lib/design-panel-catalog-schema";
import {
  getDesignPanelCatalog,
  upsertDesignPanelCatalog,
} from "@/lib/design-panel-catalog-store";
import { mergePanelModuleCatalog, PANEL_MODULE_CATALOG } from "@/lib/panel-module-catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const record = await getDesignPanelCatalog();
    const orgModules = record?.orgModules ?? [];
    const modules = mergePanelModuleCatalog(orgModules);
    return NextResponse.json(
      {
        ok: true,
        data: {
          modules,
          orgModules,
          builtInCount: PANEL_MODULE_CATALOG.length,
          updatedAt: record?.updatedAt ?? null,
        },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "fetch_failed" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = designPanelCatalogPatchSchema.parse(await req.json());
    const record = await upsertDesignPanelCatalog(body.orgModules);
    if (!record) {
      return NextResponse.json({ ok: false, error: "persist_failed" }, { status: 503 });
    }
    const modules = mergePanelModuleCatalog(record.orgModules);
    return NextResponse.json(
      {
        ok: true,
        data: {
          modules,
          orgModules: record.orgModules,
          builtInCount: PANEL_MODULE_CATALOG.length,
          updatedAt: record.updatedAt,
        },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
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
