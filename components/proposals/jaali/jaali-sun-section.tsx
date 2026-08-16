"use client";

import { useId } from "react";
import styles from "./Jaali.module.css";

/**
 * South-section of an elevated GI MMS table.
 * Symbols follow common rooftop-SPV drawing practice (MNRE: tilt ≈ latitude,
 * northern-hemisphere azimuth 180° true south; IEC-style PV / inverter / AC marks).
 */
export function JaaliSunSection({
  tiltDeg,
  walkLabel,
  southLabel,
  tiltCaption,
}: {
  tiltDeg: number;
  walkLabel: string;
  southLabel: string;
  tiltCaption: string;
}) {
  const uid = useId().replace(/:/g, "");
  const tilt = tiltDeg > 0 ? Math.min(32, Math.max(12, tiltDeg)) : 22;
  const sunGrad = `jaSun-${uid}`;
  const cellGrad = `jaCell-${uid}`;
  const steelGrad = `jaSteel-${uid}`;

  return (
    <svg className={styles.sunSvg} viewBox="0 0 720 248" role="img" aria-hidden>
      <defs>
        <linearGradient id={sunGrad} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f4c98a" />
          <stop offset="100%" stopColor="#c45c32" />
        </linearGradient>
        <linearGradient id={cellGrad} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2a5f9a" />
          <stop offset="55%" stopColor="#1a3f72" />
          <stop offset="100%" stopColor="#16325c" />
        </linearGradient>
        <linearGradient id={steelGrad} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#9aa3ab" />
          <stop offset="50%" stopColor="#d5d8d0" />
          <stop offset="100%" stopColor="#7d868e" />
        </linearGradient>
        <marker id={`jaArr-${uid}`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0 0 L8 4 L0 8 Z" fill="#b44a2a" />
        </marker>
      </defs>

      <rect x="0" y="0" width="720" height="248" fill="#f3ead8" />
      <rect x="0" y="0" width="720" height="118" fill="#e7eef4" opacity="0.55" />

      {/* 1 · Sun + GHI rays (ISO-style disc with rays) */}
      <g transform="translate(78 52)">
        <circle r="34" fill="#f4c98a" opacity="0.35" />
        <circle r="20" fill={`url(#${sunGrad})`} />
        <g stroke="#c45c32" strokeWidth="2.4" strokeLinecap="round">
          <line x1="0" y1="-28" x2="0" y2="-36" />
          <line x1="20" y1="-20" x2="26" y2="-26" />
          <line x1="28" y1="0" x2="36" y2="0" />
          <line x1="20" y1="20" x2="26" y2="26" />
          <line x1="-20" y1="-20" x2="-26" y2="-26" />
          <line x1="-28" y1="0" x2="-36" y2="0" />
        </g>
        <circle cx="28" cy="0" r="11" fill="#b08d3e" />
        <text x="28" y="4" textAnchor="middle" fill="#fbf6ec" fontSize="11" fontWeight="800">
          1
        </text>
        <text x="0" y="52" textAnchor="middle" fill="#2a2118" fontSize="11" fontWeight="800">
          SUN · GHI
        </text>
      </g>

      {/* Irradiance arrows onto the module face */}
      <g
        stroke="#b44a2a"
        strokeWidth="2.2"
        fill="none"
        markerEnd={`url(#jaArr-${uid})`}
        opacity="0.9"
      >
        <line x1="118" y1="58" x2="248" y2="108" />
        <line x1="128" y1="72" x2="262" y2="118" />
        <line x1="138" y1="86" x2="276" y2="128" />
      </g>

      {/* Compass — true south on this terrace */}
      <g transform="translate(668 44)">
        <circle r="26" fill="#fbf6ec" stroke="#b08d3e" strokeWidth="1.6" />
        <polygon points="0,-16 5,-2 0,-5 -5,-2" fill="#b44a2a" />
        <polygon points="0,16 5,2 0,5 -5,2" fill="#3a3228" />
        <text x="0" y="-18" textAnchor="middle" fill="#b44a2a" fontSize="9" fontWeight="800">
          N
        </text>
        <text x="0" y="26" textAnchor="middle" fill="#3a3228" fontSize="9" fontWeight="800">
          S
        </text>
      </g>

      {/* RCC terrace */}
      <rect x="28" y="198" width="664" height="18" fill="#ead9c1" />
      <rect x="28" y="216" width="664" height="7" fill="#d4c2a4" />
      <g stroke="#c4b394" strokeWidth="1">
        <line x1="90" y1="198" x2="90" y2="216" />
        <line x1="200" y1="198" x2="200" y2="216" />
        <line x1="320" y1="198" x2="320" y2="216" />
        <line x1="440" y1="198" x2="440" y2="216" />
        <line x1="560" y1="198" x2="560" y2="216" />
      </g>
      <text x="36" y="241" fill="#b44a2a" fontSize="12" fontWeight="800">
        {southLabel}
      </text>
      <text x="250" y="241" fill="#6b5e4e" fontSize="11" fontWeight="700">
        RCC terrace
      </text>

      {/* GI MMS columns + rafter (hot-dip galvanized look) */}
      <g>
        {[214, 278, 342, 406].map((x) => (
          <g key={x}>
            <rect x={x} y="132" width="9" height="66" rx="1" fill={`url(#${steelGrad})`} />
            <rect x={x - 4} y="194" width="17" height="6" fill="#8a8680" />
          </g>
        ))}
        <rect x="210" y="128" width="210" height="6" fill="#8d969e" />
      </g>

      {/* PV array — blue cells in silver frames, tilted toward south */}
      <g transform={`translate(198 132) rotate(-${tilt})`}>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const x = i * 38;
          return (
            <g key={i}>
              <rect x={x} y="-40" width="36" height="40" fill="#cfd5da" rx="1.5" />
              <rect x={x + 2} y="-38" width="32" height="36" fill={`url(#${cellGrad})`} />
              <g stroke="#9ec0e6" strokeWidth="0.6" opacity="0.55">
                <line x1={x + 12} y1="-38" x2={x + 12} y2="-2" />
                <line x1={x + 22} y1="-38" x2={x + 22} y2="-2" />
                <line x1={x + 2} y1="-20" x2={x + 34} y2="-20" />
              </g>
            </g>
          );
        })}
        <circle cx="228" cy="-48" r="11" fill="#b08d3e" />
        <text x="228" y="-44" textAnchor="middle" fill="#fbf6ec" fontSize="11" fontWeight="800">
          2
        </text>
      </g>

      {/* Tilt arc θ ≈ latitude */}
      <path
        d="M198 132 A34 34 0 0 1 228 108"
        fill="none"
        stroke="#2a2118"
        strokeWidth="1.6"
      />
      <text x="232" y="104" fill="#2a2118" fontSize="13" fontWeight="800">
        {tiltCaption}
      </text>
      <text x="232" y="118" fill="#6b5e4e" fontSize="10" fontWeight="700">
        ≈ latitude
      </text>

      {/* Walk clearance */}
      <line
        x1="188"
        y1="138"
        x2="188"
        y2="196"
        stroke="#2a2118"
        strokeWidth="1.4"
        strokeDasharray="3 3"
      />
      <text
        x="184"
        y="172"
        textAnchor="end"
        fill="#2a2118"
        fontSize="11"
        fontWeight="800"
      >
        {walkLabel}
      </text>

      {/* Person scale under the table */}
      <g transform="translate(248 168)" fill="#3a3228">
        <circle cx="0" cy="6" r="4.5" />
        <rect x="-3.5" y="11" width="7" height="14" rx="2" />
        <rect x="-6" y="25" width="4" height="12" rx="1" />
        <rect x="2" y="25" width="4" height="12" rx="1" />
      </g>

      {/* DC run to inverter */}
      <path
        d="M430 148 C460 148, 470 168, 498 176"
        fill="none"
        stroke="#1a3f72"
        strokeWidth="2.4"
        strokeDasharray="5 3"
      />
      <text x="448" y="164" fill="#1a3f72" fontSize="10" fontWeight="800">
        DC + −
      </text>

      {/* 3 · Inverter IEC: DC in / AC sine out */}
      <g transform="translate(498 152)">
        <rect width="72" height="48" rx="3" fill="#fbf6ec" stroke="#3a3228" strokeWidth="1.8" />
        <text x="8" y="16" fill="#1a3f72" fontSize="11" fontWeight="800">
          =
        </text>
        <line x1="22" y1="8" x2="22" y2="40" stroke="#b08d3e" strokeWidth="1.4" />
        <path
          d="M28 28 C34 18, 40 38, 46 28 C52 18, 58 38, 64 28"
          fill="none"
          stroke="#b44a2a"
          strokeWidth="1.8"
        />
        <text x="36" y="14" fill="#2a2118" fontSize="9" fontWeight="800">
          INV
        </text>
        <circle cx="72" cy="-8" r="11" fill="#b08d3e" />
        <text x="72" y="-4" textAnchor="middle" fill="#fbf6ec" fontSize="11" fontWeight="800">
          3
        </text>
      </g>

      {/* AC run to home DB */}
      <path
        d="M570 176 H612"
        fill="none"
        stroke="#b44a2a"
        strokeWidth="2.4"
        markerEnd={`url(#jaArr-${uid})`}
      />
      <text x="578" y="168" fill="#b44a2a" fontSize="10" fontWeight="800">
        AC ~
      </text>

      {/* 4 · Home / LT board */}
      <g transform="translate(618 148)">
        <polygon points="24,0 48,16 0,16" fill="#3a3228" />
        <rect x="6" y="16" width="36" height="28" fill="#fbf6ec" stroke="#3a3228" strokeWidth="1.6" />
        <rect x="20" y="28" width="8" height="16" fill="#b08d3e" />
        <circle cx="48" cy="-6" r="11" fill="#b08d3e" />
        <text x="48" y="-2" textAnchor="middle" fill="#fbf6ec" fontSize="11" fontWeight="800">
          4
        </text>
        <text x="24" y="58" textAnchor="middle" fill="#2a2118" fontSize="11" fontWeight="800">
          HOME · DB
        </text>
      </g>
    </svg>
  );
}
