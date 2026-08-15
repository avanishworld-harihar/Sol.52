"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { formatInr, formatInrCompact } from "@/components/proposals/_shared/formatters";
import styles from "./Lumina.module.css";
import { formatLuminaKw, luminaBrand, luminaLocation } from "./lumina-live";

export function LuminaClosingPage({ data }: { data: ProposalData }) {
  const customer = data.meta.customerName?.trim() || "—";
  const systemKw = Number(data.meta.systemKw) || 0;
  const installer = data.closing.installerName?.trim() || luminaBrand(data);
  const location = luminaLocation(data);
  const gross = data.economics.grossInr;
  const payments = (data.execution.payments ?? []).filter((p) => p.label?.trim());
  const bank = data.execution.bank;
  const hasBank = Boolean(
    bank.company?.trim() || bank.accountNumber?.trim() || bank.ifsc?.trim() || bank.upiId?.trim()
  );

  return (
    <section className={styles.a4Lumina}>
      <div className={styles.contentArea}>
        <div className={styles.dateTag}>Execution mandate</div>
        <h1 className={styles.clientTitle}>Ready to deploy.</h1>
        <p className={styles.subText}>
          {customer !== "—" ? `${customer} can` : "You can"} accept this Lumina issue
          {systemKw > 0 ? ` for a ${formatLuminaKw(systemKw)} kW plant` : ""}. Stage amounts below
          are the live schedule on this proposal — they stay on gross.
        </p>

        <div className={styles.payCard}>
          <div className={styles.capKicker} style={{ marginBottom: 10 }}>
            Capital schedule
            {gross > 0 ? ` · on gross ${formatInrCompact(gross)}` : ""}
          </div>
          {payments.length > 0 ? (
            payments.map((p) => (
              <div key={p.label} className={styles.scheduleRow}>
                <span className={styles.scheduleLabel}>
                  {p.label}
                  {p.pctLabel ? (
                    <span className={styles.schedulePct}>{` (${p.pctLabel})`}</span>
                  ) : null}
                </span>
                <span className={styles.scheduleAmt}>
                  {p.amountInr > 0 ? formatInr(p.amountInr) : "—"}
                </span>
              </div>
            ))
          ) : (
            <div className={styles.scheduleRow}>
              <span className={styles.scheduleLabel}>Stage payments</span>
              <span className={styles.scheduleAmt}>Not on file</span>
            </div>
          )}
        </div>

        {hasBank ? (
          <div className={styles.payCard}>
            <div className={styles.capKicker} style={{ marginBottom: 10 }}>
              Bank details
            </div>
            {bank.company?.trim() ? (
              <div className={styles.scheduleRow}>
                <span className={styles.scheduleLabel}>Account name</span>
                <span className={styles.scheduleAmt}>{bank.company}</span>
              </div>
            ) : null}
            {bank.accountNumber?.trim() ? (
              <div className={styles.scheduleRow}>
                <span className={styles.scheduleLabel}>Account</span>
                <span className={styles.scheduleAmt}>{bank.accountNumber}</span>
              </div>
            ) : null}
            {bank.ifsc?.trim() ? (
              <div className={styles.scheduleRow}>
                <span className={styles.scheduleLabel}>IFSC</span>
                <span className={styles.scheduleAmt}>{bank.ifsc}</span>
              </div>
            ) : null}
            {bank.upiId?.trim() ? (
              <div className={styles.scheduleRow}>
                <span className={styles.scheduleLabel}>UPI</span>
                <span className={styles.scheduleAmt}>{bank.upiId}</span>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className={styles.sigGrid}>
          <div className={styles.sigBox}>
            <span className={styles.sigName}>{customer}</span>
            <span className={styles.sigRole}>Client authorization</span>
          </div>
          <div className={styles.sigBox}>
            <span className={styles.sigName}>{installer}</span>
            <span className={styles.sigRole}>Official signatory</span>
          </div>
        </div>
      </div>

      <div className={styles.closeBrandBar}>
        {installer}
        {location ? ` · ${location}` : ""}
      </div>
    </section>
  );
}

export default LuminaClosingPage;
