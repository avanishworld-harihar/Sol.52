"use client";

/**
 * Jaali renderer — haveli courtyard household proposal.
 * Preset id: residential_jaali
 */

import { useEffect, useRef, useState } from "react";
import type { ProposalData } from "@/lib/proposal-data";
import type { PremiumProposalPptInput } from "@/lib/proposal-ppt";
import { JaaliProposal } from "./JaaliProposal";
import styles from "./Jaali.module.css";
import { useJaaliBrand } from "./jaali-brand";
import { getJaaliCopy, type JaaliLang } from "./jaali-copy";
import { JaaliLangProvider, useJaaliLang } from "./jaali-lang-context";
import {
  buildAtelierProposalPdf,
  downloadPdfFile,
  isAppleTouchDevice,
  sharePdfFile,
  type ResidentialPdfFile,
} from "@/components/proposals/_shared/residential-pdf-export";

export type JaaliRendererProps = {
  data: ProposalData;
  installerLogoUrl?: string;
  proposalId?: string;
  pptInput?: PremiumProposalPptInput;
};

const JAALI_LANG_KEY = "sol52-jaali-lang";

function readStoredLang(): JaaliLang {
  if (typeof window === "undefined") return "en";
  try {
    const raw = window.localStorage.getItem(JAALI_LANG_KEY);
    if (raw === "hi" || raw === "en") return raw;
  } catch {
    /* ignore */
  }
  const nav = window.navigator?.language || "";
  return /^hi\b/i.test(nav) ? "hi" : "en";
}

function persistLang(lang: JaaliLang) {
  try {
    window.localStorage.setItem(JAALI_LANG_KEY, lang);
  } catch {
    /* ignore */
  }
}

function JaaliDocument({
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
  const { lang, setLang, copy, isHi } = useJaaliLang();

  const brand = useJaaliBrand(data);

  const handlePrint = async () => {
    if (typeof window === "undefined" || pdfBusy) return;
    if (isAppleTouchDevice() && rootRef.current) {
      setPdfBusy(true);
      try {
        const file = await buildAtelierProposalPdf({
          root: rootRef.current,
          customerName: data.meta.customerName,
          presetId: "residential_jaali",
          pageSelector: "[data-jaali-stage] > section",
        });
        setPdfReady(file);
      } catch (err) {
        console.error("[jaali] PDF export failed", err);
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
      console.error("[jaali] PDF share failed", err);
      void downloadPdfFile(pdfReady);
    } finally {
      setPdfSharing(false);
    }
  };

  return (
    <div
      ref={rootRef}
      data-proposal-preset="residential_jaali"
      className={`${styles.root}${isHi ? ` ${styles.langHi}` : ""}`}
    >
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          @page jaali-sheet { size: A4 portrait; margin: 0; }
          @page jaali-cover { size: A4 portrait; margin: 0; }
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
      <JaaliProposal data={data} installerLogoUrl={installerLogoUrl} pptInput={pptInput} />

      {pdfReady ? (
        <div
          className={styles.pdfReadyOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="jaali-pdf-ready-title"
        >
          <div className={styles.pdfReadyCard}>
            <h2 id="jaali-pdf-ready-title" className={styles.pdfReadyTitle}>
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

export function JaaliRenderer({
  data,
  installerLogoUrl,
  pptInput,
}: JaaliRendererProps) {
  const [lang, setLangState] = useState<JaaliLang>("en");

  useEffect(() => {
    setLangState(readStoredLang());
  }, []);

  const setLang = (next: JaaliLang) => {
    setLangState(next);
    persistLang(next);
  };

  if (!data) {
    return <div className={styles.loading}>{getJaaliCopy(lang).print.loading}</div>;
  }

  return (
    <JaaliLangProvider lang={lang} setLang={setLang}>
      <JaaliDocument data={data} installerLogoUrl={installerLogoUrl} pptInput={pptInput} />
    </JaaliLangProvider>
  );
}

export default JaaliRenderer;
