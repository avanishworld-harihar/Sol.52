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
      {variant === "slate" ? <SlateThumb size={size} /> : null}
      {variant === "horizon" ? <HorizonThumb size={size} /> : null}
      {variant === "ember" ? <EmberThumb size={size} /> : null}
      {variant === "ledger" ? <LedgerThumb size={size} /> : null}
      {variant === "classic" ? <ClassicThumb size={size} /> : null}
      {variant === "commercial" ? <CommercialThumb size={size} /> : null}
      {![
        "golden",
        "pearl",
        "slate",
        "horizon",
        "ember",
        "ledger",
        "classic",
        "commercial",
      ].includes(variant) ? (
        <GenericThumb size={size} label={variant} />
      ) : null}
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

function GenericThumb({ size, label }: { size: "card" | "preview"; label: string }) {
  const textSize = size === "preview" ? "text-[10px]" : "text-[5px]";
  return (
    <div className="flex h-full w-full items-center justify-center bg-slate-100">
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-[3px] border border-slate-200 bg-white shadow-sm",
          size === "preview" ? "h-[62%] w-[68%] p-[8%]" : "h-[58%] w-[72%] p-[7%]"
        )}
      >
        <div className={cn("font-bold uppercase tracking-wider text-slate-500", textSize)}>
          {label.replace(/_/g, " ")}
        </div>
      </div>
    </div>
  );
}

function SlateThumb({ size }: { size: "card" | "preview" }) {
  const titleSize = size === "preview" ? "text-[9px]" : "text-[4px]";
  const heroSize = size === "preview" ? "text-[7px]" : "text-[3px]";
  const labelSize = size === "preview" ? "text-[5px]" : "text-[2.5px]";
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#f5f5f7]">
      <div
        className={cn(
          "flex flex-col rounded-[3px] border border-[#d2d2d7]/60 bg-[#f5f5f7] shadow-sm",
          size === "preview" ? "h-[62%] w-[68%] p-[8%]" : "h-[58%] w-[72%] p-[7%]"
        )}
      >
        <div className={cn("font-bold uppercase tracking-[0.2em] text-[#86868b]", titleSize)}>
          Brand
        </div>
        <div className={cn("mt-[10%] font-bold leading-tight text-[#1d1d1f]", heroSize)}>
          Your home will generate electricity.
        </div>
        <div className={cn("mt-[8%] h-[1px] w-full bg-[#d2d2d7]")} />
        <div className={cn("mt-[8%] flex justify-between", labelSize)}>
          <span className="font-semibold uppercase tracking-wider text-[#86868b]">Client</span>
          <span className="font-semibold uppercase tracking-wider text-[#86868b]">System</span>
        </div>
      </div>
    </div>
  );
}

function HorizonThumb({ size }: { size: "card" | "preview" }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-teal-400 to-sky-500">
      <MiniSlide bg="#fff" size={size}>
        <div className={cn("rounded-[2px] bg-gradient-to-r from-emerald-400 to-teal-500", size === "preview" ? "mb-[6%] h-[18%]" : "mb-[6%] h-[18%] w-full")} />
        <div className={cn("mt-[6%] flex gap-[4%]")}>
          <div className="h-[12%] flex-1 rounded-[1px] bg-amber-100" />
          <div className="h-[12%] flex-1 rounded-[1px] bg-emerald-100" />
        </div>
      </MiniSlide>
    </div>
  );
}

function EmberThumb({ size }: { size: "card" | "preview" }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-slate-800">
      <MiniSlide bg="#1e293b" size={size}>
        <div className={cn("uppercase tracking-wider text-slate-400", size === "preview" ? "text-[7px]" : "text-[3px]")}>
          Savings
        </div>
        <div className={cn("font-bold text-emerald-400", size === "preview" ? "mt-[6%] text-[11px]" : "mt-[6%] text-[7px]")}>
          ROI
        </div>
        <div className={cn("mt-[8%] flex h-[20%] items-end gap-[5%]")}>
          <div className="w-[22%] rounded-t-[1px] bg-slate-600" style={{ height: "55%" }} />
          <div className="w-[22%] rounded-t-[1px] bg-red-300/80" style={{ height: "100%" }} />
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

function CommercialThumb({ size }: { size: "card" | "preview" }) {
  const rowH = size === "preview" ? "h-[2px]" : "h-[1px]";
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950">
      <MiniSlide bg="#0f172a" size={size}>
        <div className={cn("font-bold uppercase tracking-wider text-teal-400", size === "preview" ? "text-[7px]" : "text-[3px]")}>
          Executive
        </div>
        <div className={cn("mt-[8%] space-y-[5%]")}>
          <div className={cn("w-full rounded-full bg-teal-500/40", rowH)} />
          <div className={cn("w-[85%] rounded-full bg-slate-600", rowH)} />
          <div className={cn("w-full rounded-full bg-slate-600", rowH)} />
          <div className={cn("w-[70%] rounded-full bg-amber-500/50", rowH)} />
        </div>
      </MiniSlide>
    </div>
  );
}
