"use client";

import type { ExecutivePremiumNextgenModel } from "@/lib/executive-premium-nextgen/types";
import { PP_MUTED } from "@/lib/proposal-premium-design";
import { NextgenPageShell } from "@/components/proposals/executive-premium-nextgen/primitives/nextgen-page-shell";
import { fmtInr } from "@/components/proposals/executive-premium-nextgen/primitives/nextgen-format";

type Props = {
  assetData: Pick<ExecutivePremiumNextgenModel, "property" | "financials" | "document" | "config">;
  overlayOpacity?: number;
};

export function AssetDeclarationCover({ assetData, overlayOpacity = 0.55 }: Props) {
  const { property, financials, document, config } = assetData;
  const [w1, w2, w3] = config.outcome_words;

  return (
    <NextgenPageShell className="overflow-hidden">
      {property.photograph_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={property.photograph_url}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-neutral-800" aria-hidden />
      )}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: `rgba(10, 10, 10, ${overlayOpacity})` }}
        aria-hidden
      />

      <div className="relative z-10 flex min-h-[100dvh] flex-col px-8 py-10 sm:px-14 sm:py-12">
        <header className="max-w-md text-left">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.72)" }}>
            {property.address_line1}
          </p>
          <p className="mt-1 text-sm font-medium" style={{ color: "rgba(255,255,255,0.88)" }}>
            {[property.address_line2, property.city].filter(Boolean).join(", ")}
          </p>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p
            className="text-[clamp(2.75rem,9vw,5.5rem)] font-light leading-none tracking-tight tabular-nums text-white"
          >
            {fmtInr(financials.lifetime_energy_value_inr)}
          </p>
          <p className="mt-3 text-xs font-medium uppercase tracking-[0.35em]" style={{ color: "rgba(255,255,255,0.55)" }}>
            Lifetime energy value
          </p>
          <div className="mt-12 flex w-full max-w-3xl justify-between gap-6 px-2 text-sm font-medium uppercase tracking-[0.28em] sm:text-base">
            <span style={{ color: "rgba(255,255,255,0.9)" }}>{w1}</span>
            <span style={{ color: "rgba(255,255,255,0.9)" }}>{w2}</span>
            <span style={{ color: "rgba(255,255,255,0.9)" }}>{w3}</span>
          </div>
        </div>

        <footer className="self-end text-right">
          <p className="text-[11px] font-medium tracking-wide" style={{ color: PP_MUTED }}>
            <span className="text-white/80">{document.reference_id}</span>
          </p>
          <p className="mt-1 text-[11px]" style={{ color: "rgba(255,255,255,0.55)" }}>
            {document.created_date}
          </p>
        </footer>
      </div>
    </NextgenPageShell>
  );
}
