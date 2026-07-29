"use client";

/**
 * Premium Luxe — Closing page (last A4).
 * Editorial folio close: next steps, vendor, dual signatures, contact.
 */

import type { ProposalData } from "@/lib/proposal-data";
import { formatLuxeKw } from "./luxe-format";
import { resolveLuxeVendorName } from "./luxe-vendor";
import { ExpertVerdict } from "./ExpertVerdict";
import { useLuxeLang } from "./luxe-lang-context";
import { luxeDisplayFont } from "./luxe-fonts";
import styles from "./luxe.module.css";

export type ClosingPageProps = {
  data: ProposalData;
};

function ClosingSealArt() {
  return (
    <svg className={styles.closeSeal} viewBox="0 0 120 120" aria-hidden>
      <circle cx="60" cy="60" r="54" fill="rgba(184,150,46,0.08)" />
      <circle
        cx="60"
        cy="60"
        r="42"
        fill="none"
        stroke="#B8962E"
        strokeWidth="1.2"
      />
      <circle
        cx="60"
        cy="60"
        r="30"
        fill="none"
        stroke="rgba(20,24,32,0.2)"
        strokeWidth="1"
        strokeDasharray="3 4"
      />
      <path
        d="M40 62 L54 74 L82 44"
        fill="none"
        stroke="#141820"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x="60"
        y="102"
        textAnchor="middle"
        fill="#B8962E"
        fontSize="8"
        letterSpacing="1.5"
        fontFamily="system-ui,sans-serif"
        fontWeight="700"
      >
        READY
      </text>
    </svg>
  );
}

export function ClosingPage({ data }: ClosingPageProps) {
  const { copy, isHi } = useLuxeLang();
  const vendor =
    resolveLuxeVendorName(data) || (isHi ? "सोलर पार्टनर" : "Solar Partner");
  const client =
    data.meta.customerName?.trim() ||
    (isHi ? "सम्मानित ग्राहक" : "Valued Customer");
  const systemKw = Number(data.meta.systemKw) || 0;
  const contact =
    data.closing.contactLine?.trim() ||
    (isHi
      ? "शुरू करने के लिए अपने सोलर पार्टनर को कॉल या WhatsApp करें।"
      : "Call or WhatsApp your solar partner to begin.");
  const contactPerson = data.closing.contactPerson?.trim() || vendor;
  const contactRole =
    data.closing.contactPersonDesignation?.trim() ||
    (isHi ? "अधिकृत हस्ताक्षरकर्ता" : "Authorized Signatory");
  const location =
    data.meta.locationLine && data.meta.locationLine !== "—"
      ? data.meta.locationLine.replace(/,\s*India$/i, "").trim()
      : "";
  const nextSteps = [...copy.close.steps];

  return (
    <section
      className={`${styles.a4Page} ${styles.closePage} ${luxeDisplayFont.variable}`}
    >
      <div className={styles.closeSpine} aria-hidden />
      <div className={styles.closeWash} aria-hidden />
      <div className={styles.closeCornerTL} aria-hidden />
      <div className={styles.closeCornerBR} aria-hidden />

      <header className={styles.closeTop}>
        <span className={styles.closeSeries}>{copy.close.series}</span>
        <span className={styles.closeConfidential}>{copy.close.privateOffer}</span>
      </header>

      <div className={styles.closeHero}>
        <div className={styles.closeHeroCopy}>
          <h1 className={styles.closeTitle}>{copy.close.title}</h1>
          <p className={styles.closeLead}>{copy.close.lead}</p>
          <p className={styles.closePrepared}>
            {copy.close.preparedFor} <strong>{client}</strong>
            {systemKw > 0 ? (
              <>
                {" "}
                · <span className={styles.luxeNum}>{formatLuxeKw(systemKw)} kW</span>
              </>
            ) : null}
            {location ? <> · {location}</> : null}
          </p>
        </div>
        <ClosingSealArt />
      </div>

      <div className={styles.closeVendorBlock}>
        <span>{copy.close.vendor}</span>
        <strong>{vendor}</strong>
      </div>

      <div className={styles.closeSteps}>
        <div className={styles.closeStepsHead}>{copy.close.nextHead}</div>
        <ol className={styles.closeStepsList}>
          {nextSteps.map((step, i) => (
            <li key={step.slice(0, 40)}>
              <span className={styles.closeStepNum}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className={styles.closeSigGrid}>
        <div className={styles.closeSigCard}>
          <div className={styles.closeSigLine} />
          <span className={styles.closeSigLabel}>{copy.close.clientAccept}</span>
          <strong className={styles.closeSigName}>{client}</strong>
          <em>{copy.close.sigDate}</em>
        </div>
        <div className={styles.closeSigCard}>
          <div className={styles.closeSigLine} />
          <span className={styles.closeSigLabel}>{copy.close.authSign}</span>
          <strong className={styles.closeSigName}>{contactPerson}</strong>
          <em>
            {contactRole} · {vendor}
          </em>
        </div>
      </div>

      <div className={styles.closeContact}>
        <span>{copy.close.contact}</span>
        <strong>{contact}</strong>
      </div>

      <ExpertVerdict label={copy.close.finalLabel}>{copy.close.final}</ExpertVerdict>

      <footer className={styles.impactPageFooter}>
        <span>{vendor.toUpperCase()}</span>
        <span>11 / 11</span>
      </footer>
    </section>
  );
}

export default ClosingPage;
