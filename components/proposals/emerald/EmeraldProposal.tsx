"use client";

/**
 * Emerald Signature — master compiler. Assembles the split-folio document.
 * Story: cover → bill (if live) → cost/EMI → design → hardware → forecast → pay → terms → back.
 */

import type { ProposalData } from "@/lib/proposal-data";
import { EmeraldCover } from "./EmeraldCover";
import { EmeraldBillAudit } from "./EmeraldBillAudit";
import { EmeraldEconomics } from "./EmeraldEconomics";
import { EmeraldArchitecture } from "./EmeraldArchitecture";
import { EmeraldHardware, emeraldHardwarePages } from "./EmeraldHardware";
import { EmeraldForecast } from "./EmeraldForecast";
import { EmeraldClosing } from "./EmeraldClosing";
import { EmeraldTermsOne } from "./EmeraldTermsOne";
import { EmeraldBackCover } from "./EmeraldBackCover";
import { hasEmeraldBill } from "./emerald-live";
import styles from "./Emerald.module.css";

export type EmeraldProposalProps = {
  data: ProposalData;
  proposalId?: string;
  installerLogoUrl?: string;
  selectedTenureYears?: number | null;
};

export function EmeraldProposal({
  data,
  proposalId,
  installerLogoUrl,
  selectedTenureYears,
}: EmeraldProposalProps) {
  const showBill = hasEmeraldBill(data);
  const bomPages = emeraldHardwarePages(data);
  let n = 1;
  const nextFolio = () => String(n++).padStart(2, "0");

  return (
    <div className={styles.proposalStage}>
      <EmeraldCover
        data={data}
        proposalId={proposalId}
        installerLogoUrl={installerLogoUrl}
      />
      {showBill ? <EmeraldBillAudit data={data} folio={nextFolio()} /> : null}
      <EmeraldEconomics
        data={data}
        folio={nextFolio()}
        selectedTenureYears={selectedTenureYears}
      />
      <EmeraldArchitecture data={data} folio={nextFolio()} />
      {bomPages.map((items, i) => (
        <EmeraldHardware
          key={`bom-${i}`}
          data={data}
          folio={nextFolio()}
          items={items}
          continued={i > 0}
          startIndex={i * 3}
        />
      ))}
      <EmeraldForecast data={data} folio={nextFolio()} />
      <EmeraldClosing data={data} folio={nextFolio()} />
      <EmeraldTermsOne data={data} folio={nextFolio()} />
      <EmeraldBackCover data={data} installerLogoUrl={installerLogoUrl} />
    </div>
  );
}

export default EmeraldProposal;
