"use client";

import { EP_CANVAS, EP_SURFACE } from "@/lib/executive-premium-nextgen/ep-design-tokens";
import { cn } from "@/lib/utils";

type Variant = "fullBleed" | "contained" | "containedCentre";

type Props = {
  children?: React.ReactNode;
  variant?: Variant;
  className?: string;
  /** Vertical alignment of page content (default centres on sheet). */
  contentAlign?: "start" | "center";
  /** Primary beat — thesis / dominant element */
  primary?: React.ReactNode;
  supporting?: React.ReactNode;
  grounding?: React.ReactNode;
};

const SHELL_PADDING = {
  paddingLeft: "var(--ep-margin-desktop)",
  paddingRight: "var(--ep-margin-desktop)",
  paddingTop: "var(--ep-space-10)",
  paddingBottom: "var(--ep-space-10)",
} as const;

/**
 * Page frame — 1200px max, 120px margins.
 * Beats stack with fixed gaps (not stretched across 100vh zones).
 */
export function EpPageFrame({
  children,
  variant = "contained",
  className,
  contentAlign = "center",
  primary,
  supporting,
  grounding,
}: Props) {
  const useZones = primary != null;

  if (variant === "fullBleed") {
    return (
      <section className={cn("ep-page ep-page--cover relative flex w-full flex-col", className)}>
        {children}
      </section>
    );
  }

  return (
    <section className={cn("ep-page ep-page--sheet relative flex w-full flex-col", className)}>
      <div
        className={cn(
          "mx-auto flex w-full flex-1 flex-col",
          contentAlign === "center" ? "justify-center" : "justify-start",
          variant === "containedCentre" && "items-center text-center"
        )}
        style={{
          maxWidth: "var(--ep-content-max)",
          ...SHELL_PADDING,
        }}
      >
        {useZones ? (
          <div
            className={cn(
              "ep-page-beats flex w-full flex-col",
              variant === "containedCentre" && "items-center"
            )}
            style={{ gap: "var(--ep-space-12)" }}
          >
            {primary ? (
              <div
                className={cn(
                  "w-full",
                  variant === "containedCentre" && "flex flex-col items-center text-center"
                )}
              >
                {primary}
              </div>
            ) : null}
            {supporting ? <div className="w-full">{supporting}</div> : null}
            {grounding ? (
              <div
                className={cn("w-full", variant === "containedCentre" && "flex justify-center")}
                style={{ marginTop: "var(--ep-space-2)" }}
              >
                {grounding}
              </div>
            ) : null}
          </div>
        ) : null}
        {children ?? null}
      </div>
    </section>
  );
}

export function EpDocumentCanvas({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("ep-document-canvas w-full", className)} style={{ backgroundColor: EP_CANVAS }}>
      {children}
    </div>
  );
}
