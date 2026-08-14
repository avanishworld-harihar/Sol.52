"use client";

/**
 * Emerald Signature — Execution Mandate (vintage receipt + signatures).
 */

import type { ProposalData } from "@/lib/proposal-data";
import { formatInr, formatInrCompact } from "@/components/proposals/_shared/formatters";
import { splitEmeraldWordmark, useEmeraldBrand } from "./emerald-brand";
import { useEmeraldLang } from "./emerald-lang-context";
import type { EmeraldCopy } from "./emerald-copy";
import styles from "./Emerald.module.css";

export type EmeraldClosingProps = {
  data: ProposalData;
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

export function EmeraldClosing({ data }: EmeraldClosingProps) {
  const { copy } = useEmeraldLang();
  const brand = useEmeraldBrand(data);
  const { primary } = splitEmeraldWordmark(brand);
  const client = data.meta.customerName?.trim() || copy.common.customerFallback;
  const gross =
    data.economics.grossInr > 0
      ? data.economics.grossInr
      : data.economics.netInr;
  const steps = buildMilestones(data, copy);

  return (
    <section className={styles.a4Page}>
      <div className={styles.sidebar}>
        <span className={styles.folioNum}>05</span>
        <div>
          <span className={styles.goldEyebrow}>{copy.pay.eyebrow}</span>
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

        <div className={styles.signatureArea}>
          <div className={styles.sigLine}>
            <div className={styles.sigSpace} />
            <span className={styles.sigName}>{client}</span>
            <span className={styles.sigTitle}>{copy.pay.customerSig}</span>
          </div>

          <div className={styles.sigLine}>
            <div className={styles.sigSpace}>
              <span className={styles.sigMark}>{primary}</span>
            </div>
            <span className={styles.sigName}>{brand}</span>
            <span className={styles.sigTitle}>{copy.pay.companySig}</span>
          </div>
        </div>

        <p className={styles.closingDisclaimer}>
          {copy.pay.disclaimer}
        </p>
      </div>
    </section>
  );
}

export default EmeraldClosing;
