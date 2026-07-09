import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
  cover?: boolean;
};

export function EpLuxuryPage({ children, className, cover = false }: Props) {
  return (
    <section className={cn("ep-gl-page", cover && "ep-gl-page--cover")}>
      <div className="ep-gl-luxury-border" aria-hidden />
      {cover ? (
        <div className={cn("ep-gl-cover-page", className)}>{children}</div>
      ) : (
        <div className={cn("ep-gl-page-body", className)}>{children}</div>
      )}
    </section>
  );
}
