"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type MenuState = {
  x: number;
  y: number;
  documentId: string;
  filename: string;
} | null;

type Props = {
  documentId: string;
  filename: string;
  children: React.ReactNode;
  className?: string;
};

/**
 * Placeholder for future category reassignment (desktop right-click / mobile long-press).
 * Backend not implemented — menu item is disabled.
 */
export function DocumentMoveCategoryMenu({ documentId, filename, children, className }: Props) {
  const [menu, setMenu] = useState<MenuState>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchMoved = useRef(false);

  const close = useCallback(() => setMenu(null), []);

  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu, close]);

  function openAt(x: number, y: number) {
    setMenu({ x, y, documentId, filename });
  }

  return (
    <>
      <div
        className={className}
        data-document-id={documentId}
        data-move-category-ready="true"
        onContextMenu={(e) => {
          e.preventDefault();
          openAt(e.clientX, e.clientY);
        }}
        onTouchStart={(e) => {
          touchMoved.current = false;
          const touch = e.touches[0];
          if (!touch) return;
          longPressTimer.current = setTimeout(() => {
            if (!touchMoved.current) {
              openAt(touch.clientX, touch.clientY);
            }
          }, 550);
        }}
        onTouchMove={() => {
          touchMoved.current = true;
          if (longPressTimer.current) clearTimeout(longPressTimer.current);
        }}
        onTouchEnd={() => {
          if (longPressTimer.current) clearTimeout(longPressTimer.current);
        }}
      >
        {children}
      </div>

      {menu ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default bg-transparent"
            aria-label="Close menu"
            onClick={close}
          />
          <div
            role="menu"
            aria-label="Document actions"
            className={cn(
              "fixed z-50 min-w-[11rem] rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-white/10 dark:bg-[#141a22]"
            )}
            style={{ left: menu.x, top: menu.y }}
          >
            <button
              type="button"
              role="menuitem"
              disabled
              title="Coming soon"
              className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-400"
              onClick={close}
            >
              Move to category…
              <span className="mt-0.5 block text-[10px] font-normal text-slate-400">Coming soon</span>
            </button>
          </div>
        </>
      ) : null}
    </>
  );
}
