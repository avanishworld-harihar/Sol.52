"use client";

import { createContext, useContext, type ReactNode } from "react";
import { getSiennaCopy, type SiennaCopy, type SiennaLang } from "./sienna-copy";

type SiennaLangContextValue = {
  lang: SiennaLang;
  setLang: (lang: SiennaLang) => void;
  copy: SiennaCopy;
  isHi: boolean;
};

const SiennaLangContext = createContext<SiennaLangContextValue | null>(null);

export function SiennaLangProvider({
  lang,
  setLang,
  children,
}: {
  lang: SiennaLang;
  setLang: (lang: SiennaLang) => void;
  children: ReactNode;
}) {
  const value: SiennaLangContextValue = {
    lang,
    setLang,
    copy: getSiennaCopy(lang),
    isHi: lang === "hi",
  };
  return <SiennaLangContext.Provider value={value}>{children}</SiennaLangContext.Provider>;
}

export function useSiennaLang(): SiennaLangContextValue {
  const ctx = useContext(SiennaLangContext);
  if (!ctx) {
    return {
      lang: "en",
      setLang: () => undefined,
      copy: getSiennaCopy("en"),
      isHi: false,
    };
  }
  return ctx;
}
