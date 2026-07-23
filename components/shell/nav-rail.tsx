"use client";

/**
 * NavRail — desktop left navigation rail.
 *
 * Visible only on lg+ screens. The existing BottomNav handles mobile/tablet portrait.
 * The existing DesktopTopNav (inline pill nav) is replaced by this rail on lg+.
 *
 * Size (lg+ including iPad landscape ~1024px):
 *   216px labeled rail with full Sol.52 wordmark + tagline
 *
 * Fixed-height rail — main column scrolls; rail stays in place (see OsShell).
 *
 * Active state: matches BottomNav teal palette for visual consistency.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/language-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { BrandLogo } from "@/components/brand-logo";
import { APP_NAV_ROUTES } from "@/lib/app-nav-config";
import { cn } from "@/lib/utils";

// ─── Active detection ─────────────────────────────────────────────────────────
// Mirrors the isActive logic in bottom-nav.tsx and desktop-top-nav.tsx.

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/proposals") {
    return pathname.startsWith("/proposals") || pathname.startsWith("/proposal") || pathname.startsWith("/workspace");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NavRail() {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <aside
      className={cn(
        // Only visible on desktop / tablet landscape (lg+)
        "hidden lg:flex",
        // Labeled rail from lg — iPad landscape is ~1024–1180px (below xl)
        "w-[13.5rem]",
        // Layout — full shell height; parent uses h-svh + overflow-hidden
        "h-full max-h-svh shrink-0 self-stretch flex-col",
        "overflow-hidden",
        // Surface: glass, matches TopBar
        "border-r border-white/35 dark:border-white/8",
        "bg-white/92 backdrop-blur-xl backdrop-saturate-150",
        "dark:bg-[#0d1117]/92 dark:backdrop-saturate-100",
        "shadow-[1px_0_0_rgba(255,255,255,0.55)] dark:shadow-[1px_0_0_rgba(255,255,255,0.04)]"
      )}
      aria-label="Primary navigation"
    >
      {/* ── Logo header — height matches TopBar so columns align ──────── */}
      <div
        className={cn(
          "flex h-[3.75rem] shrink-0 items-center",
          "border-b border-white/35 dark:border-white/8",
          "px-3"
        )}
      >
        <BrandLogo href="/" rail />
      </div>

      {/* ── Navigation items ─────────────────────────────────────────────── */}
      <nav
        className="flex flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden px-2 py-3"
        aria-label="Main navigation"
      >
        {APP_NAV_ROUTES.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              aria-current={active ? "page" : undefined}
              title={t(item.labelKey)}
              className={cn(
                "group relative flex h-10 w-full items-center gap-3 rounded-xl",
                "px-3 transition-all duration-200",
                // Active state — teal pill (matches BottomNav)
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
                      ? "text-white scale-105"
                      : "text-slate-500 group-hover:text-brand-700 dark:text-slate-400 dark:group-hover:text-slate-200"
                  )}
                  aria-hidden
                  strokeWidth={2.25}
                />
              </span>

              <span
                className={cn(
                  "min-w-0 truncate text-[13px] font-semibold",
                  active ? "text-white" : ""
                )}
              >
                {t(item.labelKey)}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom utilities ─────────────────────────────────────────────── */}
      <div
        className={cn(
          "flex shrink-0 flex-col gap-2",
          "border-t border-white/35 dark:border-white/8",
          "p-3",
          "pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]"
        )}
      >
        <div className="flex items-center gap-2">
          <ThemeToggle className="h-9 w-9 shrink-0" />
          <LanguageToggle className="inline-flex" />
        </div>
      </div>
    </aside>
  );
}
