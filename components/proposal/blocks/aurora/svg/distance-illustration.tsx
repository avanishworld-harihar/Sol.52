/**
 * DistanceIllustrationSvg — DC/AC cable run distance diagram for Aurora preset.
 *
 * Shows a simple top-view schematic:
 *   [Panels on roof] -- DC run --> [Inverter] -- AC run --> [Meter/Home]
 *
 * Pure SVG — print-safe.
 */

type Props = {
  dcRunM: number;
  acRunM: number;
};

const W = 180;
const H = 110;

export function DistanceIllustrationSvg({ dcRunM, acRunM }: Props) {
  const panelX = 14;
  const panelY = 38;
  const panelW = 32;
  const panelH = 34;

  const invX = 80;
  const invY = 43;
  const invW = 28;
  const invH = 24;

  const meterX = 146;
  const meterY = 43;
  const meterW = 24;
  const meterH = 24;

  // Midpoints for labels
  const dcMidX = (panelX + panelW + invX) / 2;
  const acMidX = (invX + invW + meterX) / 2;
  const lineY = 55;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      aria-label={`DC run ${dcRunM}m, AC run ${acRunM}m`}
      role="img"
    >
      <rect x="0" y="0" width={W} height={H} rx="12" fill="#f0f9ff" />

      {/* Panel box */}
      <rect x={panelX} y={panelY} width={panelW} height={panelH} rx="5" fill="#e0e7ff" stroke="#4338ca" strokeWidth="1.5" />
      <text x={panelX + panelW / 2} y={panelY + 13} textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#3730a3" fontFamily="Inter, system-ui, sans-serif">PV</text>
      <text x={panelX + panelW / 2} y={panelY + 24} textAnchor="middle" fontSize="7" fill="#4338ca" fontFamily="Inter, system-ui, sans-serif">Array</text>

      {/* DC cable line */}
      <line
        x1={panelX + panelW}
        y1={lineY}
        x2={invX}
        y2={lineY}
        stroke="#f59e0b"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <polygon
        points={`${invX - 7},${lineY - 4} ${invX},${lineY} ${invX - 7},${lineY + 4}`}
        fill="#f59e0b"
      />

      {/* DC run label */}
      <text x={dcMidX} y={lineY - 6} textAnchor="middle" fontSize="8" fontWeight="700" fill="#d97706" fontFamily="Inter, system-ui, sans-serif">
        DC · {dcRunM} m
      </text>

      {/* Inverter box */}
      <rect x={invX} y={invY} width={invW} height={invH} rx="5" fill="#ede9fe" stroke="#7c3aed" strokeWidth="1.5" />
      <text x={invX + invW / 2} y={invY + 10} textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#4c1d95" fontFamily="Inter, system-ui, sans-serif">INV</text>
      <text x={invX + invW / 2} y={invY + 20} textAnchor="middle" fontSize="7" fill="#5b21b6" fontFamily="Inter, system-ui, sans-serif">erter</text>

      {/* AC cable line */}
      <line
        x1={invX + invW}
        y1={lineY}
        x2={meterX}
        y2={lineY}
        stroke="#059669"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <polygon
        points={`${meterX - 7},${lineY - 4} ${meterX},${lineY} ${meterX - 7},${lineY + 4}`}
        fill="#059669"
      />

      {/* AC run label */}
      <text x={acMidX} y={lineY - 6} textAnchor="middle" fontSize="8" fontWeight="700" fill="#059669" fontFamily="Inter, system-ui, sans-serif">
        AC · {acRunM} m
      </text>

      {/* Meter/Home box */}
      <rect x={meterX} y={meterY} width={meterW} height={meterH} rx="5" fill="#d1fae5" stroke="#059669" strokeWidth="1.5" />
      <text x={meterX + meterW / 2} y={meterY + 10} textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#064e3b" fontFamily="Inter, system-ui, sans-serif">Home</text>
      <text x={meterX + meterW / 2} y={meterY + 20} textAnchor="middle" fontSize="7" fill="#065f46" fontFamily="Inter, system-ui, sans-serif">&amp; Grid</text>

      {/* Ideal range note */}
      <text x={W / 2} y={H - 8} textAnchor="middle" fontSize="7.5" fill="#94a3b8" fontFamily="Inter, system-ui, sans-serif">
        Ideal DC run: 5–15 m · Max: 30 m
      </text>
    </svg>
  );
}
