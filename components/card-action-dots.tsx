"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";

type CardActionDotsProps = {
  className?: string;
  editAriaLabel: string;
  deleteAriaLabel: string;
  onEdit?: () => void;
  onDelete?: () => void;
};

const dotClass =
  "block h-2.5 w-2.5 rounded-full shadow-[0_0_0_1px_rgba(255,255,255,0.35)] transition-transform duration-200";

const iconBtnClass =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border outline-none transition active:scale-95 focus-visible:ring-2 focus-visible:ring-offset-1";

/**
 * Two action affordances: collapsed blue/red dots → on hover (desktop) or tap
 * (touch), expand into pencil (edit) and trash (delete) icon buttons.
 */
export function CardActionDots({
  className,
  editAriaLabel,
  deleteAriaLabel,
  onEdit,
  onDelete,
}: CardActionDotsProps) {
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const revealed = hovered || pinned;

  useEffect(() => {
    if (!pinned) return;
    const onPointerDown = (event: PointerEvent) => {
      const root = rootRef.current;
      if (!root) return;
      if (root.contains(event.target as Node)) return;
      setPinned(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [pinned]);

  if (!onEdit && !onDelete) return null;

  const revealFromDots = () => setPinned(true);

  return (
    <div
      ref={rootRef}
      role="toolbar"
      aria-label="Card actions"
      className={cn("pointer-events-auto", className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
      }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {!revealed ? (
        <button
          type="button"
          aria-label="Show edit and delete"
          aria-expanded={false}
          onClick={(e) => {
            e.stopPropagation();
            revealFromDots();
          }}
          className="inline-flex items-center gap-3 rounded-full border border-transparent px-1.5 py-1.5 outline-none transition hover:border-slate-200/80 hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-sky-400/50 dark:hover:border-white/15 dark:hover:bg-white/10"
        >
          {onEdit ? (
            <span
              className={cn(dotClass, "bg-gradient-to-br from-sky-400 to-blue-600")}
              aria-hidden
            />
          ) : null}
          {onDelete ? (
            <span
              className={cn(dotClass, "bg-gradient-to-br from-rose-500 to-red-600")}
              aria-hidden
            />
          ) : null}
        </button>
      ) : (
        <div className="flex items-center gap-2" aria-expanded>
          {onEdit ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPinned(false);
                onEdit();
              }}
              className={cn(
                iconBtnClass,
                "border-sky-200/90 bg-sky-50 text-sky-700 hover:bg-sky-100 focus-visible:ring-sky-400/70 dark:border-sky-500/35 dark:bg-sky-950/50 dark:text-sky-200 dark:hover:bg-sky-950/80"
              )}
              aria-label={editAriaLabel}
            >
              <Pencil className="h-4 w-4" strokeWidth={2.25} aria-hidden />
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPinned(false);
                onDelete();
              }}
              className={cn(
                iconBtnClass,
                "border-rose-200/90 bg-rose-50 text-rose-700 hover:bg-rose-100 focus-visible:ring-rose-400/70 dark:border-rose-500/35 dark:bg-rose-950/45 dark:text-rose-200 dark:hover:bg-rose-950/70"
              )}
              aria-label={deleteAriaLabel}
            >
              <Trash2 className="h-4 w-4" strokeWidth={2.25} aria-hidden />
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
