"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useEpGoldenLang } from "@/components/proposals/executive-premium-editorial/ep-golden-lang-context";

type Props = {
  children: ReactNode;
  className?: string;
  cover?: boolean;
  /** Hide page footer brand (closing already shows company identity). */
  hideFooterBrand?: boolean;
};

export function EpLuxuryPage({ children, className, cover = false, hideFooterBrand = false }: Props) {
  const { footerBrand } = useEpGoldenLang();
  const showFooter = !cover && !hideFooterBrand && Boolean(footerBrand?.trim());

  return (
    <section className={cn("ep-gl-page", cover && "ep-gl-page--cover")}>
      <div className="ep-gl-luxury-border" aria-hidden />
      {cover ? (
        <div className={cn("ep-gl-cover-page", className)}>{children}</div>
      ) : (
        <div className={cn("ep-gl-page-body", className)}>
          {children}
          {showFooter ? (
            <footer className="ep-gl-page-footer-brand">
              <span>{footerBrand}</span>
            </footer>
          ) : null}
        </div>
      )}
    </section>
  );
}
