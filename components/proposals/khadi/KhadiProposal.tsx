"use client";

import type { ProposalData } from "@/lib/proposal-data";
import type { PremiumProposalPptInput } from "@/lib/proposal-ppt";
import { KhadiCover } from "./KhadiCover";
import { KhadiAudit } from "./KhadiAudit";
import { KhadiHardware } from "./KhadiHardware";
import { KhadiEngineering } from "./KhadiEngineering";
import { KhadiLedgerPage } from "./KhadiLedgerPage";
import { KhadiForecast } from "./KhadiForecast";
import { KhadiTerms, KhadiTermsContinued } from "./KhadiTerms";
import { KhadiClosingPage } from "./KhadiClosingPage";
import styles from "./Khadi.module.css";

export type KhadiProposalProps = {
  data: ProposalData;
  installerLogoUrl?: string;
  pptInput?: PremiumProposalPptInput;
};

export function KhadiProposal({
  data,
  installerLogoUrl,
  pptInput,
}: KhadiProposalProps) {
  return (
    <div className={styles.stage} data-khadi-stage>
      <KhadiCover data={data} installerLogoUrl={installerLogoUrl} />
      <KhadiAudit data={data} />
      <KhadiHardware data={data} />
      <KhadiEngineering data={data} pptInput={pptInput} />
      <KhadiForecast data={data} />
      <KhadiLedgerPage data={data} />
      <KhadiTerms data={data} />
      <KhadiTermsContinued data={data} />
      <KhadiClosingPage
        data={data}
        installerLogoUrl={installerLogoUrl}
        pptWebsite={pptInput?.companyProfile?.website}
      />
    </div>
  );
}

export default KhadiProposal;
