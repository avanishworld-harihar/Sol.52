"use client";

import { cn } from "@/lib/utils";

type Props = {
  count: number;
  className?: string;
};

/** Compact count pill for bottom nav / nav rail tab icons. */
export function NavTabBadge({ count, className }: Props) {
  if (count <= 0) return null;
  const label = count > 99 ? "99+" : String(count);
  return (
    <span
      className={cn(
        "pointer-events-none absolute -right-1 -top-1 z-10 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-extrabold leading-none text-white shadow-sm ring-2 ring-white dark:ring-[#161B22]",
        className
      )}
      aria-hidden
    >
      {label}
    </span>
  );
}
