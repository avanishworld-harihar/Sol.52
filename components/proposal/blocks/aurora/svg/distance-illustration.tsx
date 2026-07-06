/**
 * DistanceIllustrationSvg — side-elevation DC/AC run diagram for Aurora preset.
 * Shows roof-mounted PV array, cable path to inverter room, then AC to home/grid.
 */

type Props = {
  dcRunM: number;
  acRunM: number;
  lang?: "en" | "hi";
};

const W = 420;
const H = 200;

export function DistanceIllustrationSvg({ dcRunM, acRunM, lang = "en" }: Props) {
  const isHi = lang === "hi";
  const dcIdeal = dcRunM <= 15;
  const dcWarn = dcRunM > 25;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="aurora-distance-svg"
      aria-label={`DC run ${dcRunM}m, AC run ${acRunM}m`}
      role="img"
    >
      <defs>
        <linearGradient id="aurora-roof" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
        <marker id="dc-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#f59e0b" />
        </marker>
        <marker id="ac-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#10b981" />
        </marker>
      </defs>

      <rect width={W} height={H} rx="14" fill="#f8fafc" stroke="#e2e8f0" />

      {/* Ground */}
      <line x1="16" y1="158" x2={W - 16} y2="158" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 4" />

      {/* Roof */}
      <polygon points="24,118 118,72 198,118" fill="url(#aurora-roof)" stroke="#64748b" strokeWidth="1.5" />

      {/* Panels on roof */}
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect
            x={52 + i * 22}
            y={88 - i * 2}
            width="18"
            height="22"
            rx="2"
            fill="#1e3a8a"
            stroke="#f59e0b"
            strokeWidth="1"
            transform={`rotate(-18 ${61 + i * 22} 99)`}
          />
        </g>
      ))}
      <text x="98" y="132" textAnchor="middle" fontSize="9" fontWeight="700" fill="#0b2447" fontFamily="Inter, system-ui, sans-serif">
        {isHi ? "पैनल (छत)" : "PV array (roof)"}
      </text>

      {/* DC cable path — dashed with dimension */}
      <path
        d="M 118 108 C 150 108, 168 118, 188 128 L 228 138"
        fill="none"
        stroke="#f59e0b"
        strokeWidth="3"
        strokeDasharray="6 4"
        markerEnd="url(#dc-arrow)"
      />
      {/* DC dimension line */}
      <line x1="118" y1="148" x2="228" y2="148" stroke="#f59e0b" strokeWidth="1" opacity="0.6" />
      <line x1="118" y1="143" x2="118" y2="153" stroke="#f59e0b" strokeWidth="1" />
      <line x1="228" y1="143" x2="228" y2="153" stroke="#f59e0b" strokeWidth="1" />
      <rect x="155" y="152" width="48" height="16" rx="4" fill="#fff7ed" stroke="#fdba74" />
      <text x="179" y="163" textAnchor="middle" fontSize="9" fontWeight="700" fill="#c2410c" fontFamily="Inter, system-ui, sans-serif">
        DC · {dcRunM} m
      </text>

      {/* Inverter room */}
      <rect x="228" y="108" width="56" height="50" rx="6" fill="#ede9fe" stroke="#7c3aed" strokeWidth="1.5" />
      <text x="256" y="128" textAnchor="middle" fontSize="9" fontWeight="700" fill="#4c1d95" fontFamily="Inter, system-ui, sans-serif">
        {isHi ? "इन्वर्टर" : "Inverter"}
      </text>
      <text x="256" y="142" textAnchor="middle" fontSize="7.5" fill="#6d28d9" fontFamily="Inter, system-ui, sans-serif">
        {isHi ? "कमरा / शेड" : "room / shade"}
      </text>

      {/* AC cable path */}
      <path
        d="M 284 133 L 318 133 L 348 118 L 378 118"
        fill="none"
        stroke="#10b981"
        strokeWidth="3"
        markerEnd="url(#ac-arrow)"
      />
      <line x1="284" y1="168" x2="378" y2="168" stroke="#10b981" strokeWidth="1" opacity="0.6" />
      <line x1="284" y1="163" x2="284" y2="173" stroke="#10b981" strokeWidth="1" />
      <line x1="378" y1="163" x2="378" y2="173" stroke="#10b981" strokeWidth="1" />
      <rect x="305" y="172" width="48" height="16" rx="4" fill="#ecfdf5" stroke="#6ee7b7" />
      <text x="329" y="183" textAnchor="middle" fontSize="9" fontWeight="700" fill="#047857" fontFamily="Inter, system-ui, sans-serif">
        AC · {acRunM} m
      </text>

      {/* Home + meter */}
      <rect x="368" y="88" width="38" height="42" rx="5" fill="#d1fae5" stroke="#059669" strokeWidth="1.5" />
      <text x="387" y="106" textAnchor="middle" fontSize="8" fontWeight="700" fill="#064e3b" fontFamily="Inter, system-ui, sans-serif">
        {isHi ? "घर" : "Home"}
      </text>
      <text x="387" y="118" textAnchor="middle" fontSize="7" fill="#065f46" fontFamily="Inter, system-ui, sans-serif">
        + {isHi ? "मीटर" : "meter"}
      </text>

      {/* Status badge */}
      <rect x="16" y="14" width={dcIdeal ? 118 : dcWarn ? 130 : 108} height="20" rx="5" fill={dcIdeal ? "#ecfdf5" : dcWarn ? "#fef2f2" : "#fffbeb"} stroke={dcIdeal ? "#6ee7b7" : dcWarn ? "#fca5a5" : "#fcd34d"} />
      <text x="24" y="27" fontSize="8" fontWeight="600" fill={dcIdeal ? "#047857" : dcWarn ? "#b91c1c" : "#b45309"} fontFamily="Inter, system-ui, sans-serif">
        {dcIdeal
          ? isHi ? "✓ DC रन आदर्श सीमा में" : "✓ DC run in ideal range"
          : dcWarn
            ? isHi ? "⚠ DC रन लंबा — वोल्टेज ड्रॉप" : "⚠ Long DC run — voltage drop risk"
            : isHi ? "DC रन स्वीकार्य" : "DC run acceptable"}
      </text>

      <text x={W / 2} y={H - 10} textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="Inter, system-ui, sans-serif">
        {isHi ? "आदर्श DC: 5–15 m · अधिकतम: 30 m" : "Ideal DC: 5–15 m · Max recommended: 30 m"}
      </text>
    </svg>
  );
}
