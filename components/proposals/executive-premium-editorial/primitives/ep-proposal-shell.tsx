"use client";

import { Download } from "lucide-react";

type Props = {
  children: React.ReactNode;
};

export function EpProposalShell({ children }: Props) {
  return (
    <div className="ep-proposal-shell w-full">
      <div className="ep-gl-toolbar print:hidden">
        <div className="ep-gl-toolbar-inner">
          <p className="ep-gl-toolbar-label">Executive Premium · Golden</p>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") window.print();
            }}
            className="ep-gl-toolbar-btn"
          >
            <Download className="h-3.5 w-3.5" aria-hidden />
            Print / PDF
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}
