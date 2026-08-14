"use client";

/**
 * Brutalism renderer — concrete gray, heavy black frame, industrial orange.
 * Preset id: residential_brutalism
 */

import { useRef, useState } from "react";
import type { ProposalData } from "@/lib/proposal-data";
import { BrutalismProposal } from "./BrutalismProposal";
import styles from "./Brutalism.module.css";
import {
  buildAtelierProposalPdf,
  downloadPdfFile,
  isAppleTouchDevice,
} from "@/components/proposals/_shared/residential-pdf-export";

export type BrutalismRendererProps = {
  data: ProposalData;
  installerLogoUrl?: string;
  proposalId?: string;
};

function BrutalismDocument({ data }: { data: ProposalData }) {
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
            presetId: "residential_brutalism",
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
    <div ref={rootRef} data-proposal-preset="residential_brutalism" className={styles.root}>
      <div className={styles.printBar}>
        <div className={styles.printBarInner}>
          <span className={styles.printBarBrand}>Brutalism · 3 sheets</span>
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
      <BrutalismProposal data={data} />
    </div>
  );
}

export function BrutalismRenderer({ data }: BrutalismRendererProps) {
  if (!data) {
    return <div className={styles.loading}>PREPARING BRUTAL SPEC…</div>;
  }
  return <BrutalismDocument data={data} />;
}

export default BrutalismRenderer;
