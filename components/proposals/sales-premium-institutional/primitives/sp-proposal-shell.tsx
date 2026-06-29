"use client";

import { Download } from "lucide-react";

type Props = {
  children: React.ReactNode;
  variant?: "pearl" | "slate";
};

export function SpProposalShell({ children, variant = "slate" }: Props) {
  const label = variant === "pearl" ? "Pearl" : "Slate";
  return (
    <div className="sp-proposal-shell w-full">
      <div className="sp-toolbar print:hidden">
        <div className="sp-toolbar-inner">
          <p className="sp-toolbar-label">{label}</p>
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
