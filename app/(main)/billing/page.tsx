"use client";

import { BillingDashboard } from "@/components/billing/billing-dashboard";
import { WorkspacePage, WorkspacePageHero, WorkspaceStaggerItem } from "@/components/workspace";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function BillingPage() {
  return (
    <WorkspacePage tone="settings" stagger={false}>
      <WorkspaceStaggerItem>
        <Link
          href="/more"
          className="mb-3 inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to More
        </Link>
        <WorkspacePageHero
          tone="settings"
          eyebrow="Company Admin"
          title="Billing"
          subtitle="Plan, status, trial days, and usage."
        />
      </WorkspaceStaggerItem>
      <WorkspaceStaggerItem>
        <BillingDashboard variant="page" />
      </WorkspaceStaggerItem>
    </WorkspacePage>
  );
}
