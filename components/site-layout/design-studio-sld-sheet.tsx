"use client";

/**
 * Design Studio Engineering SLD sheet — printable A3 landscape SVG.
 * Separate from customer proposal (Design / SLD product lock).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { DesignStudioSldModel } from "@/lib/design-studio-sld-model";
import { Button } from "@/components/ui/button";
import { Download, Link2, Printer, X } from "lucide-react";

const W = 1180;
const H = 834;

type DesignStudioSldSheetProps = {
  model: DesignStudioSldModel;
  onClose?: () => void;
  className?: string;
  /** When set, shows Copy SLD pack share link (public /sld/[token]). */
  projectId?: string | null;
};

function fmtCoord(value: number | null, digits = 5): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toFixed(digits);
}

function plantRows(model: DesignStudioSldModel): [string, string][] {
  return [
    ["Project", model.projectName],
    ["Latitude", fmtCoord(model.latitudeDeg)],
    ["Longitude", fmtCoord(model.longitudeDeg)],
    ["Azimuth", model.azimuthDeg != null ? `${model.azimuthDeg.toFixed(0)}°` : "—"],
    ["Module tilt", `${model.moduleTiltDeg}°`],
    ["Module", model.moduleLabel],
    ["Module Voc / Vmp", `${model.moduleVocV} / ${model.moduleVmpV} V`],
    ["Module Imp / Isc", `${model.moduleImpA} / ${model.moduleIscA} A`],
    ["No. of modules", `${model.moduleCount} Nos`],
    ["DC capacity", `${model.dcCapacityKwp.toFixed(3)} kWp`],
    ["AC capacity", `${model.acCapacityKw.toFixed(1)} kW · ${model.phaseLabel}`],
    ["Injection", `${model.injectionVoltageV} V · ${model.systemFrequencyHz} Hz`],
    ["DC / AC ratio", String(model.dcAcRatio)],
    ["Design Voc (cold)", `${model.designVocColdV} V / mod`],
    ["Inv MPPT max Voc", `${model.inverterMaxVocV} V · ${model.mpptCount} MPPT`],
  ];
}

const LEGEND: [string, string][] = [
  ["PV", "PV module / string"],
  ["F", "DC fuse / gPV"],
  ["SPD", "Surge protection"],
  ["DCDB", "DC distribution"],
  ["INV", "Grid-tied inverter"],
  ["MCB", "Miniature CB"],
  ["ACDB", "AC distribution"],
  ["METER", "Solar / net meter"],
  ["SFU", "Switch fuse unit"],
  ["EP", "Earth pit"],
  ["LA", "Lightning arrester"],
  ["PE", "Protective earth"],
];

function TableBox({
  x,
  y,
  w,
  title,
  rows,
  rowH = 14,
  titleFill = "#0f172a",
}: {
  x: number;
  y: number;
  w: number;
  title: string;
  rows: [string, string][];
  rowH?: number;
  titleFill?: string;
}) {
  const h = 22 + rows.length * rowH + 8;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#f8fafc" stroke="#94a3b8" />
      <rect x={x} y={y} width={w} height={18} fill="#e2e8f0" stroke="#94a3b8" />
      <text x={x + 8} y={y + 13} fontSize={9} fontWeight={800} fill={titleFill}>
        {title}
      </text>
      {rows.map(([k, v], i) => (
        <g key={`${title}-${k}-${i}`}>
          <text x={x + 8} y={y + 32 + i * rowH} fontSize={8} fill="#64748b">
            {k}
          </text>
          <text
            x={x + w - 8}
            y={y + 32 + i * rowH}
            textAnchor="end"
            fontSize={8}
            fontWeight={700}
            fill="#0f172a"
          >
            {v.length > 42 ? `${v.slice(0, 40)}…` : v}
          </text>
        </g>
      ))}
    </g>
  );
}

