"use client";

import type { NextgenAsset } from "@/lib/executive-premium-nextgen/types";
import { EP_COPY } from "@/lib/executive-premium-nextgen/ep-copy";
import { EP_FALLBACK_PROPERTY_IMAGE } from "@/lib/executive-premium-nextgen/resolve-ep-images";
import { EpPageFrame } from "@/components/proposals/executive-premium-nextgen/primitives/ep-page-frame";
import { EpPageHeader } from "@/components/proposals/executive-premium-nextgen/primitives/ep-page-header";

type Props = {
  assetData: NextgenAsset;
};

export function PropertyAssetView({ assetData }: Props) {
  const imageUrl = assetData.rooftop_layout_image_url || EP_FALLBACK_PROPERTY_IMAGE;

  return (
    <EpPageFrame variant="contained" contentAlign="start">
      <EpPageHeader title={EP_COPY.asset.pageTitle} />
      <div className="flex w-full flex-col" style={{ gap: "var(--ep-space-6)" }}>
        <div className="ep-asset-diagram w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="" className="ep-asset-diagram-img" />
        </div>

        <div
          className="grid w-full grid-cols-1 sm:grid-cols-3"
          style={{ gap: "var(--ep-space-4)" }}
        >
          {assetData.characteristics.map((c) => (
            <div key={c.label} className="text-left">
              <p className="ep-label" style={{ color: "var(--ep-muted)" }}>
                {c.label}
              </p>
              <p className="ep-h2 tabular-nums" style={{ marginTop: "var(--ep-space-2)" }}>
                {c.value}
              </p>
              <p className="ep-caption" style={{ color: "var(--ep-muted)", marginTop: "var(--ep-space-1)" }}>
                {c.unit}
              </p>
            </div>
          ))}
        </div>

        <hr style={{ border: 0, borderTop: "1px solid var(--ep-border)", margin: 0 }} />

        <div className="text-left">
          <p className="ep-body">{EP_COPY.asset.horizonLine(assetData.lifespan_years)}</p>
          <p className="ep-body" style={{ color: "var(--ep-muted)", marginTop: "var(--ep-space-2)", maxWidth: "40rem" }}>
            {assetData.performance_assurance_text}
          </p>
        </div>
      </div>
    </EpPageFrame>
  );
}
