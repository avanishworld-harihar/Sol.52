"use client";

/**
 * Premium Luxe — Payment milestones + vendor bank account.
 * Compact schedule · bank details never clipped on A4.
 * Bank fields prefer proposal data, then More → Brand settings (local).
 */

import { useEffect, useState } from "react";
import type { ProposalData } from "@/lib/proposal-data";
import {
  PROPOSAL_BRANDING_UPDATED_EVENT,
  readProposalBrandingSettings,
  resolveProposalBankDetails,
} from "@/lib/proposal-branding-settings";
import { formatLuxeInr, formatLuxeInrReadable } from "./luxe-format";
import { useLuxeVendorName, luxeVendorOrFallback } from "./luxe-vendor";
import { ExpertVerdict } from "./ExpertVerdict";
import { useLuxeLang } from "./luxe-lang-context";
import { luxeDisplayFont } from "./luxe-fonts";
import styles from "./luxe.module.css";

export type PaymentMilestone = {
  step: string;
  title: string;
  amountLabel: string;
  percent: string;
  amountInr?: number;
};

export type PaymentMilestonesPageProps = {
  data: ProposalData;
  milestones: PaymentMilestone[];
  paymentTerms: string[];
  brand?: string;
};

function cleanBank(value: string | undefined | null): string {
  const v = (value ?? "").trim();
  if (!v || v === "—" || v === "-" || v.toLowerCase() === "n/a") return "";
  return v;
}

/** Clear “pay into bank account” metaphor — building + rupee. */
function IllustBank() {
  return (
    <svg viewBox="0 0 88 72" className={styles.payBankIcon} aria-hidden>
      <defs>
        <linearGradient id="payBankRoof" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(184,150,46,0.4)" />
          <stop offset="100%" stopColor="rgba(184,150,46,0.12)" />
        </linearGradient>
      </defs>
      <ellipse cx="44" cy="66" rx="30" ry="4" fill="rgba(20,24,32,0.08)" />
      <path
        d="M12 30 L44 10 L76 30 Z"
        fill="url(#payBankRoof)"
        stroke="#141820"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M12 30 L44 10 L76 30" fill="none" stroke="#B8962E" strokeWidth="1.8" />
      <rect
        x="16"
        y="30"
        width="56"
        height="28"
        fill="#F8F9FB"
        stroke="#141820"
        strokeWidth="1.4"
      />
      {[26, 36, 44, 52, 62].map((x) => (
        <rect
          key={x}
          x={x - 2.5}
          y="34"
          width="5"
          height="18"
          rx="0.8"
          fill="rgba(184,150,46,0.38)"
          stroke="#B8962E"
          strokeWidth="0.75"
        />
      ))}
      <rect x="12" y="58" width="64" height="5" rx="1" fill="#141820" />
      {/* Rupee badge — pay here */}
      <circle cx="68" cy="22" r="11" fill="#1e2a3a" stroke="#B8962E" strokeWidth="1.4" />
      <text
        x="68"
        y="26.5"
        textAnchor="middle"
        fill="#B8962E"
        fontSize="12"
        fontWeight="700"
        fontFamily="Georgia,serif"
      >
        ₹
      </text>
    </svg>
  );
}

