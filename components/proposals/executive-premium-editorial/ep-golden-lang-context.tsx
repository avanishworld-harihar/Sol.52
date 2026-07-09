"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ProposalLang } from "@/lib/proposal-i18n";
import { epGoldenCopy, type EpGoldenCopy } from "@/lib/executive-premium-editorial/ep-golden-i18n";

type Ctx = { lang: ProposalLang; copy: EpGoldenCopy };

const EpGoldenLangContext = createContext<Ctx>({ lang: "en", copy: epGoldenCopy("en") });

export function EpGoldenLangProvider({
  lang,
  children,
}: {
  lang: ProposalLang;
  children: ReactNode;
}) {
  return (
    <EpGoldenLangContext.Provider value={{ lang, copy: epGoldenCopy(lang) }}>
      {children}
    </EpGoldenLangContext.Provider>
  );
}

export function useEpGoldenLang(): Ctx {
  return useContext(EpGoldenLangContext);
}
