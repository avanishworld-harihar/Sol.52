"use client";

/**
 * Design Studio Design pack — printable A4 summary.
 * Separate from customer proposal (Design / SLD product lock).
 */

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { DesignStudioPackModel } from "@/lib/design-studio-pack-model";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";

type Props = {
  model: DesignStudioPackModel;
  onClose?: () => void;
};

/** Above TopBar (z-100) and Design Studio chrome; below command palette (z-500). */
const OVERLAY_Z = 400;

function fmt(n: number | null | undefined, digits = 0, suffix = ""): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n.toLocaleString("en-IN", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits > 0 ? Math.min(digits, 2) : 0,
  })}${suffix}`;
}

export function DesignStudioPackSheetViewer({ model, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const print = useCallback(() => {
    window.print();
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
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

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 flex items-stretch justify-center p-3 sm:p-4 print:static print:bg-white print:p-0"
      style={{ zIndex: OVERLAY_Z }}
      role="dialog"
      aria-modal="true"
      aria-label="Design pack"
    >
      {/* Full-screen dim — click returns to Design Studio */}
      <button
        type="button"
        aria-label="Close design pack"
        className="absolute inset-0 bg-slate-950/75 backdrop-blur-[2px] print:hidden"
        onClick={() => onClose?.()}
      />

      <div className="relative z-[1] flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl print:max-w-none print:overflow-visible print:rounded-none print:border-0 print:shadow-none dark:border-white/10 dark:bg-slate-950">
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2.5 print:hidden dark:border-white/10 dark:bg-slate-950">
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-slate-900 dark:text-white">Design pack</p>
            <p className="truncate text-[10px] text-slate-500">
              Outside click / Esc closes · Print / PDF · not on proposal
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button type="button" size="sm" onClick={print}>
              <Printer className="mr-1.5 h-3.5 w-3.5" />
              Print / PDF
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => onClose?.()}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6 print:overflow-visible print:p-8">
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
            Map snapshot is captured on Save and shown in Project Hub Design. Share-link shipping
            continues in Phase 5. This pack is for installer review and print only.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
