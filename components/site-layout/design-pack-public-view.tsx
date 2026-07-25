"use client";

/**
 * Public Design pack view — /design/[token]
 * Installer / customer design summary only. Not a proposal.
 */

import type { DesignStudioPackModel } from "@/lib/design-studio-pack-model";
import { Printer } from "lucide-react";

function fmt(n: number | null | undefined, digits = 0, suffix = ""): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n.toLocaleString("en-IN", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits > 0 ? Math.min(digits, 2) : 0,
  })}${suffix}`;
}

export function DesignPackPublicView({ model }: { model: DesignStudioPackModel }) {
  const rows: [string, string][] = [
    ["Project", model.projectName],
    ["Generated", new Date(model.generatedAtIso).toLocaleString("en-IN")],
    ["Lat / Lng", `${fmt(model.latitudeDeg, 5)} / ${fmt(model.longitudeDeg, 5)}`],
    ["Roof type", model.roofType?.replace(/_/g, " ") || "—"],
    ["Roof area", fmt(model.roofAreaSqft, 0, " sq.ft")],
    ["Azimuth", model.roofAzimuthDeg != null ? `${Math.round(model.roofAzimuthDeg)}°` : "—"],
    ["Obstructions", String(model.obstructionCount)],
    ["Panels", String(model.panelCount)],
    ["DC capacity", fmt(model.dcCapacityKw, 2, " kW")],
    ["Coverage", fmt(model.coveragePct, 0, "%")],
    ["Remaining", fmt(model.remainingAreaSqft, 0, " sq.ft")],
    ["Module", model.moduleLabel],
    ["Orientation", model.orientation.replace(/_/g, " ")],
    ["Tilt / mount", `${model.tiltDeg}° · ${model.mountingType.replace(/_/g, " ")}`],
    ["Setback", `${model.setbackFt} ft`],
  ];

  return (
    <div className="min-h-[100dvh] bg-slate-100 text-slate-900 print:bg-white">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:py-10 print:max-w-none print:px-0 print:py-0">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-teal-700">
            Sol.52 Design pack · shared link
          </p>
          <button
            type="button"
            onClick={() => typeof window !== "undefined" && window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold shadow-sm"
          >
            <Printer className="h-3.5 w-3.5" aria-hidden />
            Print / PDF
          </button>
        </div>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 print:rounded-none print:border-0 print:p-0 print:shadow-none">
          <header className="border-b border-slate-200 pb-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-700">
              Design pack
            </p>
            <h1 className="mt-1 text-2xl font-extrabold">{model.projectName}</h1>
            <p className="mt-1 text-xs text-slate-500">{model.disclaimer}</p>
            <p className="mt-2 text-[11px] font-medium text-slate-400">
              This is a site design summary — not a commercial proposal or price quote.
            </p>
          </header>

          <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
            {rows.map(([label, value]) => (
              <div
                key={label}
                className="flex items-baseline justify-between gap-3 border-b border-slate-100 py-1.5"
              >
                <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  {label}
                </dt>
                <dd className="text-right text-sm font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
        </article>
      </div>
    </div>
  );
}
