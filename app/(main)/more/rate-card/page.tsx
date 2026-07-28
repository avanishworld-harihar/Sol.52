"use client";

import { CompanyAdminOnly } from "@/components/auth/company-admin-only";
import { InstallerRateCardWorkspace } from "@/components/installer/installer-rate-card-workspace";
import { WorkspacePage, WorkspacePageHero, WorkspaceStaggerItem } from "@/components/workspace";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function InstallerRateCardPage() {
  return (
    <CompanyAdminOnly>
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
            subtitle="One catalog for residential and commercial quotes."
          />
        </WorkspaceStaggerItem>
        <WorkspaceStaggerItem>
          <InstallerRateCardWorkspace />
        </WorkspaceStaggerItem>
      </WorkspacePage>
    </CompanyAdminOnly>
  );
}
