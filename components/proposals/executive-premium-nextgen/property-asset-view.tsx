"use client";

import type { NextgenAsset } from "@/lib/executive-premium-nextgen/types";
import { PP_INK, PP_MUTED } from "@/lib/proposal-premium-design";
import { NextgenPageShell } from "@/components/proposals/executive-premium-nextgen/primitives/nextgen-page-shell";
import { NextgenHorizontalRule } from "@/components/proposals/executive-premium-nextgen/primitives/nextgen-rules";

type Props = {
  assetData: NextgenAsset;
};

export function PropertyAssetView({ assetData }: Props) {
  return (
    <NextgenPageShell className="px-6 py-10 sm:px-12 sm:py-14">
      <div className="mx-auto flex h-full max-w-5xl flex-col">
        <div className="flex min-h-[50vh] flex-1 items-center justify-center py-6">
          {assetData.rooftop_layout_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={assetData.rooftop_layout_image_url}
              alt=""
              className="max-h-[58vh] w-full max-w-3xl object-contain"
            />
          ) : (
            <div
              className="flex h-[48vh] w-full max-w-3xl items-center justify-center border border-dashed"
              style={{ borderColor: PP_MUTED, color: PP_MUTED }}
            >
              <span className="text-xs uppercase tracking-[0.2em]">Site layout — pending survey</span>
            </div>
          )}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-10 sm:grid-cols-3">
          {assetData.characteristics.map((c) => (
            <div key={c.label} className="text-center sm:text-left">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: PP_MUTED }}>
                {c.label}
              </p>
              <p className="mt-2 text-3xl font-light tabular-nums" style={{ color: PP_INK }}>
                {c.value}
              </p>
              <p className="mt-1 text-xs" style={{ color: PP_MUTED }}>
                {c.unit}
              </p>
            </div>
          ))}
        </div>

        {assetData.storage_kwh != null && assetData.storage_kwh > 0 ? (
          <p className="mt-6 text-sm" style={{ color: PP_MUTED }}>
            Storage capacity: {assetData.storage_kwh} kWh
          </p>
        ) : null}

        <NextgenHorizontalRule className="my-10" />

        <div className="space-y-3">
          <p className="text-sm" style={{ color: PP_INK }}>
            Designed for a {assetData.lifespan_years}-year operating horizon.
          </p>
          <p className="max-w-2xl text-sm leading-relaxed" style={{ color: PP_MUTED }}>
            {assetData.performance_assurance_text}
          </p>
        </div>
      </div>
    </NextgenPageShell>
  );
}
