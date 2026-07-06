/**
 * TiltIllustrationSvg — Panel tilt angle diagram for Aurora preset.
 *
 * Shows a simple side-view of a roof with a solar panel at the given tilt angle,
 * a sun arc, and a tilt angle label.
 *
 * Pure SVG — no external images. Print-safe.
 */

type Props = {
  tiltDeg: number;
};

const W = 160;
const H = 130;

export function TiltIllustrationSvg({ tiltDeg }: Props) {
  const clampedTilt = Math.max(5, Math.min(tiltDeg, 45));
  const tiltRad = (clampedTilt * Math.PI) / 180;

  // Roof base: horizontal bar
  const roofY = 90;
  const baseX1 = 20;
  const baseX2 = 140;

  // Panel starts at left edge of roof, tilts upward to the right
  const panelLen = 80;
  const panelX1 = 30;
  const panelY1 = roofY;
  const panelX2 = panelX1 + panelLen * Math.cos(tiltRad);
  const panelY2 = panelY1 - panelLen * Math.sin(tiltRad);

  // Sun position (arc, top-right)
  const sunCx = 130;
  const sunCy = 22;
  const sunR = 12;

  // Arc for tilt angle label
  const arcR = 30;
  const arcStartX = panelX1 + arcR;
  const arcStartY = panelY1;
  const arcEndX = panelX1 + arcR * Math.cos(tiltRad);
  const arcEndY = panelY1 - arcR * Math.sin(tiltRad);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      aria-label={`Solar panel tilt angle: ${tiltDeg}°`}
      role="img"
    >
      {/* Sky background */}
      <rect x="0" y="0" width={W} height={H} rx="12" fill="#f0f9ff" />

      {/* Sun */}
      <circle cx={sunCx} cy={sunCy} r={sunR} fill="#fbbf24" opacity="0.9" />
      {/* Sun rays */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <line
            key={deg}
            x1={sunCx + (sunR + 2) * Math.cos(rad)}
            y1={sunCy + (sunR + 2) * Math.sin(rad)}
            x2={sunCx + (sunR + 6) * Math.cos(rad)}
            y2={sunCy + (sunR + 6) * Math.sin(rad)}
            stroke="#fbbf24"
            strokeWidth="1.5"
          />
        );
      })}

      {/* Sunlight arrow to panel */}
      <line
        x1={sunCx - 15}
        y1={sunCy + 10}
        x2={panelX2 - 5}
        y2={panelY2 + 5}
        stroke="#fbbf24"
        strokeWidth="1.5"
        strokeDasharray="4 3"
        markerEnd="url(#arrowAmber)"
      />
      <defs>
        <marker id="arrowAmber" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#f59e0b" />
        </marker>
      </defs>

      {/* Roof base */}
      <line x1={baseX1} y1={roofY} x2={baseX2} y2={roofY} stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />

      {/* Ground fill */}
      <rect x={baseX1} y={roofY} width={baseX2 - baseX1} height={12} rx="2" fill="#e2e8f0" />

      {/* Solar panel */}
      <line
        x1={panelX1}
        y1={panelY1}
        x2={panelX2}
        y2={panelY2}
        stroke="#3730a3"
        strokeWidth="6"
        strokeLinecap="round"
      />
      {/* Panel highlight */}
      <line
        x1={panelX1 + 6}
        y1={panelY1 - 3}
        x2={panelX2 - 6}
        y2={panelY2 + 3}
        stroke="#818cf8"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />

      {/* Tilt arc */}
      <path
        d={`M ${arcStartX} ${arcStartY} A ${arcR} ${arcR} 0 0 0 ${arcEndX} ${arcEndY}`}
        fill="none"
        stroke="#f59e0b"
        strokeWidth="1.5"
        strokeDasharray="3 2"
      />

      {/* Tilt degree label */}
      <text
        x={panelX1 + arcR + 10}
        y={panelY1 - 8}
        fontSize="13"
        fontWeight="800"
        fill="#d97706"
        fontFamily="Inter, system-ui, sans-serif"
      >
        {tiltDeg}°
      </text>
    </svg>
  );
}
