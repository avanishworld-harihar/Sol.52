"use client";

/**
 * NavRail — desktop left navigation rail.
 *
 * Visible only on lg+ screens. BottomNav handles mobile/tablet portrait.
 *
 * Default: 216px labeled rail with Sol.52 wordmark.
 * Design Studio: narrow icons-only rail so the map gets more width (no collapse arrow).
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/language-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { BrandLogo } from "@/components/brand-logo";
import { Logo } from "@/components/Logo";
import { APP_NAV_ROUTES } from "@/lib/app-nav-config";
import { APP_DISPLAY_NAME } from "@/lib/app-brand";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/proposals") {
    return (
      pathname.startsWith("/proposals") ||
      pathname.startsWith("/proposal") ||
      pathname.startsWith("/workspace")
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavRail() {
  const pathname = usePathname();
  const { t } = useLanguage();
  /** Design Studio needs max map width — icons only, no labels. */
  const iconsOnly = pathname.includes("/design-studio");

  return (
    <aside
      className={cn(
        "hidden lg:flex",
        iconsOnly ? "w-14" : "w-[13.5rem]",
        "h-full max-h-svh shrink-0 self-stretch flex-col",
        "overflow-hidden transition-[width] duration-200",
        "border-r border-white/35 dark:border-white/8",
        "bg-white/92 backdrop-blur-xl backdrop-saturate-150",
        "dark:bg-[#0d1117]/92 dark:backdrop-saturate-100",
        "shadow-[1px_0_0_rgba(255,255,255,0.55)] dark:shadow-[1px_0_0_rgba(255,255,255,0.04)]"
      )}
      aria-label="Primary navigation"
      data-icons-only={iconsOnly ? "true" : undefined}
    >
      <div
        className={cn(
          "flex h-[3.75rem] shrink-0 items-center border-b border-white/35 dark:border-white/8",
          iconsOnly ? "justify-center px-1" : "px-3"
        )}
      >
        {iconsOnly ? (
          <Link
            href="/"
            aria-label={`${APP_DISPLAY_NAME} home`}
            title={APP_DISPLAY_NAME}
            className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg"
          >
            <Logo compact decorative className="h-7 w-7" />
          </Link>
        ) : (
          <BrandLogo href="/" rail />
        )}
      </div>

      <nav
        className={cn(
          "flex flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden py-3",
          iconsOnly ? "items-center px-1.5" : "px-2"
        )}
        aria-label="Main navigation"
      >
        {APP_NAV_ROUTES.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          const label = t(item.labelKey);

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              aria-current={active ? "page" : undefined}
              aria-label={label}
              title={label}
              className={cn(
                "group relative flex items-center rounded-xl transition-all duration-200",
                iconsOnly
                  ? "h-10 w-10 justify-center"
                  : "h-10 w-full gap-3 px-3",
                active
                  ? "bg-teal-600 text-white shadow-md dark:bg-teal-500"
                  : [
                      "text-slate-600 hover:text-brand-800",
                      "hover:bg-slate-100/80 dark:text-slate-400",
                      "dark:hover:bg-white/[0.07] dark:hover:text-slate-100",
                    ]
              )}
            >
              <span className="relative flex h-[1.1rem] w-[1.1rem] shrink-0 items-center justify-center">
                <Icon
                  className={cn(
                    "h-[1.1rem] w-[1.1rem] shrink-0 transition-transform duration-200",
                    active
                      ? "scale-105 text-white"
                      : "text-slate-500 group-hover:text-brand-700 dark:text-slate-400 dark:group-hover:text-slate-200"
                  )}
                  aria-hidden
                  strokeWidth={2.25}
                />
              </span>

              {!iconsOnly ? (
                <span
                  className={cn(
                    "min-w-0 truncate text-[13px] font-semibold",
                    active ? "text-white" : ""
                  )}
                >
                  {label}
                </span>
              ) : (
                <span className="sr-only">{label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div
        className={cn(
          "flex shrink-0 flex-col gap-2",
          "border-t border-white/35 dark:border-white/8",
          iconsOnly ? "items-center p-1.5" : "p-3",
          "pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]"
        )}
      >
        <div
          className={cn(
            "flex items-center gap-2",
            iconsOnly && "flex-col gap-1.5"
          )}
        >
          <ThemeToggle className="h-9 w-9 shrink-0" />
          {!iconsOnly ? <LanguageToggle className="inline-flex" /> : null}
        </div>
      </div>
    </aside>
  );
}
