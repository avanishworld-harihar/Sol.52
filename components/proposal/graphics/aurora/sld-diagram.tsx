"use client";

/**
 * Aurora — Single Line Diagram (SLD) SVG component.
 * Shows the complete electrical flow:
 *   Roof Panels → DCDB → Inverter → ACDB → Energy Meter → Grid + Load
 *
 * Pure SVG, no external dependencies, fully responsive via viewBox.
 */

type Props = {
  /** System capacity in kW — shown on the inverter label */
  systemKw: number;
  /** Number of panels — shown on the panel string label */
  panelCount: number;
  /** Panel wattage (Wp) */
  panelWatt?: number;
  /** Whether to show battery / storage branch */
  hasBattery?: boolean;
  lang?: "en" | "hi";
  className?: string;
};

const AURORA = {
  indigo: "#0B2447",
  amber: "#F5A524",
  emerald: "#10B981",
  sky: "#2E90FA",
  pearl: "#FAFBFC",
  grayLine: "#CBD5E1",
  grayText: "#64748B",
  darkText: "#1E293B",
};

export function SldDiagram({ systemKw, panelCount, panelWatt = 540, hasBattery = false, lang = "en", className }: Props) {
  const isHi = lang === "hi";
  const labels = {
    panels: isHi ? `${panelCount} पैनल\n${panelWatt}W प्रत्येक` : `${panelCount} Panels\n${panelWatt}W each`,
    dcdb: "DCDB",
    inverter: isHi ? `${systemKw} kW\nइन्वर्टर` : `${systemKw} kW\nInverter`,
    acdb: "ACDB",
    meter: isHi ? "ऊर्जा\nमीटर" : "Energy\nMeter",
    grid: isHi ? "ग्रिड" : "Grid",
    home: isHi ? "घर" : "Home",
    dc: "DC",
    ac: "AC",
    battery: isHi ? "बैटरी" : "Battery",
  };

  return (
    <svg
      viewBox="0 0 760 220"
      className={className ?? "w-full"}
      aria-label={isHi ? "सोलर सिस्टम सिंगल लाइन डायग्राम" : "Solar system single line diagram"}
      role="img"
    >
      {/* ── Background ── */}
      <rect width="760" height="220" rx="16" fill={AURORA.pearl} />

      {/* ── DC Bus line ── */}
      <line x1="120" y1="100" x2="310" y2="100" stroke={AURORA.amber} strokeWidth="2.5" strokeDasharray="6 3" />
      <text x="215" y="93" fontSize="10" fill={AURORA.amber} textAnchor="middle" fontWeight="600">{labels.dc}</text>

      {/* ── AC Bus line ── */}
      <line x1="390" y1="100" x2="570" y2="100" stroke={AURORA.sky} strokeWidth="2.5" />
      <text x="480" y="93" fontSize="10" fill={AURORA.sky} textAnchor="middle" fontWeight="600">{labels.ac}</text>

      {/* ── Grid line (right) ── */}
      <line x1="640" y1="100" x2="700" y2="100" stroke={AURORA.grayLine} strokeWidth="2" />

      {/* ── Home branch (down from meter) ── */}
      <line x1="605" y1="100" x2="605" y2="160" stroke={AURORA.emerald} strokeWidth="2" />

      {/* ── Battery branch (optional) ── */}
      {hasBattery && (
        <>
          <line x1="350" y1="130" x2="350" y2="175" stroke={AURORA.emerald} strokeWidth="2" />
          <rect x="318" y="175" width="64" height="32" rx="8" fill="#D1FAE5" stroke={AURORA.emerald} strokeWidth="1.5" />
          <text x="350" y="195" fontSize="10" fill={AURORA.emerald} textAnchor="middle" fontWeight="600">{labels.battery}</text>
        </>
      )}

      {/* ═══ PANELS (leftmost) ═══ */}
      <g transform="translate(10, 62)">
        {/* Outer panel frame */}
        <rect width="94" height="76" rx="8" fill={AURORA.indigo} />
        {/* Panel grid lines */}
        {[0,1,2].map(r => (
          <g key={r}>
            {[0,1].map(c => (
              <rect key={c} x={8 + c*44} y={8 + r*22} width="38" height="16" rx="3"
                fill="#1E40AF" stroke="#3B82F6" strokeWidth="0.8" />
            ))}
          </g>
        ))}
        {/* Label below */}
        <text x="47" y="90" fontSize="9.5" fill={AURORA.darkText} textAnchor="middle" fontWeight="600">
          {panelCount} {isHi ? "पैनल" : "Panels"}
        </text>
        <text x="47" y="102" fontSize="8.5" fill={AURORA.grayText} textAnchor="middle">
          {panelWatt}W {isHi ? "प्रत्येक" : "each"}
        </text>
      </g>

      {/* ═══ DCDB ═══ */}
      <g transform="translate(118, 74)">
        <rect width="64" height="52" rx="8" fill="#FEF3C7" stroke={AURORA.amber} strokeWidth="1.5" />
        <text x="32" y="22" fontSize="11" fill="#92400E" textAnchor="middle" fontWeight="700">DC</text>
        <text x="32" y="36" fontSize="10" fill="#92400E" textAnchor="middle" fontWeight="600">DB</text>
        <text x="32" y="66" fontSize="8.5" fill={AURORA.grayText} textAnchor="middle">DCDB</text>
      </g>

      {/* ═══ INVERTER (center) ═══ */}
      <g transform="translate(216, 58)">
        <rect width="94" height="76" rx="10" fill={AURORA.indigo} />
        {/* Inverter display screen mock */}
        <rect x="12" y="10" width="70" height="30" rx="4" fill="#1D4ED8" />
        <text x="47" y="30" fontSize="9" fill="#93C5FD" textAnchor="middle" fontWeight="500">
          ~{systemKw} kW
        </text>
        {/* LED dots */}
        <circle cx="22" cy="54" r="4" fill={AURORA.emerald} />
        <circle cx="38" cy="54" r="4" fill={AURORA.emerald} opacity="0.5"/>
        <circle cx="54" cy="54" r="4" fill={AURORA.emerald} opacity="0.3"/>
        {/* Label */}
        <text x="47" y="91" fontSize="9.5" fill={AURORA.darkText} textAnchor="middle" fontWeight="600">
          {isHi ? "इन्वर्टर" : "Inverter"}
        </text>
        <text x="47" y="103" fontSize="8.5" fill={AURORA.grayText} textAnchor="middle">
          {systemKw} kW On-Grid
        </text>
      </g>

      {/* ═══ ACDB ═══ */}
      <g transform="translate(338, 74)">
        <rect width="64" height="52" rx="8" fill="#EFF6FF" stroke={AURORA.sky} strokeWidth="1.5" />
        <text x="32" y="22" fontSize="11" fill="#1E40AF" textAnchor="middle" fontWeight="700">AC</text>
        <text x="32" y="36" fontSize="10" fill="#1E40AF" textAnchor="middle" fontWeight="600">DB</text>
        <text x="32" y="66" fontSize="8.5" fill={AURORA.grayText} textAnchor="middle">ACDB</text>
      </g>

      {/* ═══ ENERGY METER ═══ */}
      <g transform="translate(440, 72)">
        <rect width="72" height="56" rx="8" fill="#F0FDF4" stroke={AURORA.emerald} strokeWidth="1.5" />
        {/* Meter face */}
        <circle cx="36" cy="26" r="16" fill="white" stroke="#D1FAE5" strokeWidth="1" />
        {/* Meter needle */}
        <line x1="36" y1="26" x2="47" y2="18" stroke={AURORA.emerald} strokeWidth="2" strokeLinecap="round" />
        <circle cx="36" cy="26" r="3" fill={AURORA.emerald} />
        <text x="36" y="68" fontSize="8.5" fill={AURORA.grayText} textAnchor="middle">
          {isHi ? "मीटर" : "Meter"}
        </text>
      </g>

      {/* ═══ GRID POLE (right) ═══ */}
      <g transform="translate(640, 64)">
        <line x1="30" y1="0" x2="30" y2="72" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
        <line x1="14" y1="20" x2="46" y2="20" stroke="#94A3B8" strokeWidth="2.5" />
        <line x1="14" y1="20" x2="2" y2="52" stroke="#94A3B8" strokeWidth="1.5" />
        <line x1="46" y1="20" x2="58" y2="52" stroke="#94A3B8" strokeWidth="1.5" />
        <text x="30" y="88" fontSize="9" fill={AURORA.grayText} textAnchor="middle" fontWeight="500">
          {labels.grid}
        </text>
      </g>

      {/* ═══ HOME ICON ═══ */}
      <g transform="translate(578, 145)">
        <polygon points="27,2 52,22 52,52 2,52 2,22" fill="#ECFDF5" stroke={AURORA.emerald} strokeWidth="1.5" strokeLinejoin="round" />
        <rect x="18" y="34" width="18" height="18" rx="2" fill={AURORA.emerald} opacity="0.6" />
        <text x="27" y="68" fontSize="9" fill={AURORA.grayText} textAnchor="middle" fontWeight="500">
          {labels.home}
        </text>
      </g>

      {/* ── Arrow decorators on DC line ── */}
      <polygon points="170,95 176,100 170,105" fill={AURORA.amber} />
      <polygon points="254,95 260,100 254,105" fill={AURORA.amber} />

      {/* ── Arrow decorators on AC line ── */}
      <polygon points="440,95 446,100 440,105" fill={AURORA.sky} />
      <polygon points="520,95 526,100 520,105" fill={AURORA.sky} />

      {/* ── Net metering annotation ── */}
      <text x="690" y="86" fontSize="8" fill={AURORA.grayText} textAnchor="middle">Export</text>
      <text x="690" y="120" fontSize="8" fill={AURORA.grayText} textAnchor="middle">Import</text>
      <path d="M 700 95 L 715 90 L 710 85" fill="none" stroke={AURORA.grayLine} strokeWidth="1.2" />
      <path d="M 700 105 L 715 110 L 710 115" fill="none" stroke={AURORA.grayLine} strokeWidth="1.2" />
    </svg>
  );
}
