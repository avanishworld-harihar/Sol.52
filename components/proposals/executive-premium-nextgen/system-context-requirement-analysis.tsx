"use client";

import type { NextgenRequirementContext } from "@/lib/executive-premium-nextgen/types";
import { PP_INK, PP_MUTED, PP_BORDER } from "@/lib/proposal-premium-design";
import { NextgenPageShell } from "@/components/proposals/executive-premium-nextgen/primitives/nextgen-page-shell";
import { NextgenHorizontalRule } from "@/components/proposals/executive-premium-nextgen/primitives/nextgen-rules";

type Props = {
  contextData: NextgenRequirementContext;
};

/** Requirement-path page 2 — sizing context without bill audit UI. */
export function SystemContextRequirementAnalysis({ contextData }: Props) {
  const [i1, i2, i3] = contextData.insight_lines;

  const metrics = [
    {
      label: "Declared monthly draw",
      value: contextData.declared_monthly_units.toLocaleString("en-IN"),
      unit: "units",
    },
    {
      label: "Annual requirement",
      value: contextData.annual_requirement_units.toLocaleString("en-IN"),
      unit: "units / year",
    },
    {
      label: "Proposed scale",
      value: contextData.proposed_capacity_kw.toFixed(1),
      unit: "kW",
    },
    {
      label: "Modelled production",
      value: contextData.modelled_annual_production.toLocaleString("en-IN"),
      unit: "units / year",
    },
  ];

  return (
    <NextgenPageShell className="px-6 py-12 sm:px-14 sm:py-16">
      <div className="mx-auto flex h-full max-w-5xl flex-col">
        <header>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: PP_MUTED }}>
            System context
          </p>
          <p className="mt-3 text-sm" style={{ color: PP_MUTED }}>
            Requirement analysis · {contextData.discom_name}
          </p>
        </header>

        <div className="mt-16 flex flex-col items-center text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: PP_MUTED }}>
            Requirement coverage
          </p>
          <p className="mt-4 text-[clamp(3rem,12vw,6rem)] font-extralight tabular-nums leading-none" style={{ color: PP_INK }}>
            {contextData.coverage_pct}%
          </p>
          <p className="mt-4 max-w-md text-sm leading-relaxed" style={{ color: PP_MUTED }}>
            Modelled on-site production against your stated annual requirement.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-4">
          {metrics.map((m) => (
            <div key={m.label}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: PP_MUTED }}>
                {m.label}
              </p>
              <p className="mt-2 text-2xl font-light tabular-nums" style={{ color: PP_INK }}>
                {m.value}
              </p>
              <p className="mt-1 text-xs" style={{ color: PP_MUTED }}>
                {m.unit}
              </p>
            </div>
          ))}
        </div>

        <NextgenHorizontalRule className="my-12" />

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: PP_MUTED }}>
              Connection
            </p>
            <p className="mt-2 text-lg font-light" style={{ color: PP_INK }}>
              {contextData.connection_category}
            </p>
          </div>
          <ul className="space-y-3 border-l pl-8 text-sm leading-relaxed" style={{ borderColor: PP_BORDER, color: PP_INK }}>
            <li>{i1}</li>
            <li>{i2}</li>
            <li>{i3}</li>
          </ul>
        </div>
      </div>
    </NextgenPageShell>
  );
}
