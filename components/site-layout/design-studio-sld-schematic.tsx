"use client";

/**
 * Design Studio–only one-line SLD schematic.
 * Not used in customer proposal renderers (Design/SLD stay separate).
 */

type DesignStudioSldSchematicProps = {
  stringCount: number;
  modulesPerString: number;
  panelCount: number;
  inverterKw: number;
  className?: string;
};

const NODES = [
  { id: "pv", label: "PV" },
  { id: "dcdb", label: "DCDB" },
  { id: "inv", label: "Inverter" },
  { id: "acdb", label: "ACDB" },
  { id: "meter", label: "Meter" },
  { id: "grid", label: "Grid" },
] as const;

export function DesignStudioSldSchematic({
  stringCount,
  modulesPerString,
  panelCount,
  inverterKw,
  className,
}: DesignStudioSldSchematicProps) {
  const w = 320;
  const h = 72;
  const pad = 18;
  const boxW = 44;
  const boxH = 28;
  const step = (w - pad * 2 - boxW) / (NODES.length - 1);

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-auto w-full"
        role="img"
        aria-label="Single-line diagram schematic: PV to DCDB to Inverter to ACDB to Meter to Grid"
      >
        {NODES.map((node, index) => {
          if (index === 0) return null;
          const x1 = pad + (index - 1) * step + boxW;
          const x2 = pad + index * step;
          const y = h / 2;
          return (
            <line
              key={`wire-${node.id}`}
              x1={x1}
              y1={y}
              x2={x2}
              y2={y}
              stroke="currentColor"
              strokeWidth={1.5}
              className="text-slate-400 dark:text-slate-500"
            />
          );
        })}
        {NODES.map((node, index) => {
          const x = pad + index * step;
          const y = (h - boxH) / 2;
          return (
            <g key={node.id}>
              <rect
                x={x}
                y={y}
                width={boxW}
                height={boxH}
                rx={6}
                className="fill-slate-100 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600"
                strokeWidth={1.25}
              />
              <text
                x={x + boxW / 2}
                y={y + boxH / 2 + 3.5}
                textAnchor="middle"
                className="fill-slate-800 text-[9px] font-bold dark:fill-slate-100"
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="mt-1.5 text-[10px] leading-snug text-slate-500">
        {stringCount} string{stringCount === 1 ? "" : "s"} × {modulesPerString} mod
        {modulesPerString === 1 ? "" : "s"}
        {" · "}
        {panelCount} panels · ~{inverterKw} kW inv
        {" · "}
        Studio schematic only (not a signed SLD).
      </p>
    </div>
  );
}
