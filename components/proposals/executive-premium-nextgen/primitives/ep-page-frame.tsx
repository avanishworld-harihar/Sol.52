"use client";

import { EP_CANVAS, EP_SURFACE } from "@/lib/executive-premium-nextgen/ep-design-tokens";
import { cn } from "@/lib/utils";

type Variant = "fullBleed" | "contained" | "containedCentre";

type Props = {
  children?: React.ReactNode;
  variant?: Variant;
  className?: string;
  /** Primary 60% zone — thesis number territory */
  primary?: React.ReactNode;
  supporting?: React.ReactNode;
  grounding?: React.ReactNode;
};

/**
 * Page frame — 1200px max, 120px margins (responsive), 60/30/10 optional zones.
 */
export function EpPageFrame({
  children,
  variant = "contained",
  className,
  primary,
  supporting,
  grounding,
}: Props) {
  const useZones = primary != null;

  if (variant === "fullBleed") {
    return (
      <section
        className={cn("relative flex min-h-[100dvh] w-full flex-col snap-start snap-always overflow-hidden", className)}
        style={{ backgroundColor: EP_SURFACE }}
      >
        {useZones ? (
          <div
            className="relative z-10 flex min-h-[100dvh] flex-col"
            style={{
              paddingLeft: "var(--ep-margin-desktop)",
              paddingRight: "var(--ep-margin-desktop)",
              paddingTop: "var(--ep-space-10)",
              paddingBottom: "var(--ep-space-10)",
            }}
          >
            {grounding && <div className="shrink-0">{grounding}</div>}
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center text-center">{primary}</div>
            {supporting ? (
              <div className="shrink-0" style={{ marginTop: "var(--ep-space-12)" }}>
                {supporting}
              </div>
            ) : null}
            {children}
          </div>
        ) : (
          children
        )}
      </section>
    );
  }

  return (
    <section
      className={cn(
        "relative flex min-h-[100dvh] w-full flex-col snap-start snap-always",
        variant === "containedCentre" && "items-center",
        className
      )}
      style={{ backgroundColor: EP_SURFACE }}
    >
      <div
        className={cn(
          "mx-auto flex w-full min-h-[100dvh] flex-col",
          variant === "containedCentre" && "items-center text-center"
        )}
        style={{
          maxWidth: "var(--ep-content-max)",
          paddingLeft: "var(--ep-margin-desktop)",
          paddingRight: "var(--ep-margin-desktop)",
          paddingTop: "var(--ep-space-10)",
          paddingBottom: "var(--ep-space-10)",
        }}
      >
        {useZones ? (
          <>
            {primary ? (
              <div className="flex flex-[6] flex-col items-center justify-center">{primary}</div>
            ) : null}
            {supporting ? (
              <div className="flex flex-[3] flex-col justify-center" style={{ marginTop: "var(--ep-space-12)" }}>
                {supporting}
              </div>
            ) : null}
            {grounding ? (
              <div className="flex flex-[1] flex-col justify-end" style={{ marginTop: "var(--ep-space-10)" }}>
                {grounding}
              </div>
            ) : null}
          </>
        ) : null}
        {children ?? null}
      </div>
    </section>
  );
}

export function EpDocumentCanvas({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn("min-h-screen w-full snap-y snap-mandatory overflow-y-auto", className)}
      style={{ backgroundColor: EP_CANVAS }}
    >
      {children}
    </div>
  );
}
