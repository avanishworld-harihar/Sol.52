"use client";

/**
 * Khadi renderer — cloth-press household proposal.
 * Preset id: residential_khadi
 */

import { useEffect, useRef, useState } from "react";
import type { ProposalData } from "@/lib/proposal-data";
import type { PremiumProposalPptInput } from "@/lib/proposal-ppt";
import { KhadiProposal } from "./KhadiProposal";
import styles from "./Khadi.module.css";
import { useKhadiBrand } from "./khadi-brand";
import { getKhadiCopy, type KhadiLang } from "./khadi-copy";
import { KhadiLangProvider, useKhadiLang } from "./khadi-lang-context";
import {
  buildAtelierProposalPdf,
  downloadPdfFile,
  isAppleTouchDevice,
} from "@/components/proposals/_shared/residential-pdf-export";

export type KhadiRendererProps = {
  data: ProposalData;
  installerLogoUrl?: string;
  proposalId?: string;
  pptInput?: PremiumProposalPptInput;
};

const KHADI_LANG_KEY = "sol52-khadi-lang";

function readStoredLang(): KhadiLang {
  if (typeof window === "undefined") return "en";
  try {
    const raw = window.localStorage.getItem(KHADI_LANG_KEY);
    if (raw === "hi" || raw === "en") return raw;
  } catch {
    /* ignore */
  }
  const nav = window.navigator?.language || "";
  return /^hi\b/i.test(nav) ? "hi" : "en";
}

function persistLang(lang: KhadiLang) {
  try {
    window.localStorage.setItem(KHADI_LANG_KEY, lang);
  } catch {
    /* ignore */
  }
}

function KhadiDocument({
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
  const { lang, setLang, copy, isHi } = useKhadiLang();

  const brand = useKhadiBrand(data);

  const handlePrint = async () => {
    if (typeof window === "undefined" || pdfBusy) return;
    if (isAppleTouchDevice() && rootRef.current) {
      setPdfBusy(true);
      try {
        downloadPdfFile(
          await buildAtelierProposalPdf({
            root: rootRef.current,
            customerName: data.meta.customerName,
            presetId: "residential_khadi",
            pageSelector: "[data-khadi-stage] > section",
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
      data-proposal-preset="residential_khadi"
      className={`${styles.root}${isHi ? ` ${styles.langHi}` : ""}`}
    >
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          @page khadi-sheet { size: A4 portrait; margin: 0; }
          @page khadi-cover { size: A4 portrait; margin: 0; }
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
      <KhadiProposal data={data} installerLogoUrl={installerLogoUrl} pptInput={pptInput} />
    </div>
  );
}

export function KhadiRenderer({
  data,
  installerLogoUrl,
  pptInput,
}: KhadiRendererProps) {
  const [lang, setLangState] = useState<KhadiLang>("en");

  useEffect(() => {
    setLangState(readStoredLang());
  }, []);

  const setLang = (next: KhadiLang) => {
    setLangState(next);
    persistLang(next);
  };

  if (!data) {
    return <div className={styles.loading}>{getKhadiCopy(lang).print.loading}</div>;
  }

  return (
    <KhadiLangProvider lang={lang} setLang={setLang}>
      <KhadiDocument data={data} installerLogoUrl={installerLogoUrl} pptInput={pptInput} />
    </KhadiLangProvider>
  );
}

export default KhadiRenderer;
