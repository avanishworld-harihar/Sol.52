"use client";

import { epFontClassName } from "@/lib/executive-premium-nextgen/ep-fonts";
import "@/components/proposals/executive-premium-nextgen/ep-nextgen.css";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
};

/** Scopes EP fonts + CSS tokens to NextGen renderer only. */
export function EpFontRoot({ children, className }: Props) {
  return <div className={cn("ep-nextgen-root", epFontClassName, className)}>{children}</div>;
}
