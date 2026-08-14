"use client";

/**
 * Emerald Signature — payment on GROSS (subsidy credited later) + bank + signatures.
 */

import { useEffect, useState } from "react";
import type { ProposalData } from "@/lib/proposal-data";
import { formatInr, formatInrCompact } from "@/components/proposals/_shared/formatters";
import {
  PROPOSAL_BRANDING_UPDATED_EVENT,
  readProposalBrandingSettings,
  resolveProposalBankDetails,
} from "@/lib/proposal-branding-settings";
import { splitEmeraldWordmark, useEmeraldBrand } from "./emerald-brand";
import { useEmeraldLang } from "./emerald-lang-context";
import type { EmeraldCopy } from "./emerald-copy";
import styles from "./Emerald.module.css";

export type EmeraldClosingProps = {
  data: ProposalData;
  folio: string;
};

const DEFAULT_STEPS = [
  { title: "Advance", percent: 25 },
  { title: "Material delivery", percent: 50 },
  { title: "Installation", percent: 20 },
  { title: "Grid connection", percent: 5 },
] as const;

type Milestone = {
  phase: string;
  title: string;
  percent: number;
  amountInr: number;
};

function buildMilestones(
  data: ProposalData,
  copy: EmeraldCopy
): Milestone[] {
  const base =
    data.economics.grossInr > 0
      ? data.economics.grossInr
      : data.economics.netInr;
  const payments = (data.execution.payments ?? []).filter((p) => !p.isTotal);
  const defaults = copy.pay.defaultSteps;

  if (payments.length >= 3) {
    return payments.slice(0, 4).map((p, i) => {
      const pctMatch = p.pctLabel?.match(/(\d+(?:\.\d+)?)\s*%/);
      const percent = pctMatch
        ? Number(pctMatch[1])
        : base > 0 && p.amountInr > 0
          ? Math.round((p.amountInr / base) * 100)
          : defaults[i]?.percent ?? DEFAULT_STEPS[i]?.percent ?? 0;
      return {
        phase: String(i + 1).padStart(2, "0"),
        title:
          p.label.replace(/^\d+\.\s*/, "") ||
          defaults[i]?.title ||
          copy.pay.stageFallback,
        percent,
        amountInr: p.amountInr,
      };
    });
  }

  return defaults.map((s, i) => ({
    phase: String(i + 1).padStart(2, "0"),
    title: s.title,
    percent: s.percent,
    amountInr: base > 0 ? Math.round((base * s.percent) / 100) : 0,
  }));
}

function readBank(data: ProposalData) {
  return resolveProposalBankDetails({
    pptBank: {
      accountName: data.execution.bank.company,
      accountNumber: data.execution.bank.accountNumber,
      ifsc: data.execution.bank.ifsc,
      upiId: data.execution.bank.upiId,
    },
    settings: readProposalBrandingSettings(),
  });
}

export function EmeraldClosing({ data, folio }: EmeraldClosingProps) {
  const { copy } = useEmeraldLang();
  const brand = useEmeraldBrand(data);
  const company = brand || copy.common.installerFallback;
  const { primary } = splitEmeraldWordmark(company);
  const client = data.meta.customerName?.trim() || copy.common.customerFallback;
  const gross =
    data.economics.grossInr > 0
      ? data.economics.grossInr
      : data.economics.netInr;
  const steps = buildMilestones(data, copy);
  const [bank, setBank] = useState(() => readBank(data));

  useEffect(() => {
    const sync = () => setBank(readBank(data));
    sync();
    window.addEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [data]);

  const bankRows = [
    bank.accountName
      ? { label: copy.pay.accountName, value: bank.accountName }
      : null,
    bank.accountNumber
      ? { label: copy.pay.account, value: bank.accountNumber }
      : null,
    bank.ifsc ? { label: copy.pay.ifsc, value: bank.ifsc } : null,
    bank.upiId ? { label: copy.pay.upi, value: bank.upiId } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <section className={styles.a4Page}>
      <div className={styles.sidebar}>
        <span className={styles.folioNum}>{folio}</span>
        <div>
          <span className={styles.goldEyebrow}>{copy.common.section(folio)}</span>
          <h3 className={styles.sidebarTitle}>
            {copy.pay.sidebarTitle[0]}
            <br />
            {copy.pay.sidebarTitle[1]}
          </h3>
          <p className={styles.sidebarBlurb}>{copy.pay.sidebarBlurb}</p>
        </div>
      </div>

      <div className={styles.contentArea}>
        <h2 className={styles.pageHeader}>{copy.pay.pageHeader}</h2>

        <p className={styles.closingLead}>{copy.pay.lead}</p>

        <div className={styles.dossierReceipt}>
          <div className={styles.receiptHeader}>
            {gross > 0
              ? copy.pay.stagesBased(formatInrCompact(gross))
              : copy.pay.stages}
          </div>

          {steps.map((step) => (
            <div key={step.phase} className={styles.receiptRow}>
              <span className={styles.receiptPhase}>
                {step.phase}. {step.title}
              </span>
              <span className={styles.receiptPercent}>
                {copy.pay.ofValue(step.percent)}
              </span>
              <span className={styles.receiptAmount}>
                {step.amountInr > 0 ? formatInr(step.amountInr) : "—"}
              </span>
            </div>
          ))}
        </div>

        {bankRows.length > 0 ? (
          <div className={styles.bankBox}>
            <span className={styles.bankTitle}>{copy.pay.bank}</span>
            <div className={styles.bankGrid}>
              {bankRows.map((row) => (
                <div key={row.label}>
                  <span className={styles.bankLabel}>{row.label}</span>
                  <span className={styles.bankValue}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className={styles.signatureArea}>
          <div className={styles.sigLine}>
            <div className={styles.sigSpace} />
            <span className={styles.sigName}>{client}</span>
            <span className={styles.sigTitle}>{copy.pay.customerSig}</span>
          </div>

          <div className={styles.sigLine}>
            <div className={styles.sigSpace}>
              {primary ? (
                <span className={styles.sigMark}>{primary}</span>
              ) : null}
            </div>
            <span className={styles.sigName}>{company}</span>
            <span className={styles.sigTitle}>{copy.pay.companySig}</span>
          </div>
        </div>

        <p className={styles.closingDisclaimer}>{copy.pay.disclaimer}</p>
      </div>
    </section>
  );
}

export default EmeraldClosing;
