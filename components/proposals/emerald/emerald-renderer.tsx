"use client";

/**
 * Emerald Signature renderer — split-folio eco-luxury residential proposal.
 * Preset id: residential_emerald
 * Pages: Cover → Architecture → Capital Ledger → Material Anthology →
 * Impact → Energy Audit → Yield Forecast → Execution Mandate →
 * Terms I → Terms II.
 */

import { useRef, useState } from "react";
import type { ProposalData } from "@/lib/proposal-data";
import type { PremiumProposalPptInput } from "@/lib/proposal-ppt";
import { EmeraldCover } from "./EmeraldCover";
import { EmeraldArchitecture } from "./EmeraldArchitecture";
import { EmeraldEconomics } from "./EmeraldEconomics";
import { EmeraldHardware } from "./EmeraldHardware";
import { EmeraldImpact } from "./EmeraldImpact";
import { EmeraldBillAudit } from "./EmeraldBillAudit";
import { EmeraldForecast } from "./EmeraldForecast";
import { EmeraldClosing } from "./EmeraldClosing";
import { EmeraldTermsOne } from "./EmeraldTermsOne";
import { EmeraldTermsTwo } from "./EmeraldTermsTwo";
import { useEmeraldBrand } from "./emerald-brand";
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
  proposalId,
}: {
  data: ProposalData;
  proposalId?: string;
}) {
  const brand = useEmeraldBrand(data);
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
            pageSelector: ":scope > section",
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

      <EmeraldCover data={data} proposalId={proposalId} />
      <EmeraldArchitecture data={data} />
      <EmeraldEconomics data={data} />
      <EmeraldHardware data={data} />
      <EmeraldImpact data={data} />
      <EmeraldBillAudit data={data} />
      <EmeraldForecast data={data} />
      <EmeraldClosing data={data} />
      <EmeraldTermsOne data={data} />
      <EmeraldTermsTwo data={data} />
    </div>
  );
}

export function EmeraldRenderer({
  data,
  proposalId,
}: EmeraldRendererProps) {
  if (!data) {
    return <div className={styles.loading}>Preparing Emerald Signature…</div>;
  }

  return <EmeraldDocument data={data} proposalId={proposalId} />;
}

export default EmeraldRenderer;
