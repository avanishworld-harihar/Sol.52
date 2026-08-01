"use client";

/**
 * Premium Luxe — Closing folio (last A4).
 * Brand-first close · visual path · compact signature pads · company contact.
 */

import type { ProposalData } from "@/lib/proposal-data";
import type { PremiumProposalPptInput } from "@/lib/proposal-ppt";
import { formatLuxeKw } from "./luxe-format";
import {
  useLuxeCompanyContact,
  useLuxeVendorName,
  luxeVendorOrFallback,
} from "./luxe-vendor";
import { ExpertVerdict } from "./ExpertVerdict";
import { useLuxeLang } from "./luxe-lang-context";
import { luxeDisplayFont } from "./luxe-fonts";
import styles from "./luxe.module.css";

/** Local premium closing photograph — served from /public */
const CLOSING_ROOFTOP_SRC = "/assets/proposals/luxe-closing-rooftop-family.jpg";

export type ClosingPageProps = {
  data: ProposalData;
  pptInput?: PremiumProposalPptInput | null;
};

function ClosingSealArt({ label }: { label: string }) {
  return (
    <svg className={styles.closeSeal} viewBox="0 0 140 140" aria-hidden>
      <defs>
        <linearGradient id="closeSealRing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#C9A84A" />
          <stop offset="55%" stopColor="#B8962E" />
          <stop offset="100%" stopColor="#8A6E22" />
        </linearGradient>
      </defs>
      <circle cx="70" cy="70" r="64" fill="rgba(184,150,46,0.1)" />
      <circle
        cx="70"
        cy="70"
        r="52"
        fill="none"
        stroke="url(#closeSealRing)"
        strokeWidth="2.2"
      />
      <circle
        cx="70"
        cy="70"
        r="44"
        fill="none"
        stroke="rgba(20,24,32,0.18)"
        strokeWidth="1"
        strokeDasharray="2.5 3.5"
      />
      <circle cx="70" cy="66" r="28" fill="#1e2a3a" />
      <path
        d="M54 66 L64 76 L88 50"
        fill="none"
        stroke="#B8962E"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x="70"
        y="118"
        textAnchor="middle"
        fill="#8A6E22"
        fontSize="9"
        letterSpacing="2.4"
        fontFamily="system-ui,sans-serif"
        fontWeight="700"
      >
        {label}
      </text>
    </svg>
  );
}

