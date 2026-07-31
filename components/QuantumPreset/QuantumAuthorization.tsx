"use client";

/**
 * Quantum Authorization — Deployment Protocol tracks + signature gateway.
 */

import type { ProposalData } from "@/lib/proposal-data";
import { formatInr } from "@/components/proposals/_shared/formatters";
import {
  QUANTUM_DEFAULT_BRAND,
  useQuantumBrand,
} from "./quantum-brand";
import styles from "./Quantum.module.css";

export type QuantumAuthorizationProps = {
  data: ProposalData;
};

type Milestone = {
  phase: string;
  desc: string;
  percent: number;
  amountInr: number;
};

const DEFAULT_STEPS: { phase: string; desc: string; percent: number }[] = [
  {
    phase: "01 / Advance",
    desc: "Booking and material order",
    percent: 25,
  },
  {
    phase: "02 / Material",
    desc: "Delivery of equipment at site",
    percent: 50,
  },
  {
    phase: "03 / Installation",
    desc: "Structure and panel mounting",
    percent: 20,
  },
  {
    phase: "04 / Commissioning",
    desc: "Testing and net-meter activation",
    percent: 5,
  },
];

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
        phase: `${String(i + 1).padStart(2, "0")} / ${p.label}`,
        desc: p.pctLabel || DEFAULT_STEPS[i]?.desc || "",
        percent,
        amountInr: p.amountInr,
      };
    });
  }

  return DEFAULT_STEPS.map((s) => ({
    ...s,
    amountInr: base > 0 ? Math.round((base * s.percent) / 100) : 0,
  }));
}

export function QuantumAuthorization({ data }: QuantumAuthorizationProps) {
  const brand = useQuantumBrand(data) || QUANTUM_DEFAULT_BRAND;
  const client = data.meta.customerName?.trim() || "Customer Name";
  const steps = buildMilestones(data);

  return (
    <section className={`${styles.a4Page} ${styles.authPage}`}>
      <div>
        <div className={styles.pageHeader}>
          <span
            className={styles.cyanText}
            style={{ fontSize: "0.75rem", letterSpacing: "3px" }}
          >
            05 // PAYMENT &amp; SIGN-OFF
          </span>
          <h2>Payment Plan.</h2>
        </div>

        <div className={`${styles.glass3D} ${styles.protocolTracks}`}>
          {steps.map((step, idx) => (
            <div
              key={step.phase}
              className={`${styles.protocolRow}${
                idx === steps.length - 1 ? ` ${styles.protocolRowLast}` : ""
              }`}
            >
              <div className={styles.protocolMeta}>
                <span className={styles.protocolPhase}>{step.phase}</span>
                <span className={styles.protocolDesc}>{step.desc}</span>
              </div>
              <div className={styles.protocolTrack}>
                <div
                  className={styles.protocolFill}
                  style={{ width: `${Math.min(100, Math.max(0, step.percent))}%` }}
                />
              </div>
              <div className={styles.protocolAmount}>
                <span className={styles.protocolAmountValue}>
                  {step.amountInr > 0 ? formatInr(step.amountInr) : "—"}
                </span>
                <span className={styles.protocolAmountPct}>
                  {step.percent}% of project cost
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`${styles.glass3D} ${styles.authGateway}`}>
        <span className={styles.authGatewayTitle}>Signatures</span>
        <div className={styles.authSigRow}>
          <div className={styles.authSigCol}>
            <div className={styles.authSigLine} />
            <span className={styles.authSigName}>{client}</span>
            <span className={styles.authSigRole}>Customer</span>
          </div>
          <div className={styles.authSigCol}>
            <div className={styles.authSigLine} />
            <span className={styles.authSigName}>{brand}</span>
            <span className={styles.authSigRoleCyan}>Installer</span>
          </div>
        </div>
        <p className={styles.authDisclaimer}>
          Valid for 30 days. Final price depends on DISCOM approval and site
          survey.
        </p>
      </div>
    </section>
  );
}

export default QuantumAuthorization;
