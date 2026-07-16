import { Noto_Sans_Devanagari } from "next/font/google";
import type { ReactNode } from "react";

const notoDeva = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-deva",
  display: "swap"
});

const PROPOSAL_THEME_BOOTSTRAP = `(function(){try{var t=localStorage.getItem("ss_proposal_web_theme_v2");var d=t==="dark";var r=document.documentElement;r.dataset.proposalTheme=d?"dark":"light";var el=document.getElementById("proposal-route-root");if(el){el.style.backgroundColor=d?"#0a0a0a":"#ffffff";el.style.color=d?"#f5f5f5":"#171717";}}catch(e){document.documentElement.dataset.proposalTheme="light";var el=document.getElementById("proposal-route-root");if(el){el.style.backgroundColor="#ffffff";el.style.color="#171717";}}})();`;

/**
 * Shared public proposal shell only (fonts + canvas).
 * Preset-specific CSS (e.g. proposal-premium.css) must be imported by that
 * preset's renderer — never here — so residential themes are not coupled to commercial print rules.
 */
export default function ProposalRouteLayout({ children }: { children: ReactNode }) {
  return (
    <div
      id="proposal-route-root"
      className={`${notoDeva.variable} relative z-[1] min-h-[100dvh] bg-white text-neutral-900 transition-colors duration-300 print:bg-white`}
      suppressHydrationWarning
    >
      <script dangerouslySetInnerHTML={{ __html: PROPOSAL_THEME_BOOTSTRAP }} />
      {children}
    </div>
  );
}
