"use client";

/**
 * Emerald Signature — Execution Mandate (vintage receipt + signatures).
 */

import type { ProposalData } from "@/lib/proposal-data";
import { formatInr, formatInrCompact } from "@/components/proposals/_shared/formatters";
import { splitEmeraldWordmark, useEmeraldBrand } from "./emerald-brand";
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

function buildMilestones(data: ProposalData): Milestone[] {
  const base =
    data.economics.grossInr > 0
      ? data.economics.grossInr
      : data.economics.netInr;
  const payments = (data.execution.payments ?? []).filter((p) => !p.isTotal);

  if (payments.length >= 3) {
    return payments.slice(0, 4).map((p, i) => {
      const pctMatch = p.pctLabel?.match(/(\d+(?:\.\d+)?)\s*%/);
      const percent = pctMatch
        ? Number(pctMatch[1])
        : base > 0 && p.amountInr > 0
          ? Math.round((p.amountInr / base) * 100)
          : DEFAULT_STEPS[i]?.percent ?? 0;
      return {
        phase: String(i + 1).padStart(2, "0"),
        title:
          p.label.replace(/^\d+\.\s*/, "") ||
          DEFAULT_STEPS[i]?.title ||
          "Stage",
        percent,
        amountInr: p.amountInr,
      };
    });
  }

  return DEFAULT_STEPS.map((s, i) => ({
    phase: String(i + 1).padStart(2, "0"),
    title: s.title,
    percent: s.percent,
    amountInr: base > 0 ? Math.round((base * s.percent) / 100) : 0,
  }));
}

export function EmeraldClosing({ data }: EmeraldClosingProps) {
  const brand = useEmeraldBrand(data);
  const { primary } = splitEmeraldWordmark(brand);
  const client = data.meta.customerName?.trim() || "Customer Name";
  const gross =
    data.economics.grossInr > 0
      ? data.economics.grossInr
      : data.economics.netInr;
  const steps = buildMilestones(data);

  return (
    <section className={styles.a4Page}>
      <div className={styles.sidebar}>
        <span className={styles.folioNum}>05</span>
        <div>
          <span className={styles.goldEyebrow}>PAYMENT PLAN</span>
          <h3 className={styles.sidebarTitle}>
            How We
            <br />
            Get Paid.
          </h3>
          <p className={styles.sidebarBlurb}>
            Payment stages and signatures to start the project.
          </p>
        </div>
      </div>

      <div className={styles.contentArea}>
        <h2 className={styles.pageHeader}>Payment Schedule</h2>

        <p className={styles.closingLead}>
          You pay in stages as the work moves forward. This keeps the project
          clear and easy to follow from start to finish.
        </p>

        <div className={styles.dossierReceipt}>
          <div className={styles.receiptHeader}>
            Payment stages
            {gross > 0
              ? ` (based on ${formatInrCompact(gross)} gross)`
              : ""}
          </div>

          {steps.map((step) => (
            <div key={step.phase} className={styles.receiptRow}>
              <span className={styles.receiptPhase}>
                {step.phase}. {step.title}
              </span>
              <span className={styles.receiptPercent}>
                {step.percent}% of project value
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
            <span className={styles.sigTitle}>CUSTOMER SIGNATURE</span>
          </div>

          <div className={styles.sigLine}>
            <div className={styles.sigSpace}>
              <span className={styles.sigMark}>{primary}</span>
            </div>
            <span className={styles.sigName}>{brand}</span>
            <span className={styles.sigTitle}>COMPANY SIGNATURE</span>
          </div>
        </div>

        <p className={styles.closingDisclaimer}>
          THIS PROPOSAL IS VALID FOR 30 DAYS. FINAL PRICE DEPENDS ON DISCOM
          APPROVAL AND A DETAILED SITE SURVEY.
        </p>
      </div>
    </section>
  );
}

export default EmeraldClosing;
