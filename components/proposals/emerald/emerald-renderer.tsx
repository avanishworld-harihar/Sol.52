"use client";

/**
 * Emerald Signature renderer — split-folio eco-luxury residential proposal.
 * Preset id: residential_emerald
 * Pages compiled by EmeraldProposal.
 */

import { useRef, useState } from "react";
import type { ProposalData } from "@/lib/proposal-data";
import type { PremiumProposalPptInput } from "@/lib/proposal-ppt";
import { EmeraldProposal } from "./EmeraldProposal";
import { useEmeraldBrand, useEmeraldLogoUrl } from "./emerald-brand";
import styles from "./Emerald.module.css";
import {
  buildAtelierProposalPdf,
  downloadPdfFile,
  isAppleTouchDevice,
} from "@/components/proposals/_shared/residential-pdf-export";

export type EmeraldRendererProps = {
  data: ProposalData;
  installerLogoUrl?: string;
  pptInput?: PremiumProposalPptInput | null;
  proposalId?: string;
};

function EmeraldDocument({
  data,
  installerLogoUrl,
  proposalId,
}: {
  data: ProposalData;
  installerLogoUrl?: string;
  proposalId?: string;
}) {
  const brand = useEmeraldBrand(data);
  const logoUrl = useEmeraldLogoUrl(data, installerLogoUrl);
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
            presetId: "residential_emerald",
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
      data-proposal-preset="residential_emerald"
      className={styles.root}
    >
      <div className={styles.printBar}>
        <div className={styles.printBarInner}>
          <span className={styles.printBarBrand}>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- web toolbar logo
              <img src={logoUrl} alt={brand} className={styles.printBarLogo} />
            ) : null}
            {brand} · Emerald Signature
          </span>
          <button
            type="button"
            className={styles.printBarBtn}
            onClick={handlePrint}
          >
            Download PDF
          </button>
        </div>
      </div>

      <EmeraldProposal
        data={data}
        proposalId={proposalId}
        installerLogoUrl={installerLogoUrl}
      />
    </div>
  );
}

export function EmeraldRenderer({
  data,
  installerLogoUrl,
  proposalId,
}: EmeraldRendererProps) {
  if (!data) {
    return <div className={styles.loading}>Preparing your proposal…</div>;
  }

  return (
    <EmeraldDocument
      data={data}
      installerLogoUrl={installerLogoUrl}
      proposalId={proposalId}
    />
  );
}

export default EmeraldRenderer;
