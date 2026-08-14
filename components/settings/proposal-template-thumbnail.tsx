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
      {variant === "ht" ? <HtIndustrialThumb size={size} /> : null}
      {variant === "zenith" ? <ZenithThumb size={size} /> : null}
      {variant === "luxe" ? <LuxeThumb size={size} /> : null}
      {variant === "luxe_noir" ? <LuxeNoirThumb size={size} /> : null}
      {variant === "blueprint" ? <BlueprintThumb size={size} /> : null}
      {variant === "quantum" ? <QuantumThumb size={size} /> : null}
      {variant === "emerald" ? <EmeraldThumb size={size} /> : null}
      {variant === "field" ? <FieldThumb size={size} /> : null}
      {variant === "wall_street" ? <WallStreetThumb size={size} /> : null}
      {variant === "cyanotype" ? <CyanotypeThumb size={size} /> : null}
      {variant === "brutalism" ? <BrutalismThumb size={size} /> : null}
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
        "ht",
        "zenith",
        "luxe",
        "luxe_noir",
        "blueprint",
        "quantum",
        "emerald",
        "field",
        "wall_street",
        "cyanotype",
        "brutalism",
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
    <div className="flex h-full w-full items-center justify-center bg-[#EDE6DC]">
      <div
        className={cn(
          "relative flex flex-col justify-start overflow-hidden rounded-[3px] border border-[#d6cbb8] shadow-sm",
          size === "preview" ? "h-[62%] w-[68%]" : "h-[58%] w-[72%]"
        )}
        style={{ background: "#F8F5F0" }}
      >
        <div style={{ padding: size === "preview" ? "8%" : "7%" }} className="flex flex-col gap-[8%] flex-1">
          <div
            className={cn(
              "font-bold uppercase tracking-[0.14em] text-[#8B7355]",
              size === "preview" ? "text-[5px]" : "text-[2.5px]"
            )}
          >
            HARIHAR SOLAR
          </div>
          <div
            className={cn("font-serif font-bold text-[#1F2A36] leading-tight", size === "preview" ? "text-[10px]" : "text-[4.5px]")}
          >
            The Energy<br />Masterplan
          </div>
          <div
            style={{ width: size === "preview" ? 20 : 10, height: size === "preview" ? 2 : 1, background: "#C4A574" }}
          />
          <div className="grid grid-cols-3 gap-[6%] mt-auto">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-[2px] border border-[#e5dccf] bg-white/70"
                style={{ height: size === "preview" ? 16 : 7 }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LuxeNoirThumb({ size }: { size: "card" | "preview" }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#111111]">
      <div
        className={cn(
          "relative flex flex-col justify-start overflow-hidden rounded-[3px] border border-[#D4AF37]/40 shadow-sm",
          size === "preview" ? "h-[62%] w-[68%]" : "h-[58%] w-[72%]"
        )}
        style={{ background: "#0a0a0a" }}
      >
        <div style={{ padding: size === "preview" ? "8%" : "7%" }} className="flex flex-col gap-[8%] flex-1">
          <div
            className={cn(
              "font-bold uppercase tracking-[0.14em] text-[#D4AF37]",
              size === "preview" ? "text-[5px]" : "text-[2.5px]"
            )}
          >
            PREMIUM LUXE
          </div>
          <div
            className={cn(
              "font-serif font-light text-white leading-tight",
              size === "preview" ? "text-[10px]" : "text-[4.5px]"
            )}
          >
            Precision<br />Engineered
          </div>
          <div
            style={{ width: size === "preview" ? 20 : 10, height: size === "preview" ? 2 : 1, background: "#D4AF37" }}
          />
          <div className="grid grid-cols-3 gap-[6%] mt-auto">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-[1px] border border-[#D4AF37]/50 bg-[#D4AF37]/10"
                style={{ height: size === "preview" ? 16 : 7 }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BlueprintThumb({ size }: { size: "card" | "preview" }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#E2E8F0]">
      <div
        className={cn(
          "relative flex flex-col justify-start overflow-hidden rounded-[3px] shadow-sm",
          size === "preview" ? "h-[62%] w-[68%]" : "h-[58%] w-[72%]"
        )}
        style={{ background: "#fff" }}
      >
        <div
          className="w-full bg-[#0a0f1c] flex items-center justify-between"
          style={{ padding: size === "preview" ? "6% 8% 4%" : "5% 7% 3%" }}
        >
          <div
            className={cn("font-bold tracking-widest text-white", size === "preview" ? "text-[5px]" : "text-[2.5px]")}
          >
            HARIHAR <span style={{ color: "#F97316" }}>SOLAR</span>
          </div>
        </div>
        <div style={{ padding: size === "preview" ? "8%" : "7%" }} className="flex flex-col gap-[8%] flex-1">
          <div
            className={cn("font-bold text-[#0a0f1c] leading-tight", size === "preview" ? "text-[10px]" : "text-[4.5px]")}
          >
            Investment<br />Blueprint
          </div>
          <div
            style={{ width: size === "preview" ? 20 : 10, height: size === "preview" ? 2 : 1, background: "#F97316" }}
          />
          <div className="mt-auto flex items-end gap-[6%]" style={{ height: size === "preview" ? 22 : 10 }}>
            {[35, 48, 62, 78, 90, 100].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-[1px]"
                style={{ height: `${h}%`, background: i === 5 ? "#F97316" : "#94a3b8" }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuantumThumb({ size }: { size: "card" | "preview" }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#0b1220]">
      <div
        className={cn(
          "relative flex flex-col justify-start overflow-hidden rounded-[3px] border border-cyan-500/30 shadow-sm",
          size === "preview" ? "h-[62%] w-[68%]" : "h-[58%] w-[72%]"
        )}
        style={{ background: "#111827" }}
      >
        <div style={{ padding: size === "preview" ? "8%" : "7%" }} className="flex flex-col gap-[8%] flex-1">
          <div
            className={cn(
              "font-bold uppercase tracking-[0.18em] text-cyan-400",
              size === "preview" ? "text-[5px]" : "text-[2.5px]"
            )}
          >
            QUANTUM
          </div>
          <div
            className={cn(
              "font-semibold leading-tight text-slate-50",
              size === "preview" ? "text-[10px]" : "text-[4.5px]"
            )}
          >
            Neo-Glass
            <br />
            Telemetry
          </div>
          <div
            style={{
              width: size === "preview" ? 20 : 10,
              height: size === "preview" ? 2 : 1,
              background: "#06b6d4",
            }}
          />
          <div className="mt-auto grid grid-cols-2 gap-[6%]">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-[1px] border border-cyan-500/30 bg-cyan-400/10"
                style={{ height: size === "preview" ? 14 : 6 }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmeraldThumb({ size }: { size: "card" | "preview" }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#f5f0e6]">
      <div
        className={cn(
          "relative flex overflow-hidden rounded-[3px] border border-[#D4AF37]/50 shadow-sm",
          size === "preview" ? "h-[62%] w-[68%]" : "h-[58%] w-[72%]"
        )}
      >
        <div
          className="flex h-full flex-col justify-between"
          style={{
            width: "30%",
            background: "#064E3B",
            padding: size === "preview" ? "8% 6%" : "7% 5%",
            borderRight: "2px solid #D4AF37",
          }}
        >
          <div
            className="rounded-full"
            style={{
              width: size === "preview" ? 10 : 6,
              height: size === "preview" ? 10 : 6,
              border: "1px solid #D4AF37",
            }}
          />
          <div
            className={cn(
              "font-bold uppercase tracking-[0.16em] text-[#FDE68A]",
              size === "preview" ? "text-[5px]" : "text-[2.5px]"
            )}
          >
            EM
          </div>
        </div>
        <div
          className="flex flex-1 flex-col justify-center"
          style={{ background: "#FAFAF9", padding: size === "preview" ? "8%" : "7%" }}
        >
          <div
            className={cn(
              "font-bold uppercase tracking-[0.18em] text-[#D4AF37]",
              size === "preview" ? "text-[5px]" : "text-[2.5px]"
            )}
          >
            SIGNATURE
          </div>
          <div
            className={cn(
              "font-serif leading-tight text-[#064E3B]",
              size === "preview" ? "text-[10px]" : "text-[4.5px]"
            )}
          >
            Split
            <br />
            Folio
          </div>
        </div>
      </div>
    </div>
  );
}

function BrutalismThumb({ size }: { size: "card" | "preview" }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#cfcfcf]">
      <div
        className={cn(
          "relative flex flex-col overflow-hidden bg-[#E5E5E5] shadow-sm",
          size === "preview" ? "h-[62%] w-[68%] border-[6px] border-black" : "h-[58%] w-[72%] border-[4px] border-black"
        )}
      >
        <div className="flex items-stretch justify-between border-b-4 border-black">
          <div
            className={cn(
              "bg-black font-black uppercase tracking-widest text-white",
              size === "preview" ? "px-[6%] py-[4%] text-[5px]" : "px-[6%] py-[4%] text-[2.5px]"
            )}
          >
            SPEC
          </div>
          <div
            className={cn(
              "bg-[#FF4500] font-black uppercase text-white",
              size === "preview" ? "px-[6%] py-[4%] text-[5px]" : "px-[6%] py-[4%] text-[2.5px]"
            )}
          >
            DEPLOY
          </div>
        </div>
        <div
          className={cn(
            "px-[6%] pt-[8%] font-black uppercase leading-[0.85] text-black",
            size === "preview" ? "text-[11px]" : "text-[5px]"
          )}
        >
          POWER
          <br />
          INFRA.
        </div>
        <div className="mx-[6%] mt-auto mb-[8%] flex border-4 border-black">
          <div
            className={cn(
              "bg-black font-black uppercase text-white",
              size === "preview" ? "px-[6%] py-[4%] text-[4px]" : "px-[6%] py-[4%] text-[2px]"
            )}
          >
            kW
          </div>
          <div
            className={cn(
              "flex-1 bg-white font-black",
              size === "preview" ? "px-[6%] py-[4%] text-[6px]" : "px-[6%] py-[4%] text-[3px]"
            )}
          >
            —
          </div>
        </div>
      </div>
    </div>
  );
}

function CyanotypeThumb({ size }: { size: "card" | "preview" }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#0a2844]">
      <div
        className={cn(
          "relative flex flex-col overflow-hidden rounded-[2px] border border-[#88CCEE] shadow-sm",
          size === "preview" ? "h-[62%] w-[68%]" : "h-[58%] w-[72%]"
        )}
        style={{
          backgroundColor: "#0F3B66",
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "8px 8px",
        }}
      >
        <div
          className={cn(
            "border-b border-[#88CCEE] font-mono uppercase tracking-[0.14em] text-[#88CCEE]",
            size === "preview" ? "px-[6%] py-[4%] text-[5px]" : "px-[6%] py-[5%] text-[2.5px]"
          )}
        >
          CYANOTYPE
        </div>
        <div
          className={cn(
            "font-light uppercase leading-tight text-white",
            size === "preview" ? "px-[6%] pt-[8%] text-[9px]" : "px-[6%] pt-[8%] text-[4px]"
          )}
        >
          ROOFTOP
          <br />
          ELEVATION
        </div>
        <div
          className={cn(
            "mx-[6%] mt-auto grid grid-cols-2 gap-[4%] border-t border-[#88CCEE]/50 pb-[6%] pt-[4%]",
            size === "preview" ? "text-[4px]" : "text-[2px]"
          )}
        >
          <div className="border border-white/30 p-[6%] font-mono text-[#88CCEE]">kW</div>
          <div className="border border-white/30 p-[6%] font-mono text-[#88CCEE]">₹</div>
        </div>
      </div>
    </div>
  );
}

function WallStreetThumb({ size }: { size: "card" | "preview" }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#e8dfd6]">
      <div
        className={cn(
          "relative flex flex-col overflow-hidden rounded-[2px] border-2 border-[#0B2545] shadow-sm",
          size === "preview" ? "h-[62%] w-[68%]" : "h-[58%] w-[72%]"
        )}
        style={{ backgroundColor: "#F9EBE0" }}
      >
        <div
          className={cn(
            "border-b-[3px] border-[#0B2545] text-center font-serif font-black uppercase tracking-[0.08em] text-[#0B2545]",
            size === "preview" ? "px-[6%] py-[5%] text-[7px]" : "px-[6%] py-[5%] text-[3px]"
          )}
        >
          ENERGY LEDGER
        </div>
        <div
          className={cn(
            "flex items-center justify-between bg-[#0B2545] font-sans font-bold uppercase tracking-[0.1em] text-[#F9EBE0]",
            size === "preview" ? "px-[5%] py-[3%] text-[4px]" : "px-[5%] py-[3%] text-[2px]"
          )}
        >
          <span>SYMB</span>
          <span className="text-[#16A34A]">▲ YIELD</span>
        </div>
        <div
          className={cn(
            "font-serif font-bold leading-tight text-[#0B2545]",
            size === "preview" ? "px-[6%] pt-[8%] text-[8px]" : "px-[6%] pt-[8%] text-[3.5px]"
          )}
        >
          ROOFTOP
          <br />
          ASSET
        </div>
        <div
          className={cn(
            "mx-[6%] mt-auto border-t border-dotted border-[#9CA3AF] pb-[6%] pt-[4%] font-serif text-[#374151]",
            size === "preview" ? "text-[5px]" : "text-[2.5px]"
          )}
        >
          Net outlay · · · ₹ —
        </div>
      </div>
    </div>
  );
}

function FieldThumb({ size }: { size: "card" | "preview" }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#e7e2d6]">
      <div
        className={cn(
          "relative flex flex-col overflow-hidden rounded-[2px] border border-[#12212A] shadow-sm",
          size === "preview" ? "h-[62%] w-[68%]" : "h-[58%] w-[72%]"
        )}
        style={{
          backgroundColor: "#F4F0E4",
          backgroundImage:
            "linear-gradient(rgba(18,33,42,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(18,33,42,0.06) 1px, transparent 1px)",
          backgroundSize: "6px 6px",
        }}
      >
        <div
          className={cn(
            "border-b border-[#12212A] font-mono font-bold uppercase tracking-[0.16em] text-[#D9540F]",
            size === "preview" ? "px-[6%] py-[4%] text-[5px]" : "px-[6%] py-[5%] text-[2.5px]"
          )}
        >
          FIELD ENG
        </div>
        <div
          className={cn(
            "font-semibold leading-tight text-[#12212A]",
            size === "preview" ? "px-[6%] pt-[8%] text-[9px]" : "px-[6%] pt-[8%] text-[4px]"
          )}
        >
          DWG
          <br />
          FE-01
        </div>
        <div
          className="mt-auto grid grid-cols-5 border-t border-[#12212A]"
          style={{ fontSize: size === "preview" ? 4 : 2 }}
        >
          {["DRN", "CHK", "NTS", "DATE", "FE-01"].map((c) => (
            <div
              key={c}
              className="border-r border-[#12212A] px-[4%] py-[6%] font-mono text-[#12212A] last:border-r-0"
            >
              {c}
            </div>
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

function HtIndustrialThumb({ size }: { size: "card" | "preview" }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#e9edf2]">
      <div
        className={cn(
          "flex flex-col rounded-[3px] border border-[#dbe3ec] bg-white shadow-sm",
          size === "preview" ? "h-[62%] w-[68%] p-[8%]" : "h-[58%] w-[72%] p-[7%]"
        )}
      >
        <div
          className={cn(
            "font-bold uppercase tracking-[0.18em] text-[#0b5fa5]",
            size === "preview" ? "text-[6px]" : "text-[2.5px]"
          )}
        >
          HT · 33 kV
        </div>
        <div
          className={cn(
            "mt-[6%] font-serif font-bold leading-tight text-[#0f1c2e]",
            size === "preview" ? "text-[10px]" : "text-[4.5px]"
          )}
        >
          ToD Savings
        </div>
        {/* Mini ToD bars — TOD3 (solar) highlighted */}
        <div className="mt-auto flex items-end gap-[6%]" style={{ height: size === "preview" ? 22 : 10 }}>
          {[
            { h: 30, solar: false },
            { h: 55, solar: false },
            { h: 100, solar: true },
            { h: 45, solar: false },
          ].map((bar, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-[1px]"
              style={{ height: `${bar.h}%`, background: bar.solar ? "#0f766e" : "#94a3b8" }}
            />
          ))}
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
