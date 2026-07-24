"use client";

/**
 * ShellContext — global OS-shell state for SOL.52.
 *
 * Provides:
 *   - commandPaletteOpen / openCommandPalette / closeCommandPalette
 *   - activeWorkspace — the "deal" currently open, cross-route persistence
 *   - navRailCollapsed — desktop/iPad left rail icons-only (more Design Studio map space)
 *
 * Consumed by: OsShell, TopBar, NavRail, CommandPalette, WorkspacePill.
 * NOT consumed by: proposal generation, billing logic, or any (public) routes.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

export type WorkspaceType = "proposal" | "customer" | "project";

export type ActiveWorkspace = {
  /** Unique ID for the deal/project (proposal.id, customer.id, etc.) */
  id: string;
  /** Display label shown in the workspace pill */
  label: string;
  /** Link that takes the user back to this workspace */
  href: string;
  /** Used to pick the pill accent color */
  type: WorkspaceType;
};

export type ShellContextValue = {
  /** Whether the Cmd+K command palette is open */
  commandPaletteOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;

  /**
   * The currently "active" deal / workspace.
   * Null when the user is at a hub/list view.
   * Set by individual workspace pages in E5+ (proposal builder, customer detail, etc.).
   * WorkspacePill auto-detects from pathname as a fallback.
   */
  activeWorkspace: ActiveWorkspace | null;
  setActiveWorkspace: (ws: ActiveWorkspace | null) => void;
  clearActiveWorkspace: () => void;

  /** Left nav rail icons-only (lg+). Gives Design Studio more map width. */
  navRailCollapsed: boolean;
  setNavRailCollapsed: (collapsed: boolean) => void;
  toggleNavRailCollapsed: () => void;
};

const NAV_RAIL_COLLAPSED_KEY = "sol52.navRailCollapsed";

// ─── Context ──────────────────────────────────────────────────────────────────

const ShellContext = createContext<ShellContextValue>({
  commandPaletteOpen: false,
  openCommandPalette: () => {},
  closeCommandPalette: () => {},
  activeWorkspace: null,
  setActiveWorkspace: () => {},
  clearActiveWorkspace: () => {},
  navRailCollapsed: false,
  setNavRailCollapsed: () => {},
  toggleNavRailCollapsed: () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ShellProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [activeWorkspace, setActiveWorkspaceState] = useState<ActiveWorkspace | null>(null);
  const [navRailCollapsed, setNavRailCollapsedState] = useState(false);
  const [navPrefLoaded, setNavPrefLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(NAV_RAIL_COLLAPSED_KEY);
      if (raw === "1" || raw === "0") {
        setNavRailCollapsedState(raw === "1");
      } else if (pathname.includes("/design-studio")) {
        // Default: collapse on Design Studio so the map gets width (iPad + desktop).
        setNavRailCollapsedState(true);
      }
    } catch {
      if (pathname.includes("/design-studio")) setNavRailCollapsedState(true);
    }
    setNavPrefLoaded(true);
    // Only on mount — pathname used for first-visit default only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!navPrefLoaded) return;
    try {
      window.localStorage.setItem(NAV_RAIL_COLLAPSED_KEY, navRailCollapsed ? "1" : "0");
    } catch {
      // ignore
    }
  }, [navRailCollapsed, navPrefLoaded]);

  useEffect(() => {
    if (!navPrefLoaded) return;
    if (!pathname.includes("/design-studio")) return;
    try {
      const raw = window.localStorage.getItem(NAV_RAIL_COLLAPSED_KEY);
      if (raw == null) setNavRailCollapsedState(true);
    } catch {
      // ignore
    }
  }, [pathname, navPrefLoaded]);

  const openCommandPalette = useCallback(() => setCommandPaletteOpen(true), []);
  const closeCommandPalette = useCallback(() => setCommandPaletteOpen(false), []);
  const setActiveWorkspace = useCallback(
    (ws: ActiveWorkspace | null) => setActiveWorkspaceState(ws),
    []
  );
  const clearActiveWorkspace = useCallback(() => setActiveWorkspaceState(null), []);
  const setNavRailCollapsed = useCallback((collapsed: boolean) => {
    setNavRailCollapsedState(collapsed);
  }, []);
  const toggleNavRailCollapsed = useCallback(() => {
    setNavRailCollapsedState((value) => !value);
  }, []);

  return (
    <ShellContext.Provider
      value={{
        commandPaletteOpen,
        openCommandPalette,
        closeCommandPalette,
        activeWorkspace,
        setActiveWorkspace,
        clearActiveWorkspace,
        navRailCollapsed,
        setNavRailCollapsed,
        toggleNavRailCollapsed,
      }}
    >
      {children}
    </ShellContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useShell(): ShellContextValue {
  return useContext(ShellContext);
}
