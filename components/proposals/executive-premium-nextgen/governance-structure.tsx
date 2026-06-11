"use client";

import type { NextgenGovernance } from "@/lib/executive-premium-nextgen/types";
import { EP_COPY } from "@/lib/executive-premium-nextgen/ep-copy";
import { EpPageFrame } from "@/components/proposals/executive-premium-nextgen/primitives/ep-page-frame";
import { EpPageHeader } from "@/components/proposals/executive-premium-nextgen/primitives/ep-page-header";

type Props = {
  governanceData: NextgenGovernance;
};

export function GovernanceStructure({ governanceData }: Props) {
  const { zones, contact, closing_statement } = governanceData;

  return (
    <EpPageFrame variant="contained">
      <EpPageHeader title={EP_COPY.governance.pageTitle} />
      <div className="flex w-full flex-col" style={{ gap: "var(--ep-space-8)" }}>
        <div className="ep-governance-zones w-full">
          {zones.map((zone, idx) => (
            <div key={zone.zone_name} className="ep-governance-zone-wrap">
              {idx > 0 ? <div className="ep-governance-vrule" aria-hidden /> : null}
              <div className="ep-governance-zone">
                <h3 className="ep-title">{zone.zone_name}</h3>
                <p className="ep-body" style={{ marginTop: "var(--ep-space-4)" }}>
                  {zone.coverage_line1}
                </p>
                <p className="ep-body" style={{ color: "var(--ep-muted)", marginTop: "var(--ep-space-2)" }}>
                  {zone.coverage_line2}
                </p>
                <p
                  className="ep-caption"
                  style={{
                    color: "var(--ep-muted)",
                    marginTop: "var(--ep-space-6)",
                  }}
                >
                  {zone.response_timeline}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="w-full text-center" style={{ paddingTop: "var(--ep-space-4)" }}>
          <p className="ep-title">{contact.first_name}</p>
          <p className="ep-body" style={{ color: "var(--ep-muted)", marginTop: "var(--ep-space-1)" }}>
            {contact.title}
          </p>
          <p className="ep-body tabular-nums" style={{ marginTop: "var(--ep-space-1)" }}>
            {contact.contact_method}
          </p>
        </div>

        <p
          className="ep-caption text-center"
          style={{ color: "var(--ep-muted)", maxWidth: "36rem", marginInline: "auto" }}
        >
          {closing_statement}
        </p>
      </div>
    </EpPageFrame>
  );
}
