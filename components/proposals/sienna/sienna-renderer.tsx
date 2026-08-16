"use client";

/**
 * Sienna renderer — warm paper flagship residential proposal.
 * Preset id: residential_sienna
 */

import { useEffect, useRef, useState } from "react";
import type { ProposalData } from "@/lib/proposal-data";
import type { PremiumProposalPptInput } from "@/lib/proposal-ppt";
import { SiennaProposal } from "./SiennaProposal";
import styles from "./Sienna.module.css";
import { useSiennaBrand } from "./sienna-brand";
import { getSiennaCopy, type SiennaLang } from "./sienna-copy";
import { SiennaLangProvider, useSiennaLang } from "./sienna-lang-context";
import {
  buildAtelierProposalPdf,
  downloadPdfFile,
  isAppleTouchDevice,
} from "@/components/proposals/_shared/residential-pdf-export";

export type SiennaRendererProps = {
  data: ProposalData;
  installerLogoUrl?: string;
  proposalId?: string;
  pptInput?: PremiumProposalPptInput;
};

const SIENNA_LANG_KEY = "sol52-sienna-lang";

function readStoredLang(): SiennaLang {
  if (typeof window === "undefined") return "en";
  try {
    const raw = window.localStorage.getItem(SIENNA_LANG_KEY);
    if (raw === "hi" || raw === "en") return raw;
  } catch {
    /* ignore */
  }
  const nav = window.navigator?.language || "";
  return /^hi\b/i.test(nav) ? "hi" : "en";
}

function persistLang(lang: SiennaLang) {
  try {
    window.localStorage.setItem(SIENNA_LANG_KEY, lang);
  } catch {
    /* ignore */
  }
}

function SiennaDocument({
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
  const { lang, setLang, copy, isHi } = useSiennaLang();

  const brand = useSiennaBrand(data);

  const handlePrint = async () => {
    if (typeof window === "undefined" || pdfBusy) return;
    if (isAppleTouchDevice() && rootRef.current) {
      setPdfBusy(true);
      try {
        downloadPdfFile(
          await buildAtelierProposalPdf({
            root: rootRef.current,
            customerName: data.meta.customerName,
            presetId: "residential_sienna",
            pageSelector: "[data-sienna-stage] > section",
          })
        );
      } finally {
        setPdfBusy(false);
      }
      return;
    }
    window.print();
  };

  return (
    <div
      ref={rootRef}
      data-proposal-preset="residential_sienna"
      className={`${styles.root}${isHi ? ` ${styles.langHi}` : ""}`}
    >
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          @page sienna-sheet { size: A4 portrait; margin: 0; }
          @page sienna-cover { size: A4 portrait; margin: 0; }
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
      <SiennaProposal data={data} installerLogoUrl={installerLogoUrl} pptInput={pptInput} />
    </div>
  );
}

export function SiennaRenderer({
  data,
  installerLogoUrl,
  pptInput,
}: SiennaRendererProps) {
  const [lang, setLangState] = useState<SiennaLang>("en");

  useEffect(() => {
    setLangState(readStoredLang());
  }, []);

  const setLang = (next: SiennaLang) => {
    setLangState(next);
    persistLang(next);
  };

  if (!data) {
    return <div className={styles.loading}>{getSiennaCopy(lang).print.loading}</div>;
  }

  return (
    <SiennaLangProvider lang={lang} setLang={setLang}>
      <SiennaDocument data={data} installerLogoUrl={installerLogoUrl} pptInput={pptInput} />
    </SiennaLangProvider>
  );
}

export default SiennaRenderer;
