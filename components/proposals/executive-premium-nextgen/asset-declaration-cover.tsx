"use client";

import type { ExecutivePremiumNextgenModel } from "@/lib/executive-premium-nextgen/types";
import { EP_COPY } from "@/lib/executive-premium-nextgen/ep-copy";
import { EpPageFrame } from "@/components/proposals/executive-premium-nextgen/primitives/ep-page-frame";

type Props = {
  assetData: Pick<ExecutivePremiumNextgenModel, "property" | "document" | "config">;
  customerName?: string;
  overlayOpacity?: number;
};

export function AssetDeclarationCover({ assetData, customerName, overlayOpacity = 0.52 }: Props) {
  const { property, document, config } = assetData;
  const [w1, w2, w3] = config.outcome_words;
  const preparedFor = customerName?.trim();

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
        <header className="max-w-lg shrink-0 text-left">
          <p className="ep-label" style={{ color: "rgba(255,255,255,0.6)" }}>
            {EP_COPY.cover.kicker}
          </p>
          <p className="ep-title mt-3" style={{ color: "rgba(255,255,255,0.95)", fontWeight: 500 }}>
            {EP_COPY.cover.title}
          </p>
          {preparedFor ? (
            <p className="ep-body mt-2" style={{ color: "rgba(255,255,255,0.88)" }}>
              Prepared for {preparedFor}
            </p>
          ) : null}
          <p className="ep-caption mt-3" style={{ color: "rgba(255,255,255,0.72)" }}>
            {property.address_line1}
            {property.city ? ` · ${property.city}` : ""}
          </p>
        </header>

        <div
          className="flex flex-1 flex-col items-center justify-center text-center"
          style={{ padding: "var(--ep-space-10) 0" }}
        >
          <p className="ep-body max-w-md" style={{ color: "rgba(255,255,255,0.82)" }}>
            {EP_COPY.cover.subtitle}
          </p>
        </div>

        <div
          className="flex w-full max-w-3xl shrink-0 justify-between self-center"
          style={{ gap: "var(--ep-space-4)" }}
        >
          <span className="ep-body" style={{ color: "rgba(255,255,255,0.88)" }}>
            {w1}
          </span>
          <span className="ep-body" style={{ color: "rgba(255,255,255,0.88)" }}>
            {w2}
          </span>
          <span className="ep-body" style={{ color: "rgba(255,255,255,0.88)" }}>
            {w3}
          </span>
        </div>

        <footer className="mt-auto shrink-0 self-end text-right" style={{ paddingTop: "var(--ep-space-10)" }}>
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