function StepGlyph({ index }: { index: number }) {
  if (index === 0) {
    return (
      <svg viewBox="0 0 32 32" className={styles.closeStepGlyph} aria-hidden>
        <rect x="6" y="8" width="20" height="16" rx="2" fill="none" stroke="#B8962E" strokeWidth="1.6" />
        <path d="M11 16 L15 20 L22 12" fill="none" stroke="#141820" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (index === 1) {
    return (
      <svg viewBox="0 0 32 32" className={styles.closeStepGlyph} aria-hidden>
        <path d="M10 7h9l5 5v13H10z" fill="none" stroke="#B8962E" strokeWidth="1.6" />
        <path d="M19 7v5h5" fill="none" stroke="#B8962E" strokeWidth="1.6" />
        <path d="M13 17h10M13 21h7" stroke="#141820" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }
  if (index === 2) {
    return (
      <svg viewBox="0 0 32 32" className={styles.closeStepGlyph} aria-hidden>
        <path d="M6 22 L16 10 L26 22 Z" fill="none" stroke="#B8962E" strokeWidth="1.6" />
        <rect x="12" y="16" width="8" height="6" fill="none" stroke="#141820" strokeWidth="1.4" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 32 32" className={styles.closeStepGlyph} aria-hidden>
      <circle cx="16" cy="12" r="5" fill="rgba(184,150,46,0.35)" stroke="#B8962E" strokeWidth="1.4" />
      <path d="M8 24 L16 16 L24 24" fill="none" stroke="#141820" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M11 24h10" stroke="#B8962E" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function ClosingPage({ data, pptInput }: ClosingPageProps) {
  const { copy, isHi } = useLuxeLang();
  const vendor = luxeVendorOrFallback(useLuxeVendorName(data), isHi);
  const company = useLuxeCompanyContact(data, pptInput);
  const client =
    data.meta.customerName?.trim() ||
    (isHi ? "सम्मानित ग्राहक" : "Valued Customer");
  const systemKw = Number(data.meta.systemKw) || 0;
  const contactLine =
    company.line ||
    (isHi
      ? `शुरू करने के लिए ${vendor} को कॉल या WhatsApp करें।`
      : `Call or WhatsApp ${vendor} to begin.`);
  const contactPerson = company.contactPerson || vendor;
  const contactRole =
    company.contactPersonDesignation ||
    (isHi ? "अधिकृत हस्ताक्षरकर्ता" : "Authorized Signatory");
  const location =
    data.meta.locationLine && data.meta.locationLine !== "—"
      ? data.meta.locationLine.replace(/,\s*India$/i, "").trim()
      : "";

  const stepTitles = [...copy.close.stepTitles];
  const stepBodies = [...copy.close.steps];
  const detailBits = [
    company.address,
    company.website,
    company.gstNumber
      ? `${isHi ? "GSTIN" : "GSTIN"} ${company.gstNumber}`
      : "",
  ].filter(Boolean);

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

      <div className={styles.closeBrandHero}>
        <div className={styles.closeBrandCopy}>
          <span className={styles.closeBrandEyebrow}>{copy.close.vendor}</span>
          <h1 className={styles.closeVendorName}>{vendor}</h1>
          <p className={styles.closeTitle}>{copy.close.title}</p>
          <p className={styles.closeLead}>{copy.close.lead}</p>
        </div>
        <ClosingSealArt label={copy.close.sealReady} />
      </div>

      <div className={styles.closeMetaStrip}>
        <div className={styles.closeMetaCell}>
          <span>{copy.close.preparedFor}</span>
          <strong>{client}</strong>
        </div>
        {systemKw > 0 ? (
          <div className={styles.closeMetaCell}>
            <span>{isHi ? "सिस्टम" : "System"}</span>
            <strong className={styles.luxeNum}>{formatLuxeKw(systemKw)} kW</strong>
          </div>
        ) : null}
        {location ? (
          <div className={styles.closeMetaCell}>
            <span>{isHi ? "स्थान" : "Site"}</span>
            <strong>{location}</strong>
          </div>
        ) : null}
      </div>

      <figure className={styles.closePhotoPlate}>
        <div className={styles.closePhotoFrame}>
          {/* eslint-disable-next-line @next/next/no-img-element -- print A4 static asset */}
          <img
            className={styles.closePhotoImg}
            src={CLOSING_ROOFTOP_SRC}
            alt=""
            width={1600}
            height={900}
          />
          <div className={styles.closePhotoVignette} aria-hidden />
          <div className={styles.closePhotoGoldEdge} aria-hidden />
        </div>
        <figcaption className={styles.closePhotoCaption}>
          <span>{copy.close.photoCaption}</span>
          <span>{copy.close.photoFolio}</span>
        </figcaption>
      </figure>

      <div className={styles.closeJourney}>
        <div className={styles.closeJourneyHead}>
          <span>{copy.close.nextHead}</span>
          <em>{copy.close.nextHint}</em>
        </div>
        <ol className={styles.closeJourneyTrack}>
          {stepTitles.map((title, i) => (
            <li key={title} className={styles.closeJourneyStep}>
              {i < stepTitles.length - 1 ? (
                <span className={styles.closeJourneyRail} aria-hidden />
              ) : null}
              <div className={styles.closeJourneyBadge}>
                <span className={styles.closeStepNum}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <StepGlyph index={i} />
              </div>
              <strong>{title}</strong>
              <p>{stepBodies[i]}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className={styles.closeSigGrid}>
        <div className={styles.closeSigCard}>
          <span className={styles.closeSigLabel}>{copy.close.clientAccept}</span>
          <div className={styles.closeSigPad} />
          <strong className={styles.closeSigName}>{client}</strong>
          <em>{copy.close.sigDate}</em>
        </div>
        <div className={`${styles.closeSigCard} ${styles.closeSigCardVendor}`}>
          <span className={styles.closeSigLabel}>{copy.close.authSign}</span>
          <div className={styles.closeSigPad} />
          <strong className={styles.closeSigName}>{contactPerson}</strong>
          <em>
            {contactRole} · {vendor}
          </em>
        </div>
      </div>

      <div className={styles.closeContact}>
        <div className={styles.closeContactArt} aria-hidden>
          <svg viewBox="0 0 48 48" width="40" height="40">
            <circle cx="24" cy="24" r="22" fill="rgba(184,150,46,0.15)" />
            <path
              d="M16 20c0-2 1.5-4 4-4h2l2 5-2 1c.8 1.6 2.2 3 4 4l1-2 5 2v2c0 2.5-2 4-4 4-7 0-12-5-12-12z"
              fill="none"
              stroke="#B8962E"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className={styles.closeContactCopy}>
          <span className={styles.closeContactEyebrow}>{copy.close.contact}</span>
          <strong>{contactLine}</strong>
          {company.contactPerson ? (
            <span className={styles.closeContactPerson}>
              {company.contactPerson}
              {company.contactPersonDesignation
                ? ` · ${company.contactPersonDesignation}`
                : ""}
            </span>
          ) : null}
          {detailBits.length > 0 ? (
            <em>{detailBits.join(" · ")}</em>
          ) : (
            <em>{copy.close.contactHint}</em>
          )}
        </div>
      </div>

      <ExpertVerdict label={copy.close.finalLabel}>{copy.close.final}</ExpertVerdict>

      <footer className={`${styles.impactPageFooter} ${styles.closeFooter}`}>
        <span>{vendor.toUpperCase()}</span>
        <span>11 / 11</span>
      </footer>
    </section>
  );
}

export default ClosingPage;
