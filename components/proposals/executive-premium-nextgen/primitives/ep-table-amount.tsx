"use client";

import { cn } from "@/lib/utils";

function roundDisplayInr(value: number): number {
  return Math.round(Math.max(0, value) / 100) * 100;
}

const TIER_CLASS = {
  caption: "ep-caption",
  body: "ep-body",
  title: "ep-title",
  h2: "ep-h2",
} as const;

type Tier = keyof typeof TIER_CLASS;

type Props = {
  value: number;
  tier?: Tier;
  className?: string;
  medium?: boolean;
};

/** Right-aligned ledger / table figures — tabular lining numerals. */
export function EpTableAmount({ value, tier = "body", className, medium = false }: Props) {
  const n = roundDisplayInr(value);
  return (
    <span className={cn(TIER_CLASS[tier], "tabular-nums", medium && "font-medium", className)}>
      ₹{n.toLocaleString("en-IN")}
    </span>
  );
}
