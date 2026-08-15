"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { LuminaCover } from "./LuminaCover";
import { LuminaLedgerPage } from "./LuminaLedgerPage";
import { LuminaClosingPage } from "./LuminaClosingPage";
import styles from "./Lumina.module.css";

export function LuminaProposal({ data }: { data: ProposalData }) {
  return (
    <div className={styles.stage}>
      <LuminaCover data={data} />
      <LuminaLedgerPage data={data} />
      <LuminaClosingPage data={data} />
    </div>
  );
}

export default LuminaProposal;
