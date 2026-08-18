"use client";

/**
 * Voltaic E-101 visuals.
 *
 * Two drawings no other preset carries: an exploded section through the
 * mounting assembly (what actually sits between the module and the roof slab),
 * and a tilt/row-pitch geometry diagram with the wind case called out.
 */

type StackLabels = {
  module: string;
  moduleNote: string;
  clamp: string;
  clampNote: string;
  rail: string;
  railNote: string;
  leg: string;
  legNote: string;
  base: string;
  baseNote: string;
  slab: string;
  slabNote: string;
  title: string;
  scale: string;
};

/** Exploded section — layers pulled apart with leader lines, like an assembly detail. */
export function VoltaicStackDiagram({ labels }: { labels: StackLabels }) {
  const layers = [
    { y: 16, label: labels.module, note: labels.moduleNote, key: "module" },
    { y: 78, label: labels.clamp, note: labels.clampNote, key: "clamp" },
    { y: 126, label: labels.rail, note: labels.railNote, key: "rail" },
    { y: 174, label: labels.leg, note: labels.legNote, key: "leg" },
    { y: 226, label: labels.base, note: labels.baseNote, key: "base" },
    { y: 274, label: labels.slab, note: labels.slabNote, key: "slab" },
  ];

  return (
    <svg viewBox="0 0 700 330" className="voltaicStackSvg" role="img" aria-label={labels.title}>
      <defs>
        <linearGradient id="vtGlass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2C6FA8" />
          <stop offset="100%" stopColor="#123E68" />
        </linearGradient>
        <pattern id="vtCells" width="26" height="18" patternUnits="userSpaceOnUse">
          <rect width="26" height="18" fill="url(#vtGlass)" />
          <rect width="24" height="16" x="1" y="1" fill="none" stroke="#5FC8F5" strokeWidth="0.5" opacity="0.55" />
        </pattern>
        <pattern id="vtConcrete" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="#5FC8F5" strokeWidth="0.6" opacity="0.35" />
        </pattern>
        <marker id="vtArrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" fill="#FF6A2B" />
        </marker>
      </defs>

      {/* ── 1 · PV module, drawn as a slab with a cell grid and frame edge ── */}
      <g transform="translate(150 16)">
        <polygon points="0,26 220,0 300,18 80,44" fill="url(#vtCells)" stroke="#7FD8FF" strokeWidth="1.1" />
        <polygon points="0,26 220,0 300,18 80,44" fill="none" stroke="#BFE7FF" strokeWidth="2.2" opacity="0.5" />
        <polygon points="0,26 0,32 80,50 80,44" fill="#0B2F52" stroke="#7FD8FF" strokeWidth="0.8" />
        <polygon points="80,44 80,50 300,24 300,18" fill="#0A2843" stroke="#7FD8FF" strokeWidth="0.8" />
        <text x="312" y="26" className="voltaicStackDim">2278 × 1134 mm</text>
      </g>

      {/* ── 2 · Mid / end clamps ── */}
      <g transform="translate(150 84)">
        {[40, 130, 220].map((x) => (
          <g key={x} transform={`translate(${x} ${Math.round(26 - x * 0.115)})`}>
            <rect x="-9" y="-7" width="18" height="12" rx="1.5" fill="#0E3A61" stroke="#7FD8FF" strokeWidth="1" />
            <rect x="-3" y="-13" width="6" height="8" rx="1" fill="#FF6A2B" opacity="0.9" />
          </g>
        ))}
        <text x="312" y="18" className="voltaicStackDim">M8 SS 304</text>
      </g>

      {/* ── 3 · Rails ── */}
      <g transform="translate(150 128)">
        <polygon points="0,22 220,-4 300,14 80,40" fill="none" stroke="#7FD8FF" strokeWidth="1" opacity="0.4" />
        <polygon points="6,24 224,-1 224,7 6,32" fill="#0E3A61" stroke="#7FD8FF" strokeWidth="1.1" />
        <polygon points="76,42 296,16 296,24 76,50" fill="#0B3050" stroke="#7FD8FF" strokeWidth="1.1" />
        <text x="312" y="22" className="voltaicStackDim">Al 6063-T6</text>
      </g>

      {/* ── 4 · Legs / purlin frame ── */}
      <g transform="translate(150 176)">
        {[26, 116, 206].map((x, i) => (
          <g key={x}>
            <line
              x1={x}
              y1={26 - x * 0.115}
              x2={x + 6}
              y2={26 - x * 0.115 + 34 - i * 5}
              stroke="#7FD8FF"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>
        ))}
        <text x="312" y="30" className="voltaicStackDim">HDG MS ≥80 µm</text>
      </g>

      {/* ── 5 · Base plate + chemical anchor ── */}
      <g transform="translate(150 232)">
        {[24, 114, 204].map((x, i) => (
          <g key={x} transform={`translate(${x} ${18 - x * 0.09 + i * 1})`}>
            <polygon points="-14,0 12,-4 26,3 0,7" fill="#0E3A61" stroke="#7FD8FF" strokeWidth="1" />
            <line x1="4" y1="4" x2="4" y2="16" stroke="#FF6A2B" strokeWidth="2.4" />
          </g>
        ))}
        <text x="312" y="16" className="voltaicStackDim">M12 · sealed</text>
      </g>

      {/* ── 6 · RCC slab ── */}
      <g transform="translate(150 278)">
        <polygon points="-24,26 216,-2 320,22 80,50" fill="url(#vtConcrete)" stroke="#7FD8FF" strokeWidth="1.2" />
        <polygon points="-24,26 -24,34 80,58 80,50" fill="#08243D" stroke="#7FD8FF" strokeWidth="0.9" />
        <polygon points="80,50 80,58 320,30 320,22" fill="#071E33" stroke="#7FD8FF" strokeWidth="0.9" />
        <text x="332" y="26" className="voltaicStackDim">RCC + waterproofing</text>
      </g>

      {/* ── Leader lines + numbered callouts ── */}
      {layers.map((layer, i) => {
        const y = layer.y + 26;
        return (
          <g key={layer.key}>
            <line x1="128" y1={y} x2="146" y2={y} stroke="#5FC8F5" strokeWidth="0.9" opacity="0.7" />
            <circle cx="118" cy={y} r="10" fill="#FF6A2B" />
            <text x="118" y={y + 4} className="voltaicStackNum">
              {i + 1}
            </text>
            <text x="102" y={y - 4} className="voltaicStackLabel" textAnchor="end">
              {layer.label}
            </text>
            <text x="102" y={y + 9} className="voltaicStackNote" textAnchor="end">
              {layer.note}
            </text>
          </g>
        );
      })}

      {/* Exploded-assembly axis */}
      <line
        x1="330"
        y1="44"
        x2="330"
        y2="300"
        stroke="#5FC8F5"
        strokeWidth="0.7"
        strokeDasharray="3 4"
        opacity="0.5"
        markerEnd="url(#vtArrow)"
      />
    </svg>
  );
}

