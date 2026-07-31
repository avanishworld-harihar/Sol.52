"use client";

/**
 * Quantum payment page — plan + side bank box, payment rules, signatures.
 * Full terms live on QuantumTerms pages (Premium Luxe parity).
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
import { useQuantumLang } from "./quantum-lang-context";
import type { QuantumCopy } from "./quantum-copy";
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

  const resolved = resolveProposalBankDetails({
    pptBank: {
      accountName: cleanBank(fromData.company) || undefined,
      accountNumber: cleanBank(fromData.accountNumber) || undefined,
      ifsc: cleanBank(fromData.ifsc) || undefined,
      upiId: cleanBank(fromData.upiId) || undefined,
    },
    settings,
  });

  void tick;

  return {
    accountName: cleanBank(resolved.accountName),
    accountNumber: cleanBank(resolved.accountNumber),
    ifsc: cleanBank(resolved.ifsc).toUpperCase(),
    branch: cleanBank(resolved.branch),
    upiId: cleanBank(resolved.upiId),
  };
}

/** Space account digits in groups for easy reading / copy. */
function formatAccountDisplay(raw: string): string {
  const digits = raw.replace(/\s+/g, "");
  if (!/^\d{9,18}$/.test(digits)) return raw;
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
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

function buildMilestones(
  data: ProposalData,
  defaultSteps: QuantumCopy["pay"]["defaultSteps"],
  stageFallback: string
): Milestone[] {
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
          : defaultSteps[i]?.percent ?? 0;
      return {
        phase: String(i + 1).padStart(2, "0"),
        title:
          p.label.replace(/^\d+\.\s*/, "") ||
          defaultSteps[i]?.title ||
          stageFallback,
        desc: p.pctLabel || defaultSteps[i]?.desc || "",
        percent,
        amountInr: p.amountInr,
      };
    });
  }

  return defaultSteps.map((s, i) => ({
    phase: String(i + 1).padStart(2, "0"),
    title: s.title,
    desc: s.desc,
    percent: s.percent,
    amountInr: base > 0 ? Math.round((base * s.percent) / 100) : 0,
  }));
}

export function QuantumAuthorization({ data }: QuantumAuthorizationProps) {
  const { copy } = useQuantumLang();
  const brand = useQuantumBrand(data) || QUANTUM_DEFAULT_BRAND;
  const client =
    data.meta.customerName?.trim() || copy.pay.customerFallback;
  const steps = buildMilestones(data, copy.pay.defaultSteps, copy.pay.stage);
  const bank = useResolvedQuantumBank(data);
  const company = bank.accountName || brand;
  const hasBank = Boolean(bank.accountNumber || bank.ifsc || bank.upiId);

  const gross = data.economics.grossInr;
  const net = data.economics.netInr;
  const projectValue = gross > 0 ? gross : net;

  const paymentRules =
    data.terms.conditions.length > 0
      ? data.terms.conditions.slice(0, 4)
      : copy.pay.defaultRules;

  return (
    <section className={`${styles.a4Page} ${styles.authPage}`}>
      <div className={styles.pageHeader}>
        <span
          className={styles.cyanText}
          style={{ fontSize: "0.75rem", letterSpacing: "3px" }}
        >
          {copy.pay.eyebrow}
        </span>
        <h2>{copy.pay.title}</h2>
      </div>

      {projectValue > 0 ? (
        <p className={styles.payLead}>
          {copy.pay.leadWithValue(
            formatInr(projectValue),
            gross > 0 && net > 0 && net !== gross
              ? `${copy.pay.netAfter}${formatInr(net)}`
              : ""
          )}
        </p>
      ) : (
        <p className={styles.payLead}>{copy.pay.leadFallback}</p>
      )}

      <div className={styles.payPlanBankRow}>
        <div className={`${styles.glass3D} ${styles.payScheduleCard}`}>
          <span className={styles.paySectionTitle}>{copy.pay.planTitle}</span>
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

        <aside className={`${styles.glass3D} ${styles.payBankCard}`}>
          <div className={styles.payBankHead}>
            <IllustBank />
            <div className={styles.payBankHeadText}>
              <span className={styles.paySectionTitle}>{copy.pay.bankTitle}</span>
              <p className={styles.payBankNote}>{copy.pay.bankNote}</p>
            </div>
          </div>

          {hasBank ? (
            <div className={styles.payBankClear}>
              <div className={styles.payBankRow}>
                <span>{copy.pay.name}</span>
                <strong>{company || "—"}</strong>
              </div>
              <div className={`${styles.payBankRow} ${styles.payBankRowHero}`}>
                <span>{copy.pay.acNumber}</span>
                <strong className={styles.payBankMono}>
                  {bank.accountNumber
                    ? formatAccountDisplay(bank.accountNumber)
                    : "—"}
                </strong>
              </div>
              <div className={styles.payBankRow}>
                <span>{copy.pay.ifsc}</span>
                <strong className={styles.payBankMono}>
                  {bank.ifsc || "—"}
                </strong>
              </div>
              {bank.upiId ? (
                <div className={styles.payBankRow}>
                  <span>{copy.pay.upi}</span>
                  <strong className={styles.payBankMono}>{bank.upiId}</strong>
                </div>
              ) : null}
              {bank.branch ? (
                <div className={styles.payBankRow}>
                  <span>{copy.pay.branch}</span>
                  <strong>{bank.branch}</strong>
                </div>
              ) : null}
            </div>
          ) : (
            <div className={styles.payBankEmpty}>{copy.pay.bankEmpty}</div>
          )}
        </aside>
      </div>

      <div className={`${styles.glass3D} ${styles.payRulesCard}`}>
        <span className={styles.paySectionTitle}>{copy.pay.rulesTitle}</span>
        <ul className={styles.payRulesList}>
          {paymentRules.map((rule) => (
            <li key={rule.slice(0, 40)}>{rule}</li>
          ))}
        </ul>
        <p className={styles.payRulesFoot}>{copy.pay.rulesFoot}</p>
      </div>

      <div className={`${styles.glass3D} ${styles.authGateway}`}>
        <span className={styles.authGatewayTitle}>{copy.pay.signatures}</span>
        <div className={styles.authSigRow}>
          <div className={styles.authSigCol}>
            <div className={styles.authSigLine} />
            <span className={styles.authSigName}>{client}</span>
            <span className={styles.authSigRole}>{copy.pay.customer}</span>
          </div>
          <div className={styles.authSigCol}>
            <div className={styles.authSigLine} />
            <span className={styles.authSigName}>{brand}</span>
            <span className={styles.authSigRoleCyan}>{copy.pay.installer}</span>
          </div>
        </div>
        <p className={styles.authDisclaimer}>{copy.pay.disclaimer}</p>
      </div>
    </section>
  );
}

export default QuantumAuthorization;
