"use client";

import type { ProposalData } from "@/lib/proposal-data";
import type { PremiumProposalPptInput } from "@/lib/proposal-ppt";
import { SiennaCover } from "./SiennaCover";
import { SiennaAudit } from "./SiennaAudit";
import { SiennaHardware } from "./SiennaHardware";
import { SiennaEngineering } from "./SiennaEngineering";
import { SiennaLedgerPage } from "./SiennaLedgerPage";
import { SiennaForecast } from "./SiennaForecast";
import { SiennaTerms, SiennaTermsContinued } from "./SiennaTerms";
import { SiennaClosingPage } from "./SiennaClosingPage";
import styles from "./Sienna.module.css";

export type SiennaProposalProps = {
  data: ProposalData;
  installerLogoUrl?: string;
  pptInput?: PremiumProposalPptInput;
};

export function SiennaProposal({
  data,
  installerLogoUrl,
  pptInput,
}: SiennaProposalProps) {
  return (
    <div className={styles.stage} data-sienna-stage>
      <SiennaCover data={data} installerLogoUrl={installerLogoUrl} />
      <SiennaAudit data={data} />
      <SiennaHardware data={data} />
      <SiennaEngineering data={data} pptInput={pptInput} />
      <SiennaForecast data={data} />
      <SiennaLedgerPage data={data} />
      <SiennaTerms data={data} />
      <SiennaTermsContinued data={data} />
      <SiennaClosingPage
        data={data}
        installerLogoUrl={installerLogoUrl}
        pptWebsite={pptInput?.companyProfile?.website}
      />
    </div>
  );
}

export default SiennaProposal;
