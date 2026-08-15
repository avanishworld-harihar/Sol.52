"use client";

/**
 * Lumina renderer — clean light app-like residential proposal.
 * Preset id: residential_lumina
 */

import { useRef, useState } from "react";
import type { ProposalData } from "@/lib/proposal-data";
import { LuminaProposal } from "./LuminaProposal";
import styles from "./Lumina.module.css";
import {
  buildAtelierProposalPdf,
  downloadPdfFile,
  isAppleTouchDevice,
} from "@/components/proposals/_shared/residential-pdf-export";

export type LuminaRendererProps = {
  data: ProposalData;
  installerLogoUrl?: string;
  proposalId?: string;
};

function LuminaDocument({
  data,
  installerLogoUrl,
}: {
  data: ProposalData;
  installerLogoUrl?: string;
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
            presetId: "residential_lumina",
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
    <div ref={rootRef} data-proposal-preset="residential_lumina" className={styles.root}>
      <div className={styles.printBar}>
        <div className={styles.printBarInner}>
          <span className={styles.printBarBrand}>Proposal · 7 pages</span>
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
      <LuminaProposal data={data} installerLogoUrl={installerLogoUrl} />
    </div>
  );
}

export function LuminaRenderer({
  data,
  installerLogoUrl,
}: LuminaRendererProps) {
  if (!data) {
    return <div className={styles.loading}>Preparing Lumina proposal…</div>;
  }
  return <LuminaDocument data={data} installerLogoUrl={installerLogoUrl} />;
}

export default LuminaRenderer;
