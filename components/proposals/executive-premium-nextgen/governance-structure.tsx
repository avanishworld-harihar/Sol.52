"use client";

import type { NextgenGovernance } from "@/lib/executive-premium-nextgen/types";
import { EpPageFrame } from "@/components/proposals/executive-premium-nextgen/primitives/ep-page-frame";

type Props = {
  governanceData: NextgenGovernance;
};

export function GovernanceStructure({ governanceData }: Props) {
  const { zones, contact, closing_statement } = governanceData;

  return (
    <EpPageFrame
      variant="contained"
      primary={
        <div className="ep-governance-zones w-full">
          {zones.map((zone, idx) => (
            <div key={zone.zone_name} className="ep-governance-zone-wrap">
              {idx > 0 ? <div className="ep-governance-vrule" aria-hidden /> : null}
              <div className="ep-governance-zone">
                <h2 className="ep-title">{zone.zone_name}</h2>
                <p className="ep-body" style={{ marginTop: "var(--ep-space-6)" }}>
                  {zone.coverage_line1}
                </p>
                <p
                  className="ep-body"
                  style={{ color: "var(--ep-muted)", marginTop: "var(--ep-space-3)" }}
                >
                  {zone.coverage_line2}
                </p>
                <p
                  className="ep-title font-normal"
                  style={{
                    color: "var(--ep-muted)",
                    marginTop: "auto",
                    paddingTop: "var(--ep-space-10)",
                  }}
                >
                  {zone.response_timeline}
                </p>
              </div>
            </div>
          ))}
        </div>
      }
      supporting={
        <div className="w-full text-center">
          <p className="ep-title">{contact.first_name}</p>
          <p className="ep-body" style={{ color: "var(--ep-muted)", marginTop: "var(--ep-space-2)" }}>
            {contact.title}
          </p>
          <p className="ep-body tabular-nums" style={{ marginTop: "var(--ep-space-2)" }}>
            {contact.contact_method}
          </p>
        </div>
      }
      grounding={
        <p
          className="ep-caption text-center"
          style={{ color: "var(--ep-muted)", maxWidth: "36rem", marginInline: "auto" }}
        >
          {closing_statement}
        </p>
      }
    />
  );
}