/** Main schematic + engineering tables as one SVG sheet. */
export function DesignStudioSldSheetSvg({ model }: { model: DesignStudioSldModel }) {
  const stringSizes = model.strings.map((s) => `${s.modules}`).join(" + ");
  const pvCaption = `PV ARRAY RATED ${model.dcCapacityKwp.toFixed(3)} kWp · ${model.moduleCount} Nos × ${model.moduleWatt} Wp · ${model.stringing.stringCount} STRING(S)`;
  const invLabel = `INV-1 · ${model.acCapacityKw.toFixed(1)} kW`;
  const maxFuse = Math.max(...model.strings.map((s) => s.dcFuseA), 10);
  const acMcb =
    model.protectionSchedule.find((p) => p.location.includes("Inverter"))?.rating ?? "—";
  const sfu =
    model.protectionSchedule.find((p) => p.location.includes("Grid"))?.rating ?? "—";

  const flowY = 188;
  const boxes: {
    id: string;
    x: number;
    label: string;
    sub: string;
    fill: string;
    stroke: string;
  }[] = [
    {
      id: "pv",
      x: 28,
      label: "PV ARRAY",
      sub: `${model.stringing.stringCount} str · DC+/−`,
      fill: "#fff7ed",
      stroke: "#ea580c",
    },
    {
      id: "dcdb",
      x: 168,
      label: "DCDB",
      sub: `F ${maxFuse}A + SPD`,
      fill: "#f5f3ff",
      stroke: "#7c3aed",
    },
    {
      id: "inv",
      x: 308,
      label: invLabel,
      sub: `MPPT×${model.mpptCount} · ${model.phaseLabel}`,
      fill: "#eef2ff",
      stroke: "#4338ca",
    },
    {
      id: "acdb",
      x: 468,
      label: "ACDB",
      sub: acMcb.split(" · ")[0] ?? "MCB",
      fill: "#ecfdf5",
      stroke: "#059669",
    },
    {
      id: "meter",
      x: 608,
      label: "SOLAR METER",
      sub: `${model.phaseLabel} ${model.injectionVoltageV}V`,
      fill: "#fef9c3",
      stroke: "#ca8a04",
    },
    {
      id: "sfu",
      x: 758,
      label: "SFU",
      sub: sfu.split(" · ")[0] ?? "Isolator",
      fill: "#fce7f3",
      stroke: "#db2777",
    },
  ];
  const boxW = 118;
  const boxH = 52;

  const stringTableH = 22 + Math.min(model.strings.length, 8) * 16 + 8;
  const showStrings = model.strings.slice(0, 8);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full bg-white text-slate-900"
      role="img"
      aria-label={model.title}
    >
      <rect x={10} y={10} width={W - 20} height={H - 20} fill="none" stroke="#0f172a" strokeWidth={2} />
      <rect x={16} y={16} width={W - 32} height={H - 32} fill="none" stroke="#64748b" strokeWidth={0.75} />

      <text x={W / 2} y={42} textAnchor="middle" fontSize={15} fontWeight={800} fill="#0f172a">
        {model.title}
      </text>
      <text x={W / 2} y={58} textAnchor="middle" fontSize={9} fill="#64748b">
        DC &amp; AC SINGLE LINE DIAGRAM · Design Studio engineering sheet · {model.status} · NTS
      </text>

      {/* PV string glyphs */}
      <text x={28} y={78} fontSize={9} fontWeight={700} fill="#9a3412">
        {pvCaption}
      </text>
      {Array.from({ length: Math.min(model.stringing.stringCount, 8) }).map((_, i) => {
        const x = 28 + i * 72;
        const row = model.strings[i];
        return (
          <g key={`str-glyph-${i}`}>
            <rect
              x={x}
              y={86}
              width={62}
              height={44}
              rx={3}
              fill="#fff7ed"
              stroke="#ea580c"
              strokeWidth={1.25}
            />
            <text x={x + 31} y={100} textAnchor="middle" fontSize={8} fontWeight={800} fill="#9a3412">
              S{String(i + 1).padStart(2, "0")}
            </text>
            <text x={x + 31} y={112} textAnchor="middle" fontSize={7} fill="#c2410c">
              {row?.modules ?? "—"}×1 · F{row?.dcFuseA ?? "—"}A
            </text>
            <text x={x + 31} y={123} textAnchor="middle" fontSize={7} fill="#9a3412">
              Voc≤{row?.stringVocMaxV ?? "—"}V
            </text>
          </g>
        );
      })}
      {model.stringing.stringCount > 8 ? (
        <text x={28 + 8 * 72} y={112} fontSize={8} fill="#64748b">
          +{model.stringing.stringCount - 8}
        </text>
      ) : null}

      {/* Flow */}
      {boxes.map((box, index) => {
        if (index === 0) return null;
        const prev = boxes[index - 1]!;
        const x1 = prev.x + boxW;
        const x2 = box.x;
        const y = flowY + boxH / 2;
        return (
          <g key={`wire-${box.id}`}>
            <line
              x1={x1}
              y1={y}
              x2={x2}
              y2={y}
              stroke={index <= 2 ? "#dc2626" : "#a21caf"}
              strokeWidth={2.5}
            />
            <polygon
              points={`${x2},${y} ${x2 - 7},${y - 4} ${x2 - 7},${y + 4}`}
              fill={index <= 2 ? "#dc2626" : "#a21caf"}
            />
          </g>
        );
      })}
      {boxes.map((box) => (
        <g key={box.id}>
          <rect
            x={box.x}
            y={flowY}
            width={boxW}
            height={boxH}
            rx={4}
            fill={box.fill}
            stroke={box.stroke}
            strokeWidth={1.5}
          />
          <text
            x={box.x + boxW / 2}
            y={flowY + 20}
            textAnchor="middle"
            fontSize={9}
            fontWeight={800}
            fill="#0f172a"
          >
            {box.label}
          </text>
          <text x={box.x + boxW / 2} y={flowY + 36} textAnchor="middle" fontSize={7} fill="#475569">
            {box.sub}
          </text>
        </g>
      ))}

      <line
        x1={876}
        y1={flowY + boxH / 2}
        x2={960}
        y2={flowY + boxH / 2}
        stroke="#a21caf"
        strokeWidth={2.5}
      />
      <polygon
        points={`${960},${flowY + boxH / 2} ${952},${flowY + boxH / 2 - 4} ${952},${flowY + boxH / 2 + 4}`}
        fill="#a21caf"
      />
      <text x={968} y={flowY + 18} fontSize={8} fontWeight={800} fill="#831843">
        CLIENT MAIN
      </text>
      <text x={968} y={flowY + 32} fontSize={8} fontWeight={800} fill="#831843">
        LT PANEL
      </text>
      <text x={968} y={flowY + 46} fontSize={7} fill="#9d174d">
        {model.phaseLabel} {model.injectionVoltageV}V
      </text>

      <text x={168} y={flowY + boxH + 14} fontSize={7} fill="#b91c1c">
        DC: {model.dcCableNote}
      </text>
      <text x={468} y={flowY + boxH + 14} fontSize={7} fill="#9d174d">
        AC: {model.acCableNote}
      </text>

      {/* Earthing schematic */}
      <text x={28} y={278} fontSize={9} fontWeight={800} fill="#15803d">
        EARTHING / LIGHTNING (planning)
      </text>
      {model.earthingPoints.map((ep, i) => (
        <g key={ep.id}>
          <circle cx={48 + i * 145} cy={308} r={12} fill="#ecfdf5" stroke="#16a34a" strokeWidth={1.5} />
          <text x={48 + i * 145} y={311} textAnchor="middle" fontSize={7} fontWeight={800} fill="#166534">
            {ep.id}
          </text>
          <text x={64 + i * 145} y={304} fontSize={7} fontWeight={700} fill="#166534">
            {ep.duty}
          </text>
          <text x={64 + i * 145} y={316} fontSize={6.5} fill="#64748b">
            {ep.conductor}
          </text>
        </g>
      ))}
      <rect x={620} y={292} width={70} height={28} rx={3} fill="#f0fdf4" stroke="#16a34a" />
      <text x={655} y={310} textAnchor="middle" fontSize={9} fontWeight={800} fill="#166534">
        LA
      </text>
      <text x={700} y={304} fontSize={7} fill="#15803d">
        {model.laNote}
      </text>
      <text x={700} y={316} fontSize={7} fill="#64748b">
        PE: {model.earthCableNote} · {model.earthingNote}
      </text>

      {/* String electrical table */}
      <text x={28} y={348} fontSize={9} fontWeight={800} fill="#0f172a">
        STRING / MPPT ELECTRICAL (planning)
      </text>
      <rect x={28} y={354} width={700} height={stringTableH} fill="#f8fafc" stroke="#94a3b8" />
      {["Str", "Mod", "MPPT", "Voc max", "Vmp", "Imp", "Fuse", "kWp"].map((h, i) => (
        <text key={h} x={40 + i * 86} y={368} fontSize={7.5} fontWeight={800} fill="#475569">
          {h}
        </text>
      ))}
      <line x1={28} y1={374} x2={728} y2={374} stroke="#94a3b8" />
      {showStrings.map((row, i) => (
        <g key={`row-${row.stringNo}`}>
          <text x={40} y={388 + i * 16} fontSize={7.5} fill="#0f172a">
            {String(row.stringNo).padStart(2, "0")}
          </text>
          <text x={126} y={388 + i * 16} fontSize={7.5} fill="#0f172a">
            {row.modules}×1
          </text>
          <text x={212} y={388 + i * 16} fontSize={7.5} fill="#0f172a">
            {row.mpptNo}
          </text>
          <text x={298} y={388 + i * 16} fontSize={7.5} fill="#0f172a">
            {row.stringVocMaxV} V
          </text>
          <text x={384} y={388 + i * 16} fontSize={7.5} fill="#0f172a">
            {row.stringVmpV} V
          </text>
          <text x={470} y={388 + i * 16} fontSize={7.5} fill="#0f172a">
            {row.stringImpA} A
          </text>
          <text x={556} y={388 + i * 16} fontSize={7.5} fill="#0f172a">
            {row.dcFuseA} A
          </text>
          <text x={642} y={388 + i * 16} fontSize={7.5} fill="#0f172a">
            {row.dcKwp.toFixed(3)}
          </text>
        </g>
      ))}
      <text x={28} y={354 + stringTableH + 12} fontSize={7} fill="#64748b">
        Sizes {stringSizes || "—"} · Voc cold {model.designVocColdV} V/mod · MPPT≤
        {model.inverterMaxVocV} V · DC/AC {model.dcAcRatio}
        {model.strings.length > 8 ? ` · showing 8/${model.strings.length}` : ""}
      </text>

      {/* Right column: plant + protection */}
      <TableBox x={750} y={78} w={400} title="PLANT / ELECTRICAL DETAILS" rows={plantRows(model)} rowH={13} />

      <TableBox
        x={750}
        y={310}
        w={400}
        title="PROTECTION SCHEDULE"
        rows={model.protectionSchedule.map((p) => [p.location, `${p.device} · ${p.rating}`])}
        rowH={14}
        titleFill="#7c3aed"
      />

      <TableBox
        x={28}
        y={520}
        w={460}
        title="EQUIPMENT SUMMARY (planning BOM)"
        rows={model.equipmentBom}
        rowH={13}
      />

      <TableBox
        x={500}
        y={520}
        w={240}
        title="LEGEND"
        rows={LEGEND}
        rowH={12}
      />

      {/* Title block */}
      <rect x={750} y={520} width={400} height={120} fill="#fff" stroke="#0f172a" strokeWidth={1.25} />
      <text x={762} y={540} fontSize={8} fontWeight={700} fill="#64748b">
        DRAWING TITLE
      </text>
      <text x={762} y={558} fontSize={11} fontWeight={800} fill="#0f172a">
        DC &amp; AC SINGLE LINE DIAGRAM
      </text>
      <text x={762} y={578} fontSize={8} fill="#475569">
        Drg No: {model.drawingNo}
      </text>
      <text x={762} y={594} fontSize={8} fill="#475569">
        Date: {model.drawnDate} · Scale: NTS · Rev: 0
      </text>
      <text x={762} y={610} fontSize={8} fill="#475569">
        Status: {model.status} · Generated from Design Studio
      </text>
      <text x={762} y={628} fontSize={8} fontWeight={700} fill="#b45309">
        Sol.52 SLD pack — outside customer proposal
      </text>

      {/* Design notes */}
      <text x={28} y={660} fontSize={8} fontWeight={800} fill="#0f172a">
        DESIGN NOTES
      </text>
      {model.designNotes.map((note, i) => (
        <text key={`note-${i}`} x={28} y={676 + i * 12} fontSize={7} fill="#475569">
          {i + 1}. {note}
        </text>
      ))}
      <text x={28} y={740} fontSize={7} fill="#94a3b8">
        {model.disclaimer}
      </text>
    </svg>
  );
}

