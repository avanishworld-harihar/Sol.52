"use client";

import { cn } from "@/lib/utils";

export type EpCurrencyTier = "display" | "h1" | "h2";

type Props = {
  value: number;
  tier?: EpCurrencyTier;
  className?: string;
  /** Centre the currency block (thesis numbers). */
  centered?: boolean;
  /** Light text for dark backgrounds (cover page). */
  inverted?: boolean;
};

function roundDisplayInr(value: number): number {
  return Math.round(Math.max(0, value) / 100) * 100;
}

function formatInrParts(value: number): { whole: string } {
  const n = roundDisplayInr(value);
  return { whole: n.toLocaleString("en-IN") };
}

const TIER_CLASS: Record<EpCurrencyTier, string> = {
  display: "ep-display",
  h1: "ep-h1",
  h2: "ep-h2",
};

/**
 * ₹ at Caption size, top-aligned — number at Display/H1/H2 per Design Bible.
 */
export function EpCurrency({ value, tier = "display", className, centered = false, inverted = false }: Props) {
  const { whole } = formatInrParts(value);
  const ink = inverted ? "rgba(255,255,255,0.95)" : "var(--ep-ink)";
  const sym = inverted ? "rgba(255,255,255,0.65)" : "var(--ep-muted)";

  return (
    <div
      className={cn(
        "inline-flex items-start tabular-nums",
        centered && "justify-center",
        className
      )}
      style={{ padding: "var(--ep-space-6) 0", color: ink }}
    >
      <span
        className="ep-caption shrink-0 self-start leading-none"
        style={{ marginTop: "0.35em", marginRight: "0.35em", color: sym }}
        aria-hidden
      >
        ₹
      </span>
      <span className={cn(TIER_CLASS[tier], "tracking-tight")} style={{ color: ink }}>
        {whole}
      </span>
    </div>
  );
}
