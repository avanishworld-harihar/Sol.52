"use client";

/**
 * Emerald Signature — master compiler. Assembles the split-folio document.
 */

import type { ProposalData } from "@/lib/proposal-data";
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
import { EmeraldBackCover } from "./EmeraldBackCover";
import styles from "./Emerald.module.css";

export type EmeraldProposalProps = {
  data: ProposalData;
  proposalId?: string;
  installerLogoUrl?: string;
};

export function EmeraldProposal({
  data,
  proposalId,
  installerLogoUrl,
}: EmeraldProposalProps) {
  return (
    <div className={styles.proposalStage}>
      <EmeraldCover
        data={data}
        proposalId={proposalId}
        installerLogoUrl={installerLogoUrl}
      />
      <EmeraldArchitecture data={data} />
      <EmeraldEconomics data={data} />
      <EmeraldHardware data={data} />
      <EmeraldImpact data={data} />
      <EmeraldBillAudit data={data} />
      <EmeraldForecast data={data} />
      <EmeraldClosing data={data} />
      <EmeraldTermsOne data={data} />
      <EmeraldTermsTwo data={data} />
      <EmeraldBackCover data={data} installerLogoUrl={installerLogoUrl} />
    </div>
  );
}

export default EmeraldProposal;
