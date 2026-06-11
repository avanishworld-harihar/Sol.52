"use client";

/** Minimal roof-line schematic — used when no site survey photo exists yet. */
export function EpRooftopSchematic() {
  return (
    <svg
      viewBox="0 0 480 260"
      className="ep-rooftop-schematic"
      role="img"
      aria-label="Rooftop solar layout schematic"
    >
      <defs>
        <linearGradient id="ep-roof-fill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(20,20,20,0.04)" />
          <stop offset="100%" stopColor="rgba(20,20,20,0.1)" />
        </linearGradient>
      </defs>
      <polygon
        points="40,200 240,40 440,200"
        fill="url(#ep-roof-fill)"
        stroke="rgba(20,20,20,0.22)"
        strokeWidth="1.5"
      />
      <line x1="40" y1="200" x2="440" y2="200" stroke="rgba(20,20,20,0.18)" strokeWidth="1" />
      {[
        [120, 130, 80, 50],
        [220, 100, 80, 50],
        [320, 130, 80, 50],
      ].map(([x, y, w, h], i) => (
        <g key={i}>
          <rect
            x={x}
            y={y}
            width={w}
            height={h}
            fill="rgba(20,20,20,0.06)"
            stroke="rgba(20,20,20,0.28)"
            strokeWidth="1"
            transform={`rotate(-22 ${x + w / 2} ${y + h / 2})`}
          />
          <line
            x1={x + 20}
            y1={y + 10}
            x2={x + w - 10}
            y2={y + h - 15}
            stroke="rgba(20,20,20,0.12)"
            strokeWidth="0.75"
            transform={`rotate(-22 ${x + w / 2} ${y + h / 2})`}
          />
        </g>
      ))}
    </svg>
  );
}
