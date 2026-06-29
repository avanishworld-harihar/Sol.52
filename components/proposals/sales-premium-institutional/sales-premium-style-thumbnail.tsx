"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { SalesPremiumStyleId } from "@/lib/sales-premium-styles";

type Props = {
  styleId: SalesPremiumStyleId;
  className?: string;
};

/** Gamma-style square theme preview — outer swatch + inner mini slide. */
export function SalesPremiumStyleThumbnail({ styleId, className }: Props) {
  return (
    <div
      className={cn(
        "relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg",
        className
      )}
      aria-hidden
    >
      {styleId === "pearl" ? <PearlThumb /> : null}
      {styleId === "slate" ? <SlateThumb /> : null}
      {styleId === "journey" ? <JourneyThumb /> : null}
      {styleId === "savings_focus" ? <SavingsFocusThumb /> : null}
    </div>
  );
}

function MiniSlide({
  bg,
  children,
}: {
  bg: string;
  children: ReactNode;
}) {
  return (
    <div
      className="flex h-[58%] w-[72%] flex-col rounded-[3px] border border-black/5 bg-white p-[7%] shadow-sm"
      style={{ backgroundColor: bg === "white" ? "#fff" : bg }}
    >
      {children}
    </div>
  );
}

function PearlThumb() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#f4f4f5]">
      <MiniSlide bg="white">
        <div className="text-[5px] font-bold tracking-[0.15em] text-slate-800">TITLE</div>
        <div className="mt-[8%] h-[1px] w-[22%] bg-blue-600" />
        <div className="mt-[10%] space-y-[5%]">
          <div className="h-[1.5px] w-full rounded-full bg-slate-200" />
          <div className="h-[1.5px] w-[75%] rounded-full bg-slate-100" />
        </div>
        <div className="mt-auto text-[4px] text-blue-600">Body &amp; link</div>
      </MiniSlide>
    </div>
  );
}

function SlateThumb() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#f5f5f7]">
      <div className="flex h-[58%] w-[72%] flex-col rounded-[3px] border border-[#d2d2d7]/60 bg-[#f5f5f7] p-[7%] shadow-sm">
        <div className="text-[4px] font-bold uppercase tracking-[0.2em] text-[#86868b]">Brand</div>
        <div className="mt-[10%] text-[3px] font-bold leading-tight text-[#1d1d1f]">
          Your home will generate electricity.
        </div>
        <div className="mt-[8%] h-[1px] w-full bg-[#d2d2d7]" />
      </div>
    </div>
  );
}

function JourneyThumb() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-teal-400 to-sky-500">
      <MiniSlide bg="white">
        <div className="mb-[6%] h-[18%] w-full rounded-[2px] bg-gradient-to-r from-emerald-400 to-teal-500" />
        <div className="text-[5px] font-bold text-slate-800">Title</div>
        <div className="mt-[8%] flex gap-[4%]">
          <div className="h-[12%] flex-1 rounded-[1px] bg-amber-100" />
          <div className="h-[12%] flex-1 rounded-[1px] bg-emerald-100" />
        </div>
        <div className="mt-auto text-[4px] text-slate-500">Body &amp; link</div>
      </MiniSlide>
    </div>
  );
}

function SavingsFocusThumb() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-slate-800">
      <MiniSlide bg="#1e293b">
        <div className="text-[4px] uppercase tracking-wider text-slate-400">Saving</div>
        <div className="mt-[6%] text-[7px] font-bold text-emerald-400">₹97k</div>
        <div className="mt-[10%] flex h-[20%] items-end gap-[5%]">
          <div className="w-[22%] rounded-t-[1px] bg-slate-600" style={{ height: "55%" }} />
          <div className="w-[22%] rounded-t-[1px] bg-red-300/80" style={{ height: "100%" }} />
          <div className="w-[22%] rounded-t-[1px] bg-slate-600" style={{ height: "70%" }} />
        </div>
        <div className="mt-auto text-[4px] text-sky-400">Body &amp; link</div>
      </MiniSlide>
    </div>
  );
}
