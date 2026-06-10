"use client";

import type { NextgenGovernance } from "@/lib/executive-premium-nextgen/types";
import { PP_INK, PP_MUTED } from "@/lib/proposal-premium-design";
import { NextgenPageShell } from "@/components/proposals/executive-premium-nextgen/primitives/nextgen-page-shell";
import { NextgenVerticalRule } from "@/components/proposals/executive-premium-nextgen/primitives/nextgen-rules";

type Props = {
  governanceData: NextgenGovernance;
};

export function GovernanceStructure({ governanceData }: Props) {
  const { zones, contact, closing_statement } = governanceData;

  return (
    <NextgenPageShell className="px-6 py-14 sm:px-12 sm:py-16">
      <div className="mx-auto flex h-full max-w-6xl flex-col justify-center">
        <div className="flex flex-col gap-10 sm:flex-row sm:gap-0">
          {zones.map((zone, idx) => (
            <div key={zone.zone_name} className="flex flex-1">
              {idx > 0 ? <NextgenVerticalRule className="mx-6 hidden sm:block" /> : null}
              <div className="flex flex-1 flex-col px-2 sm:px-6">
                <h2
                  className="text-[11px] font-semibold uppercase tracking-[0.24em]"
                  style={{ color: PP_INK }}
                >
                  {zone.zone_name}
                </h2>
                <p className="mt-6 text-sm leading-relaxed" style={{ color: PP_INK }}>
                  {zone.coverage_line1}
                </p>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: PP_MUTED }}>
                  {zone.coverage_line2}
                </p>
                <p className="mt-auto pt-10 text-[11px] uppercase tracking-[0.16em]" style={{ color: PP_MUTED }}>
                  {zone.response_timeline}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-lg font-medium" style={{ color: PP_INK }}>
            {contact.first_name}
          </p>
          <p className="mt-1 text-sm" style={{ color: PP_MUTED }}>
            {contact.title}
          </p>
          <p className="mt-2 text-sm tabular-nums" style={{ color: PP_INK }}>
            {contact.contact_method}
          </p>
        </div>

        <p className="mt-14 text-center text-xs leading-relaxed" style={{ color: PP_MUTED }}>
          {closing_statement}
        </p>
      </div>
    </NextgenPageShell>
  );
}
