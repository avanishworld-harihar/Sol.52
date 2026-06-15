"use client";

import { BILLING_WATERMARK_TEXT } from "@/lib/billing/types";
import { cn } from "@/lib/utils";
import "@/components/proposals/proposal-pdf-watermark.css";

type Props = {
  enabled?: boolean;
  className?: string;
  children: React.ReactNode;
};

/** Wraps proposal document roots — adds print watermark when `enabled`. */
export function ProposalWatermarkShell({ enabled = false, className, children }: Props) {
  return (
    <div className={cn(enabled && "sol52-watermark-on", className)}>
      {children}
      {enabled ? (
        <div className="sol52-pdf-watermark print:block" aria-hidden>
          {BILLING_WATERMARK_TEXT}
        </div>
      ) : null}
    </div>
  );
}
