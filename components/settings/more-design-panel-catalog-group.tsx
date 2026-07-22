"use client";

import { DesignPanelCatalogPanel } from "@/components/settings/design-panel-catalog-panel";
import { cn } from "@/lib/utils";
import { ChevronDown, Grid2X2, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * More tab — Panel catalog for Design Studio (central, not browser-local).
 */
export function MoreDesignPanelCatalogGroup() {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash === "#more-section-panel-catalog") {
      setOpen(true);
      setMounted(true);
      detailsRef.current?.setAttribute("open", "");
      detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  function handleToggle(e: React.SyntheticEvent<HTMLDetailsElement>) {
    const isOpen = e.currentTarget.open;
    setOpen(isOpen);
    if (isOpen) setMounted(true);
  }

  return (
    <details
      ref={detailsRef}
      id="more-section-panel-catalog"
      className={cn(
        "ss-card workspace-more-group overflow-hidden p-0 [[open]_&_.more-chevron]:rotate-180",
        "[&_summary::-webkit-details-marker]:hidden [&_summary::marker]:content-none"
      )}
      onToggle={handleToggle}
    >
      <summary className="flex cursor-pointer list-none items-start gap-3 p-4 sm:p-5">
        <span className="ws-icon-well ws-icon-well--amber shrink-0" aria-hidden>
          <Grid2X2 className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="workspace-more-group__title">Panel catalog</span>
          <span className="workspace-more-group__subtitle">
            Design Studio modules — watt &amp; frame size for all users.
          </span>
        </span>
        <ChevronDown
          className="more-chevron mt-0.5 h-5 w-5 shrink-0 text-slate-500 transition-transform duration-200 dark:text-slate-400"
          aria-hidden
        />
      </summary>
      <div className="space-y-4 border-t border-slate-200/80 px-4 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4 dark:border-white/10">
        {mounted ? (
          <DesignPanelCatalogPanel />
        ) : open ? (
          <div className="flex min-h-[120px] items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading panel catalog…
          </div>
        ) : null}
      </div>
    </details>
  );
}
