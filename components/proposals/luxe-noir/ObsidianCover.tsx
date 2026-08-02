"use client";

/**
 * Premium Luxe — Cover (Page 01).
 * Brand-first folio + photoreal rooftop hero plate (print-safe local asset).
 */

import type { ProposalData } from "@/lib/proposal-data";
import type {
  PremiumProposalPptInput,
  ProposalDeckSummary,
} from "@/lib/proposal-ppt";
import { formatLuxeKw } from "./luxe-format";
import {
  useLuxeCompanyContact,
  useLuxeVendorName,
  luxeVendorOrFallback,
} from "./luxe-vendor";
import { useLuxeLang } from "./luxe-lang-context";
import { luxeDisplayFont } from "./luxe-fonts";
import styles from "./luxe.module.css";

/** Local premium cover photograph — served from /public */
const COVER_ROOFTOP_SRC = "/assets/proposals/luxe-cover-rooftop.jpg";

export type ObsidianCoverProps = {
  data: ProposalData;
  pptInput?: PremiumProposalPptInput | null;
  summary?: ProposalDeckSummary | null;
};

function CoverPhotoPlate({
  caption,
  folio,
}: {
  caption: string;
  folio: string;
}) {
  return (
    <figure className={styles.coverPhotoPlate}>
      <div className={styles.coverPhotoFrame}>
        {/* eslint-disable-next-line @next/next/no-img-element -- print A4 static asset */}
        <img
          className={styles.coverPhotoImg}
          src={COVER_ROOFTOP_SRC}
          alt=""
          width={1600}
          height={900}
        />
        <div className={styles.coverPhotoVignette} aria-hidden />
        <div className={styles.coverPhotoGoldEdge} aria-hidden />
      </div>
      <figcaption className={styles.coverPhotoCaption}>
        <span>{caption}</span>
        <span>{folio}</span>
      </figcaption>
    </figure>
  );
}

export function ObsidianCover({ data, pptInput, summary }: ObsidianCoverProps) {
  const { copy, isHi } = useLuxeLang();
  const vendor = luxeVendorOrFallback(useLuxeVendorName(data, pptInput), isHi);
  const company = useLuxeCompanyContact(data, pptInput, summary);
  const client =
    data.meta.customerName?.trim() ||
    (isHi ? "सम्मानित ग्राहक" : "Valued Customer");
  const systemKw = Number(data.meta.systemKw) || 3;
  const location =
    data.meta.locationLine && data.meta.locationLine !== "—"
      ? data.meta.locationLine.replace(/,\s*India$/i, "").trim()
      : "Madhya Pradesh";
  const year = new Date().getFullYear();
  const longName = vendor.length > 18;
  const plateCaption = isHi
    ? "निजी रूफटॉप अध्ययन"
    : "PRIVATE ROOFTOP STUDY";
  const contactLine = company.line;

  return (
    <section
      className={`${styles.a4Page} ${styles.obsidianCover} ${luxeDisplayFont.variable}`}
    >
      <div className={styles.coverSpine} aria-hidden />
      <div className={styles.coverAtmosphere} aria-hidden>
        <div className={styles.coverWash} />
        <div className={styles.coverLinen} />
        <div className={styles.coverFrame} />
      </div>

      <header className={styles.coverTopRail}>
        <span className={styles.coverSeries}>{copy.cover.series}</span>
        <span className={styles.coverConfidential}>{copy.cover.confidential}</span>
      </header>
      <div className={styles.coverTopRule} aria-hidden />

      <div className={styles.coverHero}>
        <span className={styles.coverVendorLabel}>{copy.cover.vendor}</span>
        <h1
          className={`${styles.coverVendorName} ${
            longName ? styles.coverVendorNameLong : ""
          }`}
        >
          {vendor}
        </h1>
        <div className={styles.coverBrandRule} />
        <p className={styles.coverBrandDiscipline}>{copy.cover.discipline}</p>
        {contactLine ? (
          <p className={styles.coverVendorContact}>{contactLine}</p>
        ) : null}
      </div>

      <div className={styles.coverPlate}>
        <CoverPhotoPlate caption={plateCaption} folio="FOLIO 01" />
      </div>

      <div className={styles.coverDedication}>
        <div className={styles.coverDedicationCopy}>
          <span className={styles.coverPrepared}>{copy.cover.preparedFor}</span>
          <h2 className={styles.coverClientName}>{client}</h2>
          <p className={styles.coverOfferLine}>{copy.cover.offer}</p>
        </div>
      </div>

      <footer className={styles.coverMeta}>
        <div className={styles.coverMetaCell}>
          <span>{copy.cover.system}</span>
          <strong className={styles.luxeNum}>{formatLuxeKw(systemKw)} kW</strong>
        </div>
        <div className={styles.coverMetaDivider} aria-hidden />
        <div className={styles.coverMetaCell}>
          <span>{copy.cover.location}</span>
          <strong>{location}</strong>
        </div>
        <div className={styles.coverMetaDivider} aria-hidden />
        <div className={styles.coverMetaCell}>
          <span>{copy.cover.year}</span>
          <strong className={styles.luxeNum}>{year}</strong>
        </div>
      </footer>
    </section>
  );
}

export default ObsidianCover;
