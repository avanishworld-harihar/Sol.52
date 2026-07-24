"use client";

/**
 * Design Studio Design pack — printable A4 summary.
 * Separate from customer proposal (Design / SLD product lock).
 */

import { useCallback, useEffect } from "react";
import type { DesignStudioPackModel } from "@/lib/design-studio-pack-model";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";

type Props = {
  model: DesignStudioPackModel;
  onClose?: () => void;
};

function fmt(n: number | null | undefined, digits = 0, suffix = ""): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n.toLocaleString("en-IN", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits > 0 ? Math.min(digits, 2) : 0,
  })}${suffix}`;
}

export function DesignStudioPackSheetViewer({ model, onClose }: Props) {
  const print = useCallback(() => {
    window.print();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

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
    ["Plant roof AGL", `${model.plantRoofHeightFt} ft`],
    [
      "Shadow sample",
      model.shadowSampleLabel
        ? `${model.shadowSampleLabel} · mean ${model.meanShadePct ?? "—"}%`
        : "—",
    ],
    ["Shade-free array", fmt(model.shadeFreePanelSqft, 0, " sq.ft")],
    ["Annual yield (rough)", fmt(model.annualYieldKwh, 0, " kWh")],
    ["Annual shade loss", fmt(model.annualShadeLossKwh, 0, " kWh")],
  ];

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-slate-900/70 p-3 backdrop-blur-sm print:static print:bg-white print:p-0">
      <div className="mx-auto flex w-full max-w-3xl shrink-0 items-center justify-between gap-2 rounded-t-xl border border-b-0 border-slate-200 bg-white px-3 py-2 print:hidden dark:border-white/10 dark:bg-slate-950">
        <div>
          <p className="text-sm font-extrabold text-slate-900 dark:text-white">Design pack</p>
          <p className="text-[10px] text-slate-500">
            Installer summary · Print / PDF · not on customer proposal
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" size="sm" onClick={print}>
            <Printer className="mr-1.5 h-3.5 w-3.5" />
            Print / PDF
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl flex-1 overflow-auto rounded-b-xl border border-slate-200 bg-white p-6 shadow-xl print:max-w-none print:overflow-visible print:rounded-none print:border-0 print:p-8 print:shadow-none dark:border-white/10 dark:bg-slate-950">
        <header className="border-b border-slate-200 pb-4 dark:border-white/10">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-700">
            Sol.52 Design pack
          </p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
            {model.projectName}
          </h1>
          <p className="mt-1 text-xs text-slate-500">{model.disclaimer}</p>
        </header>

        <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="flex items-baseline justify-between gap-3 border-b border-slate-100 py-1.5 dark:border-white/5"
            >
              <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                {label}
              </dt>
              <dd className="text-right text-sm font-semibold text-slate-900 dark:text-slate-100">
                {value}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-6 text-[10px] leading-relaxed text-slate-500">
          Map snapshot / share link ship in later Phase 5 steps. This pack is for installer review
          and print only.
        </p>
      </div>
    </div>
  );
}
