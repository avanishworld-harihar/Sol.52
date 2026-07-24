"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ProposalLang } from "@/lib/proposal-i18n";
import { epGoldenCopy, type EpGoldenCopy } from "@/lib/executive-premium-editorial/ep-golden-i18n";

type Ctx = {
  lang: ProposalLang;
  copy: EpGoldenCopy;
  /** Page footer company name when brand footer rule shows name. */
  footerBrand?: string;
};

const EpGoldenLangContext = createContext<Ctx>({ lang: "en", copy: epGoldenCopy("en") });

export function EpGoldenLangProvider({
  lang,
  footerBrand,
  children,
}: {
  lang: ProposalLang;
  footerBrand?: string;
  children: ReactNode;
}) {
  return (
    <EpGoldenLangContext.Provider value={{ lang, copy: epGoldenCopy(lang), footerBrand }}>
      {children}
    </EpGoldenLangContext.Provider>
  );
}

export function useEpGoldenLang(): Ctx {
  return useContext(EpGoldenLangContext);
}
