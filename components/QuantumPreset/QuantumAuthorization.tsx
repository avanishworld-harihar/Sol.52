"use client";

/**
 * Quantum last page — payment plan, vendor bank (More settings), terms, signatures.
 * Bank resolve matches Premium Luxe; terms adapted from Luxe TermsCompliance (simple English).
 */

import { useEffect, useState } from "react";
import type { ProposalData } from "@/lib/proposal-data";
import { formatInr } from "@/components/proposals/_shared/formatters";
import {
  PROPOSAL_BRANDING_UPDATED_EVENT,
  readProposalBrandingSettings,
  resolveProposalBankDetails,
} from "@/lib/proposal-branding-settings";
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
  title: string;
  desc: string;
  percent: number;
  amountInr: number;
};

const DEFAULT_STEPS: { title: string; desc: string; percent: number }[] = [
  { title: "Advance", desc: "Booking and material order", percent: 25 },
  { title: "Material", desc: "Delivery of equipment at site", percent: 50 },
  { title: "Installation", desc: "Structure and panel mounting", percent: 20 },
  { title: "Commissioning", desc: "Testing and net-meter activation", percent: 5 },
];

/** Condensed from Premium Luxe TermsCompliance — simple English. */
const GENERAL_TERMS: { label: string; text: string }[] = [
  {
    label: "Load change",
    text: "DISCOM load change or pole-to-meter cable work, if needed, is in the customer's scope.",
  },
  {
    label: "Statutory fees",
    text: "Government fees for net-metering, subsidy, and DISCOM approvals are paid by the client.",
  },
  {
    label: "Arrears",
    text: "Clear pending DISCOM bills before any load-increase process.",
  },
  {
    label: "Inverter warranty",
    text: "As per manufacturer — usually 8–10 years on string inverters.",
  },
  {
    label: "Module warranty",
    text: "Product 15 years; performance ≥80% at year 30. Other parts: 1 year from commissioning.",
  },
  {
    label: "Warranty scope",
    text: "Covers manufacturing defects only — not physical damage, misuse, or vandalism.",
  },
  {
    label: "Maintenance",
    text: "Regular panel cleaning (recommended weekly) is the customer's responsibility.",
  },
  {
    label: "Timeline",
    text: "Installation in about 30–40 working days from advance, as per the agreed schedule.",
  },
  {
    label: "Refunds",
    text: "If applicable: after 2.5% deduction on the final amount plus documented expenses.",
  },
  {
    label: "Other terms",
    text: "Anything not listed here follows a mutual written agreement.",
  },
];

const DEFAULT_PAYMENT_RULES = [
  "Proposal valid for 30 days from issue date.",
  "Final price may change after site survey.",
  "Subsidy depends on MNRE / DISCOM approval.",
  "Net metering timing depends on your local DISCOM.",
];

function cleanBank(value: string | undefined | null): string {
  const v = (value ?? "").trim();
  if (!v || v === "—" || v === "-" || v.toLowerCase() === "n/a") return "";
  return v;
}

function useResolvedQuantumBank(data: ProposalData) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    window.addEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, bump);
    return () => window.removeEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, bump);
  }, []);

  const fromData = data.execution.bank;
  const settings =
    typeof window !== "undefined" ? readProposalBrandingSettings() : null;

  const pptNum = cleanBank(fromData.accountNumber);
  const pptIfsc = cleanBank(fromData.ifsc);
  const pptUpi = cleanBank(fromData.upiId);
  const dataHasCoords = Boolean(pptNum || pptIfsc || pptUpi);

  const resolved = resolveProposalBankDetails({
    pptBank: {
      accountName: dataHasCoords
        ? cleanBank(fromData.company) || undefined
        : undefined,
      accountNumber: pptNum || undefined,
      ifsc: pptIfsc || undefined,
      upiId: pptUpi || undefined,
    },
    settings,
  });

  void tick;

  return {
    accountName: cleanBank(resolved.accountName),
    accountNumber: cleanBank(resolved.accountNumber),
    ifsc: cleanBank(resolved.ifsc),
    branch: cleanBank(resolved.branch),
    upiId: cleanBank(resolved.upiId),
  };
}

function IllustBank() {
  return (
    <svg viewBox="0 0 72 56" className={styles.payBankIcon} aria-hidden>
      <path
        d="M10 24 L36 8 L62 24 Z"
        fill="rgba(6,182,212,0.18)"
        stroke="#06B6D4"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <rect
        x="14"
        y="24"
        width="44"
        height="22"
        fill="#0c1622"
        stroke="#06B6D4"
        strokeWidth="1.2"
      />
      {[22, 30, 38, 46, 54].map((x) => (
        <rect
          key={x}
          x={x - 2}
          y="28"
          width="4"
          height="14"
          rx="0.6"
          fill="rgba(6,182,212,0.35)"
        />
      ))}
      <rect x="12" y="46" width="48" height="4" rx="1" fill="#1e293b" />
      <circle cx="56" cy="18" r="9" fill="#0a1420" stroke="#22D3EE" strokeWidth="1.2" />
      <text
        x="56"
        y="22"
        textAnchor="middle"
        fill="#67E8F9"
        fontSize="10"
        fontWeight="700"
      >
        ₹
      </text>
    </svg>
  );
}

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
        title: p.label.replace(/^\d+\.\s*/, "") || DEFAULT_STEPS[i]?.title || "Stage",
        desc: p.pctLabel || DEFAULT_STEPS[i]?.desc || "",
        percent,
        amountInr: p.amountInr,
      };
    });
  }

  return DEFAULT_STEPS.map((s, i) => ({
    phase: String(i + 1).padStart(2, "0"),
    title: s.title,
    desc: s.desc,
    percent: s.percent,
    amountInr: base > 0 ? Math.round((base * s.percent) / 100) : 0,
  }));
}

