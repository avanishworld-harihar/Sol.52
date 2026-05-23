"use client";

import { InstallerRateCardWorkspace } from "@/components/installer/installer-rate-card-workspace";
import { WorkspacePage, WorkspacePageHero, WorkspaceStaggerItem } from "@/components/workspace";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function InstallerRateCardPage() {
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
          eyebrow="Master pricing"
          title="Rate card"
          subtitle="Central rates for residential (₹/kW plant) and commercial (₹/Wp). All new proposals use these prices until you save a customer-specific quote."
        />
      </WorkspaceStaggerItem>
      <WorkspaceStaggerItem>
        <InstallerRateCardWorkspace />
      </WorkspaceStaggerItem>
    </WorkspacePage>
  );
}
