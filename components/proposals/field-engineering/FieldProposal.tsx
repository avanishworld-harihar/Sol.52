"use client";

/**
 * Field Engineering — master compiler. Ten numbered drawing sheets (FE-00…FE-09).
 */

import type { ProposalData } from "@/lib/proposal-data";
import { RegisterPage } from "./RegisterPage";
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
  siteImages?: string[];
};

export function FieldProposal({ data, proposalId, siteImages }: FieldProposalProps) {
  return (
    <div className={styles.proposalStage}>
      <RegisterPage data={data} proposalId={proposalId} />
      <CoverPage data={data} proposalId={proposalId} />
      <LoadProfilePage data={data} proposalId={proposalId} />
      <SiteSurveyPage data={data} proposalId={proposalId} siteImages={siteImages} />
      <ArchitecturePage data={data} proposalId={proposalId} />
      <PerformancePage data={data} proposalId={proposalId} />
      <FinancialLedgerPage data={data} proposalId={proposalId} />
      <CompliancePage data={data} proposalId={proposalId} />
      <TimelinePage data={data} proposalId={proposalId} />
      <AcceptancePage data={data} proposalId={proposalId} />
    </div>
  );
}

export default FieldProposal;
