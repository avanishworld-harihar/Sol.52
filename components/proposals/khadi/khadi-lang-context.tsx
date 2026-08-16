"use client";

import { createContext, useContext, type ReactNode } from "react";
import { getKhadiCopy, type KhadiCopy, type KhadiLang } from "./khadi-copy";

type KhadiLangContextValue = {
  lang: KhadiLang;
  setLang: (lang: KhadiLang) => void;
  copy: KhadiCopy;
  isHi: boolean;
};

const KhadiLangContext = createContext<KhadiLangContextValue | null>(null);

export function KhadiLangProvider({
  lang,
  setLang,
  children,
}: {
  lang: KhadiLang;
  setLang: (lang: KhadiLang) => void;
  children: ReactNode;
}) {
  const value: KhadiLangContextValue = {
    lang,
    setLang,
    copy: getKhadiCopy(lang),
    isHi: lang === "hi",
  };
  return <KhadiLangContext.Provider value={value}>{children}</KhadiLangContext.Provider>;
}

export function useKhadiLang(): KhadiLangContextValue {
  const ctx = useContext(KhadiLangContext);
  if (!ctx) {
    return {
      lang: "en",
      setLang: () => undefined,
      copy: getKhadiCopy("en"),
      isHi: false,
    };
  }
  return ctx;
}
