"use client";

import type { NextgenRequirementContext } from "@/lib/executive-premium-nextgen/types";
import { EP_COPY } from "@/lib/executive-premium-nextgen/ep-copy";
import { EpPageFrame } from "@/components/proposals/executive-premium-nextgen/primitives/ep-page-frame";
import { EpPageHeader } from "@/components/proposals/executive-premium-nextgen/primitives/ep-page-header";

type Props = {
  contextData: NextgenRequirementContext;
};

export function SystemContextRequirementAnalysis({ contextData }: Props) {
  const [i1, i2] = contextData.insight_lines;

  const facts = [
    {
      label: "Monthly use (stated)",
      value: contextData.declared_monthly_units.toLocaleString("en-IN"),
      unit: "units",
    },
    {
      label: "Annual use (stated)",
      value: contextData.annual_requirement_units.toLocaleString("en-IN"),
      unit: "units / year",
    },
    {
      label: "Expected production",
      value: contextData.modelled_annual_production.toLocaleString("en-IN"),
      unit: "units / year",
    },
  ];

  return (
    <EpPageFrame variant="containedCentre">
      <EpPageHeader title={EP_COPY.requirement.pageTitle} centered />
      <div
        className="flex w-full flex-col items-center"
        style={{ gap: "var(--ep-space-6)" }}
      >
        <div className="text-center">
          <p className="ep-label" style={{ color: "var(--ep-muted)" }}>
            {EP_COPY.requirement.heroLabel}
          </p>
          <p className="ep-h1 tabular-nums" style={{ marginTop: "var(--ep-space-3)" }}>
            {contextData.coverage_pct}%
          </p>
          <p className="ep-body" style={{ color: "var(--ep-muted)", marginTop: "var(--ep-space-3)", maxWidth: "28rem" }}>
            {EP_COPY.requirement.heroSub}
          </p>
          <p className="ep-caption" style={{ color: "var(--ep-muted)", marginTop: "var(--ep-space-2)" }}>
            {contextData.discom_name}
          </p>
        </div>

        <div
          className="grid w-full max-w-lg grid-cols-1 gap-4 sm:grid-cols-3"
        >
          {facts.map((f) => (
            <div key={f.label} className="text-center sm:text-left">
              <p className="ep-label" style={{ color: "var(--ep-muted)" }}>
                {f.label}
              </p>
              <p className="ep-title tabular-nums" style={{ marginTop: "var(--ep-space-2)" }}>
                {f.value}
              </p>
              <p className="ep-caption" style={{ color: "var(--ep-muted)" }}>
                {f.unit}
              </p>
            </div>
          ))}
        </div>

        <div className="w-full max-w-lg text-center">
          <p className="ep-body">{i1}</p>
          <p className="ep-body" style={{ marginTop: "var(--ep-space-3)" }}>
            {i2}
          </p>
        </div>
      </div>
    </EpPageFrame>
  );
}
