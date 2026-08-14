"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { WallStreetCover } from "./WallStreetCover";
import { WallStreetLedgerPage } from "./WallStreetLedgerPage";
import { WallStreetClosingPage } from "./WallStreetClosingPage";
import styles from "./WallStreet.module.css";

export function WallStreetProposal({ data }: { data: ProposalData }) {
  return (
    <div className={styles.stage}>
      <WallStreetCover data={data} />
      <WallStreetLedgerPage data={data} />
      <WallStreetClosingPage data={data} />
    </div>
  );
}

export default WallStreetProposal;
