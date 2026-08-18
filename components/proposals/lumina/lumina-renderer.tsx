"use client";

/**
 * Lumina renderer — clean light app-like residential proposal.
 * Preset id: residential_lumina
 */

import { useEffect, useRef, useState } from "react";
import type { ProposalData } from "@/lib/proposal-data";
import type { PremiumProposalPptInput } from "@/lib/proposal-ppt";
import { LuminaProposal } from "./LuminaProposal";
import styles from "./Lumina.module.css";
import { useLuminaBrand } from "./lumina-brand";
import { getLuminaCopy, type LuminaLang } from "./lumina-copy";
import { LuminaLangProvider, useLuminaLang } from "./lumina-lang-context";
import {
  buildAtelierProposalPdf,
  downloadPdfFile,
  isAppleTouchDevice,
  sharePdfFile,
  type ResidentialPdfFile,
} from "@/components/proposals/_shared/residential-pdf-export";

export type LuminaRendererProps = {
  data: ProposalData;
  installerLogoUrl?: string;
  proposalId?: string;
  pptInput?: PremiumProposalPptInput;
};

const LUMINA_LANG_KEY = "sol52-lumina-lang";

function readStoredLang(): LuminaLang {
  if (typeof window === "undefined") return "en";
  try {
    const raw = window.localStorage.getItem(LUMINA_LANG_KEY);
    if (raw === "hi" || raw === "en") return raw;
  } catch {
    /* ignore */
  }
  const nav = window.navigator?.language || "";
  return /^hi\b/i.test(nav) ? "hi" : "en";
}

function persistLang(lang: LuminaLang) {
  try {
    window.localStorage.setItem(LUMINA_LANG_KEY, lang);
  } catch {
    /* ignore */
  }
}

function LuminaDocument({
  data,
  installerLogoUrl,
  pptInput,
}: {
  data: ProposalData;
  installerLogoUrl?: string;
  pptInput?: PremiumProposalPptInput;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfSharing, setPdfSharing] = useState(false);
  const [pdfReady, setPdfReady] = useState<ResidentialPdfFile | null>(null);
  const { lang, setLang, copy, isHi } = useLuminaLang();

  const brand = useLuminaBrand(data);

  const handlePrint = async () => {
    if (typeof window === "undefined" || pdfBusy) return;
    if (isAppleTouchDevice() && rootRef.current) {
      setPdfBusy(true);
      try {
        const file = await buildAtelierProposalPdf({
          root: rootRef.current,
          customerName: data.meta.customerName,
          presetId: "residential_lumina",
          pageSelector: "[data-lumina-stage] > section",
        });
        setPdfReady(file);
      } catch (err) {
        console.error("[lumina] PDF export failed", err);
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
      console.error("[lumina] PDF share failed", err);
      void downloadPdfFile(pdfReady);
    } finally {
      setPdfSharing(false);
    }
  };

  return (
    <div
      ref={rootRef}
      data-proposal-preset="residential_lumina"
      className={`${styles.root}${isHi ? ` ${styles.langHi}` : ""}`}
    >
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          @page lumina-sheet { size: A4 portrait; margin: 0; }
          @page lumina-cover { size: A4 portrait; margin: 0; }
          html, body { font-size: 16.5px !important; }
        }
      `}</style>
      <div className={styles.printBar}>
        <div className={styles.printBarInner}>
          <span className={styles.printBarBrand}>
            {brand ? `${brand} · ${copy.print.pages(9)}` : copy.print.pages(9)}
          </span>
          <div className={styles.printBarActions}>
            <div className={styles.langToggle} role="group" aria-label={copy.print.langAria}>
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
      <LuminaProposal data={data} installerLogoUrl={installerLogoUrl} pptInput={pptInput} />

      {pdfReady ? (
        <div
          className={styles.pdfReadyOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="lumina-pdf-ready-title"
        >
          <div className={styles.pdfReadyCard}>
            <h2 id="lumina-pdf-ready-title" className={styles.pdfReadyTitle}>
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

export function LuminaRenderer({
  data,
  installerLogoUrl,
  pptInput,
}: LuminaRendererProps) {
  const [lang, setLangState] = useState<LuminaLang>("en");

  useEffect(() => {
    setLangState(readStoredLang());
  }, []);

  const setLang = (next: LuminaLang) => {
    setLangState(next);
    persistLang(next);
  };

  if (!data) {
    return <div className={styles.loading}>{getLuminaCopy(lang).print.loading}</div>;
  }

  return (
    <LuminaLangProvider lang={lang} setLang={setLang}>
      <LuminaDocument data={data} installerLogoUrl={installerLogoUrl} pptInput={pptInput} />
    </LuminaLangProvider>
  );
}

export default LuminaRenderer;
