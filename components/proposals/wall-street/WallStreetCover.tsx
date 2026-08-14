"use client";

import type { ProposalData } from "@/lib/proposal-data";
import { formatInr, formatInrCompact } from "@/components/proposals/_shared/formatters";
import styles from "./WallStreet.module.css";
import { WallStreetMasthead } from "./WallStreetMasthead";
import {
  formatWallStreetKw,
  wallStreetAnnualUnits,
  wallStreetHeadlineLocation,
  wallStreetMonthlySavings,
  wallStreetNetInvestment,
  wallStreetPanelLine,
  wallStreetTickerSymbol,
} from "./wall-street-live";

function LedgerLine({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className={styles.ledgerRow}>
      <span className={styles.ledgerLabel}>{label}</span>
      <div className={styles.ledgerDots} />
      <span className={`${styles.ledgerValue} ${positive ? styles.positive : ""}`}>{value}</span>
    </div>
  );
}

export function WallStreetCover({ data }: { data: ProposalData }) {
  const customer = data.meta.customerName?.trim() || "—";
  const systemKw = Number(data.meta.systemKw) || 0;
  const annual = wallStreetAnnualUnits(data);
  const net = wallStreetNetInvestment(data);
  const monthly = wallStreetMonthlySavings(data);
  const payback = data.economics.paybackYears;
  const locationHead = wallStreetHeadlineLocation(data);
  const panelLine = wallStreetPanelLine(data);
  const symbol = wallStreetTickerSymbol(data);

  const headline =
    customer !== "—" && systemKw > 0
      ? `${customer.toUpperCase()} TO ACQUIRE ${formatWallStreetKw(systemKw)} kW ROOFTOP ENERGY ASSET`
      : customer !== "—"
        ? `${customer.toUpperCase()} — ROOFTOP ENERGY MANDATE`
        : "ROOFTOP ENERGY ASSET MANDATE";

  return (
    <section className={styles.a4Newspaper}>
      <WallStreetMasthead data={data} />

      <div className={styles.stockTicker}>
        <div className={styles.tickerItem}>
          <span>SYMB: {symbol}</span>
        </div>
        <div className={styles.tickerItem}>
          <span>CAPACITY: {systemKw > 0 ? `${formatWallStreetKw(systemKw)} kW` : "—"}</span>
          {systemKw > 0 ? <span className={styles.positive}>▲</span> : null}
        </div>
        <div className={styles.tickerItem}>
          <span>
            YIELD EST: {annual > 0 ? `${annual.toLocaleString("en-IN")} U` : "—"}
          </span>
          {annual > 0 ? <span className={styles.positive}>▲</span> : null}
        </div>
        <div className={styles.tickerItem}>
          <span>STAGE PAYMENTS</span>
          <span className={styles.positive}>ON GROSS</span>
        </div>
      </div>

      <h2 className={styles.headline}>{headline}</h2>
      <h3 className={styles.subHeadline}>
        Strategic rooftop generation asset — capital recovery and long-term utility insulation
        when live economics are on file.
      </h3>

      <div className={styles.twoColumn}>
        {locationHead !== "—" ? (
          <p>
            <strong>{locationHead}</strong> — An engineering and financial mandate has been
            prepared for a decentralized photovoltaic asset on this property
            {systemKw > 0 ? `, sized at ${formatWallStreetKw(systemKw)} kW AC` : ""}.
          </p>
        ) : (
          <p>
            An engineering and financial mandate has been prepared for a decentralized
            photovoltaic asset on this property
            {systemKw > 0 ? `, sized at ${formatWallStreetKw(systemKw)} kW AC` : ""}.
          </p>
        )}
        {panelLine ? (
          <p>
            The bill of materials on this proposal specifies{" "}
            <strong>{panelLine}</strong>
            {annual > 0
              ? `, with year-1 generation estimated at ${annual.toLocaleString("en-IN")} units.`
              : "."}
          </p>
        ) : annual > 0 ? (
          <p>
            Year-1 generation on this proposal is estimated at{" "}
            <strong>{annual.toLocaleString("en-IN")} units</strong>, subject to site
            conditions and DISCOM availability.
          </p>
        ) : (
          <p>
            Generation and hardware details appear on this ledger when they exist on the
            live proposal record — nothing is invented for the headline.
          </p>
        )}
        <p>
          Stage payments remain on <strong>gross turnkey cost</strong>; any subsidy is
          credited later when it exists on this quote. This document is issued as a
          financial utility instrument, not a marketing brochure.
        </p>
      </div>

      <div className={styles.ledgerContainer}>
        <span className={styles.ledgerKicker}>Executive Financial Summary</span>
        <LedgerLine
          label={
            data.economics.subsidyInr > 0
              ? "Net Capital Outlay (Post-Subsidy)"
              : "Capital Outlay (Turnkey Gross)"
          }
          value={net > 0 ? formatInrCompact(net) : "—"}
        />
        <LedgerLine
          label="Estimated Monthly Dividend (Savings)"
          value={monthly > 0 ? `+ ${formatInr(monthly)}` : "—"}
          positive={monthly > 0}
        />
        <LedgerLine
          label="Capital Recovery Period (Payback)"
          value={payback > 0 ? `${payback} yrs` : "—"}
        />
      </div>

      <footer className={styles.pageFooter}>SOL.52 SYSTEM · PROPRIETARY PORTFOLIO MEMORANDUM</footer>
    </section>
  );
}

export default WallStreetCover;
