"use client";

/**
 * Voltaic E-102 — single-line diagram.
 *
 * Drawn with IEC-style symbols rather than product icons: the array, isolation,
 * protection, conversion, metering and the grid tie appear as they would on an
 * electrical drawing, annotated with the actual design voltages and currents.
 */

import type { VoltaicStringDesign } from "./voltaic-live";

export type SldLabels = {
  title: string;
  array: string;
  string: string;
  isolator: string;
  dcdb: string;
  fuse: string;
  spd: string;
  inverter: string;
  acdb: string;
  mcb: string;
  rcd: string;
  meter: string;
  grid: string;
  loads: string;
  earth: string;
  la: string;
  dcSide: string;
  acSide: string;
};

function EarthSymbol({ x, y, label }: { x: number; y: number; label?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <line x1="0" y1="-12" x2="0" y2="0" stroke="#7FD8FF" strokeWidth="1.3" />
      <line x1="-11" y1="0" x2="11" y2="0" stroke="#7FD8FF" strokeWidth="1.6" />
      <line x1="-7" y1="4" x2="7" y2="4" stroke="#7FD8FF" strokeWidth="1.4" />
      <line x1="-3.5" y1="8" x2="3.5" y2="8" stroke="#7FD8FF" strokeWidth="1.2" />
      {label ? (
        <text x="0" y="22" className="voltaicSldMicro" textAnchor="middle">
          {label}
        </text>
      ) : null}
    </g>
  );
}

