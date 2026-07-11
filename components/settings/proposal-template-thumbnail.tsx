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
      {variant === "ember" ? <EmberThumb size={size} /> : null}
      {variant === "solstice" ? <SolsticeThumb size={size} /> : null}
      {variant === "freedom" ? <FreedomThumb size={size} /> : null}
      {variant === "ledger" ? <LedgerThumb size={size} /> : null}
      {variant === "classic" ? <ClassicThumb size={size} /> : null}
      {variant === "commercial" ? <CommercialThumb size={size} /> : null}
      {variant === "zenith" ? <ZenithThumb size={size} /> : null}
      {variant === "luxe" ? <LuxeThumb size={size} /> : null}
      {![
        "golden",
        "pearl",
        "slate",
        "ember",
        "solstice",
        "freedom",
        "ledger",
        "classic",
        "commercial",
        "zenith",
        "luxe",
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

function ZenithThumb({ size }: { size: "card" | "preview" }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#05070d]">
      <div
        className={cn(
          "relative flex flex-col justify-center overflow-hidden rounded-[3px] border border-[#1e293b] bg-[#0a0f1c] shadow-sm",
          size === "preview" ? "h-[62%] w-[68%] p-[8%]" : "h-[58%] w-[72%] p-[7%]"
        )}
      >
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 opacity-50"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(197,160,89,0.3), transparent 70%)",
          }}
        />
        <div
          className={cn(
            "relative font-semibold uppercase tracking-[0.2em] text-white",
            size === "preview" ? "text-[7px]" : "text-[3px]"
          )}
        >
          Harihar <span className="text-[#c5a059]">Solar</span>
        </div>
        <div
          className={cn(
            "relative mt-[10%] font-serif text-white",
            size === "preview" ? "text-[11px]" : "text-[5px]"
          )}
        >
          Energy Independent.
        </div>
        <div
          className={cn(
            "relative mt-[8%] bg-[#c5a059]",
            size === "preview" ? "h-[2px] w-8" : "h-[1px] w-4"
          )}
        />
      </div>
    </div>
  );
}

function LuxeThumb({ size }: { size: "card" | "preview" }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#EDE6D9]">
      <div
        className={cn(
          "relative flex flex-col justify-center overflow-hidden rounded-[3px] border border-[#EDE6D9] bg-[#F8F5F0] shadow-sm",
          size === "preview" ? "h-[62%] w-[68%] p-[8%]" : "h-[58%] w-[72%] p-[7%]"
        )}
      >
        <div
          className={cn(
            "font-medium uppercase tracking-[0.2em] text-[#B8975E]",
            size === "preview" ? "text-[6px]" : "text-[3px]"
          )}
        >
          Harihar Solar
        </div>
        <div
          className={cn(
            "mt-[10%] font-semibold tracking-tight text-[#1F2A36]",
            size === "preview" ? "text-[11px]" : "text-[5px]"
          )}
        >
          Energy Masterplan
        </div>
        <div
          className={cn(
            "mt-[10%] grid grid-cols-3 gap-[6%]",
            size === "preview" ? "mt-[12%]" : ""
          )}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-[2px] border border-[#EDE6D9] bg-white"
              style={{ height: size === "preview" ? 18 : 8 }}
            />
          ))}
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

