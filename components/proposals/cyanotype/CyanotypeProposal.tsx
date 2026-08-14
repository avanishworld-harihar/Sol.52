"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { CyanotypeCover } from "./CyanotypeCover";
import { CyanotypeLedgerPage } from "./CyanotypeLedgerPage";
import { CyanotypeClosingPage } from "./CyanotypeClosingPage";
import styles from "./Cyanotype.module.css";

export function CyanotypeProposal({ data }: { data: ProposalData }) {
  return (
    <div className={styles.stage}>
      <CyanotypeCover data={data} />
      <CyanotypeLedgerPage data={data} />
      <CyanotypeClosingPage data={data} />
    </div>
  );
}

export default CyanotypeProposal;