export function VoltaicSld({
  labels,
  design,
  systemKw,
  threePhase,
  acCurrentA,
}: {
  labels: SldLabels;
  design: VoltaicStringDesign;
  systemKw: number;
  threePhase: boolean;
  acCurrentA: number;
}) {
  const busY = 132;
  const strings = Math.min(3, Math.max(1, design.stringCount));

  return (
    <svg viewBox="0 0 700 300" className="voltaicSldSvg" role="img" aria-label={labels.title}>
      <defs>
        <marker id="vtSldArrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" fill="#7FD8FF" />
        </marker>
      </defs>

      {/* DC / AC zone split */}
      <rect x="18" y="30" width="352" height="212" rx="4" fill="rgba(95,200,245,0.05)" stroke="#5FC8F5" strokeWidth="0.7" strokeDasharray="5 5" />
      <text x="28" y="46" className="voltaicSldZone">{labels.dcSide}</text>
      <rect x="382" y="30" width="300" height="212" rx="4" fill="rgba(255,106,43,0.05)" stroke="#FF6A2B" strokeWidth="0.7" strokeDasharray="5 5" opacity="0.75" />
      <text x="392" y="46" className="voltaicSldZoneAc">{labels.acSide}</text>

      {/* ── PV strings ── */}
      {Array.from({ length: strings }).map((_, i) => {
        const y = 74 + i * 42;
        return (
          <g key={i}>
            {/* Module symbol: rectangle with diagonal + irradiance arrows */}
            <rect x="34" y={y - 13} width="46" height="26" fill="none" stroke="#7FD8FF" strokeWidth="1.3" />
            <line x1="34" y1={y + 13} x2="80" y2={y - 13} stroke="#7FD8FF" strokeWidth="1.1" />
            <line x1="22" y1={y - 16} x2="32" y2={y - 8} stroke="#FF6A2B" strokeWidth="1.1" markerEnd="url(#vtSldArrow)" />
            <line x1="22" y1={y - 6} x2="32" y2={y + 2} stroke="#FF6A2B" strokeWidth="1.1" markerEnd="url(#vtSldArrow)" />
            <text x="57" y={y - 19} className="voltaicSldMicro" textAnchor="middle">
              {labels.string} {i + 1}
              {strings < design.stringCount && i === strings - 1 ? ` …${design.stringCount}` : ""}
            </text>
            {/* run to isolator */}
            <line x1="80" y1={y} x2="128" y2={y} stroke="#7FD8FF" strokeWidth="1.3" />
            {/* DC isolator: break in the line */}
            <line x1="128" y1={y} x2="140" y2={y} stroke="#7FD8FF" strokeWidth="1.3" />
            <line x1="140" y1={y} x2="152" y2={y - 9} stroke="#7FD8FF" strokeWidth="1.5" />
            <circle cx="140" cy={y} r="2" fill="#0A2E52" stroke="#7FD8FF" strokeWidth="1" />
            <circle cx="154" cy={y} r="2" fill="#0A2E52" stroke="#7FD8FF" strokeWidth="1" />
            <line x1="154" y1={y} x2="196" y2={y} stroke="#7FD8FF" strokeWidth="1.3" />
            {/* Fuse inside DCDB */}
            <rect x="196" y={y - 7} width="24" height="14" fill="none" stroke="#7FD8FF" strokeWidth="1.2" />
            <line x1="196" y1={y} x2="220" y2={y} stroke="#7FD8FF" strokeWidth="1.2" />
            <line x1="220" y1={y} x2="262" y2={y} stroke="#7FD8FF" strokeWidth="1.3" />
            {/* down to the DC bus */}
            <line x1="262" y1={y} x2="262" y2={busY} stroke="#7FD8FF" strokeWidth="1.3" />
          </g>
        );
      })}
      <text x="140" y="46" className="voltaicSldMicro">{labels.isolator}</text>
      <text x="206" y="46" className="voltaicSldMicro" textAnchor="middle">{labels.fuse}</text>

      {/* DCDB enclosure */}
      <rect x="188" y="56" width="88" height={strings * 42 + 6} rx="3" fill="none" stroke="#5FC8F5" strokeWidth="1" strokeDasharray="4 3" opacity="0.85" />
      <text x="232" y={strings * 42 + 76} className="voltaicSldBox" textAnchor="middle">{labels.dcdb}</text>

      {/* SPD tap on the DC bus */}
      <line x1="240" y1={busY} x2="240" y2={busY + 30} stroke="#7FD8FF" strokeWidth="1.2" />
      <rect x="231" y={busY + 30} width="18" height="20" fill="none" stroke="#7FD8FF" strokeWidth="1.2" />
      <path d={`M235,${busY + 46} L245,${busY + 34}`} stroke="#7FD8FF" strokeWidth="1.1" />
      <path d={`M241,${busY + 34} L245,${busY + 34} L245,${busY + 38}`} fill="none" stroke="#7FD8FF" strokeWidth="1.1" />
      <text x="252" y={busY + 44} className="voltaicSldMicro">{labels.spd}</text>
      <EarthSymbol x={240} y={busY + 62} />

      {/* DC bus into inverter */}
      <line x1="262" y1={busY} x2="330" y2={busY} stroke="#7FD8FF" strokeWidth="1.6" />
      <text x="296" y={busY - 8} className="voltaicSldValue" textAnchor="middle">
        {design.stringVocColdV} V · {Math.round(design.stringIscA * design.stringCount)} A
      </text>

      {/* ── Inverter ── */}
      <rect x="330" y={busY - 34} width="92" height="68" rx="3" fill="rgba(127,216,255,0.08)" stroke="#7FD8FF" strokeWidth="1.6" />
      <line x1="352" y1={busY + 16} x2="400" y2={busY - 16} stroke="#7FD8FF" strokeWidth="1.3" />
      <text x="346" y={busY - 8} className="voltaicSldSym">=</text>
      <path
        d={`M392,${busY + 12} q5,-9 10,0 q5,9 10,0`}
        fill="none"
        stroke="#7FD8FF"
        strokeWidth="1.5"
      />
      <text x="376" y={busY + 48} className="voltaicSldBox" textAnchor="middle">{labels.inverter}</text>
      <text x="376" y={busY - 44} className="voltaicSldValue" textAnchor="middle">
        {systemKw} kW · {design.mpptCount} MPPT
      </text>
      <EarthSymbol x={376} y={busY + 62} />

      {/* ── AC run to ACDB ── */}
      <line x1="422" y1={busY} x2="470" y2={busY} stroke="#FFB48C" strokeWidth="1.6" />
      <text x="446" y={busY - 8} className="voltaicSldValueAc" textAnchor="middle">
        {threePhase ? "415 V 3Φ" : "230 V 1Φ"}
      </text>

      {/* ACDB: MCB + RCD */}
      <rect x="470" y={busY - 40} width="76" height="80" rx="3" fill="none" stroke="#FF6A2B" strokeWidth="1" strokeDasharray="4 3" opacity="0.85" />
      <line x1="470" y1={busY} x2="486" y2={busY} stroke="#FFB48C" strokeWidth="1.5" />
      <line x1="486" y1={busY} x2="498" y2={busY - 10} stroke="#FFB48C" strokeWidth="1.6" />
      <rect x="498" y={busY - 6} width="8" height="12" fill="none" stroke="#FFB48C" strokeWidth="1.2" />
      <line x1="506" y1={busY} x2="546" y2={busY} stroke="#FFB48C" strokeWidth="1.5" />
      <text x="508" y={busY - 20} className="voltaicSldMicroAc" textAnchor="middle">{labels.mcb}</text>
      <text x="508" y={busY + 30} className="voltaicSldMicroAc" textAnchor="middle">{labels.rcd}</text>
      <text x="508" y={busY + 52} className="voltaicSldBoxAc" textAnchor="middle">{labels.acdb}</text>

      {/* ── Net meter ── */}
      <line x1="546" y1={busY} x2="566" y2={busY} stroke="#FFB48C" strokeWidth="1.5" />
      <circle cx="580" cy={busY} r="15" fill="none" stroke="#FFB48C" strokeWidth="1.5" />
      <text x="580" y={busY + 4} className="voltaicSldSymAc" textAnchor="middle">kWh</text>
      <path d={`M572,${busY - 20} L588,${busY - 20}`} stroke="#FFB48C" strokeWidth="1.2" markerEnd="url(#vtSldArrow)" />
      <path d={`M588,${busY + 20} L572,${busY + 20}`} stroke="#FFB48C" strokeWidth="1.2" markerEnd="url(#vtSldArrow)" />
      <text x="580" y={busY + 42} className="voltaicSldBoxAc" textAnchor="middle">{labels.meter}</text>

      {/* ── Grid ── */}
      <line x1="595" y1={busY} x2="638" y2={busY} stroke="#FFB48C" strokeWidth="1.6" />
      <g transform={`translate(654 ${busY})`}>
        <circle cx="0" cy="0" r="15" fill="none" stroke="#FFB48C" strokeWidth="1.6" />
        <path d="M-8,2 q4,-8 8,0 q4,8 8,0" fill="none" stroke="#FFB48C" strokeWidth="1.5" />
        <text x="0" y="32" className="voltaicSldBoxAc" textAnchor="middle">{labels.grid}</text>
      </g>

      {/* ── House loads tapped before the meter ── */}
      <line x1="546" y1={busY} x2="546" y2={busY + 62} stroke="#FFB48C" strokeWidth="1.4" />
      <g transform={`translate(546 ${busY + 78})`}>
        <path d="M-15,4 L0,-9 L15,4 L15,16 L-15,16 Z" fill="none" stroke="#FFB48C" strokeWidth="1.4" />
        <text x="0" y="32" className="voltaicSldBoxAc" textAnchor="middle">{labels.loads}</text>
      </g>

      {/* ── Lightning arrester ── */}
      <g transform="translate(96 246)">
        <line x1="0" y1="-16" x2="0" y2="4" stroke="#FF6A2B" strokeWidth="1.5" />
        <path d="M0,-24 L-5,-16 L5,-16 Z" fill="#FF6A2B" />
        <text x="14" y="0" className="voltaicSldMicro">{labels.la}</text>
      </g>
      <EarthSymbol x={96} y={262} label={labels.earth} />
    </svg>
  );
}
