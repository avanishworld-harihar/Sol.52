"use client";

/**
 * Public SLD pack view — /sld/[token]
 * Engineering single-line diagram share. Not a customer proposal.
 */

import { DesignStudioSldSheetSvg } from "@/components/site-layout/design-studio-sld-sheet";
import type { DesignStudioSldModel } from "@/lib/design-studio-sld-model";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function SldPackPublicView({ model }: { model: DesignStudioSldModel }) {
  return (
    <div className="min-h-dvh bg-slate-100 text-slate-900 print:bg-white">
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur print:hidden">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Engineering SLD pack
          </p>
          <h1 className="truncate text-lg font-extrabold tracking-tight">{model.projectName}</h1>
          <p className="text-xs text-slate-600">
            {model.moduleCount} modules · {model.dcCapacityKwp.toFixed(2)} kWp · {model.status}
          </p>
        </div>
        <Button type="button" className="gap-2" onClick={() => window.print()}>
          <Printer className="h-4 w-4" aria-hidden />
          Print / PDF
        </Button>
      </header>
      <main className="mx-auto max-w-[1200px] overflow-x-auto p-3 print:max-w-none print:p-0">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm print:rounded-none print:border-0 print:shadow-none">
          <DesignStudioSldSheetSvg model={model} />
        </div>
        <p className="mt-3 px-1 text-[11px] leading-relaxed text-slate-500 print:hidden">
          This is an installer engineering SLD pack — not a customer proposal. {model.disclaimer}
        </p>
      </main>
    </div>
  );
}
