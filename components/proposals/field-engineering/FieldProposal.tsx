"use client";

/**
 * Field Engineering — master compiler. Nine numbered drawing sheets.
 */

import type { ProposalData } from "@/lib/proposal-data";
import { CoverPage } from "./CoverPage";
import { SiteSurveyPage } from "./SiteSurveyPage";
import { ArchitecturePage } from "./ArchitecturePage";
import { PerformancePage } from "./PerformancePage";
import { LoadProfilePage } from "./LoadProfilePage";
import { FinancialLedgerPage } from "./FinancialLedgerPage";
import { CompliancePage } from "./CompliancePage";
import { TimelinePage } from "./TimelinePage";
import { AcceptancePage } from "./AcceptancePage";
import styles from "./Field.module.css";

export type FieldProposalProps = {
  data: ProposalData;
  proposalId?: string;
};

export function FieldProposal({ data, proposalId }: FieldProposalProps) {
  return (
    <div className={styles.proposalStage}>
      <CoverPage data={data} proposalId={proposalId} />
      <LoadProfilePage data={data} />
      <SiteSurveyPage data={data} />
      <ArchitecturePage data={data} />
      <PerformancePage data={data} />
      <FinancialLedgerPage data={data} />
      <CompliancePage data={data} />
      <TimelinePage data={data} />
      <AcceptancePage data={data} />
    </div>
  );
}

export default FieldProposal;
