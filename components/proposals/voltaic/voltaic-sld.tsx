"use client";

/**
 * Voltaic E-102 — single-line diagram.
 *
 * Drawn with IEC-style symbols rather than product icons: the array, isolation,
 * protection, conversion, metering and the grid tie appear as they would on an
 * electrical drawing, annotated with the actual design voltages and currents.
 *
 * Layout is on a fixed column grid so labels never collide: device names sit
 * below their symbol, measured values sit above the conductor.
 */

import type { VoltaicStringDesign } from "./voltaic-live";
import styles from "./voltaic.module.css";

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

/* Column grid */
const MOD_X = 38;
const MOD_W = 44;
const ISO_X = 128;
const FUSE_X = 186;
const COLLECT_X = 250;
const INV_X = 312;
const INV_W = 92;
const ACDB_X = 470;
const ACDB_W = 84;
const METER_X = 600;
const GRID_X = 700;

/* Vertical budget: zone label 32 · device captions 48 · strings from 92 · bus 214 */
const ZONE_Y = 18;
const ZONE_H = 300;
const CAPTION_Y = 48;
const FIRST_ROW_Y = 92;
const ROW_GAP = 40;
const BUS_Y = 214;

function Earth({ x, y, label }: { x: number; y: number; label?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <line x1="0" y1="-11" x2="0" y2="0" stroke="#7FD8FF" strokeWidth="1.3" />
      <line x1="-10" y1="0" x2="10" y2="0" stroke="#7FD8FF" strokeWidth="1.6" />
      <line x1="-6" y1="4" x2="6" y2="4" stroke="#7FD8FF" strokeWidth="1.3" />
      <line x1="-3" y1="8" x2="3" y2="8" stroke="#7FD8FF" strokeWidth="1.1" />
      {label ? (
        <text x="0" y="20" className={styles.voltaicSldMicro} textAnchor="middle">
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
  const shown = Math.min(3, Math.max(1, design.stringCount));
  const rowGap = ROW_GAP;
  const firstRowY = FIRST_ROW_Y;

  return (
    <svg viewBox="0 0 760 352" className={styles.voltaicSldSvg} role="img" aria-label={labels.title}>
      <defs>
        <marker id="vtSldArrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" fill="#7FD8FF" />
        </marker>
        <marker id="vtSldArrowAc" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" fill="#FFB48C" />
        </marker>
      </defs>

      {/* Zone bands */}
      <rect x="12" y={ZONE_Y} width="286" height={ZONE_H} rx="3" fill="rgba(95,200,245,0.05)" stroke="#5FC8F5" strokeWidth="0.7" strokeDasharray="5 5" />
      <text x="22" y={ZONE_Y + 14} className={styles.voltaicSldZone}>{labels.dcSide}</text>
      <rect x="306" y={ZONE_Y} width="442" height={ZONE_H} rx="3" fill="rgba(255,106,43,0.05)" stroke="#FF6A2B" strokeWidth="0.7" strokeDasharray="5 5" opacity="0.7" />
      <text x="316" y={ZONE_Y + 14} className={styles.voltaicSldZoneAc}>{labels.acSide}</text>

      {/* ── Strings: module → isolator → fuse → collector ── */}
      {Array.from({ length: shown }).map((_, i) => {
        const y = firstRowY + i * rowGap;
        const isLast = i === shown - 1;
        return (
          <g key={i}>
            {/* PV module symbol */}
            <rect x={MOD_X} y={y - 12} width={MOD_W} height="24" fill="none" stroke="#7FD8FF" strokeWidth="1.3" />
            <line x1={MOD_X} y1={y + 12} x2={MOD_X + MOD_W} y2={y - 12} stroke="#7FD8FF" strokeWidth="1" />
            <line x1={MOD_X - 14} y1={y - 12} x2={MOD_X - 4} y2={y - 4} stroke="#FF6A2B" strokeWidth="1.1" markerEnd="url(#vtSldArrow)" />
            <line x1={MOD_X - 14} y1={y - 2} x2={MOD_X - 4} y2={y + 6} stroke="#FF6A2B" strokeWidth="1.1" markerEnd="url(#vtSldArrow)" />

            {/* conductor to isolator */}
            <line x1={MOD_X + MOD_W} y1={y} x2={ISO_X} y2={y} stroke="#7FD8FF" strokeWidth="1.3" />
            {/* DC isolator: hinged break */}
            <circle cx={ISO_X} cy={y} r="2.4" fill="#0A2E52" stroke="#7FD8FF" strokeWidth="1" />
            <line x1={ISO_X} y1={y} x2={ISO_X + 20} y2={y - 11} stroke="#7FD8FF" strokeWidth="1.5" />
            <circle cx={ISO_X + 24} cy={y} r="2.4" fill="#0A2E52" stroke="#7FD8FF" strokeWidth="1" />
            <line x1={ISO_X + 24} y1={y} x2={FUSE_X} y2={y} stroke="#7FD8FF" strokeWidth="1.3" />
            {/* Fuse */}
            <rect x={FUSE_X} y={y - 7} width="26" height="14" fill="none" stroke="#7FD8FF" strokeWidth="1.2" />
            <line x1={FUSE_X} y1={y} x2={FUSE_X + 26} y2={y} stroke="#7FD8FF" strokeWidth="1.2" />
            <line x1={FUSE_X + 26} y1={y} x2={COLLECT_X} y2={y} stroke="#7FD8FF" strokeWidth="1.3" />
            {/* drop onto the collector bus */}
            <line x1={COLLECT_X} y1={y} x2={COLLECT_X} y2={BUS_Y} stroke="#7FD8FF" strokeWidth="1.3" />
          </g>
        );
      })}

      {/* Array caption once, rather than one label per string row */}
      <text x={MOD_X} y={CAPTION_Y} className={styles.voltaicSldMicro}>
        {labels.array}
      </text>

      {/* Device captions, staggered so the two never run together */}
      <text x={ISO_X + 12} y={CAPTION_Y} className={styles.voltaicSldMicro} textAnchor="middle">
        {labels.isolator}
      </text>
      <text x={FUSE_X + 13} y={CAPTION_Y + 16} className={styles.voltaicSldMicro} textAnchor="middle">
        {labels.fuse}
      </text>
      <line x1={ISO_X + 12} y1={CAPTION_Y + 4} x2={ISO_X + 12} y2={firstRowY - 20} stroke="#5FC8F5" strokeWidth="0.6" opacity="0.45" />
      <line x1={FUSE_X + 13} y1={CAPTION_Y + 20} x2={FUSE_X + 13} y2={firstRowY - 20} stroke="#5FC8F5" strokeWidth="0.6" opacity="0.45" />

      {/* DCDB enclosure around isolators + fuses */}
      <rect
        x={ISO_X - 14}
        y={firstRowY - 24}
        width={COLLECT_X - ISO_X + 4}
        height={(shown - 1) * rowGap + 48}
        rx="3"
        fill="none"
        stroke="#5FC8F5"
        strokeWidth="1"
        strokeDasharray="4 3"
        opacity="0.7"
      />
      <text x={ISO_X - 14} y={firstRowY + (shown - 1) * rowGap + 40} className={styles.voltaicSldBox}>
        {labels.dcdb}
      </text>

      {/* SPD tap + earth, below the DC bus */}
      <line x1={COLLECT_X - 34} y1={BUS_Y} x2={COLLECT_X - 34} y2={BUS_Y + 22} stroke="#7FD8FF" strokeWidth="1.2" />
      <rect x={COLLECT_X - 43} y={BUS_Y + 22} width="18" height="20" fill="none" stroke="#7FD8FF" strokeWidth="1.2" />
      <path d={`M${COLLECT_X - 39},${BUS_Y + 38} L${COLLECT_X - 29},${BUS_Y + 26}`} stroke="#7FD8FF" strokeWidth="1.1" />
      <text x={COLLECT_X - 20} y={BUS_Y + 36} className={styles.voltaicSldMicro}>{labels.spd}</text>
      <Earth x={COLLECT_X - 34} y={BUS_Y + 54} />

      {/* DC bus into the inverter */}
      <line x1={COLLECT_X} y1={BUS_Y} x2={INV_X} y2={BUS_Y} stroke="#7FD8FF" strokeWidth="1.7" />
      <text x={(COLLECT_X + INV_X) / 2} y={BUS_Y - 12} className={styles.voltaicSldValue} textAnchor="middle">
        {design.stringVocColdV} V
      </text>

      {/* ── Inverter ── */}
      <rect x={INV_X} y={BUS_Y - 30} width={INV_W} height="60" rx="3" fill="rgba(127,216,255,0.1)" stroke="#7FD8FF" strokeWidth="1.6" />
      <line x1={INV_X + 22} y1={BUS_Y + 16} x2={INV_X + INV_W - 22} y2={BUS_Y - 16} stroke="#7FD8FF" strokeWidth="1.3" />
      <text x={INV_X + 14} y={BUS_Y - 8} className={styles.voltaicSldSym}>=</text>
      <path
        d={`M${INV_X + INV_W - 32},${BUS_Y + 12} q5,-9 10,0 q5,9 10,0`}
        fill="none"
        stroke="#7FD8FF"
        strokeWidth="1.5"
      />
      <text x={INV_X + INV_W / 2} y={BUS_Y - 40} className={styles.voltaicSldValue} textAnchor="middle">
        {systemKw} kW · {design.mpptCount} MPPT
      </text>
      <text x={INV_X + INV_W / 2} y={BUS_Y + 48} className={styles.voltaicSldBox} textAnchor="middle">
        {labels.inverter}
      </text>
      <Earth x={INV_X + INV_W / 2} y={BUS_Y + 66} />

      {/* ── AC run to ACDB ── */}
      <line x1={INV_X + INV_W} y1={BUS_Y} x2={ACDB_X} y2={BUS_Y} stroke="#FFB48C" strokeWidth="1.6" />
      <text x={(INV_X + INV_W + ACDB_X) / 2} y={BUS_Y - 14} className={styles.voltaicSldValueAc} textAnchor="middle">
        {threePhase ? "415 V" : "230 V"}
      </text>
      <text x={(INV_X + INV_W + ACDB_X) / 2} y={BUS_Y - 4} className={styles.voltaicSldValueAc} textAnchor="middle">
        {acCurrentA} A
      </text>

      {/* ── ACDB: MCB + RCD ── */}
      <rect x={ACDB_X} y={BUS_Y - 34} width={ACDB_W} height="68" rx="3" fill="none" stroke="#FF6A2B" strokeWidth="1" strokeDasharray="4 3" opacity="0.8" />
      <line x1={ACDB_X} y1={BUS_Y} x2={ACDB_X + 16} y2={BUS_Y} stroke="#FFB48C" strokeWidth="1.5" />
      <circle cx={ACDB_X + 16} cy={BUS_Y} r="2.4" fill="#0A2E52" stroke="#FFB48C" strokeWidth="1" />
      <line x1={ACDB_X + 16} y1={BUS_Y} x2={ACDB_X + 34} y2={BUS_Y - 11} stroke="#FFB48C" strokeWidth="1.6" />
      <rect x={ACDB_X + 42} y={BUS_Y - 7} width="12" height="14" fill="none" stroke="#FFB48C" strokeWidth="1.2" />
      <line x1={ACDB_X + 54} y1={BUS_Y} x2={ACDB_X + ACDB_W} y2={BUS_Y} stroke="#FFB48C" strokeWidth="1.5" />
      <text x={ACDB_X + 20} y={BUS_Y - 22} className={styles.voltaicSldMicroAc}>{labels.mcb}</text>
      <text x={ACDB_X + 46} y={BUS_Y + 24} className={styles.voltaicSldMicroAc}>{labels.rcd}</text>
      {/* Enclosure name above the box, keeping the space below free for the load drop */}
      <text x={ACDB_X + ACDB_W / 2} y={BUS_Y - 42} className={styles.voltaicSldBoxAc} textAnchor="middle">
        {labels.acdb}
      </text>

      {/* ── Net meter ── */}
      <line x1={ACDB_X + ACDB_W} y1={BUS_Y} x2={METER_X - 17} y2={BUS_Y} stroke="#FFB48C" strokeWidth="1.5" />
      <circle cx={METER_X} cy={BUS_Y} r="17" fill="none" stroke="#FFB48C" strokeWidth="1.5" />
      <text x={METER_X} y={BUS_Y + 4} className={styles.voltaicSldSymAc} textAnchor="middle">kWh</text>
      {/* import / export arrows */}
      <line x1={METER_X - 14} y1={BUS_Y - 26} x2={METER_X + 14} y2={BUS_Y - 26} stroke="#FFB48C" strokeWidth="1.1" markerEnd="url(#vtSldArrowAc)" />
      <line x1={METER_X + 14} y1={BUS_Y + 30} x2={METER_X - 14} y2={BUS_Y + 30} stroke="#FFB48C" strokeWidth="1.1" markerEnd="url(#vtSldArrowAc)" />
      <text x={METER_X} y={BUS_Y + 50} className={styles.voltaicSldBoxAc} textAnchor="middle">{labels.meter}</text>

      {/* ── Grid ── */}
      <line x1={METER_X + 17} y1={BUS_Y} x2={GRID_X - 18} y2={BUS_Y} stroke="#FFB48C" strokeWidth="1.6" />
      <circle cx={GRID_X} cy={BUS_Y} r="18" fill="none" stroke="#FFB48C" strokeWidth="1.6" />
      <path d={`M${GRID_X - 9},${BUS_Y + 3} q4.5,-9 9,0 q4.5,9 9,0`} fill="none" stroke="#FFB48C" strokeWidth="1.5" />
      <text x={GRID_X} y={BUS_Y + 50} className={styles.voltaicSldBoxAc} textAnchor="middle">{labels.grid}</text>

      {/* ── House loads, tapped at the ACDB and dropped clear of the bus ── */}
      <line x1={ACDB_X + ACDB_W / 2} y1={BUS_Y + 34} x2={ACDB_X + ACDB_W / 2} y2={BUS_Y + 54} stroke="#FFB48C" strokeWidth="1.4" />
      <g transform={`translate(${ACDB_X + ACDB_W / 2} ${BUS_Y + 68})`}>
        <path d="M-16,4 L0,-10 L16,4 L16,16 L-16,16 Z" fill="none" stroke="#FFB48C" strokeWidth="1.4" />
        <text x="0" y="30" className={styles.voltaicSldBoxAc} textAnchor="middle">{labels.loads}</text>
      </g>

      {/* ── Lightning arrester + earth, bottom-left of the DC zone ── */}
      <g transform={`translate(60 ${BUS_Y + 62})`}>
        <path d="M0,-30 L-6,-20 L6,-20 Z" fill="#FF6A2B" />
        <line x1="0" y1="-20" x2="0" y2="0" stroke="#FF6A2B" strokeWidth="1.5" />
        <text x="18" y="-14" className={styles.voltaicSldMicro}>{labels.la}</text>
      </g>
      <Earth x={60} y={BUS_Y + 74} label={labels.earth} />
    </svg>
  );
}
