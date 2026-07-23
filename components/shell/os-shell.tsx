"use client";

/**
 * OsShell — the SOL.52 OS-layer shell wrapper (E2).
 *
 * Replaces `AppShell + BottomNav` in app/(main)/layout.tsx.
 * All other uses of AppShell (admin, 404) remain unchanged.
 *
 * Layout (desktop lg+):
 * ┌──────────────────────────────────────────────────────┐
 * │ NavRail (56–216px) │ TopBar (sticky)                 │
 * │ ├─────────────────┤─────────────────────────────────┤
 * │ │ Logo            │ Breadcrumb + WorkspacePill       │
 * │ │ Nav items       │                                  │
 * │ │ ...             │  Page content (scrollable)       │
 * │ │ Theme/Lang      │                                  │
 * └──────────────────────────────────────────────────────┘
 *
 * Layout (mobile/tablet <lg):
 * ┌──────────────────────────────────────────────────────┐
 * │ TopBar (Logo + Search + Theme + Lang)                │
 * │──────────────────────────────────────────────────────│
 * │  Page content (scrollable)                          │
 * │──────────────────────────────────────────────────────│
 * │ BottomNav (portal into #ss-bottom-nav-portal)       │
 * └──────────────────────────────────────────────────────┘
 *
 * Performance:
 *   - NavRail + TopBar + BottomNav are all memo'd or stable — no re-render
 *     on page navigation (same as original AppShell design goal).
 *   - Cmd+K palette renders into document.body via portal.
 *   - applyPerformanceMode called once on mount (same as AppShell).
 *
 * Backward compatibility:
 *   - AppShell, BottomNav, DesktopTopNav remain unchanged.
 *   - pageContainerClass export from app-shell.tsx is untouched.
 *   - All existing routes, proposal flows, public pages are unaffected.
 */

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { applyPerformanceMode, readPerformanceMode } from "@/lib/performance-mode";
import { ShellProvider, useShell } from "@/lib/shell-context";
import { NavRail } from "@/components/shell/nav-rail";
import { TopBar } from "@/components/shell/top-bar";
import { CommandPalette } from "@/components/shell/command-palette";
import { BottomNav } from "@/components/bottom-nav";
import { cn } from "@/lib/utils";

// ─── Keyboard shortcut wiring ─────────────────────────────────────────────────

/**
 * Registers Cmd+K / Ctrl+K global shortcut inside the ShellProvider.
 * Renders nothing — side-effect only.
 */
function ShellKeyboardShortcuts() {
  const { openCommandPalette } = useShell();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        openCommandPalette();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [openCommandPalette]);

  return null;
}

// ─── Inner shell (needs ShellProvider in scope) ───────────────────────────────

function OsShellInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // Design Studio needs the full content viewport — no page scroll / bottom-nav chrome.
  const immersive = pathname.includes("/design-studio");

  // Replaces AppShell's useEffect for performance mode
  useEffect(() => {
    applyPerformanceMode(readPerformanceMode());
  }, []);

  return (
    <div className="flex h-svh max-h-svh w-full max-w-[100vw] overflow-hidden">
      {/* Cmd+K wiring */}
      <ShellKeyboardShortcuts />

      {/* ── Desktop left rail (lg+) — fixed column; does not scroll with content ── */}
      <NavRail />

      {/* ── Main content column — only this area scrolls ───────────────── */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar />

        <main
          className={cn(
            // min-h-0 is required so TopBar stays visible inside h-svh shell
            "app-shell relative z-[1] flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overscroll-y-contain",
            immersive ? "overflow-hidden" : "overflow-y-auto"
          )}
        >
          <section
            className={cn(
              "mx-auto w-full flex-1 overflow-x-hidden",
              immersive
                ? "flex h-full min-h-0 max-w-none flex-col overflow-hidden p-0"
                : cn(
                    "min-h-0",
                    "px-3 pt-4 sm:px-4 sm:space-y-4 sm:pt-5",
                    "md:space-y-5 md:px-5 md:pt-6",
                    "lg:pt-6 2xl:px-8",
                    "max-w-full xl:max-w-[90rem]",
                    "pb-[max(6.75rem,calc(5.5rem+env(safe-area-inset-bottom,0px)))] lg:pb-6"
                  )
            )}
          >
            {children}
          </section>
        </main>
      </div>

      {/* ── Mobile bottom nav — hidden in Design Studio immersive mode ── */}
      {!immersive ? <BottomNav /> : null}

      {/* ── Cmd+K command palette (portal into body) ─────────────────── */}
      <CommandPalette />
    </div>
  );
}

// ─── Public export ────────────────────────────────────────────────────────────

export function OsShell({ children }: { children: ReactNode }) {
  return (
    <ShellProvider>
      <OsShellInner>{children}</OsShellInner>
    </ShellProvider>
  );
}