export function QuantumAuthorization({ data }: QuantumAuthorizationProps) {
  const brand = useQuantumBrand(data) || QUANTUM_DEFAULT_BRAND;
  const client = data.meta.customerName?.trim() || "Customer Name";
  const steps = buildMilestones(data);
  const bank = useResolvedQuantumBank(data);
  const company = bank.accountName || brand;
  const hasBank = Boolean(bank.accountNumber || bank.ifsc || bank.upiId);

  const gross = data.economics.grossInr;
  const net = data.economics.netInr;
  const projectValue = gross > 0 ? gross : net;

  const paymentRules =
    data.terms.conditions.length > 0
      ? data.terms.conditions.slice(0, 4)
      : DEFAULT_PAYMENT_RULES;

  return (
    <section className={`${styles.a4Page} ${styles.authPage}`}>
      <div className={styles.pageHeader}>
        <span
          className={styles.cyanText}
          style={{ fontSize: "0.75rem", letterSpacing: "3px" }}
        >
          05 // PAYMENT &amp; TERMS
        </span>
        <h2>Payment &amp; Agreement.</h2>
      </div>

      {projectValue > 0 ? (
        <p className={styles.payLead}>
          Project value: <strong>{formatInr(projectValue)}</strong>
          {gross > 0 && net > 0 && net !== gross
            ? ` · Net after subsidy: ${formatInr(net)}`
            : null}
          . Pay stage-wise into the vendor account below.
        </p>
      ) : (
        <p className={styles.payLead}>
          Pay stage-wise into the vendor bank account from More settings.
        </p>
      )}

      <div className={styles.payTopGrid}>
        {/* Payment schedule */}
        <div className={`${styles.glass3D} ${styles.payScheduleCard}`}>
          <span className={styles.paySectionTitle}>Payment plan</span>
          <div className={styles.payScheduleList}>
            {steps.map((step) => (
              <div key={step.phase} className={styles.payMilestoneRow}>
                <span className={styles.payMilestoneNum}>{step.phase}</span>
                <div className={styles.payMilestoneBody}>
                  <strong>{step.title}</strong>
                  <span>
                    {step.percent}% · {step.desc}
                  </span>
                </div>
                <em className={styles.payMilestoneAmt}>
                  {step.amountInr > 0 ? formatInr(step.amountInr) : "—"}
                </em>
              </div>
            ))}
          </div>
        </div>

        {/* Bank from More settings */}
        <div className={`${styles.glass3D} ${styles.payBankCard}`}>
          <div className={styles.payBankHead}>
            <IllustBank />
            <div>
              <span className={styles.paySectionTitle}>Vendor bank account</span>
              <p className={styles.payBankNote}>
                Transfer only to this account (from More → Brand settings).
              </p>
            </div>
          </div>

          {hasBank ? (
            <div className={styles.payBankGrid}>
              <div className={styles.payBankCell}>
                <span>Account name</span>
                <strong>{company || "—"}</strong>
              </div>
              <div className={styles.payBankCell}>
                <span>Account number</span>
                <strong>{bank.accountNumber || "—"}</strong>
              </div>
              <div className={styles.payBankCell}>
                <span>IFSC</span>
                <strong>{bank.ifsc || "—"}</strong>
              </div>
              <div className={styles.payBankCell}>
                <span>UPI</span>
                <strong>{bank.upiId || "—"}</strong>
              </div>
              {bank.branch ? (
                <div className={`${styles.payBankCell} ${styles.payBankCellWide}`}>
                  <span>Branch</span>
                  <strong>{bank.branch}</strong>
                </div>
              ) : null}
            </div>
          ) : (
            <div className={styles.payBankEmpty}>
              Add bank details in More → Brand settings to show them here.
            </div>
          )}
        </div>
      </div>

      {/* Terms — from Luxe, Quantum style */}
      <div className={`${styles.glass3D} ${styles.payTermsCard}`}>
        <div className={styles.payTermsHead}>
          <span className={styles.paySectionTitle}>Terms &amp; conditions</span>
          <span className={styles.payTermsHint}>Key points from this proposal</span>
        </div>
        <div className={styles.payTermsGrid}>
          {GENERAL_TERMS.map((t) => (
            <div key={t.label} className={styles.payTermItem}>
              <strong>{t.label}</strong>
              <p>{t.text}</p>
            </div>
          ))}
        </div>
        <ul className={styles.payRulesList}>
          {paymentRules.map((rule) => (
            <li key={rule.slice(0, 40)}>{rule}</li>
          ))}
        </ul>
      </div>

      {/* Signatures */}
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
          By signing, both parties agree to the payment plan and terms above.
        </p>
      </div>
    </section>
  );
}

export default QuantumAuthorization;
