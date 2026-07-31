"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  getQuantumCopy,
  type QuantumCopy,
  type QuantumLang,
} from "./quantum-copy";

type QuantumLangContextValue = {
  lang: QuantumLang;
  setLang: (lang: QuantumLang) => void;
  copy: QuantumCopy;
  isHi: boolean;
};

const QuantumLangContext = createContext<QuantumLangContextValue | null>(null);

export function QuantumLangProvider({
  lang,
  setLang,
  children,
}: {
  lang: QuantumLang;
  setLang: (lang: QuantumLang) => void;
  children: ReactNode;
}) {
  const value: QuantumLangContextValue = {
    lang,
    setLang,
    copy: getQuantumCopy(lang),
    isHi: lang === "hi",
  };
  return (
    <QuantumLangContext.Provider value={value}>
      {children}
    </QuantumLangContext.Provider>
  );
}

export function useQuantumLang(): QuantumLangContextValue {
  const ctx = useContext(QuantumLangContext);
  if (!ctx) {
    return {
      lang: "en",
      setLang: () => undefined,
      copy: getQuantumCopy("en"),
      isHi: false,
    };
  }
  return ctx;
}
