"use client";

/**
 * NavRail — desktop / iPad landscape left navigation rail.
 *
 * Visible only on lg+ screens. BottomNav handles smaller viewports.
 *
 * Modes:
 *   Expanded (~216px): logo + labels + theme/lang
 *   Collapsed (~56px): icons only — more map space in Design Studio
 *
 * Toggle: chevron on the rail edge (persisted via ShellContext / localStorage).
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { BrandLogo } from "@/components/brand-logo";
import { Logo } from "@/components/Logo";
import { APP_NAV_ROUTES } from "@/lib/app-nav-config";
import { useShell } from "@/lib/shell-context";
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
  const { navRailCollapsed, toggleNavRailCollapsed } = useShell();
  const collapsed = navRailCollapsed;

  return (
    <aside
      className={cn(
        "hidden lg:flex",
        "relative h-full max-h-svh shrink-0 self-stretch flex-col",
        "overflow-hidden transition-[width] duration-200 ease-out",
        collapsed ? "w-14" : "w-[13.5rem]",
        "border-r border-white/35 dark:border-white/8",
        "bg-white/92 backdrop-blur-xl backdrop-saturate-150",
        "dark:bg-[#0d1117]/92 dark:backdrop-saturate-100",
        "shadow-[1px_0_0_rgba(255,255,255,0.55)] dark:shadow-[1px_0_0_rgba(255,255,255,0.04)]"
      )}
      aria-label="Primary navigation"
      data-collapsed={collapsed ? "true" : "false"}
    >
      {/* Collapse / expand — sits on the rail edge */}
      <button
        type="button"
        onClick={toggleNavRailCollapsed}
        title={collapsed ? "Show navigation labels" : "Collapse navigation (icons only)"}
        aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
        aria-expanded={!collapsed}
        className={cn(
          "absolute -right-3 top-[4.15rem] z-30 flex h-6 w-6 items-center justify-center",
          "rounded-full border border-slate-200 bg-white text-slate-600 shadow-md",
          "hover:bg-teal-50 hover:text-teal-800",
          "dark:border-white/15 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-teal-950 dark:hover:text-teal-100",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
        )}
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
        )}
      </button>

      {/* Logo */}
      <div
        className={cn(
          "flex h-[3.75rem] shrink-0 items-center border-b border-white/35 dark:border-white/8",
          collapsed ? "justify-center px-1" : "px-3"
        )}
      >
        {collapsed ? (
          <Link
            href="/"
            prefetch
            title={`${APP_DISPLAY_NAME} home`}
            aria-label={`${APP_DISPLAY_NAME} home`}
            className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg"
          >
            <Logo className="h-8 w-8" decorative />
          </Link>
        ) : (
          <BrandLogo href="/" rail />
        )}
      </div>

      {/* Nav items */}
      <nav
        className={cn(
          "flex flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden py-3",
          collapsed ? "items-center px-1.5" : "px-2"
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
              title={label}
              className={cn(
                "group relative flex h-10 items-center rounded-xl transition-all duration-200",
                collapsed ? "w-10 justify-center px-0" : "w-full gap-3 px-3",
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

              {!collapsed ? (
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

      {/* Bottom utilities */}
      <div
        className={cn(
          "flex shrink-0 flex-col gap-2 border-t border-white/35 dark:border-white/8",
          "pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]",
          collapsed ? "items-center p-2" : "p-3"
        )}
      >
        {collapsed ? (
          <ThemeToggle className="h-9 w-9 shrink-0" />
        ) : (
          <div className="flex items-center gap-2">
            <ThemeToggle className="h-9 w-9 shrink-0" />
            <LanguageToggle className="inline-flex" />
          </div>
        )}
      </div>
    </aside>
  );
}
