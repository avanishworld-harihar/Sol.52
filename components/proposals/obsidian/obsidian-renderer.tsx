"use client";

/**
 * Obsidian renderer — cinematic HUD residential proposal.
 * Preset id: residential_obsidian
 */

import { useRef, useState } from "react";
import type { ProposalData } from "@/lib/proposal-data";
import type { PremiumProposalPptInput } from "@/lib/proposal-ppt";
import { ObsidianProposal } from "./ObsidianProposal";
import styles from "./Obsidian.module.css";
import {
  buildAtelierProposalPdf,
  downloadPdfFile,
  isAppleTouchDevice,
} from "@/components/proposals/_shared/residential-pdf-export";

export type ObsidianRendererProps = {
  data: ProposalData;
  installerLogoUrl?: string;
  pptInput?: PremiumProposalPptInput | null;
  proposalId?: string;
};

function ObsidianDocument({
  data,
  pptInput,
}: {
  data: ProposalData;
  pptInput?: PremiumProposalPptInput | null;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  const handlePrint = async () => {
    if (typeof window === "undefined" || pdfBusy) return;
    if (isAppleTouchDevice() && rootRef.current) {
      setPdfBusy(true);
      try {
        downloadPdfFile(
          await buildAtelierProposalPdf({
            root: rootRef.current,
            customerName: data.meta.customerName,
            presetId: "residential_obsidian",
            pageSelector: "section",
          })
        );
      } finally {
        setPdfBusy(false);
      }
      return;
    }
    window.print();
  };

  return (
    <div
      ref={rootRef}
      data-proposal-preset="residential_obsidian"
      className={styles.root}
    >
      <div className={styles.printBar}>
        <div className={styles.printBarInner}>
          <span className={styles.printBarBrand}>Obsidian · HUD</span>
          <button
            type="button"
            className={styles.printBarBtn}
            onClick={handlePrint}
            disabled={pdfBusy}
          >
            {pdfBusy ? "Preparing PDF…" : "Download PDF"}
          </button>
        </div>
      </div>
      <ObsidianProposal data={data} pptInput={pptInput} />
    </div>
  );
}

export function ObsidianRenderer({ data, pptInput }: ObsidianRendererProps) {
  if (!data) {
    return <div className={styles.loading}>Preparing Obsidian…</div>;
  }
  return <ObsidianDocument data={data} pptInput={pptInput} />;
}

export default ObsidianRenderer;
