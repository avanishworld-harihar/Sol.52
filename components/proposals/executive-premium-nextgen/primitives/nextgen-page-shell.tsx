"use client";

import { cn } from "@/lib/utils";
import { PP_CANVAS, PP_SURFACE } from "@/lib/proposal-premium-design";

type Props = {
  children: React.ReactNode;
  className?: string;
  id?: string;
};

export function NextgenPageShell({ children, className, id }: Props) {
  return (
    <section
      id={id}
      className={cn(
        "relative flex min-h-[100dvh] w-full flex-col snap-start snap-always",
        className
      )}
      style={{ backgroundColor: PP_SURFACE }}
    >
      {children}
    </section>
  );
}

export function NextgenDocumentCanvas({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn("min-h-screen w-full snap-y snap-mandatory overflow-y-auto", className)}
      style={{ backgroundColor: PP_CANVAS }}
    >
      {children}
    </div>
  );
}
