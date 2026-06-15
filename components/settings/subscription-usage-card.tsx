"use client";

import { BillingDashboard } from "@/components/billing/billing-dashboard";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

/** Compact subscription summary on the More page — full dashboard at /billing. */
export function SubscriptionUsageCard() {
  return (
    <div className="space-y-3">
      <BillingDashboard variant="card" />
      <Link
        href="/billing"
        className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline"
      >
        Open billing dashboard
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
      </Link>
    </div>
  );
}
