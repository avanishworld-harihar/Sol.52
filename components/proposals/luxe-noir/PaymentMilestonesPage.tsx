"use client";

/**
 * Premium Luxe — Payment milestones + vendor bank account.
 * Simple English · gate-based payment system · bank remittance block.
 */

import type { ProposalData } from "@/lib/proposal-data";
import { formatLuxeInr, formatLuxeInrReadable } from "./luxe-format";
import { resolveLuxeVendorName } from "./luxe-vendor";
import { ExpertVerdict } from "./ExpertVerdict";
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

function cleanBank(value: string | undefined): string {
  const v = (value ?? "").trim();
  if (!v || v === "—" || v === "-") return "";
  return v;
}

function IllustBank() {
  return (
    <svg viewBox="0 0 72 56" className={styles.payBankIcon} aria-hidden>
      <rect x="8" y="20" width="56" height="28" rx="2" fill="none" stroke="#B8962E" strokeWidth="1.5" />
      <path d="M12 20 L36 8 L60 20" fill="none" stroke="#141820" strokeWidth="1.5" />
      <line x1="18" y1="28" x2="18" y2="42" stroke="#B8962E" strokeWidth="1.2" />
      <line x1="28" y1="28" x2="28" y2="42" stroke="#B8962E" strokeWidth="1.2" />
      <line x1="36" y1="28" x2="36" y2="42" stroke="#B8962E" strokeWidth="1.2" />
      <line x1="44" y1="28" x2="44" y2="42" stroke="#B8962E" strokeWidth="1.2" />
      <line x1="54" y1="28" x2="54" y2="42" stroke="#B8962E" strokeWidth="1.2" />
      <rect x="14" y="44" width="44" height="4" fill="#141820" opacity="0.85" />
    </svg>
  );
}

export function PaymentMilestonesPage({
  data,
  milestones,
  paymentTerms,
  brand,
}: PaymentMilestonesPageProps) {
  const bank = data.execution.bank;
  const vendorName =
    (brand?.trim() || resolveLuxeVendorName(data) || "").trim() || "Solar Partner";
  const company = cleanBank(bank.company) || vendorName;
  const accountNumber = cleanBank(bank.accountNumber);
  const ifsc = cleanBank(bank.ifsc);
  const upiId = cleanBank(bank.upiId);
  const hasBank = Boolean(accountNumber || ifsc || upiId);

  const gross = data.economics.grossInr;
  const net = data.economics.netInr;
  const projectValue = gross > 0 ? gross : net;

  return (
    <section
      className={`${styles.a4Page} ${styles.payPage} ${luxeDisplayFont.variable}`}
    >
      <header className={styles.luxeHeaderBlock}>
        <span className={styles.goldTag}>08 // PAYMENT SYSTEM</span>
        <h2 className={styles.luxeHeadline}>How You Pay.</h2>
      </header>

      <p className={styles.payLead}>
        You pay in four clear steps. Each payment unlocks the next stage of work — from
        booking to switch-on.
        {projectValue > 0 ? (
          <>
            {" "}
            Project value shown:{" "}
            <strong className={styles.luxeNum}>{formatLuxeInr(projectValue)}</strong>
            {gross > 0 && net > 0 && net !== gross
              ? ` (net after subsidy about ${formatLuxeInrReadable(net)})`
              : ""}
            .
          </>
        ) : null}
      </p>

      {/* Visual payment gates */}
      <div className={styles.payGateTrack} aria-hidden>
        {milestones.map((m, i) => (
          <div key={m.step} className={styles.payGate}>
            <div className={styles.payGateDot}>{m.step}</div>
            {i < milestones.length - 1 ? <div className={styles.payGateLine} /> : null}
            <span className={styles.payGateLabel}>{m.title}</span>
          </div>
        ))}
      </div>

      <div className={styles.payMilestoneList}>
        {milestones.map((m) => (
          <div key={m.step} className={styles.payMilestoneRow}>
            <span className={styles.payMilestoneNum}>{m.step}</span>
            <div className={styles.payMilestoneBody}>
              <strong>{m.title}</strong>
              <span>{m.percent} of project value · due at this stage</span>
            </div>
            <em className={`${styles.payMilestoneAmt} ${styles.luxeNum}`}>
              {m.amountLabel}
            </em>
          </div>
        ))}
      </div>

      {/* Vendor bank */}
      <div className={styles.payBankBlock}>
        <div className={styles.payBankHead}>
          <IllustBank />
          <div>
            <span className={styles.payBankEyebrow}>VENDOR BANK ACCOUNT</span>
            <h3 className={styles.payBankTitle}>Pay only to this account</h3>
            <p className={styles.payBankNote}>
              Use these details for advance and all milestone transfers. Keep the payment
              screenshot for your records.
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
              <strong className={styles.luxeNum}>{accountNumber || "—"}</strong>
            </div>
            <div className={styles.payBankCell}>
              <span>IFSC</span>
              <strong className={styles.luxeNum}>{ifsc || "—"}</strong>
            </div>
            <div className={styles.payBankCell}>
              <span>UPI</span>
              <strong>{upiId || "—"}</strong>
            </div>
          </div>
        ) : (
          <div className={styles.payBankEmpty}>
            Bank details will be shared on the official invoice / booking confirmation.
            Please do not transfer to any personal account.
          </div>
        )}
      </div>

      <div className={styles.payTermsBox}>
        <span className={styles.payTermsLabel}>PAYMENT RULES</span>
        <ul>
          {(paymentTerms.length > 0
            ? paymentTerms
            : [
                "Proposal valid for 30 days from issue date.",
                "Final price may change after site survey.",
                "Subsidy depends on MNRE / DISCOM approval.",
                "Net metering timing depends on your local DISCOM.",
              ]
          ).map((t) => (
            <li key={t.slice(0, 48)}>{t}</li>
          ))}
        </ul>
      </div>

      <ExpertVerdict label="PROJECT DIRECTOR'S VERDICT">
        Pay stage by stage — booking, material, installation, then commissioning. Always
        use the vendor bank account above so every rupee is tracked against work on your
        roof.
      </ExpertVerdict>

      <footer className={styles.impactPageFooter}>
        <span>{vendorName.toUpperCase()}</span>
        <span>08 / 11</span>
      </footer>
    </section>
  );
}

export default PaymentMilestonesPage;
