"use client";

export function DesignStudioMetricsStrip({
  panels,
  dcKw,
  coveragePct,
  remainingSqft,
  yieldAnnualKwh,
  roofAreaSqft,
  azimuthDeg,
  warning,
}: {
  panels: number;
  dcKw: number | null;
  coveragePct: number | null;
  remainingSqft: number | null;
  yieldAnnualKwh: number | null;
  roofAreaSqft: number | null;
  azimuthDeg: number | null;
  warning?: string | null;
}) {
  const cells: Array<{ label: string; value: string }> = [
    {
      label: "Roof",
      value: roofAreaSqft != null ? `${Math.round(roofAreaSqft).toLocaleString("en-IN")} ft²` : "—",
    },
    {
      label: "Azimuth",
      value: azimuthDeg != null ? `${azimuthDeg.toFixed(0)}°` : "—",
    },
    { label: "Panels", value: String(panels) },
    { label: "DC kW", value: dcKw != null && panels > 0 ? dcKw.toFixed(2) : "—" },
    {
      label: "Cover",
      value: coveragePct != null && panels > 0 ? `${coveragePct.toFixed(0)}%` : "—",
    },
    {
      label: "Left",
      value:
        remainingSqft != null && panels > 0
          ? `${Math.round(remainingSqft).toLocaleString("en-IN")} ft²`
          : "—",
    },
    {
      label: "Yield/yr",
      value:
        yieldAnnualKwh != null
          ? `${Math.round(yieldAnnualKwh).toLocaleString("en-IN")} kWh`
          : "—",
    },
  ];

  return (
    <div className="shrink-0 border-t border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950">
      {warning ? (
        <p className="border-b border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-semibold text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          {warning}
        </p>
      ) : null}
      <div className="flex gap-0 overflow-x-auto scrollbar-none">
        {cells.map((cell) => (
          <div
            key={cell.label}
            className="min-w-[4.5rem] flex-1 border-r border-slate-100 px-2.5 py-1.5 last:border-r-0 dark:border-white/5"
          >
            <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
              {cell.label}
            </p>
            <p className="truncate text-xs font-extrabold tabular-nums text-slate-900 dark:text-white">
              {cell.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
