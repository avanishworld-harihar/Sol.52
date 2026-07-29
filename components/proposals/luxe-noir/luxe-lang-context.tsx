"use client";

import { createContext, useContext, type ReactNode } from "react";
import { getLuxeCopy, type LuxeCopy, type LuxeLang } from "./luxe-copy";

type LuxeLangContextValue = {
  lang: LuxeLang;
  setLang: (lang: LuxeLang) => void;
  copy: LuxeCopy;
  isHi: boolean;
};

const LuxeLangContext = createContext<LuxeLangContextValue | null>(null);

export function LuxeLangProvider({
  lang,
  setLang,
  children,
}: {
  lang: LuxeLang;
  setLang: (lang: LuxeLang) => void;
  children: ReactNode;
}) {
  const value: LuxeLangContextValue = {
    lang,
    setLang,
    copy: getLuxeCopy(lang),
    isHi: lang === "hi",
  };
  return (
    <LuxeLangContext.Provider value={value}>{children}</LuxeLangContext.Provider>
  );
}

export function useLuxeLang(): LuxeLangContextValue {
  const ctx = useContext(LuxeLangContext);
  if (!ctx) {
    // Safe fallback when used outside provider (e.g. isolated preview)
    return {
      lang: "en",
      setLang: () => undefined,
      copy: getLuxeCopy("en"),
      isHi: false,
    };
  }
  return ctx;
}
