"use client";

import { ProposalTemplateGallery } from "@/components/settings/proposal-template-gallery";

type Props = {
  markSaved: (message: string) => void;
};

export function ProposalTemplateSettingsPanel({ markSaved }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-[11px] leading-snug text-slate-600 dark:text-slate-400">
        Choose a default theme for new proposals. Browse by{" "}
        <strong className="font-semibold text-slate-800 dark:text-slate-200">Residential</strong> or{" "}
        <strong className="font-semibold text-slate-800 dark:text-slate-200">Commercial</strong> — click to select,
        preview before you commit.
      </p>
      <ProposalTemplateGallery markSaved={markSaved} />
    </div>
  );
}
