"use client";

/**
 * Design Studio Engineering SLD sheet v1 — printable A3 landscape SVG.
 * Separate from customer proposal (Design / SLD product lock).
 */

import { useCallback, useEffect } from "react";
import type { DesignStudioSldModel } from "@/lib/design-studio-sld-model";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";

const W = 1120;
const H = 794; // ~A3 landscape at 96dpi-ish viewBox

type DesignStudioSldSheetProps = {
  model: DesignStudioSldModel;
  onClose?: () => void;
  className?: string;
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
    ["No. of modules", `${model.moduleCount} Nos`],
    ["DC capacity", `${model.dcCapacityKwp.toFixed(3)} kWp`],
    ["AC capacity", `${model.acCapacityKw.toFixed(1)} kW`],
    ["Injection V", `${model.injectionVoltageV} V`],
  ];
}

const LEGEND: [string, string][] = [
  ["PV", "PV module / string"],
  ["DCDB", "DC distribution + SPD"],
  ["INV", "Grid-tied inverter"],
  ["ACDB", "AC distribution + MCB"],
  ["METER", "Solar / net energy meter"],
  ["SFU", "Switch fuse unit"],
  ["EP", "Earth pit"],
  ["LA", "Lightning arrester"],
];

/** Main schematic + side tables as one SVG sheet. */
export function DesignStudioSldSheetSvg({ model }: { model: DesignStudioSldModel }) {
  const stringSizes = model.strings.map((s) => `${s.modules}`).join(" + ");
  const pvCaption = `PV ARRAY ${model.dcCapacityKwp.toFixed(3)} kWp · ${model.moduleCount} × ${model.moduleWatt} Wp`;
  const invLabel = `INV-1 · ~${model.acCapacityKw.toFixed(1)} kW`;

  // Schematic layout coordinates
  const flowY = 210;
  const boxes: { id: string; x: number; label: string; sub: string; fill: string; stroke: string }[] = [
    { id: "pv", x: 40, label: "PV ARRAY", sub: `${model.stringing.stringCount} str`, fill: "#fff7ed", stroke: "#ea580c" },
    { id: "dcdb", x: 200, label: "DCDB", sub: "SPD + Fuse", fill: "#f5f3ff", stroke: "#7c3aed" },
    { id: "inv", x: 360, label: invLabel, sub: "MPPT 1–2", fill: "#eef2ff", stroke: "#4338ca" },
    { id: "acdb", x: 560, label: "ACDB", sub: "MCB 2P", fill: "#ecfdf5", stroke: "#059669" },
    { id: "meter", x: 700, label: "METER", sub: `${model.injectionVoltageV} V`, fill: "#fef9c3", stroke: "#ca8a04" },
    { id: "sfu", x: 840, label: "SFU", sub: "2P isolator", fill: "#fce7f3", stroke: "#db2777" },
  ];
  const boxW = 120;
  const boxH = 56;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full bg-white text-slate-900"
      role="img"
      aria-label={model.title}
    >
      {/* Border frame */}
      <rect x={12} y={12} width={W - 24} height={H - 24} fill="none" stroke="#0f172a" strokeWidth={2} />
      <rect x={18} y={18} width={W - 36} height={H - 36} fill="none" stroke="#64748b" strokeWidth={0.75} />

      {/* Title */}
      <text x={W / 2} y={48} textAnchor="middle" fontSize={16} fontWeight={800} fill="#0f172a">
        {model.title}
      </text>
      <text x={W / 2} y={68} textAnchor="middle" fontSize={10} fill="#64748b">
        Design Studio · Engineering SLD sheet v1 · {model.status}
      </text>

      {/* PV array glyph row */}
      <text x={40} y={100} fontSize={10} fontWeight={700} fill="#9a3412">
        {pvCaption}
      </text>
      {Array.from({ length: Math.min(model.stringing.stringCount, 6) }).map((_, i) => {
        const x = 40 + i * 70;
        return (
          <g key={`str-glyph-${i}`}>
            <rect x={x} y={110} width={56} height={36} rx={3} fill="#fff7ed" stroke="#ea580c" strokeWidth={1.25} />
            <text x={x + 28} y={125} textAnchor="middle" fontSize={8} fontWeight={700} fill="#9a3412">
              S{i + 1}
            </text>
            <text x={x + 28} y={138} textAnchor="middle" fontSize={8} fill="#c2410c">
              {model.strings[i]?.modules ?? "—"}×1
            </text>
          </g>
        );
      })}
      {model.stringing.stringCount > 6 ? (
        <text x={40 + 6 * 70} y={132} fontSize={9} fill="#64748b">
          +{model.stringing.stringCount - 6} more
        </text>
      ) : null}

      {/* Flow boxes */}
      {boxes.map((box, index) => {
        if (index === 0) return null;
        const prev = boxes[index - 1]!;
        const x1 = prev.x + boxW;
        const x2 = box.x;
        return (
          <g key={`wire-${box.id}`}>
            <line
              x1={x1}
              y1={flowY + boxH / 2}
              x2={x2}
              y2={flowY + boxH / 2}
              stroke={index <= 2 ? "#dc2626" : "#a21caf"}
              strokeWidth={2.5}
            />
            <polygon
              points={`${x2},${flowY + boxH / 2} ${x2 - 8},${flowY + boxH / 2 - 4} ${x2 - 8},${flowY + boxH / 2 + 4}`}
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
            y={flowY + 22}
            textAnchor="middle"
            fontSize={10}
            fontWeight={800}
            fill="#0f172a"
          >
            {box.label}
          </text>
          <text x={box.x + boxW / 2} y={flowY + 38} textAnchor="middle" fontSize={8} fill="#475569">
            {box.sub}
          </text>
        </g>
      ))}

      <line
        x1={960}
        y1={flowY + boxH / 2}
        x2={1040}
        y2={flowY + boxH / 2}
        stroke="#a21caf"
        strokeWidth={2.5}
      />
      <polygon
        points={`${1040},${flowY + boxH / 2} ${1032},${flowY + boxH / 2 - 4} ${1032},${flowY + boxH / 2 + 4}`}
        fill="#a21caf"
      />
      <text x={1045} y={flowY + 20} fontSize={9} fontWeight={700} fill="#831843">
        CLIENT
      </text>
      <text x={1045} y={flowY + 34} fontSize={9} fontWeight={700} fill="#831843">
        MAIN LT
      </text>

      {/* Cable notes */}
      <text x={200} y={flowY + boxH + 18} fontSize={8} fill="#b91c1c">
        DC: {model.dcCableNote}
      </text>
      <text x={560} y={flowY + boxH + 18} fontSize={8} fill="#9d174d">
        AC: {model.acCableNote}
      </text>

      {/* Earthing row */}
      <text x={40} y={320} fontSize={10} fontWeight={700} fill="#15803d">
        EARTHING / LA (planning)
      </text>
      {[1, 2, 3, 4].map((n, i) => (
        <g key={`ep-${n}`}>
          <circle cx={60 + i * 90} cy={350} r={14} fill="#ecfdf5" stroke="#16a34a" strokeWidth={1.5} />
          <text x={60 + i * 90} y={354} textAnchor="middle" fontSize={9} fontWeight={700} fill="#166534">
            EP-{n}
          </text>
        </g>
      ))}
      <rect x={420} y={336} width={100} height={28} rx={3} fill="#f0fdf4" stroke="#16a34a" strokeWidth={1.25} />
      <text x={470} y={354} textAnchor="middle" fontSize={9} fontWeight={700} fill="#166534">
        LA
      </text>
      <text x={540} y={354} fontSize={8} fill="#15803d">
        {model.earthingNote}
      </text>

      {/* Inverter / string table */}
      <text x={40} y={400} fontSize={10} fontWeight={700} fill="#0f172a">
        INVERTER / STRING DETAILS
      </text>
      <rect x={40} y={410} width={620} height={28 + model.strings.length * 22} fill="#f8fafc" stroke="#94a3b8" />
      {["String", "Size", "Inv", "MPPT", "DC kWp"].map((h, i) => (
        <text key={h} x={55 + i * 120} y={428} fontSize={9} fontWeight={700} fill="#475569">
          {h}
        </text>
      ))}
      <line x1={40} y1={438} x2={660} y2={438} stroke="#94a3b8" />
      {model.strings.map((row, i) => (
        <g key={`row-${row.stringNo}`}>
          <text x={55} y={456 + i * 22} fontSize={9} fill="#0f172a">
            {String(row.stringNo).padStart(2, "0")}
          </text>
          <text x={175} y={456 + i * 22} fontSize={9} fill="#0f172a">
            {row.modules}×1
          </text>
          <text x={295} y={456 + i * 22} fontSize={9} fill="#0f172a">
            {String(row.inverterNo).padStart(2, "0")}
          </text>
          <text x={415} y={456 + i * 22} fontSize={9} fill="#0f172a">
            {String(row.mpptNo).padStart(2, "0")}
          </text>
          <text x={535} y={456 + i * 22} fontSize={9} fill="#0f172a">
            {((row.modules * model.moduleWatt) / 1000).toFixed(3)}
          </text>
        </g>
      ))}
      <text x={40} y={410 + 28 + model.strings.length * 22 + 16} fontSize={8} fill="#64748b">
        String sizes: {stringSizes || "—"} · Voc planning {model.stringing.assumedVocV} V · MPPT max{" "}
        {model.stringing.inverterMaxVocV} V · DC/AC {model.stringing.dcAcRatio}
      </text>

      {/* Plant details (right) */}
      <text x={700} y={320} fontSize={10} fontWeight={700} fill="#0f172a">
        PLANT DETAILS
      </text>
      <rect x={700} y={330} width={380} height={220} fill="#f8fafc" stroke="#94a3b8" />
      {plantRows(model).map(([k, v], i) => (
        <g key={k}>
          <text x={712} y={352 + i * 20} fontSize={9} fontWeight={600} fill="#64748b">
            {k}
          </text>
          <text x={1068} y={352 + i * 20} textAnchor="end" fontSize={9} fontWeight={700} fill="#0f172a">
            {v.length > 36 ? `${v.slice(0, 34)}…` : v}
          </text>
        </g>
      ))}

      {/* Legend */}
      <text x={40} y={560} fontSize={10} fontWeight={700} fill="#0f172a">
        LEGEND
      </text>
      {LEGEND.map(([sym, desc], i) => {
        const col = i < 4 ? 0 : 1;
        const row = i % 4;
        const x = 40 + col * 200;
        const y = 580 + row * 18;
        return (
          <g key={sym}>
            <text x={x} y={y} fontSize={9} fontWeight={700} fill="#334155">
              {sym}
            </text>
            <text x={x + 48} y={y} fontSize={9} fill="#64748b">
              {desc}
            </text>
          </g>
        );
      })}

      {/* Title block */}
      <rect x={700} y={570} width={380} height={140} fill="#fff" stroke="#0f172a" strokeWidth={1.25} />
      <text x={712} y={592} fontSize={9} fontWeight={700} fill="#64748b">
        DRAWING TITLE
      </text>
      <text x={712} y={610} fontSize={11} fontWeight={800} fill="#0f172a">
        DC &amp; AC SINGLE LINE DIAGRAM
      </text>
      <text x={712} y={632} fontSize={9} fill="#475569">
        Drg No: {model.drawingNo}
      </text>
      <text x={712} y={650} fontSize={9} fill="#475569">
        Date: {model.drawnDate} · Scale: NTS
      </text>
      <text x={712} y={668} fontSize={9} fill="#475569">
        Status: {model.status}
      </text>
      <text x={712} y={690} fontSize={8} fontWeight={700} fill="#b45309">
        Sol.52 Design Studio — SLD pack (not proposal)
      </text>

      {/* Disclaimer */}
      <foreignObject x={40} y={660} width={640} height={90}>
        <div
          style={{
            fontSize: 8,
            lineHeight: 1.35,
            color: "#64748b",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {model.disclaimer}
        </div>
      </foreignObject>
    </svg>
  );
}

export function DesignStudioSldSheetViewer({ model, onClose, className }: DesignStudioSldSheetProps) {
  const handlePrint = useCallback(() => {
    if (typeof window === "undefined") return;
    window.print();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className={`sld-print-portal fixed inset-0 z-[80] flex flex-col bg-slate-900/70 print:bg-white ${className ?? ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Engineering SLD sheet"
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-slate-950 px-3 py-2 print:hidden">
        <div>
          <p className="text-sm font-extrabold text-white">Engineering SLD sheet</p>
          <p className="text-[10px] text-slate-400">
            Print → Save as PDF · Separate from customer proposal
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" onClick={handlePrint} className="bg-violet-600 hover:bg-violet-500">
            <Printer className="mr-1.5 h-4 w-4" /> Print / PDF
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={onClose} className="border-white/20 text-white">
            <X className="mr-1 h-4 w-4" /> Close
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3 print:p-0">
        <div className="sld-sheet-page mx-auto max-w-[1120px] rounded-lg bg-white shadow-xl print:max-w-none print:rounded-none print:shadow-none">
          <DesignStudioSldSheetSvg model={model} />
        </div>
      </div>
      <style>{`
        @media print {
          @page {
            size: A3 landscape;
            margin: 8mm;
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
    </div>
  );
}
