"use client";

import type { ExecutivePremiumNextgenModel } from "@/lib/executive-premium-nextgen/types";
import { EP_COPY } from "@/lib/executive-premium-nextgen/ep-copy";
import { EpPageFrame } from "@/components/proposals/executive-premium-nextgen/primitives/ep-page-frame";

type Props = {
  assetData: Pick<ExecutivePremiumNextgenModel, "property" | "document" | "config">;
  customerName?: string;
};

/**
 * Cover — typography-led executive declaration.
 * No stock or install photos; imagery belongs on the system page only.
 */
export function AssetDeclarationCover({ assetData, customerName }: Props) {
  const { property, document, config } = assetData;
  const [w1, w2, w3] = config.outcome_words;
  const preparedFor = customerName?.trim();
  const location = [property.address_line1, property.city].filter(Boolean).join(" · ");

  return (
    <EpPageFrame variant="fullBleed" className="ep-cover overflow-hidden">
      <div className="ep-cover-canvas absolute inset-0" aria-hidden />

      <div
        className="relative z-10 flex min-h-[100dvh] flex-col text-white"
        style={{
          paddingLeft: "var(--ep-margin-desktop)",
          paddingRight: "var(--ep-margin-desktop)",
          paddingTop: "var(--ep-space-10)",
          paddingBottom: "var(--ep-space-10)",
        }}
      >
        <header className="max-w-2xl shrink-0 text-left">
          <p className="ep-label" style={{ color: "rgba(255,255,255,0.55)" }}>
            {EP_COPY.cover.kicker}
          </p>
          {preparedFor ? (
            <h1 className="ep-display mt-6" style={{ color: "rgba(255,255,255,0.97)" }}>
              {preparedFor}
            </h1>
          ) : (
            <h1 className="ep-display mt-6" style={{ color: "rgba(255,255,255,0.97)" }}>
              {EP_COPY.cover.title}
            </h1>
          )}
          <p className="ep-body mt-5 max-w-md" style={{ color: "rgba(255,255,255,0.78)" }}>
            {EP_COPY.cover.subtitle}
          </p>
          {location ? (
            <p className="ep-caption mt-4" style={{ color: "rgba(255,255,255,0.55)" }}>
              {location}
            </p>
          ) : null}
        </header>

        <div className="ep-cover-rule my-auto w-full max-w-3xl self-center" aria-hidden />

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

        <footer className="mt-auto shrink-0 flex items-end justify-between pt-10">
          <p className="ep-caption" style={{ color: "rgba(255,255,255,0.4)" }}>
            {document.reference_id}
          </p>
          <p className="ep-caption" style={{ color: "rgba(255,255,255,0.4)" }}>
            {document.created_date}
          </p>
        </footer>
      </div>
    </EpPageFrame>
  );
}
