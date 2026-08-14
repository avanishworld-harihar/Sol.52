"use client";

/**
 * Field Engineering renderer — survey-drawing residential proposal.
 * Preset id: residential_field
 */

import { useRef, useState } from "react";
import type { ProposalData } from "@/lib/proposal-data";
import { FieldProposal } from "./FieldProposal";
import styles from "./Field.module.css";
import {
  buildAtelierProposalPdf,
  downloadPdfFile,
  isAppleTouchDevice,
} from "@/components/proposals/_shared/residential-pdf-export";

export type FieldRendererProps = {
  data: ProposalData;
  installerLogoUrl?: string;
  proposalId?: string;
};

function FieldDocument({ data }: { data: ProposalData }) {
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
            presetId: "residential_field",
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
      data-proposal-preset="residential_field"
      className={styles.root}
    >
      <div className={styles.printBar}>
        <div className={styles.printBarInner}>
          <span className={styles.printBarBrand}>Field Engineering · FE-01…09</span>
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
      <FieldProposal data={data} />
    </div>
  );
}

export function FieldRenderer({ data }: FieldRendererProps) {
  if (!data) {
    return <div className={styles.loading}>Preparing Field Engineering…</div>;
  }
  return <FieldDocument data={data} />;
}

export default FieldRenderer;
