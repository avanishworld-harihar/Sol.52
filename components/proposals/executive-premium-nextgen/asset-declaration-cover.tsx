"use client";

import type { ExecutivePremiumNextgenModel } from "@/lib/executive-premium-nextgen/types";
import { EpCurrency } from "@/components/proposals/executive-premium-nextgen/primitives/ep-currency";
import { EpPageFrame } from "@/components/proposals/executive-premium-nextgen/primitives/ep-page-frame";

type Props = {
  assetData: Pick<ExecutivePremiumNextgenModel, "property" | "financials" | "document" | "config">;
  overlayOpacity?: number;
};

export function AssetDeclarationCover({ assetData, overlayOpacity = 0.52 }: Props) {
  const { property, financials, document, config } = assetData;
  const [w1, w2, w3] = config.outcome_words;

  return (
    <EpPageFrame variant="fullBleed" className="overflow-hidden">
      {property.photograph_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={property.photograph_url}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-neutral-900" aria-hidden />
      )}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: `rgba(8, 8, 8, ${overlayOpacity})` }}
        aria-hidden
      />

      <div
        className="relative z-10 flex min-h-[100dvh] flex-col text-white"
        style={{
          paddingLeft: "var(--ep-margin-desktop)",
          paddingRight: "var(--ep-margin-desktop)",
          paddingTop: "var(--ep-space-10)",
          paddingBottom: "var(--ep-space-10)",
        }}
      >
        <header className="max-w-md shrink-0 text-left">
          <p className="ep-label" style={{ color: "rgba(255,255,255,0.72)" }}>
            {property.address_line1}
          </p>
          <p className="ep-body mt-2" style={{ color: "rgba(255,255,255,0.88)" }}>
            {[property.address_line2, property.city].filter(Boolean).join(", ")}
          </p>
        </header>

        <div
          className="flex flex-1 flex-col items-center justify-center text-center"
          style={{ padding: "var(--ep-space-12) 0" }}
        >
          <EpCurrency value={financials.lifetime_energy_value_inr} tier="display" centered inverted />
          <p
            className="ep-label mt-4"
            style={{ color: "rgba(255,255,255,0.55)", marginTop: "var(--ep-space-4)" }}
          >
            Lifetime energy value
          </p>
        </div>

        <div
          className="flex w-full max-w-3xl shrink-0 justify-between self-center"
          style={{ marginTop: "var(--ep-space-12)", gap: "var(--ep-space-4)" }}
        >
          <span className="ep-title font-normal tracking-wide" style={{ color: "rgba(255,255,255,0.92)" }}>
            {w1}
          </span>
          <span className="ep-title font-normal tracking-wide" style={{ color: "rgba(255,255,255,0.92)" }}>
            {w2}
          </span>
          <span className="ep-title font-normal tracking-wide" style={{ color: "rgba(255,255,255,0.92)" }}>
            {w3}
          </span>
        </div>

        <footer className="mt-auto shrink-0 self-end text-right" style={{ paddingTop: "var(--ep-space-12)" }}>
          <p className="ep-caption" style={{ color: "rgba(255,255,255,0.72)" }}>
            {document.reference_id}
          </p>
          <p className="ep-caption mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
            {document.created_date}
          </p>
        </footer>
      </div>
    </EpPageFrame>
  );
}
