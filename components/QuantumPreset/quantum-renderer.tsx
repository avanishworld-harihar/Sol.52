"use client";

/**
 * Quantum renderer — Cinematic Neo-Glass residential proposal.
 * Preset id: residential_quantum
 * Pages: Cover → Telemetry → Economics → Hardware → Impact → Payment → Terms ×2
 *
 * DEVELOPMENT LOCKED — see `lib/quantum-proposal-lock.ts`. Do not edit for other presets.
 */

import { useRef, useState } from "react";
import type { ProposalData } from "@/lib/proposal-data";
import { QuantumCover } from "./QuantumCover";
import { QuantumTelemetry } from "./QuantumTelemetry";
import { QuantumEconomics } from "./QuantumEconomics";
import { QuantumHardware } from "./QuantumHardware";
import { QuantumImpact } from "./QuantumImpact";
import { QuantumAuthorization } from "./QuantumAuthorization";
import { QuantumTermsPage1, QuantumTermsPage2 } from "./QuantumTerms";
import { QuantumLangProvider, useQuantumLang } from "./quantum-lang-context";
import { getQuantumCopy, type QuantumLang } from "./quantum-copy";
import styles from "./Quantum.module.css";
import {
  buildAtelierProposalPdf,
  downloadPdfFile,
  isAppleTouchDevice,
} from "@/components/proposals/_shared/residential-pdf-export";

export type QuantumRendererProps = {
  data: ProposalData;
};

function QuantumDocument({ data }: { data: ProposalData }) {
  const { lang, setLang, copy } = useQuantumLang();
  const rootRef = useRef<HTMLDivElement>(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  const handlePrint = async () => {
    if (typeof window === "undefined" || pdfBusy) return;
    if (isAppleTouchDevice() && rootRef.current) {
      setPdfBusy(true);
      try {
        downloadPdfFile(await buildAtelierProposalPdf({
          root: rootRef.current,
          customerName: data.meta.customerName,
          presetId: "residential_quantum",
          pageSelector: ":scope > section",
        }));
      } finally {
        setPdfBusy(false);
      }
      return;
    }
    window.print();
  };

  return (
    <div ref={rootRef} data-proposal-preset="residential_quantum" className={styles.root}>
      <div className={styles.printBar}>
        <div className={styles.printBarInner}>
          <span className={styles.printBarBrand}>{copy.print.brand}</span>
          <div className={styles.printBarActions}>
            <div className={styles.langToggle} role="group" aria-label="Language">
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
            >
              {copy.print.downloadPdf}
            </button>
          </div>
        </div>
      </div>

      <QuantumCover data={data} />
      <QuantumTelemetry data={data} />
      <QuantumEconomics data={data} />
      <QuantumHardware data={data} />
      <QuantumImpact data={data} />
      <QuantumAuthorization data={data} />
      <QuantumTermsPage1 data={data} />
      <QuantumTermsPage2 data={data} />
    </div>
  );
}

export function QuantumRenderer({ data }: QuantumRendererProps) {
  const [lang, setLang] = useState<QuantumLang>("en");

  if (!data) {
    return (
      <div className={styles.loading}>{getQuantumCopy("en").print.loading}</div>
    );
  }

  return (
    <QuantumLangProvider lang={lang} setLang={setLang}>
      <QuantumDocument data={data} />
    </QuantumLangProvider>
  );
}

export default QuantumRenderer;
