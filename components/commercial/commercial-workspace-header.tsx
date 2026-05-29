"use client";

import { Button } from "@/components/ui/button";
import type { ProposalDeckSummary } from "@/lib/proposal-ppt";
import { cn } from "@/lib/utils";
import { ExternalLink, LayoutGrid } from "lucide-react";
import Link from "next/link";

const inr = (v: number) => `₹${Math.round(v).toLocaleString("en-IN")}`;

type Props = {
  summary: ProposalDeckSummary;
  netCostInr: number;
  onOpenReview?: () => void;
  className?: string;
};

export function CommercialWorkspaceHeader({ summary, netCostInr, onOpenReview, className }: Props) {
  const metrics = [
    { label: "Plant", value: `${summary.systemKw} kW` },
    { label: "Net payable", value: inr(netCostInr) },
    { label: "Est. saving / yr", value: inr(summary.annualSaving) },
  ];

  return (
    <header
      className={cn(
        "overflow-hidden rounded-2xl border border-indigo-200/70 bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 p-4 text-white shadow-lg dark:border-indigo-500/30 sm:p-5",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold tracking-tight">Commercial proposal</h2>
          <p className="mt-0.5 text-xs text-indigo-100/90">Rates in More → Rate card</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            asChild
            variant="secondary"
            size="sm"
            className="gap-1.5 border-0 bg-white/15 font-semibold text-white hover:bg-white/25"
          >
            <Link href="/more/rate-card">
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              Open rate card
            </Link>
          </Button>
          {onOpenReview ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="gap-1.5 border-0 bg-white font-semibold text-indigo-950 hover:bg-indigo-50"
              onClick={onOpenReview}
            >
              <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
              Review sections
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-xl border border-white/15 bg-white/10 px-2.5 py-2 text-center backdrop-blur-sm"
          >
            <p className="text-[9px] font-bold uppercase tracking-wide text-indigo-200/80">{m.label}</p>
            <p className="mt-0.5 text-sm font-bold tabular-nums">{m.value}</p>
          </div>
        ))}
      </div>

      <ol className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-semibold uppercase tracking-wide text-indigo-200/90">
        <li>1 · Plant &amp; brand</li>
        <li>2 · Quote</li>
        <li>3 · Customer specs</li>
        <li>4 · Compare</li>
        <li>5 · DG &amp; delivery</li>
      </ol>
    </header>
  );
}
