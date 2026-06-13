"use client";

import { ProposalTemplateGallery } from "@/components/settings/proposal-template-gallery";

type Props = {
  markSaved: (message: string) => void;
};

export function ProposalTemplateSettingsPanel({ markSaved }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-[11px] leading-snug text-slate-600 dark:text-slate-400">
        Pick the default look for new{" "}
        <strong className="font-semibold text-slate-800 dark:text-slate-200">Residential</strong> proposals. Browse all
        themes at once — click to select, preview before you commit.
      </p>
      <ProposalTemplateGallery markSaved={markSaved} />
    </div>
  );
}