type GeometryLabels = {
  tilt: string;
  pitch: string;
  clearance: string;
  wind: string;
  uplift: string;
  south: string;
  shadow: string;
  title: string;
};

/** Tilt, row pitch, shadow and the wind uplift case in one section view. */
export function VoltaicGeometryDiagram({
  labels,
  tiltDeg,
  rowPitchM,
  clearanceMm,
  windKmph,
  upliftN,
}: {
  labels: GeometryLabels;
  tiltDeg: number;
  rowPitchM: number;
  clearanceMm: number;
  windKmph: number;
  upliftN: number;
}) {
  const tilt = Math.max(8, Math.min(35, tiltDeg));
  const rad = (tilt * Math.PI) / 180;
  const len = 132;
  const baseY = 168;
  const x0 = 96;
  const x1 = x0 + Math.cos(rad) * len;
  const y1 = baseY - Math.sin(rad) * len;
  const shadow = Math.round(Math.sin(rad) * len * 1.9);

  return (
    <svg viewBox="0 0 700 214" className="voltaicGeomSvg" role="img" aria-label={labels.title}>
      <defs>
        <marker id="vtDim" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M0,4 L8,1 L8,7 Z" fill="#5FC8F5" />
        </marker>
        <marker id="vtWind" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="#FF6A2B" />
        </marker>
      </defs>

      {/* Roof datum */}
      <line x1="40" y1={baseY} x2="660" y2={baseY} stroke="#7FD8FF" strokeWidth="1.4" />
      {Array.from({ length: 32 }).map((_, i) => (
        <line
          key={i}
          x1={40 + i * 20}
          y1={baseY}
          x2={32 + i * 20}
          y2={baseY + 9}
          stroke="#5FC8F5"
          strokeWidth="0.7"
          opacity="0.45"
        />
      ))}

      {/* Row 1 module + support triangle */}
      <line x1={x0} y1={baseY} x2={x1} y2={y1} stroke="#7FD8FF" strokeWidth="5" strokeLinecap="round" />
      <line x1={x0} y1={baseY} x2={x1} y2={baseY} stroke="#5FC8F5" strokeWidth="0.8" strokeDasharray="4 4" opacity="0.7" />
      <line x1={x1} y1={baseY} x2={x1} y2={y1} stroke="#5FC8F5" strokeWidth="0.8" strokeDasharray="4 4" opacity="0.7" />
      <path
        d={`M ${x0 + 34} ${baseY} A 34 34 0 0 0 ${x0 + Math.cos(rad) * 34} ${baseY - Math.sin(rad) * 34}`}
        fill="none"
        stroke="#FF6A2B"
        strokeWidth="1.6"
      />
      <text x={x0 + 42} y={baseY - 10} className="voltaicGeomTilt">
        {tilt}°
      </text>
      <text x={x0 + 42} y={baseY - 24} className="voltaicGeomLabel">
        {labels.tilt}
      </text>

      {/* Shadow projection */}
      <line
        x1={x1}
        y1={baseY}
        x2={x1 + shadow}
        y2={baseY}
        stroke="#FF6A2B"
        strokeWidth="2"
        opacity="0.55"
      />
      <text x={x1 + shadow / 2} y={baseY + 22} className="voltaicGeomDim" textAnchor="middle">
        {labels.shadow}
      </text>

      {/* Row 2 */}
      <g transform={`translate(${Math.round(shadow + 44)} 0)`}>
        <line x1={x0} y1={baseY} x2={x1} y2={y1} stroke="#7FD8FF" strokeWidth="5" strokeLinecap="round" opacity="0.75" />
      </g>

      {/* Row pitch dimension */}
      <line
        x1={x0}
        y1={baseY + 40}
        x2={x0 + shadow + 44}
        y2={baseY + 40}
        stroke="#5FC8F5"
        strokeWidth="0.9"
        markerStart="url(#vtDim)"
        markerEnd="url(#vtDim)"
      />
      <text x={x0 + (shadow + 44) / 2} y={baseY + 35} className="voltaicGeomDim" textAnchor="middle">
        {labels.pitch} {rowPitchM.toFixed(2)} m
      </text>

      {/* Clearance under array */}
      <line x1={x0 - 22} y1={baseY} x2={x0 - 22} y2={baseY - 34} stroke="#5FC8F5" strokeWidth="0.9" markerStart="url(#vtDim)" markerEnd="url(#vtDim)" />
      <text x={x0 - 28} y={baseY - 14} className="voltaicGeomDim" textAnchor="end">
        {labels.clearance} {clearanceMm} mm
      </text>

      {/* Wind case */}
      <g transform="translate(430 34)">
        <line x1="0" y1="16" x2="52" y2="16" stroke="#FF6A2B" strokeWidth="1.6" markerEnd="url(#vtWind)" />
        <line x1="0" y1="30" x2="52" y2="30" stroke="#FF6A2B" strokeWidth="1.6" markerEnd="url(#vtWind)" />
        <text x="62" y="14" className="voltaicGeomLabel">{labels.wind}</text>
        <text x="62" y="30" className="voltaicGeomTilt">{windKmph} km/h</text>
        <text x="62" y="46" className="voltaicGeomDim">
          {labels.uplift} ≈ {upliftN} N
        </text>
      </g>

      {/* South marker */}
      <g transform="translate(600 150)">
        <circle cx="0" cy="0" r="17" fill="none" stroke="#7FD8FF" strokeWidth="1" />
        <path d="M0,-13 L4,0 L0,13 L-4,0 Z" fill="#FF6A2B" />
        <text x="0" y="31" className="voltaicGeomDim" textAnchor="middle">
          {labels.south}
        </text>
      </g>
    </svg>
  );
}
