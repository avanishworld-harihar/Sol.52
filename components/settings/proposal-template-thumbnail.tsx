"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { ProposalTemplateThumbnailVariant } from "@/lib/proposal-template-gallery";

type Props = {
  variant: ProposalTemplateThumbnailVariant;
  className?: string;
  /** Enlarged preview inside modal */
  size?: "card" | "preview";
};

/** Gamma-style mini slide preview for a residential proposal template. */
export function ProposalTemplateThumbnail({ variant, className, size = "card" }: Props) {
  const scale = size === "preview" ? "min-h-[200px] sm:min-h-[240px]" : "aspect-[4/3] w-full";

  return (
    <div
      className={cn("relative flex items-center justify-center overflow-hidden rounded-lg", scale, className)}
      aria-hidden
    >
      {variant === "golden" ? <GoldenThumb size={size} /> : null}
      {variant === "pearl" ? <PearlThumb size={size} /> : null}
      {variant === "ledger" ? <LedgerThumb size={size} /> : null}
      {variant === "classic" ? <ClassicThumb size={size} /> : null}
    </div>
  );
}

function MiniSlide({
  bg,
  children,
  size,
}: {
  bg: string;
  children: ReactNode;
  size: "card" | "preview";
}) {
  const w = size === "preview" ? "w-[68%]" : "w-[72%]";
  const h = size === "preview" ? "h-[62%]" : "h-[58%]";
  const pad = size === "preview" ? "p-[6%]" : "p-[7%]";
  const titleSize = size === "preview" ? "text-[11px]" : "text-[5px]";
  const bodySize = size === "preview" ? "text-[9px]" : "text-[4px]";

  return (
    <div
      className={cn(
        "flex flex-col rounded-[3px] border border-black/5 shadow-sm",
        w,
        h,
        pad
      )}
      style={{ backgroundColor: bg }}
    >
      <div className={cn("font-bold tracking-[0.12em] text-slate-800", titleSize)}>Title</div>
      {children}
      <div className={cn("mt-auto text-blue-600", bodySize)}>Body &amp; link</div>
    </div>
  );
}

function GoldenThumb({ size }: { size: "card" | "preview" }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#fdfcf9]">
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-[3px] border border-[#b59a57]/30 bg-[#fdfcf9] shadow-sm",
          size === "preview" ? "h-[62%] w-[68%] p-[8%]" : "h-[58%] w-[72%] p-[7%]"
        )}
      >
        <div className={cn("font-serif italic text-[#111e38]", size === "preview" ? "text-[10px]" : "text-[4px]")}>
          Title
        </div>
        <div className={cn("bg-[#b59a57]", size === "preview" ? "mt-[8%] h-[2px] w-[1px] min-h-[20px]" : "mt-[8%] h-[12px] w-[1px]")} />
        <div className={cn("mt-[8%] text-[#718096] uppercase tracking-widest", size === "preview" ? "text-[6px]" : "text-[3px]")}>
          Body
        </div>
      </div>
    </div>
  );
}

function PearlThumb({ size }: { size: "card" | "preview" }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#f4f4f5]">
      <MiniSlide bg="#fff" size={size}>
        <div
          className={cn("bg-blue-600", size === "preview" ? "mt-[8%] h-[2px] w-[22%]" : "mt-[8%] h-[1px] w-[22%]")}
        />
        <div className={cn("mt-[10%] space-y-[5%]", size === "preview" ? "space-y-[6%]" : "")}>
          <div className={cn("w-full rounded-full bg-slate-200", size === "preview" ? "h-[2px]" : "h-[1.5px]")} />
          <div className={cn("w-[75%] rounded-full bg-slate-100", size === "preview" ? "h-[2px]" : "h-[1.5px]")} />
        </div>
      </MiniSlide>
    </div>
  );
}

function LedgerThumb({ size }: { size: "card" | "preview" }) {
  const rowH = size === "preview" ? "h-[2px]" : "h-[1px]";
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#e8e4df]">
      <MiniSlide bg="#fafaf9" size={size}>
        <div className={cn("mt-[6%] font-semibold uppercase tracking-wider text-slate-500", size === "preview" ? "text-[7px]" : "text-[3px]")}>
          Documents
        </div>
        <div className={cn("mt-[10%] space-y-[6%]")}>
          <div className={cn("w-full bg-slate-300/60", rowH)} />
          <div className={cn("w-[90%] bg-slate-200", rowH)} />
          <div className={cn("w-full bg-slate-200", rowH)} />
          <div className={cn("w-[80%] bg-slate-100", rowH)} />
        </div>
      </MiniSlide>
    </div>
  );
}

function ClassicThumb({ size }: { size: "card" | "preview" }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-teal-500/30 to-slate-700/40">
      <MiniSlide bg="#fff" size={size}>
        <div className={cn("rounded-[2px] bg-gradient-to-r from-teal-500 to-emerald-500", size === "preview" ? "mb-[6%] h-[18%]" : "mb-[6%] h-[18%] w-full")} />
        <div className={cn("mt-[6%] flex gap-[4%]")}>
          <div className="h-[12%] flex-1 rounded-[1px] bg-teal-100" />
          <div className="h-[12%] flex-1 rounded-[1px] bg-amber-100" />
          <div className="h-[12%] flex-1 rounded-[1px] bg-slate-100" />
        </div>
      </MiniSlide>
    </div>
  );
}
