"use client";

/**
 * Emerald Signature renderer — split-folio eco-luxury residential proposal.
 * Preset id: residential_emerald
 * Pages compiled by EmeraldProposal.
 */

import { useRef, useState } from "react";
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
} from "@/components/proposals/_shared/residential-pdf-export";

export type EmeraldRendererProps = {
  data: ProposalData;
  installerLogoUrl?: string;
  pptInput?: PremiumProposalPptInput | null;
  proposalId?: string;
};

function EmeraldDocument({
  data,
  installerLogoUrl,
  proposalId,
}: {
  data: ProposalData;
  installerLogoUrl?: string;
  proposalId?: string;
}) {
  const brand = useEmeraldBrand(data);
  const logoUrl = useEmeraldLogoUrl(data, installerLogoUrl);
  const { lang, setLang, copy, isHi } = useEmeraldLang();
  const rootRef = useRef<HTMLDivElement>(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  const handlePrint = async () => {
    if (typeof window === "undefined" || pdfBusy) return;
    if (isAppleTouchDevice() && rootRef.current) {
      setPdfBusy(true);
      try {
        downloadPdfFile(
          await buildAtelierProposalPdf({
            root: rootRef.current,
            customerName: data.meta.customerName,
            presetId: "residential_emerald",
            pageSelector: "section",
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
      data-proposal-preset="residential_emerald"
      className={`${styles.root}${isHi ? ` ${styles.langHi}` : ""}`}
    >
      <div className={styles.printBar}>
        <div className={styles.printBarInner}>
          <span className={styles.printBarBrand}>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- web toolbar logo
              <img src={logoUrl} alt={brand} className={styles.printBarLogo} />
            ) : null}
            {brand} · {copy.print.brand}
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
      />
    </div>
  );
}

export function EmeraldRenderer({
  data,
  installerLogoUrl,
  proposalId,
}: EmeraldRendererProps) {
  const [lang, setLang] = useState<EmeraldLang>("en");

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
      />
    </EmeraldLangProvider>
  );
}

export default EmeraldRenderer;
