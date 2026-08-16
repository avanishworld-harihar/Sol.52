"use client";

import type { ProposalData } from "@/lib/proposal-data";
import type { PremiumProposalPptInput } from "@/lib/proposal-ppt";
import { LuminaCover } from "./LuminaCover";
import { LuminaAudit } from "./LuminaAudit";
import { LuminaHardware } from "./LuminaHardware";
import { LuminaEngineering } from "./LuminaEngineering";
import { LuminaLedgerPage } from "./LuminaLedgerPage";
import { LuminaForecast } from "./LuminaForecast";
import { LuminaTerms, LuminaTermsContinued } from "./LuminaTerms";
import { LuminaClosingPage } from "./LuminaClosingPage";
import styles from "./Lumina.module.css";

export type LuminaProposalProps = {
  data: ProposalData;
  installerLogoUrl?: string;
  pptInput?: PremiumProposalPptInput;
};

export function LuminaProposal({
  data,
  installerLogoUrl,
  pptInput,
}: LuminaProposalProps) {
  return (
    <div className={styles.stage} data-lumina-stage>
      <LuminaCover data={data} installerLogoUrl={installerLogoUrl} />
      <LuminaAudit data={data} />
      <LuminaHardware data={data} />
      <LuminaEngineering data={data} pptInput={pptInput} />
      <LuminaForecast data={data} />
      <LuminaLedgerPage data={data} />
      <LuminaTerms data={data} />
      <LuminaTermsContinued data={data} />
      <LuminaClosingPage
        data={data}
        installerLogoUrl={installerLogoUrl}
        pptWebsite={pptInput?.companyProfile?.website}
      />
    </div>
  );
}

export default LuminaProposal;
