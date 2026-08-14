"use client";

/**
 * Cyanotype renderer — deep indigo blueprint drafting sheets.
 * Preset id: residential_cyanotype
 */

import { useRef, useState } from "react";
import type { ProposalData } from "@/lib/proposal-data";
import { CyanotypeProposal } from "./CyanotypeProposal";
import styles from "./Cyanotype.module.css";
import {
  buildAtelierProposalPdf,
  downloadPdfFile,
  isAppleTouchDevice,
} from "@/components/proposals/_shared/residential-pdf-export";

export type CyanotypeRendererProps = {
  data: ProposalData;
  installerLogoUrl?: string;
  proposalId?: string;
};

function CyanotypeDocument({ data }: { data: ProposalData }) {
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
            presetId: "residential_cyanotype",
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
    <div ref={rootRef} data-proposal-preset="residential_cyanotype" className={styles.root}>
      <div className={styles.printBar}>
        <div className={styles.printBarInner}>
          <span className={styles.printBarBrand}>Cyanotype · 3 sheets</span>
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
      <CyanotypeProposal data={data} />
    </div>
  );
}

export function CyanotypeRenderer({ data }: CyanotypeRendererProps) {
  if (!data) {
    return <div className={styles.loading}>Preparing Cyanotype draft…</div>;
  }
  return <CyanotypeDocument data={data} />;
}

export default CyanotypeRenderer;
