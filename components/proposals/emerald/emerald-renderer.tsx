"use client";

/**
 * Emerald Signature renderer — split-folio eco-luxury residential proposal.
 * Preset id: residential_emerald
 * Pages compiled by EmeraldProposal.
 */

import { useEffect, useRef, useState } from "react";
import type { ProposalData } from "@/lib/proposal-data";
import type { PremiumProposalPptInput } from "@/lib/proposal-ppt";
import { EmeraldProposal } from "./EmeraldProposal";
import { useEmeraldBrand, useEmeraldLogoUrl } from "./emerald-brand";
import {
  EmeraldLangProvider,
  useEmeraldLang,
} from "./emerald-lang-context";
import { getEmeraldCopy, type EmeraldLang } from "./emerald-copy";
import styles from "./Emerald.module.css";
import {
  buildAtelierProposalPdf,
  downloadPdfFile,
  isAppleTouchDevice,
  sharePdfFile,
  type ResidentialPdfFile,
} from "@/components/proposals/_shared/residential-pdf-export";

export type EmeraldRendererProps = {
  data: ProposalData;
  installerLogoUrl?: string;
  pptInput?: PremiumProposalPptInput | null;
  proposalId?: string;
};

const EMERALD_LANG_KEY = "sol52-emerald-lang";

function readStoredLang(): EmeraldLang {
  if (typeof window === "undefined") return "en";
  try {
    const stored = window.localStorage.getItem(EMERALD_LANG_KEY);
    if (stored === "hi" || stored === "en") return stored;
  } catch {
    /* ignore */
  }
  const nav = window.navigator?.language || "";
  return /^hi\b/i.test(nav) ? "hi" : "en";
}

function persistLang(lang: EmeraldLang) {
  try {
    window.localStorage.setItem(EMERALD_LANG_KEY, lang);
  } catch {
    /* ignore */
  }
}

function EmeraldDocument({
  data,
  installerLogoUrl,
  proposalId,
  selectedTenureYears,
}: {
  data: ProposalData;
  installerLogoUrl?: string;
  proposalId?: string;
  selectedTenureYears?: number | null;
}) {
  const brand = useEmeraldBrand(data);
  const logoUrl = useEmeraldLogoUrl(data, installerLogoUrl);
  const { lang, setLang, copy, isHi } = useEmeraldLang();
  const rootRef = useRef<HTMLDivElement>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfSharing, setPdfSharing] = useState(false);
  const [pdfReady, setPdfReady] = useState<ResidentialPdfFile | null>(null);

  const handlePrint = async () => {
    if (typeof window === "undefined" || pdfBusy) return;
    if (isAppleTouchDevice() && rootRef.current) {
      setPdfBusy(true);
      try {
        const file = await buildAtelierProposalPdf({
          root: rootRef.current,
          customerName: data.meta.customerName,
          presetId: "residential_emerald",
          /*
           * Scoped to the stage's direct children only — an unscoped
           * "section" selector matches every <section> in the subtree, so a
           * future nested <section> anywhere inside a page would silently
           * duplicate a page in the export.
           */
          pageSelector: "[data-emerald-stage] > section",
        });
        setPdfReady(file);
      } catch (err) {
        console.error("[emerald] PDF export failed", err);
        window.alert(copy.print.pdfFailed);
      } finally {
        setPdfBusy(false);
      }
      return;
    }
    window.print();
  };

  /*
   * iOS Safari's navigator.share() needs a fresh, real click — the tap that
   * started the 15-30s PDF build above is long expired by the time the file
   * is ready, so share() is only ever called from this button's own click,
   * never automatically after the build.
   */
  const handleSharePdf = async () => {
    if (!pdfReady || pdfSharing) return;
    setPdfSharing(true);
    try {
      await sharePdfFile(pdfReady);
    } catch (err) {
      console.error("[emerald] PDF share failed", err);
      void downloadPdfFile(pdfReady);
    } finally {
      setPdfSharing(false);
    }
  };

  return (
    <div
      ref={rootRef}
      data-proposal-preset="residential_emerald"
      className={`${styles.root}${isHi ? ` ${styles.langHi}` : ""}`}
    >
      <div className={styles.printBar}>
        <div className={styles.printBarInner}>
          <span className={styles.printBarBrand}>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- web toolbar logo
              <img
                src={logoUrl}
                alt={brand || copy.print.brand}
                className={styles.printBarLogo}
              />
            ) : null}
            {brand ? `${brand} · ` : ""}
            {copy.print.brand}
          </span>
          <div className={styles.printBarActions}>
            <div
              className={styles.langToggle}
              role="group"
              aria-label={copy.print.langAria}
            >
              <button
                type="button"
                className={`${styles.langBtn}${lang === "en" ? ` ${styles.langBtnActive}` : ""}`}
                onClick={() => setLang("en")}
                aria-pressed={lang === "en"}
              >
                {copy.print.langEn}
              </button>
              <button
                type="button"
                className={`${styles.langBtn}${lang === "hi" ? ` ${styles.langBtnActive}` : ""}`}
                onClick={() => setLang("hi")}
                aria-pressed={lang === "hi"}
              >
                {copy.print.langHi}
              </button>
            </div>
            <button
              type="button"
              className={styles.printBarBtn}
              onClick={handlePrint}
              disabled={pdfBusy}
            >
              {pdfBusy ? copy.print.preparingPdf : copy.print.downloadPdf}
            </button>
          </div>
        </div>
      </div>

      <EmeraldProposal
        data={data}
        proposalId={proposalId}
        installerLogoUrl={installerLogoUrl}
        selectedTenureYears={selectedTenureYears}
      />

      {pdfReady ? (
        <div
          className={styles.pdfReadyOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="emerald-pdf-ready-title"
        >
          <div className={styles.pdfReadyCard}>
            <h2 id="emerald-pdf-ready-title" className={styles.pdfReadyTitle}>
              {copy.print.pdfReadyTitle}
            </h2>
            <p className={styles.pdfReadyBody}>{copy.print.pdfReadyBody}</p>
            <p className={styles.pdfReadyFile}>{pdfReady.fileName}</p>
            <div className={styles.pdfReadyActions}>
              <button
                type="button"
                className={styles.pdfReadyShare}
                onClick={handleSharePdf}
                disabled={pdfSharing}
              >
                {pdfSharing ? copy.print.pdfBuilding : copy.print.pdfReadyShare}
              </button>
              <button
                type="button"
                className={styles.pdfReadyClose}
                onClick={() => setPdfReady(null)}
              >
                {copy.print.pdfReadyClose}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function EmeraldRenderer({
  data,
  installerLogoUrl,
  pptInput,
  proposalId,
}: EmeraldRendererProps) {
  const [lang, setLangState] = useState<EmeraldLang>("en");
  const selectedTenureYears =
    pptInput?.financeOption?.selectedTenureYears &&
    pptInput.financeOption.selectedTenureYears > 0
      ? pptInput.financeOption.selectedTenureYears
      : null;

  useEffect(() => {
    setLangState(readStoredLang());
  }, []);

  const setLang = (next: EmeraldLang) => {
    setLangState(next);
    persistLang(next);
  };

  if (!data) {
    return (
      <div className={styles.loading}>
        {getEmeraldCopy(lang).print.loading}
      </div>
    );
  }

  return (
    <EmeraldLangProvider lang={lang} setLang={setLang}>
      <EmeraldDocument
        data={data}
        installerLogoUrl={installerLogoUrl}
        proposalId={proposalId}
        selectedTenureYears={selectedTenureYears}
      />
    </EmeraldLangProvider>
  );
}

export default EmeraldRenderer;
