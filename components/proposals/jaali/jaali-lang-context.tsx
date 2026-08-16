"use client";

import { createContext, useContext, type ReactNode } from "react";
import { getJaaliCopy, type JaaliCopy, type JaaliLang } from "./jaali-copy";

type JaaliLangContextValue = {
  lang: JaaliLang;
  setLang: (lang: JaaliLang) => void;
  copy: JaaliCopy;
  isHi: boolean;
};

const JaaliLangContext = createContext<JaaliLangContextValue | null>(null);

export function JaaliLangProvider({
  lang,
  setLang,
  children,
}: {
  lang: JaaliLang;
  setLang: (lang: JaaliLang) => void;
  children: ReactNode;
}) {
  const value: JaaliLangContextValue = {
    lang,
    setLang,
    copy: getJaaliCopy(lang),
    isHi: lang === "hi",
  };
  return <JaaliLangContext.Provider value={value}>{children}</JaaliLangContext.Provider>;
}

export function useJaaliLang(): JaaliLangContextValue {
  const ctx = useContext(JaaliLangContext);
  if (!ctx) {
    return {
      lang: "en",
      setLang: () => undefined,
      copy: getJaaliCopy("en"),
      isHi: false,
    };
  }
  return ctx;
}
