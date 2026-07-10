import type { ProposalData } from "@/lib/proposal-data";
import { formatInr } from "@/components/proposals/_shared/formatters";
import styles from "../zenith.module.css";

type Props = {
  execution: ProposalData["execution"];
};

/** Execution timeline + premium payment schedule — Pearl page. */
export function Execution({ execution }: Props) {
  const steps = execution?.steps ?? [];
  const payments = execution?.payments ?? [];
  const bank = execution?.bank;
  if (steps.length === 0 && payments.length === 0) return null;

  return (
    <section className={styles.contentPage}>
      <h2 className={styles.sectionTitle}>Execution & Settlement</h2>
      <div className={styles.goldRule} aria-hidden />
      <p className={styles.sectionLead}>
        From survey to commissioning — with a clear capital schedule.
      </p>

      {steps.length > 0 ? (
        <ol className={styles.stepList}>
          {steps.map((s) => (
            <li key={s.num} className={styles.stepItem}>
              <span className={styles.stepNum}>{s.num}</span>
              <div>
                <p className={styles.stepTitle}>{s.title}</p>
                <p className={styles.stepDesc}>{s.description}</p>
              </div>
            </li>
          ))}
        </ol>
      ) : null}

      {payments.length > 0 ? (
        <>
          <h3 className={styles.subTitle}>Payment schedule</h3>
          <div className={styles.paymentList}>
            {payments.map((p) => (
              <div
                key={p.label}
                className={`${styles.paymentRow} ${p.isTotal ? styles.paymentRowTotal : ""}`}
              >
                <div className={styles.paymentMeta}>
                  <span className={styles.paymentStep}>{p.label}</span>
                  {p.pctLabel ? (
                    <span className={styles.paymentPct}>{p.pctLabel}</span>
                  ) : null}
                </div>
                <span className={styles.textGold}>{formatInr(p.amountInr)}</span>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {bank && (bank.accountNumber || bank.upiId) ? (
        <div className={styles.bankBlock}>
          <p className={styles.archLabel}>Bank details</p>
          {bank.company ? <p className={styles.bankLine}>{bank.company}</p> : null}
          {bank.accountNumber ? (
            <p className={styles.bankLine}>A/C {bank.accountNumber}</p>
          ) : null}
          {bank.ifsc ? <p className={styles.bankLine}>IFSC {bank.ifsc}</p> : null}
          {bank.upiId ? <p className={styles.bankLine}>UPI {bank.upiId}</p> : null}
        </div>
      ) : null}
    </section>
  );
}
