"use client";

/**
 * Wall Street Ledger renderer — salmon newsprint financial editorial.
 * Preset id: residential_wall_street
 */

import { useRef, useState } from "react";
import type { ProposalData } from "@/lib/proposal-data";
import { WallStreetProposal } from "./WallStreetProposal";
import styles from "./WallStreet.module.css";
import {
  buildAtelierProposalPdf,
  downloadPdfFile,
  isAppleTouchDevice,
} from "@/components/proposals/_shared/residential-pdf-export";

export type WallStreetRendererProps = {
  data: ProposalData;
  installerLogoUrl?: string;
  proposalId?: string;
};

function WallStreetDocument({ data }: { data: ProposalData }) {
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
            presetId: "residential_wall_street",
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
      data-proposal-preset="residential_wall_street"
      className={styles.root}
    >
      <div className={styles.printBar}>
        <div className={styles.printBarInner}>
          <span className={styles.printBarBrand}>Wall Street Ledger · 3 pages</span>
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
      <WallStreetProposal data={data} />
    </div>
  );
}

export function WallStreetRenderer({ data }: WallStreetRendererProps) {
  if (!data) {
    return <div className={styles.loading}>Preparing Wall Street Ledger…</div>;
  }
  return <WallStreetDocument data={data} />;
}

export default WallStreetRenderer;
