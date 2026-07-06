"use client";

import type { ReactNode } from "react";
import type { ProposalLang } from "@/lib/proposal-i18n";

export const AURORA = {
  indigo: "#0B2447",
  amber: "#F5A524",
  emerald: "#10B981",
  sky: "#2E90FA",
  pearl: "#FAFBFC",
  ink: "#1E293B",
  muted: "#64748B",
  border: "#E2E8F0",
} as const;

export function fmtInr(v: number): string {
  return `₹${Math.round(v).toLocaleString("en-IN")}`;
}

export function fmtInrL(v: number): string {
  const x = Math.round(v);
  if (x >= 100_000) return `₹${(x / 100_000).toFixed(1)}L`;
  if (x >= 1_000) return `₹${(x / 1_000).toFixed(0)}k`;
  return fmtInr(x);
}

type ShellProps = {
  tone?: "pearl" | "sky" | "indigo";
  className?: string;
  children: ReactNode;
};

export function AuroraPageShell({ tone = "pearl", className = "", children }: ShellProps) {
  return (
    <div className={`aurora-page aurora-page--${tone} ${className}`.trim()}>
      <div className="aurora-page-inner">{children}</div>
    </div>
  );
}

type TextProps = {
  lang?: ProposalLang;
  children: ReactNode;
  className?: string;
};

export function AuroraEyebrow({ children, className = "" }: TextProps) {
  return (
    <p className={`aurora-eyebrow ${className}`.trim()}>
      {children}
    </p>
  );
}

export function AuroraTitle({ children, className = "" }: TextProps) {
  return <h2 className={`aurora-title ${className}`.trim()}>{children}</h2>;
}

export function AuroraLead({ children, className = "" }: TextProps) {
  return <p className={`aurora-lead ${className}`.trim()}>{children}</p>;
}