function SolsticeThumb({ size }: { size: "card" | "preview" }) {
  const heroSize = size === "preview" ? "text-[10px]" : "text-[5px]";
  const pillH = size === "preview" ? "h-[14px]" : "h-[6px]";
  return (
    <div className="flex h-full w-full items-center justify-center bg-slate-100">
      <div
        className={cn(
          "flex flex-col rounded-[3px] border border-slate-200 bg-slate-50 shadow-sm",
          size === "preview" ? "h-[62%] w-[68%] p-[8%]" : "h-[58%] w-[72%] p-[7%]"
        )}
      >
        <div className="flex items-center gap-[4%]">
          <div className={cn("rounded-full bg-amber-500", size === "preview" ? "h-[8px] w-[8px]" : "h-[4px] w-[4px]")} />
          <div className={cn("font-bold text-slate-800", heroSize)}>Solstice</div>
        </div>
        <div className={cn("mt-[8%] font-bold leading-tight text-slate-900", heroSize)}>
          Your roof is ready
        </div>
        <div className={cn("mt-[8%] grid grid-cols-2 gap-[4%]")}>
          <div className={cn("rounded-[2px] bg-white", pillH)} />
          <div className={cn("rounded-[2px] bg-emerald-100", pillH)} />
        </div>
        <div className={cn("mt-[6%] rounded-[2px] bg-emerald-800/90", size === "preview" ? "h-[18%]" : "h-[14%]")} />
      </div>
    </div>
  );
}

function FreedomThumb({ size }: { size: "card" | "preview" }) {
  const heroSize = size === "preview" ? "text-[10px]" : "text-[5px]";
  const subSize = size === "preview" ? "text-[7px]" : "text-[3px]";
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#e8edf2]">
      <div
        className={cn(
          "flex flex-col rounded-[3px] border border-[#008080]/20 bg-white shadow-sm",
          size === "preview" ? "h-[62%] w-[68%] p-[8%]" : "h-[58%] w-[72%] p-[7%]"
        )}
      >
        <div className={cn("font-black text-[#2D3748]", heroSize)}>HARIHAR</div>
        <div className={cn("text-[#008080]/30 font-bold", size === "preview" ? "text-[14px]" : "text-[6px]")}>
          ENERGY
        </div>
        <div className={cn("font-bold text-[#2D3748]", subSize)}>REIMAGINED.</div>
        <div className={cn("mt-[10%] h-[2px] w-full bg-[#008080]", size === "preview" ? "" : "h-[1px]")} />
      </div>
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

function AuroraThumb({ size }: { size: "card" | "preview" }) {
  const titleSize = size === "preview" ? "text-[9px]" : "text-[4px]";
  const labelSize = size === "preview" ? "text-[7px]" : "text-[3px]";
  const rowH = size === "preview" ? "h-[2px]" : "h-[1px]";
  const nodeSize = size === "preview" ? "h-[10px] w-[10px]" : "h-[4px] w-[4px]";
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-700 to-amber-400">
      <div
        className={cn(
          "flex flex-col rounded-[3px] border border-indigo-200/30 shadow-sm",
          size === "preview" ? "h-[62%] w-[68%] p-[8%]" : "h-[58%] w-[72%] p-[7%]"
        )}
        style={{ background: "rgba(248,250,252,0.97)" }}
      >
        {/* kW hero */}
        <div
          className={cn("rounded-[2px] font-extrabold text-indigo-700", titleSize)}
          style={{ background: "linear-gradient(to right, #3730a3, #f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
        >
          5 kW
        </div>
        {/* SLD mini nodes: PV → DCDB → Inverter → ACDB */}
        <div className={cn("mt-[8%] flex items-center gap-[3%]")}>
          <div className={cn("flex-shrink-0 rounded-[1px] bg-amber-400", nodeSize)} />
          <div className={cn("flex-shrink-0 rounded-[1px] bg-indigo-500", nodeSize)} />
          <div className={cn("flex-shrink-0 rounded-[1px] bg-emerald-500", nodeSize)} />
          <div className={cn("flex-shrink-0 rounded-[1px] bg-sky-500", nodeSize)} />
        </div>
        {/* Tilt hint line */}
        <div className={cn("mt-[8%] uppercase tracking-wider text-indigo-400", labelSize)}>
          SLD · Tilt · BOM
        </div>
        <div className={cn("mt-[6%] space-y-[5%]")}>
          <div className={cn("w-full rounded-full bg-indigo-100", rowH)} />
          <div className={cn("w-[80%] rounded-full bg-amber-100", rowH)} />
          <div className={cn("w-[90%] rounded-full bg-emerald-100", rowH)} />
        </div>
      </div>
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
