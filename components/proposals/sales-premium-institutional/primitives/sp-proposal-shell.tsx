"use client";

import { Download } from "lucide-react";

type Props = {
  children: React.ReactNode;
};

export function SpProposalShell({ children }: Props) {
  return (
    <div className="sp-proposal-shell w-full">
      <div className="sp-toolbar print:hidden">
        <div className="sp-toolbar-inner">
          <p className="sp-toolbar-label">Apple Pro</p>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") window.print();
            }}
            className="sp-toolbar-btn"
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
