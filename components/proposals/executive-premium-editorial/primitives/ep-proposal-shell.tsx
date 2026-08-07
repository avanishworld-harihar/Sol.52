"use client";

import { Download, Languages } from "lucide-react";
import type { ProposalLang } from "@/lib/proposal-i18n";

type Props = {
  children: React.ReactNode;
  lang: ProposalLang;
  onLangToggle: () => void;
  langToggleLabel: string;
  printLabel: string;
  presetLabel: string;
  onPrint?: () => void;
};

export function EpProposalShell({
  children,
  lang,
  onLangToggle,
  langToggleLabel,
  printLabel,
  presetLabel,
  onPrint,
}: Props) {
  return (
    <div className="ep-proposal-shell w-full">
      <div className="ep-gl-toolbar print:hidden">
        <div className="ep-gl-toolbar-inner">
          <p className="ep-gl-toolbar-label">{presetLabel}</p>
          <div className="ep-gl-toolbar-actions">
            <button type="button" onClick={onLangToggle} className="ep-gl-toolbar-btn ep-gl-toolbar-btn--ghost">
              <Languages className="h-3.5 w-3.5" aria-hidden />
              {langToggleLabel}
            </button>
            <button
              type="button"
              onClick={onPrint ?? (() => window.print())}
              className="ep-gl-toolbar-btn"
            >
              <Download className="h-3.5 w-3.5" aria-hidden />
              {printLabel}
            </button>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
