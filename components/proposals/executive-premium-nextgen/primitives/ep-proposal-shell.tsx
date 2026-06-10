"use client";

import { Download, Presentation } from "lucide-react";
import Link from "next/link";

type Props = {
  proposalId: string;
  children: React.ReactNode;
};

/** Client-facing chrome — print/PDF and present mode. */
export function EpProposalShell({ proposalId, children }: Props) {
  return (
    <div className="ep-proposal-shell w-full">
      <div className="ep-proposal-toolbar print:hidden">
        <div className="ep-proposal-toolbar-inner">
          <p className="ep-proposal-toolbar-label">Executive Premium</p>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") window.print();
              }}
              className="ep-proposal-toolbar-btn"
            >
              <Download className="h-3.5 w-3.5" aria-hidden />
              Print / PDF
            </button>
            <Link href={`/proposal/${proposalId}/present`} className="ep-proposal-toolbar-btn ep-proposal-toolbar-btn--accent">
              <Presentation className="h-3.5 w-3.5" aria-hidden />
              Present
            </Link>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