export function DesignStudioSldSheetViewer({
  model,
  onClose,
  className,
  projectId,
}: DesignStudioSldSheetProps) {
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCopyShareLink = useCallback(async () => {
    if (!projectId) return;
    setShareBusy(true);
    try {
      const res = await fetch(
        `/api/projects/${encodeURIComponent(projectId)}/panel-layout/share`,
        { method: "POST" }
      );
      const json = (await res.json()) as {
        ok?: boolean;
        data?: { path?: string; url?: string | null; token?: string };
        error?: string;
      };
      if (!json.ok || !json.data?.token) {
        throw new Error(json.error || "Save panel layout first.");
      }
      const href =
        json.data.url ||
        `${typeof window !== "undefined" ? window.location.origin : ""}${json.data.path}`;
      await navigator.clipboard.writeText(href);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 2000);
    } catch {
      /* silent — button resets */
    } finally {
      setShareBusy(false);
    }
  }, [projectId]);

  const handlePrint = useCallback(() => {
    if (typeof window === "undefined") return;
    window.print();
  }, []);

  const handleDownloadPng = useCallback(async () => {
    const svgEl = sheetRef.current?.querySelector("svg");
    if (!svgEl || typeof window === "undefined") return;
    setDownloading(true);
    try {
      const clone = svgEl.cloneNode(true) as SVGSVGElement;
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      clone.setAttribute("width", String(W));
      clone.setAttribute("height", String(H));
      const xml = new XMLSerializer().serializeToString(clone);
      const svgBlob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          try {
            const scale = 2;
            const canvas = document.createElement("canvas");
            canvas.width = W * scale;
            canvas.height = H * scale;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              reject(new Error("canvas"));
              return;
            }
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
              URL.revokeObjectURL(url);
              if (!blob) {
                reject(new Error("blob"));
                return;
              }
              const safeName = (model.projectName || "design")
                .replace(/[^\w\-]+/g, "_")
                .slice(0, 60);
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = `SLD_${safeName}.png`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              URL.revokeObjectURL(a.href);
              resolve();
            }, "image/png");
          } catch (error) {
            URL.revokeObjectURL(url);
            reject(error);
          }
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error("image_load"));
        };
        img.src = url;
      });
    } catch {
      // Fall back to SVG download if PNG raster fails.
      const svgEl2 = sheetRef.current?.querySelector("svg");
      if (svgEl2) {
        const clone = svgEl2.cloneNode(true) as SVGSVGElement;
        clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        const xml = new XMLSerializer().serializeToString(clone);
        const blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
        const safeName = (model.projectName || "design")
          .replace(/[^\w\-]+/g, "_")
          .slice(0, 60);
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `SLD_${safeName}.svg`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(a.href);
      }
    } finally {
      setDownloading(false);
    }
  }, [model.projectName]);

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

  if (!mounted) return null;

  return createPortal(
    <div
      className={`sld-print-portal fixed inset-0 flex flex-col print:bg-white ${className ?? ""}`}
      style={{ zIndex: 400 }}
      role="dialog"
      aria-modal="true"
      aria-label="Engineering SLD sheet"
    >
      <button
        type="button"
        aria-label="Close engineering SLD"
        className="absolute inset-0 bg-slate-950/75 backdrop-blur-[2px] print:hidden"
        onClick={() => onClose?.()}
      />
      <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-slate-950 px-3 py-2 print:hidden">
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-white">Engineering SLD sheet</p>
            <p className="truncate text-[10px] text-slate-400">
              Outside click / Esc closes · Download PNG · Print → PDF (not on proposal)
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {projectId ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void handleCopyShareLink()}
                disabled={shareBusy}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Link2 className="mr-1.5 h-4 w-4" />
                {shareCopied ? "Copied" : shareBusy ? "Link…" : "Copy SLD link"}
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void handleDownloadPng()}
              disabled={downloading}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Download className="mr-1.5 h-4 w-4" />
              {downloading ? "Saving…" : "Download PNG"}
            </Button>
            <Button type="button" size="sm" onClick={handlePrint} className="bg-violet-600 hover:bg-violet-500">
              <Printer className="mr-1.5 h-4 w-4" /> Print / PDF
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onClose}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <X className="mr-1 h-4 w-4" /> Close
            </Button>
          </div>
        </div>
        <div
          className="relative min-h-0 flex-1 overflow-auto p-3 print:p-0"
          onClick={(event) => {
            if (event.target === event.currentTarget) onClose?.();
          }}
        >
          <div
            ref={sheetRef}
            className="sld-sheet-page relative z-[1] mx-auto max-w-[1180px] rounded-lg bg-white shadow-xl print:max-w-none print:rounded-none print:shadow-none"
            onClick={(event) => event.stopPropagation()}
          >
            <DesignStudioSldSheetSvg model={model} />
          </div>
        </div>
      </div>
      <style>{`
        @media print {
          @page {
            size: A3 landscape;
            margin: 6mm;
          }
          body * {
            visibility: hidden !important;
          }
          .sld-print-portal,
          .sld-print-portal * {
            visibility: visible !important;
          }
          .sld-print-portal {
            position: fixed !important;
            inset: 0 !important;
            background: white !important;
            z-index: 99999 !important;
          }
          .sld-sheet-page {
            width: 100% !important;
            max-width: none !important;
          }
        }
      `}</style>
    </div>,
    document.body
  );
}

