"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { LuminaCover } from "./LuminaCover";
import { LuminaAudit } from "./LuminaAudit";
import { LuminaHardware } from "./LuminaHardware";
import { LuminaLedgerPage } from "./LuminaLedgerPage";
import { LuminaForecast } from "./LuminaForecast";
import { LuminaTerms, LuminaTermsContinued } from "./LuminaTerms";
import { LuminaClosingPage } from "./LuminaClosingPage";
import styles from "./Lumina.module.css";

export type LuminaProposalProps = {
  data: ProposalData;
  installerLogoUrl?: string;
};

export function LuminaProposal({
  data,
  installerLogoUrl,
}: LuminaProposalProps) {
  return (
    <div className={styles.stage}>
      <LuminaCover data={data} installerLogoUrl={installerLogoUrl} />
      <LuminaAudit data={data} />
      <LuminaHardware data={data} />
      <LuminaLedgerPage data={data} />
      <LuminaForecast data={data} />
      <LuminaTerms data={data} />
      <LuminaTermsContinued data={data} />
      <LuminaClosingPage data={data} installerLogoUrl={installerLogoUrl} />
    </div>
  );
}

export default LuminaProposal;
