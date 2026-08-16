"use client";

import type { ProposalData } from "@/lib/proposal-data";
import type { PremiumProposalPptInput } from "@/lib/proposal-ppt";
import { JaaliCover } from "./JaaliCover";
import { JaaliAudit } from "./JaaliAudit";
import { JaaliHardware } from "./JaaliHardware";
import { JaaliEngineering } from "./JaaliEngineering";
import { JaaliLedgerPage } from "./JaaliLedgerPage";
import { JaaliForecast } from "./JaaliForecast";
import { JaaliTerms, JaaliTermsContinued } from "./JaaliTerms";
import { JaaliClosingPage } from "./JaaliClosingPage";
import styles from "./Jaali.module.css";

export type JaaliProposalProps = {
  data: ProposalData;
  installerLogoUrl?: string;
  pptInput?: PremiumProposalPptInput;
};

export function JaaliProposal({
  data,
  installerLogoUrl,
  pptInput,
}: JaaliProposalProps) {
  return (
    <div className={styles.stage} data-jaali-stage>
      <JaaliCover data={data} installerLogoUrl={installerLogoUrl} />
      <JaaliAudit data={data} />
      <JaaliHardware data={data} />
      <JaaliEngineering data={data} pptInput={pptInput} />
      <JaaliForecast data={data} />
      <JaaliLedgerPage data={data} />
      <JaaliTerms data={data} />
      <JaaliTermsContinued data={data} />
      <JaaliClosingPage
        data={data}
        installerLogoUrl={installerLogoUrl}
        pptWebsite={pptInput?.companyProfile?.website}
      />
    </div>
  );
}

export default JaaliProposal;