function useResolvedLuxeBank(data: ProposalData) {
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

export function PaymentMilestonesPage({
  data,
  milestones,
  paymentTerms,
  brand,
}: PaymentMilestonesPageProps) {
  const { copy, isHi } = useLuxeLang();
  const bank = useResolvedLuxeBank(data);
  const fromSettings = useLuxeVendorName(data);
  const vendorName = luxeVendorOrFallback(brand?.trim() || fromSettings, isHi);
  const company = bank.accountName || vendorName;
  const hasBank = Boolean(bank.accountNumber || bank.ifsc || bank.upiId);

  const gross = data.economics.grossInr;
  const net = data.economics.netInr;
  const projectValue = gross > 0 ? gross : net;

  const rules =
    paymentTerms.length > 0
      ? paymentTerms
      : isHi
        ? [
            "प्रस्ताव जारी तिथि से 30 दिनों तक मान्य।",
            "साइट सर्वे के बाद अंतिम कीमत बदल सकती है।",
            "सब्सिडी MNRE / DISCOM मंज़ूरी पर निर्भर।",
            "नेट मीटरिंग समय आपके स्थानीय DISCOM पर निर्भर।",
          ]
        : [
            "Proposal valid for 30 days from issue date.",
            "Final price may change after site survey.",
            "Subsidy depends on MNRE / DISCOM approval.",
            "Net metering timing depends on your local DISCOM.",
          ];

  return (
    <section
      className={`${styles.a4Page} ${styles.payPage} ${luxeDisplayFont.variable}`}
    >
      <header className={styles.luxeHeaderBlock}>
        <span className={styles.goldTag}>{copy.pay.tag}</span>
        <h2 className={styles.luxeHeadline}>{copy.pay.title}</h2>
      </header>

      <p className={styles.payLead}>
        {copy.pay.lead}
        {projectValue > 0 ? (
          <>
            {" "}
            {copy.pay.projectValue}:{" "}
            <strong className={styles.luxeNum}>{formatLuxeInr(projectValue)}</strong>
            {gross > 0 && net > 0 && net !== gross
              ? ` (${copy.pay.netAfter} ${formatLuxeInrReadable(net)})`
              : ""}
            .
          </>
        ) : null}
      </p>

      {/* One compact schedule — no duplicate progress track */}
      <div className={styles.paySchedule}>
        <div className={styles.payScheduleHead}>
          <span>{copy.pay.scheduleHead}</span>
          <span className={styles.payScheduleHeadHint}>{copy.pay.scheduleHint}</span>
        </div>
        {milestones.map((m) => (
          <div key={m.step} className={styles.payMilestoneRow}>
            <span className={styles.payMilestoneNum}>{m.step}</span>
            <div className={styles.payMilestoneBody}>
              <strong>{m.title}</strong>
              <span>
                {m.percent} · {copy.pay.stageDue}
              </span>
            </div>
            <em className={`${styles.payMilestoneAmt} ${styles.luxeNum}`}>
              {m.amountLabel}
            </em>
          </div>
        ))}
      </div>

      {/* Bank — primary block, never flex-shrunk away */}
      <div className={styles.payBankBlock}>
        <div className={styles.payBankHead}>
          <IllustBank />
          <div>
            <span className={styles.payBankEyebrow}>{copy.pay.bankEyebrow}</span>
            <h3 className={styles.payBankTitle}>{copy.pay.bankTitle}</h3>
            <p className={styles.payBankNote}>{copy.pay.bankNote}</p>
          </div>
        </div>

        {hasBank ? (
          <div className={styles.payBankGrid}>
            <div className={styles.payBankCell}>
              <span>{copy.pay.accountName}</span>
              <strong>{company || "—"}</strong>
            </div>
            <div className={styles.payBankCell}>
              <span>{copy.pay.accountNo}</span>
              <strong className={styles.luxeNum}>{bank.accountNumber || "—"}</strong>
            </div>
            <div className={styles.payBankCell}>
              <span>{copy.pay.ifsc}</span>
              <strong className={styles.luxeNum}>{bank.ifsc || "—"}</strong>
            </div>
            <div className={styles.payBankCell}>
              <span>{copy.pay.upi}</span>
              <strong>{bank.upiId || "—"}</strong>
            </div>
            {bank.branch ? (
              <div className={`${styles.payBankCell} ${styles.payBankCellWide}`}>
                <span>{isHi ? "शाखा" : "Branch"}</span>
                <strong>{bank.branch}</strong>
              </div>
            ) : null}
          </div>
        ) : (
          <div className={styles.payBankEmpty}>{copy.pay.bankEmpty}</div>
        )}
      </div>

      <div className={styles.payBottomRow}>
        <div className={styles.payTermsBox}>
          <span className={styles.payTermsLabel}>{copy.pay.rules}</span>
          <ul>
            {rules.map((t) => (
              <li key={t.slice(0, 48)}>{t}</li>
            ))}
          </ul>
        </div>
        <ExpertVerdict label={copy.pay.verdictLabel}>{copy.pay.verdict}</ExpertVerdict>
      </div>

      <footer className={styles.impactPageFooter}>
        <span>{vendorName.toUpperCase()}</span>
        <span>08 / 11</span>
      </footer>
    </section>
  );
}

export default PaymentMilestonesPage;
