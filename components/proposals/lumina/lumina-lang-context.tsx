"use client";

import { createContext, useContext, type ReactNode } from "react";
import { getLuminaCopy, type LuminaCopy, type LuminaLang } from "./lumina-copy";

type LuminaLangContextValue = {
  lang: LuminaLang;
  setLang: (lang: LuminaLang) => void;
  copy: LuminaCopy;
  isHi: boolean;
};

const LuminaLangContext = createContext<LuminaLangContextValue | null>(null);

export function LuminaLangProvider({
  lang,
  setLang,
  children,
}: {
  lang: LuminaLang;
  setLang: (lang: LuminaLang) => void;
  children: ReactNode;
}) {
  const value: LuminaLangContextValue = {
    lang,
    setLang,
    copy: getLuminaCopy(lang),
    isHi: lang === "hi",
  };
  return <LuminaLangContext.Provider value={value}>{children}</LuminaLangContext.Provider>;
}

export function useLuminaLang(): LuminaLangContextValue {
  const ctx = useContext(LuminaLangContext);
  if (!ctx) {
    return {
      lang: "en",
      setLang: () => undefined,
      copy: getLuminaCopy("en"),
      isHi: false,
    };
  }
  return ctx;
}
