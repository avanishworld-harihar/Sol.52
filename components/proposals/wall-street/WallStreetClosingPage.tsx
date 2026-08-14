"use client";

import type { ProposalData } from "@/lib/proposal-data";
import styles from "./WallStreet.module.css";
import { WallStreetMasthead } from "./WallStreetMasthead";
import { formatWallStreetKw, wallStreetAnnualUnits } from "./wall-street-live";

export function WallStreetClosingPage({ data }: { data: ProposalData }) {
  const customer = data.meta.customerName?.trim() || "—";
  const systemKw = Number(data.meta.systemKw) || 0;
  const annual = wallStreetAnnualUnits(data);
  const contact = data.closing.contactLine?.trim() || "—";
  const installer = data.closing.installerName?.trim() || data.meta.brandName?.trim() || "—";
  const terms = (data.terms.conditions ?? []).filter((t) => t.trim()).slice(0, 4);

  return (
    <section className={styles.a4Newspaper}>
      <WallStreetMasthead data={data} />

      <h2 className={styles.sectionHead}>Closing Memorandum</h2>
      <div className={styles.twoColumn}>
        <p>
          <strong>{customer}</strong> is invited to accept this Wall Street Ledger issue as
          the commercial specification for the proposed plant
          {systemKw > 0 ? ` (${formatWallStreetKw(systemKw)} kW)` : ""}.
        </p>
        {annual > 0 ? (
          <p>
            Year-1 yield on file: <strong>{annual.toLocaleString("en-IN")} kWh</strong>.
            Actual generation varies with weather and grid availability.
          </p>
        ) : null}
        {terms.length > 0 ? (
          <p>
            Key terms on this proposal: {terms.join(" · ")}
          </p>
        ) : null}
        <p>
          For execution queries: <strong>{installer}</strong>
          {contact !== "—" ? ` · ${contact}` : ""}.
        </p>
      </div>

      <div className={styles.ledgerContainer}>
        <span className={styles.ledgerKicker}>Acceptance</span>
        <div className={styles.ledgerRow}>
          <span className={styles.ledgerLabel}>Client / date</span>
          <div className={styles.ledgerDots} />
          <span className={styles.ledgerValue}>{customer}</span>
        </div>
        <div className={styles.ledgerRow}>
          <span className={styles.ledgerLabel}>Issuer / date</span>
          <div className={styles.ledgerDots} />
          <span className={styles.ledgerValue}>{installer}</span>
        </div>
      </div>

      <footer className={styles.pageFooter}>END OF LEDGER ISSUE · SOL.52</footer>
    </section>
  );
}

export default WallStreetClosingPage;
