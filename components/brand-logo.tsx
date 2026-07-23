"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Logo } from "@/components/Logo";
import { APP_DISPLAY_NAME } from "@/lib/app-brand";
import { PROPOSAL_BRANDING_UPDATED_EVENT, readProposalBrandingSettings } from "@/lib/proposal-branding-settings";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  href?: string;
  /**
   * Nav rail: fixed box sized for full Sol.52 + “Solar Design Platform” tagline.
   * Avoids the large LOGO_BOX overflowing / clipping the rail.
   */
  rail?: boolean;
  /** Mobile top bar — smaller mark so actions (lang toggle) stay on-screen. */
  dense?: boolean;
};

/** Box keeps header layout stable. */
const LOGO_BOX = cn(
  "relative shrink-0 overflow-visible",
  "h-[3.8rem] w-[11rem] sm:h-[4.3rem] sm:w-[13rem] md:h-[4.5rem] md:w-[13.5rem] lg:h-[4.75rem] lg:w-[14.5rem]"
);

/** Full wordmark + tagline, fits xl nav rail (~13.5–14rem). */
const RAIL_LOGO_BOX = "relative h-[3.7rem] w-[11.15rem] shrink-0 overflow-hidden bg-transparent";

/** Phone top bar — leaves room for search / bell / theme / EN|हि. */
const DENSE_LOGO_BOX = "relative h-9 w-[6.75rem] shrink-0 overflow-hidden bg-transparent sm:h-10 sm:w-[8rem]";

export function BrandLogo({ className, href = "/", rail, dense }: BrandLogoProps) {
  const [installerLogoUrl, setInstallerLogoUrl] = useState("");
  const [installerName, setInstallerName] = useState("");

  useEffect(() => {
    const sync = () => {
      const s = readProposalBrandingSettings();
      setInstallerLogoUrl(s.installerLogoUrl?.trim() ?? "");
      setInstallerName(s.installerName?.trim() ?? "");
    };
    sync();
    window.addEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, sync);
    return () => window.removeEventListener(PROPOSAL_BRANDING_UPDATED_EVENT, sync);
  }, []);

  const boxClass = rail
    ? cn(RAIL_LOGO_BOX, className)
    : dense
      ? cn(DENSE_LOGO_BOX, className)
      : cn(LOGO_BOX, "bg-transparent", className);
  const hasLogo = installerLogoUrl.length > 0;
  const hasName = installerName.length > 0;

  const inner = (
    <div className={boxClass}>
      {hasLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={installerLogoUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-contain object-left"
          {...(href ? { "aria-hidden": true } : {})}
        />
      ) : hasName ? (
        <span
          className={cn(
            "absolute inset-0 flex items-center text-left font-semibold leading-tight tracking-tight",
            "text-[#072141] dark:text-white",
            dense ? "text-xs sm:text-sm" : rail ? "text-[15px]" : "text-base sm:text-lg"
          )}
          {...(href ? { "aria-hidden": true } : {})}
        >
          <span className="line-clamp-2 break-words">{installerName}</span>
        </span>
      ) : (
        // More → Brand: no company name and no logo PNG → platform Sol.52
        <Logo className="absolute inset-0 h-full w-full" decorative={!!href} />
      )}
    </div>
  );

  const homeLabel = hasName ? `${installerName} home` : `${APP_DISPLAY_NAME} home`;

  if (href) {
    return (
      <Link
        href={href}
        className="flex shrink-0 items-center rounded-md bg-transparent outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-brand-500/80"
        aria-label={homeLabel}
      >
        {inner}
      </Link>
    );
  }

  return inner;
}
