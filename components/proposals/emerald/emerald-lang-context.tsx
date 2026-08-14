"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  getEmeraldCopy,
  type EmeraldCopy,
  type EmeraldLang,
} from "./emerald-copy";

type EmeraldLangContextValue = {
  lang: EmeraldLang;
  setLang: (lang: EmeraldLang) => void;
  copy: EmeraldCopy;
  isHi: boolean;
};

const EmeraldLangContext = createContext<EmeraldLangContextValue | null>(null);

export function EmeraldLangProvider({
  lang,
  setLang,
  children,
}: {
  lang: EmeraldLang;
  setLang: (lang: EmeraldLang) => void;
  children: ReactNode;
}) {
  const value: EmeraldLangContextValue = {
    lang,
    setLang,
    copy: getEmeraldCopy(lang),
    isHi: lang === "hi",
  };
  return (
    <EmeraldLangContext.Provider value={value}>
      {children}
    </EmeraldLangContext.Provider>
  );
}

export function useEmeraldLang(): EmeraldLangContextValue {
  const ctx = useContext(EmeraldLangContext);
  if (!ctx) {
    return {
      lang: "en",
      setLang: () => undefined,
      copy: getEmeraldCopy("en"),
      isHi: false,
    };
  }
  return ctx;
}
