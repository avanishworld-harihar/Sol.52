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
  { title: "Project Advance", percent: 25 },
  { title: "Material Delivery", percent: 50 },
  { title: "Installation Setup", percent: 20 },
  { title: "Grid Commissioning", percent: 5 },
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
          <span className={styles.goldEyebrow}>FINAL SECTION</span>
          <h3 className={styles.sidebarTitle}>
            Execution
            <br />
            Mandate.
          </h3>
          <p className={styles.sidebarBlurb}>
            Formal deployment protocol, payment scheduling, and project
            authorization.
          </p>
        </div>
      </div>

      <div className={styles.contentArea}>
        <h2 className={styles.pageHeader}>Deployment Protocol</h2>

        <p className={styles.closingLead}>
          Capital deployment is gated against clear project milestones to ensure
          risk-free execution and complete transparency throughout the
          installation lifecycle.
        </p>

        <div className={styles.dossierReceipt}>
          <div className={styles.receiptHeader}>
            Investment Milestone Schedule
            {gross > 0
              ? ` (Based on ${formatInrCompact(gross)} Gross)`
              : ""}
          </div>

          {steps.map((step) => (
            <div key={step.phase} className={styles.receiptRow}>
              <span className={styles.receiptPhase}>
                {step.phase}. {step.title}
              </span>
              <span className={styles.receiptPercent}>
                {step.percent}% of Project Value
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
            <span className={styles.sigTitle}>CLIENT ACCEPTANCE</span>
          </div>

          <div className={styles.sigLine}>
            <div className={styles.sigSpace}>
              <span className={styles.sigMark}>{primary}</span>
            </div>
            <span className={styles.sigName}>{brand}</span>
            <span className={styles.sigTitle}>AUTHORIZED SIGNATORY</span>
          </div>
        </div>

        <p className={styles.closingDisclaimer}>
          PROPOSAL VALID FOR 30 DAYS. FINAL PRICING IS SUBJECT TO DISCOM
          APPROVAL AND DETAILED SITE SURVEY.
        </p>
      </div>
    </section>
  );
}

export default EmeraldClosing;
