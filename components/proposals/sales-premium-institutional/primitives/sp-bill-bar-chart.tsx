"use client";

import type { InstitutionalAuditMonth } from "@/lib/sales-premium-institutional/types";

type Props = {
  months: InstitutionalAuditMonth[];
};

export function SpBillBarChart({ months }: Props) {
  return (
    <div className="sp-chart-wrapper">
      {months.map((m) => (
        <div key={m.label} className="sp-bar-container">
          <div
            className={`sp-bar${m.is_summer_peak ? " sp-highlight" : ""}`}
            style={{ height: `${m.bar_height_pct}%` }}
          />
          <div className="sp-month-label">{m.label}</div>
        </div>
      ))}
    </div>
  );
}
